
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, LiveSession, Type, Schema } from "@google/genai";
import { ChatMessage, ResearchResult, CaseSummary, CaseProfile, SectionTemplate, Jurisdiction } from "../types";
import { encode } from '../audioUtils';

let ai: GoogleGenAI;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// --- Utilities ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

// --- Extraction Engine ---

/**
 * Extracts structured case data from a uploaded document (PDF, Image, Text).
 */
export const extractCaseDetails = async (file: File): Promise<Partial<CaseProfile>> => {
    const base64Data = await fileToBase64(file);
    
    // Define the expected JSON structure
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            nickname: { type: Type.STRING, description: "A short, memorable name for the case (e.g., 'State v. Jones')." },
            courtName: { type: Type.STRING, description: "The full name of the court." },
            caseNumber: { type: Type.STRING, description: "The alphanumeric case number." },
            plaintiff: { type: Type.STRING, description: "Name of the plaintiff(s)." },
            defendant: { type: Type.STRING, description: "Name of the defendant(s)." },
            judge: { type: Type.STRING, description: "Name of the presiding judge/department." },
            globalFacts: { type: Type.STRING, description: "A comprehensive summary of the factual background alleged in the document." },
            jurisdiction: { 
                type: Type.STRING, 
                enum: [
                    Jurisdiction.D_NEV, 
                    Jurisdiction.WASHOE, 
                    Jurisdiction.CLARK, 
                    Jurisdiction.NV_SUPREME
                ],
                description: "The most likely jurisdiction based on the court name."
            }
        },
        required: ["nickname", "courtName", "caseNumber", "plaintiff", "defendant", "globalFacts"],
    };

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash', // Flash is excellent for high-volume extraction
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: "Analyze this legal document. Extract the case details into the specified JSON format. If the jurisdiction is unclear, make a best guess based on the location/court." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as Partial<CaseProfile>;
        }
        throw new Error("No JSON response generated");
    } catch (error) {
        console.error("Error extracting case details:", error);
        throw error;
    }
};

/**
 * Performs OCR to extract raw text from an image or PDF.
 */
export const performOCR = async (mimeType: string, base64Data: string): Promise<string> => {
    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: "Extract all legible text from this document verbatim. Preserve formatting where possible (newlines, etc.)." }
                ]
            }
        });
        return response.text || "No text could be extracted.";
    } catch (error) {
        console.error("OCR Error:", error);
        return "Error performing OCR extraction.";
    }
};

// --- Strategic Engine ---

export const analyzeCaseStrategy = async (caseProfile: CaseProfile): Promise<string> => {
    const prompt = `
    You are a senior strategic litigator. Analyze the following case and provide a "Status Report & Strategic Roadmap".
    
    CASE CONTEXT:
    Case: ${caseProfile.nickname} (${caseProfile.caseNumber})
    Jurisdiction: ${caseProfile.jurisdiction}
    Judge: ${caseProfile.judge}
    
    FACTS:
    ${caseProfile.globalFacts}
    
    RECENT EVENTS/NOTES:
    ${caseProfile.events?.map(e => `- ${new Date(e.date).toLocaleDateString()}: ${e.title} (${e.description})`).join('\n') || "No specific events logged."}
    
    OUTPUT FORMAT (Markdown):
    1. **Current Posture**: Brief assessment of where the case stands.
    2. **Key Risks**: What should we worry about?
    3. **Recommended Actions**: 3 bullet points of what to file or do next.
    
    Be concise, tactical, and aggressive where appropriate.
    `;

    try {
         const response = await getAI().models.generateContent({
            model: 'gemini-3-pro-preview', // High reasoning for strategy
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });
        return response.text || "Unable to generate strategy.";
    } catch (error) {
        console.error("Error generating strategy:", error);
        return "Error generating strategy.";
    }
}

// --- Core Drafting Engine ---

/**
 * Generates a specific legal section based on a template and case context.
 * Uses the high-reasoning Gemini 3 Pro model.
 */
export const generateSectionContent = async (
    section: SectionTemplate,
    caseProfile: CaseProfile,
    userInputs: Record<string, string>
): Promise<string> => {
    // 1. Interpolate the prompt with variables
    let prompt = section.promptTemplate;
    
    // Replace standard placeholders
    prompt = prompt.replace(/{globalFacts}/g, caseProfile.globalFacts || "See attached complaint.");
    prompt = prompt.replace(/{jurisdiction}/g, caseProfile.jurisdiction);
    prompt = prompt.replace(/{plaintiff}/g, caseProfile.plaintiff);
    prompt = prompt.replace(/{defendant}/g, caseProfile.defendant);
    prompt = prompt.replace(/{judge}/g, caseProfile.judge);
    
    // Replace user input placeholders
    for (const [key, value] of Object.entries(userInputs)) {
        prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    try {
        const response: GenerateContentResponse = await getAI().models.generateContent({
            model: 'gemini-3-pro-preview', // Using the reasoning model for drafting
            contents: prompt,
            config: {
                // Higher budget for thinking if needed for complex arguments, 
                // but standard generation is usually sufficient for sections.
                temperature: 0.2, // Low temperature for legal precision
            },
        });
        return response.text || "(No content generated)";
    } catch (error) {
        console.error(`Error generating section ${section.title}:`, error);
        return `[Error generating section: ${section.title}]`;
    }
};

/**
 * Edits existing text based on an instruction (Shorten, Formalize, etc.)
 */
export const refineText = async (text: string, instruction: string): Promise<string> => {
    const prompt = `You are a legal editor. 
    Instruction: ${instruction}
    
    Original Text:
    "${text}"
    
    Output ONLY the edited text. Do not add conversational filler.`;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        return response.text || text;
    } catch (error) {
        return text; // Fail safe
    }
}

// --- Chat & Research ---

export const createChat = (): Chat => {
    return getAI().chats.create({
        model: 'gemini-2.5-flash',
        config: {
             systemInstruction: "You are a legal assistant helping with Nevada and Federal litigation. Be concise and cite sources."
        }
    });
};

export const performLegalResearch = async (query: string): Promise<{ results: ResearchResult[], sources: any[] }> => {
    const prompt = `Query: "${query}"
    Find relevant case law (prioritize Nevada/9th Cir). 
    Return a list of cases with summaries.
    Format:
    CASE: [Citation]
    SUMMARY: [Relevance]
    ***`;

    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const results = parseResearchResults(response.text);
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { results, sources };
    } catch (error) {
        console.error("Error performing legal research:", error);
        return { results: [], sources: [] };
    }
};

const parseResearchResults = (text: string): ResearchResult[] => {
    if (!text) return [];
    const results: ResearchResult[] = [];
    const entries = text.split('***').filter(entry => entry.trim());
    for (const entry of entries) {
        const citationMatch = entry.match(/CASE:\s*(.*)/);
        const summaryMatch = entry.match(/SUMMARY:\s*([\s\S]*)/);
        if (citationMatch && summaryMatch) {
            results.push({
                citation: citationMatch[1].trim(),
                summary: summaryMatch[1].trim(),
            });
        }
    }
    return results;
};

// --- Multimedia ---

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
    try {
        const response = await getAI().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const connectLive = (callbacks: any): Promise<LiveSession> => {
  return getAI().live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
    },
  });
};

export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

# MotionForge AI: The Litigator's Edge

![MotionForge AI Hero](https://via.placeholder.com/1200x400/0f172a/06b6d4?text=MotionForge+AI+v2.1)

**MotionForge AI** is a workflow-centric legal assistant designed for high-stakes litigation in Nevada State and Federal courts. Unlike generic AI wrappers that simply "generate text," MotionForge is architected to think like a litigator: understanding case context, jurisdiction rules, and strategic argumentation.

## 🚀 The Mission

Lawyers spend 60% of their time on formatting, repetitive background facts, and boilerplate procedural history. MotionForge AI eliminates this drudgery.

By combining **Case Context Memory** with **Gemini 1.5 Pro's** reasoning capabilities, it allows attorneys to focus on strategy while the AI handles the drafting execution.

---

## 🏗 Architecture & Workflow

The application follows a strict 3-step legal workflow:

### 1. The Case Profile (Context Layer)
Everything starts with a Case Profile.
- **Why?** You shouldn't have to re-type "Plaintiff Smith vs. Defendant Jones" or the 5-page factual background for every single motion.
- **How?** The app persists a `CaseProfile` object containing the global narrative, parties, and court details. This acts as the "System Prompt" for every subsequent interaction.

### 2. The Case Dashboard (Command Layer)
A centralized hub for every matter.
- **Strategic Intelligence**: The "AI Co-Counsel" analyzes the case facts and recent events to suggest the next best strategic move (e.g., "File a Motion for Clarification").
- **Timeline Tracking**: Keep a log of key events (hearings, orders) to maintain context.
- **Document Repository**: Access all drafts for the specific case in one place.

### 3. The Drafting Engine (Execution Layer)
The app orchestrates a section-by-section generation process.
- **Filing Wizard**: Select from pre-configured templates (TRO, Sanctions) or use the **Generic Motion** builder for custom needs.
- **Orchestration**: It asks Gemini to draft the Introduction, then the Facts, then the Argument sequentially for maximum coherence.
- **Model**: Uses `gemini-3-pro-preview` for deep reasoning in drafting and `gemini-2.5-flash` for low-latency chat and research.

---

## ✨ Key Features

### 🧠 Contextual Memory
- Create a case once.
- The AI remembers the judge, the opposing counsel, and the core narrative forever.

### ⚡ "Lethal" Motion Templates
- **TRO / Preliminary Injunction**: tailored for *Winter v. NRDC* factors.
- **Rule 11 Sanctions**: tailored for 9th Circuit bad-faith standards.
- **Structural Dismissal**: tailored for constitutional due-process violations.
- **Custom / Generic**: flexible template for any specific motion type.

### 💎 Glassmorphism UI
- A stunning, dark-mode interface designed for focus.
- Seamless animations and transitions.

### 🎙️ Multimodal Tools
- **Legal Research**: Integrated Google Search grounding to find case law.
- **Voice Mode**: Real-time two-way audio conversation with Gemini to brainstorm arguments while driving or pacing.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Integration**: Google GenAI SDK (`@google/genai`).
- **State Management**: LocalStorage for persistence (Privacy-first: data never leaves your browser except to go to Google's API).
- **Icons**: Lucide React.
- **Typography**: Inter (UI) and Merriweather (Legal Text).

## 📦 Project Structure

```
├── src/
│   ├── App.tsx                 # Main Controller & UI Views (Landing, Case, Wizard, Editor)
│   ├── services/
│   │   ├── geminiService.ts    # AI Orchestrator (Generation, Research, Live API)
│   │   └── storageService.ts   # Persistence Layer
│   ├── constants.ts            # The "Legal Brain" (Templates & Prompts)
│   ├── types.ts                # TypeScript Definitions
│   └── audioUtils.ts           # PCM Audio Encoding/Decoding helpers
└── index.html                  # Entry point & Styles
```

## 🚀 Getting Started

1. **API Key**: The app requires a valid Google GenAI API Key in `process.env.API_KEY`.
2. **Permissions**: Microphone access is required for Voice Mode.
3. **Usage**:
    - Click **"New Case"** to initialize a matter or **Import** a document to auto-extract details.
    - Enter the **Case Dashboard** to view strategic insights.
    - Click **"New Filing"** to launch the Wizard.
    - Answer the strategic questions.
    - Watch the AI draft your motion section-by-section.
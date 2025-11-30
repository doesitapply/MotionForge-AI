
import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  FileText, 
  PlusCircle, 
  Mic, 
  MessageSquare, 
  Gavel, 
  Save, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  BookOpen,
  Layout,
  Cpu,
  Shield,
  History,
  X,
  Clock,
  CheckCircle2,
  Upload,
  FileSearch,
  Loader2,
  BrainCircuit,
  CalendarDays,
  FilePen,
  Paperclip,
  Eye,
  Trash2,
  ScanText
} from 'lucide-react';

import { CaseProfile, Draft, FilingType, Jurisdiction, InputQuestion, AIFeature, ChatMessage, CaseEvent, Evidence } from './types';
import * as storage from './services/storageService';
import * as geminiService from './services/geminiService';
import { getFilingTypes } from './constants';
import { decode, decodeAudioData } from './audioUtils';

// --- Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow' }> = ({ variant = 'primary', className = '', children, ...props }) => {
  const base = "px-5 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-500/50',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:border-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-cyan-400',
    danger: 'bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-800',
    glow: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/30'
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800 hover:shadow-cyan-500/10 hover:-translate-y-1' : ''} ${className}`}
  >
    {children}
  </div>
);

const StepIndicator: React.FC<{ num: number, active: boolean, label: string }> = ({ num, active, label }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${active ? 'bg-cyan-950 border-cyan-500' : 'bg-slate-900 border-slate-800'}`}>
            {num}
        </div>
        <span className="text-sm font-medium hidden md:block">{label}</span>
    </div>
);

// --- Modal: Document Viewer ---

const DocumentViewer: React.FC<{ evidence: Evidence, onClose: () => void, onUpdateEvidence: (updated: Evidence) => void }> = ({ evidence, onClose, onUpdateEvidence }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text'>('preview');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const isImage = evidence.mimeType.startsWith('image/');
  const isPDF = evidence.mimeType === 'application/pdf';

  const handleRunOCR = async () => {
    setIsProcessingOCR(true);
    const text = await geminiService.performOCR(evidence.mimeType, evidence.data);
    onUpdateEvidence({ ...evidence, ocrText: text });
    setIsProcessingOCR(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in-down">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-lg">
                <Paperclip size={20} className="text-cyan-400"/> {evidence.filename}
            </h3>
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${activeTab === 'preview' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Preview
                </button>
                <button 
                    onClick={() => setActiveTab('text')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${activeTab === 'text' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ScanText size={12}/> OCR Text
                </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X size={24}/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow bg-slate-950/50 relative overflow-hidden flex flex-col">
            {activeTab === 'preview' && (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    {isImage && (
                        <img src={`data:${evidence.mimeType};base64,${evidence.data}`} alt="Evidence" className="max-w-full max-h-full object-contain shadow-lg border border-slate-800" />
                    )}
                    {isPDF && (
                        <iframe 
                        src={`data:application/pdf;base64,${evidence.data}`} 
                        className="w-full h-full border-none rounded-lg shadow-lg"
                        title="PDF Viewer"
                        ></iframe>
                    )}
                    {!isImage && !isPDF && (
                        <div className="text-center p-8">
                        <FileText size={64} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-300 mb-2">Preview not available for this file type.</p>
                        <p className="text-slate-500 text-sm">Type: {evidence.mimeType}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'text' && (
                <div className="w-full h-full p-8 overflow-y-auto">
                    {evidence.ocrText ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Extracted Text</h4>
                                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(evidence.ocrText || '')} className="text-xs h-8 px-3">
                                    Copy to Clipboard
                                </Button>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                                {evidence.ocrText}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ScanText size={64} className="text-slate-600 mb-6"/>
                            <h3 className="text-xl font-medium text-slate-200 mb-2">No Text Extracted Yet</h3>
                            <p className="text-slate-400 max-w-md mb-8">
                                Use Gemini Vision to extract readable text from this document for searching and copying.
                            </p>
                            <Button onClick={handleRunOCR} disabled={isProcessingOCR} variant="glow">
                                {isProcessingOCR ? <><Loader2 className="animate-spin" size={18}/> Analyzing...</> : <><Sparkles size={18}/> Run AI OCR</>}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- View: Landing Page ---

const Landing: React.FC<{ onEnter: () => void }> = ({ onEnter }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6 relative overflow-hidden">
    {/* Background Accents */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div className="max-w-5xl mx-auto text-center z-10 animate-fade-in-down">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-medium mb-8 shadow-lg shadow-cyan-900/20">
        <Sparkles size={12} /> v2.3 with AI OCR
      </div>
      
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6 font-serif drop-shadow-2xl">
        MotionForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
      </h1>
      
      <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
        Your complete Litigation Command Center. <br/>
        Track cases, manage evidence, and draft lethal filings in minutes.
      </p>

      <div className="flex justify-center gap-4 mb-20">
        <Button variant="glow" onClick={onEnter} className="text-lg px-8 py-4">
          Enter Chambers <ArrowRight className="ml-2" />
        </Button>
        <Button variant="secondary" onClick={() => window.open('https://github.com/google-gemini/motionforge', '_blank')} className="text-lg px-8 py-4">
          Documentation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <FeatureCard 
          icon={<History className="text-cyan-400" />} 
          title="Case Tracker" 
          desc="Centralized dashboard for timelines, parties, and case status." 
        />
        <FeatureCard 
          icon={<Shield className="text-purple-400" />} 
          title="Evidence Locker" 
          desc="Securely store documents. Use AI OCR to extract text from PDFs and images." 
        />
        <FeatureCard 
          icon={<Cpu className="text-blue-400" />} 
          title="Universal Drafting" 
          desc="Generate any motion, opposition, or discovery request with custom templates." 
        />
      </div>
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
    <div className="mb-4 bg-slate-950 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-800">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

// --- View: Case Manager ---

const CaseManager: React.FC<{ onSelectCase: (c: CaseProfile) => void }> = ({ onSelectCase }) => {
  const [cases, setCases] = useState<CaseProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newCase, setNewCase] = useState<Partial<CaseProfile>>({
    jurisdiction: Jurisdiction.D_NEV,
    courtName: 'United States District Court, District of Nevada',
    events: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCases(storage.getCases());
  }, []);

  const handleCreate = () => {
    if (!newCase.nickname || !newCase.caseNumber) return;
    const caseProfile: CaseProfile = {
      judge: '', plaintiff: '', defendant: '',
      events: [],
      evidence: [],
      ...newCase,
      id: crypto.randomUUID(),
      lastModified: Date.now(),
      globalFacts: newCase.globalFacts || ''
    } as CaseProfile;
    
    storage.saveCase(caseProfile);
    setCases(storage.getCases());
    setShowForm(false);
    setNewCase({ jurisdiction: Jurisdiction.D_NEV, courtName: 'United States District Court, District of Nevada', events: [] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
        const extractedData = await geminiService.extractCaseDetails(file);
        setNewCase(prev => ({
            ...prev,
            ...extractedData
        }));
        setShowForm(true);
    } catch (error) {
        alert("Failed to extract data. Please try again or enter manually.");
        console.error(error);
    } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in relative min-h-screen">
      {/* Loading Overlay */}
      {isAnalyzing && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                <FileSearch className="text-cyan-400 w-16 h-16 animate-bounce relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mt-8 mb-2 font-serif">Analyzing Document</h2>
              <p className="text-slate-300">Extracting parties, jurisdiction, and facts...</p>
              <Loader2 className="animate-spin text-cyan-500 mt-6" size={24} />
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 font-serif tracking-tight">Case Files</h1>
          <p className="text-slate-400 mt-1">Select a matter to view dashboard.</p>
        </div>
        <div className="flex gap-3">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.doc,.docx,image/*"
                onChange={handleFileUpload}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Import Case File
            </Button>
            <Button onClick={() => { setNewCase({ jurisdiction: Jurisdiction.D_NEV }); setShowForm(true); }} variant="glow">
                <PlusCircle size={18} /> New Case Profile
            </Button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-fade-in-down max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
               <h3 className="text-2xl font-semibold text-cyan-400 font-serif">Initialize New Matter</h3>
               <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="col-span-2 md:col-span-1">
                <Label>Case Nickname</Label>
                <Input placeholder="e.g. State v. Jones" value={newCase.nickname || ''} onChange={e => setNewCase({...newCase, nickname: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Case Number</Label>
                <Input placeholder="e.g. 2:24-cv-00123" value={newCase.caseNumber || ''} onChange={e => setNewCase({...newCase, caseNumber: e.target.value})} />
              </div>
               <div className="col-span-2">
                <Label>Court Name</Label>
                <Input placeholder="e.g. U.S. District Court..." value={newCase.courtName || ''} onChange={e => setNewCase({...newCase, courtName: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Plaintiff</Label>
                <Input value={newCase.plaintiff || ''} onChange={e => setNewCase({...newCase, plaintiff: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Defendant</Label>
                <Input value={newCase.defendant || ''} onChange={e => setNewCase({...newCase, defendant: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Judge / Dept</Label>
                <Input value={newCase.judge || ''} onChange={e => setNewCase({...newCase, judge: e.target.value})} />
              </div>
               <div className="col-span-2">
                <Label>Jurisdiction</Label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none focus:border-cyan-500 transition-colors" 
                  value={newCase.jurisdiction} onChange={e => setNewCase({...newCase, jurisdiction: e.target.value as Jurisdiction})}>
                    {Object.values(Jurisdiction).map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Label>Global Facts / Case Narrative</Label>
                <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 h-32 text-sm outline-none focus:border-cyan-500 transition-colors" placeholder="Paste the core facts here. The AI will reference this for all motions to ensure consistency."
                  value={newCase.globalFacts || ''} onChange={e => setNewCase({...newCase, globalFacts: e.target.value})} />
                <p className="text-xs text-slate-400 mt-2">This narrative serves as the "System Context" for every document you generate in this case.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Case Profile</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map(c => (
          <Card key={c.id} onClick={() => onSelectCase(c)} className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gavel size={64} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/20 rounded-lg group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 text-cyan-400">
                <FolderOpen size={24} />
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">{c.caseNumber}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-1 font-serif group-hover:text-cyan-400 transition-colors">{c.nickname}</h3>
            <p className="text-sm text-slate-400 line-clamp-2 h-10 mb-4">{c.courtName}</p>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={12}/> Last active: {new Date(c.lastModified).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-cyan-500 font-medium">Dashboard <ChevronRight size={12}/></span>
            </div>
          </Card>
        ))}
        {cases.length === 0 && !showForm && (
            <div className="col-span-full py-20 flex flex-col items-center text-center opacity-70 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                <FolderOpen size={64} className="mb-6 text-slate-500" />
                <h3 className="text-xl font-medium text-slate-200">No active cases found</h3>
                <p className="max-w-md mt-2 mb-6 text-slate-400">Create a case profile manually or import a docket file to get started.</p>
                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} /> Import Document
                  </Button>
                  <Button onClick={() => setShowForm(true)} variant="glow">Create Manually</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Modal: Voice Assistant ---

const VoiceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={24} />
        </button>
        <div className="mb-4 text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-1">Counselor Mode</h3>
            <p className="text-slate-400 text-sm">Verbal strategy session with Gemini</p>
        </div>
        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 h-80">
            <VoicePanel />
        </div>
    </div>
  </div>
);

// --- View: Case Dashboard ---

const CaseDashboard: React.FC<{ 
    caseProfile: CaseProfile, 
    onBack: () => void, 
    onOpenWizard: () => void,
    onOpenDraft: (d: Draft) => void,
    onUpdateCase: (c: CaseProfile) => void
}> = ({ caseProfile, onBack, onOpenWizard, onOpenDraft, onUpdateCase }) => {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [newEvent, setNewEvent] = useState('');
    const evidenceInputRef = useRef<HTMLInputElement>(null);
    const [viewEvidence, setViewEvidence] = useState<Evidence | null>(null);
    const [showVoice, setShowVoice] = useState(false);

    useEffect(() => {
        setDrafts(storage.getDraftsForCase(caseProfile.id));
    }, [caseProfile.id]);

    const handleAddEvent = () => {
        if (!newEvent) return;
        const event: CaseEvent = {
            id: crypto.randomUUID(),
            date: Date.now(),
            title: newEvent,
            description: 'Manual entry',
            type: 'OTHER'
        };
        const updated = { ...caseProfile, events: [event, ...(caseProfile.events || [])] };
        storage.saveCase(updated);
        onUpdateCase(updated);
        setNewEvent('');
    };

    const handleGenerateStrategy = async () => {
        setIsThinking(true);
        const analysis = await geminiService.analyzeCaseStrategy(caseProfile);
        const updated = { ...caseProfile, lastStrategyAnalysis: analysis };
        storage.saveCase(updated);
        onUpdateCase(updated);
        setIsThinking(false);
    };

    const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const newEvidenceList: Evidence[] = [];

        // Convert FileList to Array for iteration
        const fileArray = Array.from(files) as File[];

        for (const file of fileArray) {
             // Check size (limit to ~3MB per file for LocalStorage prototype safety)
            if (file.size > 3 * 1024 * 1024) {
                console.warn(`File ${file.name} too large for local storage prototype (Limit: 3MB). Skipping.`);
                continue;
            }
            
            try {
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                newEvidenceList.push({
                    id: crypto.randomUUID(),
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size,
                    data: base64Data,
                    uploadedAt: Date.now()
                });
            } catch (err) {
                console.error(`Failed to upload ${file.name}`, err);
            }
        }

        if (newEvidenceList.length > 0) {
            const updated = { ...caseProfile, evidence: [...newEvidenceList, ...(caseProfile.evidence || [])] };
            storage.saveCase(updated);
            onUpdateCase(updated);
        }
        
        // Reset input
        if (evidenceInputRef.current) evidenceInputRef.current.value = '';
    };

    const handleDeleteEvidence = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = { ...caseProfile, evidence: caseProfile.evidence?.filter(ev => ev.id !== id) };
        storage.saveCase(updated);
        onUpdateCase(updated);
    };

    const handleUpdateEvidence = (updatedEvidence: Evidence) => {
        const updatedList = caseProfile.evidence?.map(ev => ev.id === updatedEvidence.id ? updatedEvidence : ev) || [];
        const updatedCase = { ...caseProfile, evidence: updatedList };
        storage.saveCase(updatedCase);
        onUpdateCase(updatedCase);
        setViewEvidence(updatedEvidence); // Update the modal view
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 w-full animate-fade-in min-h-screen flex flex-col">
            {viewEvidence && <DocumentViewer evidence={viewEvidence} onClose={() => setViewEvidence(null)} onUpdateEvidence={handleUpdateEvidence} />}
            {showVoice && <VoiceModal onClose={() => setShowVoice(false)} />}
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ChevronRight className="rotate-180" size={28}/>
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                             {caseProfile.nickname} <span className="text-sm font-sans font-medium text-cyan-300 bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-500/30">{caseProfile.caseNumber}</span>
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">{caseProfile.courtName}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                     <Button variant="glow" onClick={() => setShowVoice(true)} className="bg-cyan-900/20 border-cyan-500/50 hover:bg-cyan-900/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <Mic size={18} /> <span className="hidden sm:inline">Voice Mode</span>
                     </Button>
                     <Button variant="secondary" onClick={() => {}}>
                        <Save size={16} /> Edit Details
                     </Button>
                     <Button variant="primary" onClick={onOpenWizard} className="shadow-cyan-500/20">
                        <FilePen size={16} /> Create New Filing
                     </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Timeline & Parties (3 cols) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                     <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg">
                         <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                             <CalendarDays size={14}/> Case Timeline
                         </h3>
                         <div className="flex gap-2 mb-4">
                             <input 
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs w-full text-slate-200 focus:border-cyan-500 outline-none transition-colors" 
                                placeholder="Add event..."
                                value={newEvent}
                                onChange={e => setNewEvent(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddEvent()}
                             />
                             <button onClick={handleAddEvent} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded px-2"><PlusCircle size={14}/></button>
                         </div>
                         <div className="space-y-4 relative pl-4 border-l border-slate-800 ml-1">
                             {(caseProfile.events || []).map(e => (
                                 <div key={e.id} className="relative">
                                     <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900"></div>
                                     <div className="text-xs text-slate-400 mb-0.5">{new Date(e.date).toLocaleDateString()}</div>
                                     <div className="text-sm text-slate-200 font-medium">{e.title}</div>
                                 </div>
                             ))}
                             {(!caseProfile.events || caseProfile.events.length === 0) && (
                                 <div className="text-xs text-slate-500 italic">No events logged yet.</div>
                             )}
                         </div>
                     </div>

                     <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg">
                         <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Key Parties</h3>
                         <div className="space-y-4 text-sm">
                             <div>
                                 <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Judge</div>
                                 <div className="text-slate-200 font-medium bg-slate-950/50 p-2 rounded border border-slate-800">{caseProfile.judge || 'Unassigned'}</div>
                             </div>
                             <div>
                                 <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Plaintiff</div>
                                 <div className="text-slate-200 font-medium bg-slate-950/50 p-2 rounded border border-slate-800">{caseProfile.plaintiff}</div>
                             </div>
                             <div>
                                 <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Defendant</div>
                                 <div className="text-slate-200 font-medium bg-slate-950/50 p-2 rounded border border-slate-800">{caseProfile.defendant}</div>
                             </div>
                         </div>
                     </div>
                </div>

                {/* Center Col: Strategy & Drafts (6 cols) */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Strategy Console */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <BrainCircuit size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="text-cyan-400" size={18}/> AI Strategic Counsel
                            </h3>
                            <button 
                                onClick={handleGenerateStrategy} 
                                disabled={isThinking}
                                className="text-xs bg-cyan-950/80 text-cyan-300 px-3 py-1.5 rounded-full border border-cyan-500/30 hover:bg-cyan-900 transition-colors flex items-center gap-2 shadow-sm font-medium">
                                {isThinking ? <Loader2 className="animate-spin" size={12}/> : <BrainCircuit size={12}/>}
                                {caseProfile.lastStrategyAnalysis ? 'Refresh Analysis' : 'Generate Strategy'}
                            </button>
                        </div>
                        
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed relative z-10">
                            {caseProfile.lastStrategyAnalysis ? (
                                <div dangerouslySetInnerHTML={{ __html: caseProfile.lastStrategyAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-200">$1</strong>') }} />
                            ) : (
                                <div className="text-slate-500 italic text-center py-6 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                    Click "Generate Strategy" to have Gemini analyze your case facts and history for risks and next steps.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Drafts List */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <FileText className="text-slate-400" size={20}/> Work Product
                        </h3>
                        <div className="grid gap-3">
                            {drafts.map(d => (
                                <div key={d.id} onClick={() => onOpenDraft(d)} className="bg-slate-900 border border-slate-700 p-4 rounded-xl hover:bg-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 border border-slate-800 group-hover:border-cyan-500/30">
                                            <FileText size={20}/>
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-200 group-hover:text-white">{d.title}</div>
                                            <div className="text-xs text-slate-500">Last edited {new Date(d.updatedAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-cyan-400" size={18}/>
                                </div>
                            ))}
                            {drafts.length === 0 && (
                                <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500">
                                    No documents drafted yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Evidence Locker (3 cols) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                     <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg flex-grow">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Shield size={14} /> Evidence Locker
                             </h3>
                             <input 
                                type="file" 
                                ref={evidenceInputRef} 
                                className="hidden" 
                                multiple
                                accept="application/pdf,image/*,text/plain"
                                onChange={handleEvidenceUpload}
                             />
                             <button onClick={() => evidenceInputRef.current?.click()} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/20">
                                <Upload size={12}/> Upload
                             </button>
                         </div>
                         
                         <div className="space-y-2">
                             {(caseProfile.evidence || []).map(ev => (
                                 <div key={ev.id} 
                                    onClick={() => setViewEvidence(ev)}
                                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-cyan-500/50 cursor-pointer transition-colors"
                                 >
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <div className="min-w-[2rem] w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-500">
                                             {ev.mimeType.includes('image') ? <Layout size={14}/> : <Paperclip size={14}/>}
                                         </div>
                                         <div className="truncate">
                                             <div className="text-sm text-slate-300 truncate font-medium group-hover:text-white">{ev.filename}</div>
                                             <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                {new Date(ev.uploadedAt).toLocaleDateString()}
                                                {ev.ocrText && <span title="OCR Text Available"><ScanText size={8} className="text-cyan-500"/></span>}
                                             </div>
                                         </div>
                                     </div>
                                     <button onClick={(e) => handleDeleteEvidence(ev.id, e)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={14}/>
                                     </button>
                                 </div>
                             ))}
                             {(!caseProfile.evidence || caseProfile.evidence.length === 0) && (
                                 <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                                     No evidence uploaded.
                                 </div>
                             )}
                         </div>
                     </div>
                     
                     <div className="bg-gradient-to-b from-cyan-950/20 to-slate-900/50 rounded-xl p-5 border border-cyan-500/20">
                         <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">Pro Tip</h3>
                         <p className="text-xs text-slate-400 leading-relaxed">
                             Run OCR on uploaded PDFs to let the AI search your evidence during drafting.
                         </p>
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- View: Filing Wizard ---

const FilingWizard: React.FC<{ 
    caseProfile: CaseProfile, 
    onCancel: () => void, 
    onComplete: (draft: Draft) => void 
}> = ({ caseProfile, onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<FilingType | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [generatingSection, setGeneratingSection] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const filingTypes = getFilingTypes();

    const handleGenerate = async () => {
        if (!selectedType) return;
        setStep(3);
        
        // 1. Generate Caption 
        const caption = `<div style="text-align:center; font-weight:bold; margin-bottom: 2rem;">
        ${caseProfile.courtName.toUpperCase()}<br/><br/>
        ${caseProfile.plaintiff}, Plaintiff,<br/>
        v.<br/>
        ${caseProfile.defendant}, Defendant.<br/><br/>
        CASE NO: ${caseProfile.caseNumber}<br/><br/>
        ${selectedType.id === 'CUSTOM_MOTION' ? (answers['motion_title'] || 'MOTION').toUpperCase() : selectedType.name.toUpperCase()}
        </div>`;
        
        let fullDoc = caption;
        const totalSections = selectedType.sections.length;
        
        // 2. Iterate sections
        for (let i = 0; i < totalSections; i++) {
            const section = selectedType.sections[i];
            setGeneratingSection(section.title);
            setProgress(((i) / totalSections) * 100);
            
            const content = await geminiService.generateSectionContent(section, caseProfile, answers);
            fullDoc += `\n\n### ${section.title}\n\n${content}`;
        }
        
        setProgress(100);
        setGeneratingSection(null);
        
        const newDraft: Draft = {
            id: crypto.randomUUID(),
            caseId: caseProfile.id,
            filingTypeId: selectedType.id,
            title: `${selectedType.id === 'CUSTOM_MOTION' ? answers['motion_title'] : selectedType.name} - ${new Date().toLocaleDateString()}`,
            content: fullDoc,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        storage.saveDraft(newDraft);
        setTimeout(() => onComplete(newDraft), 800);
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 w-full min-h-screen flex flex-col">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onCancel} className="flex items-center text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={20} className="rotate-180 mr-1"/> Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                    <StepIndicator num={1} active={step >= 1} label="Strategy" />
                    <div className={`w-12 h-px ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                    <StepIndicator num={2} active={step >= 2} label="Details" />
                    <div className={`w-12 h-px ${step >= 3 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                    <StepIndicator num={3} active={step >= 3} label="Drafting" />
                </div>
            </div>
            
            <div className="flex-grow flex flex-col justify-center">
                {step === 1 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-bold font-serif text-white mb-2">Select Filing Strategy</h2>
                            <p className="text-slate-400">Choose a pre-configured motion template tailored for {caseProfile.jurisdiction}.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filingTypes.map(ft => (
                                <Card key={ft.id} onClick={() => setSelectedType(ft)} 
                                    className={`relative ${selectedType?.id === ft.id ? 'bg-cyan-900/40 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${selectedType?.id === ft.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            <FileText size={20} />
                                        </div>
                                        {selectedType?.id === ft.id && <CheckCircle2 className="text-cyan-500" size={20}/>}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-200 mb-2">{ft.name}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{ft.description}</p>
                                </Card>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                            <Button disabled={!selectedType} onClick={() => setStep(2)} variant="glow" className="px-12">
                                Continue <ArrowRight size={18}/>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && selectedType && (
                     <div className="animate-fade-in max-w-2xl mx-auto w-full">
                        <div className="mb-8">
                             <h2 className="text-3xl font-bold font-serif text-white mb-2">{selectedType.name}</h2>
                             <p className="text-slate-400">MotionForge needs specific details to construct the argument.</p>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                            {selectedType.questions.map(q => (
                                <div key={q.id} className="group">
                                    <label className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">{q.label}</label>
                                    {q.type === 'textarea' ? (
                                        <textarea 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all h-32 resize-none"
                                            placeholder={q.placeholder}
                                            value={answers[q.id] || ''}
                                            onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                        />
                                    ) : (
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                                            placeholder={q.placeholder}
                                            value={answers[q.id] || ''}
                                            onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleGenerate} variant="glow">
                                <Sparkles size={18} /> Initialize Drafting Agent
                            </Button>
                        </div>
                     </div>
                )}

                {step === 3 && (
                    <div className="text-center max-w-xl mx-auto animate-pulse">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                             <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl"></div>
                             <div className="relative bg-slate-900 border border-cyan-500/50 w-full h-full rounded-full flex items-center justify-center">
                                 <Cpu className="text-cyan-400 animate-spin-slow" size={40} />
                             </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-serif">Constructing Filing...</h3>
                        <p className="text-slate-400 mb-8 h-6">{generatingSection ? `Drafting: ${generatingSection}` : 'Finalizing document structure...'}</p>
                        
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- View: Document Editor ---

const Editor: React.FC<{ draft: Draft, caseProfile: CaseProfile, onBack: () => void }> = ({ draft, caseProfile, onBack }) => {
    const [content, setContent] = useState(draft.content);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTool, setActiveTool] = useState<AIFeature | null>(null);

    // AI Tools State
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content !== draft.content) {
                setIsSaving(true);
                storage.saveDraft({ ...draft, content, updatedAt: Date.now() });
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [content]);

    const handleAIEdit = async (instruction: string) => {
        const selection = window.getSelection()?.toString();
        if (!selection) return alert("Select text to edit.");
        const refined = await geminiService.refineText(selection, instruction);
        setContent(c => c.replace(selection, refined));
    };

    const handleChatSend = async () => {
        if(!chatInput) return;
        setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
        const txt = chatInput;
        setChatInput('');
        const chat = geminiService.createChat(); 
        const result = await chat.sendMessage({ message: txt });
        setChatMessages(prev => [...prev, { role: 'model', content: result.text }]);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950">
            {/* Toolbar */}
            <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                        <ChevronRight className="rotate-180" size={16}/> <span className="text-sm font-medium">Exit</span>
                    </button>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div>
                        <h1 className="font-semibold text-slate-200 text-sm">{draft.title}</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{caseProfile.nickname}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`text-xs mr-4 transition-colors ${isSaving ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {isSaving ? 'Syncing...' : 'Saved to Local Storage'}
                    </span>
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => handleAIEdit("Make more formal")} className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-all">Formalize</button>
                        <button onClick={() => handleAIEdit("Shorten this")} className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-all">Concise</button>
                    </div>
                    <Button variant="primary" className="h-9 text-xs px-4 ml-2"><Save size={14}/> Export PDF</Button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-grow overflow-hidden relative">
                {/* Document Surface */}
                <div className="flex-grow overflow-y-auto flex justify-center p-8 bg-slate-950">
                    <div className="w-full max-w-[8.5in] bg-[#f8f9fa] min-h-[11in] shadow-2xl p-[1in] text-slate-900 font-serif leading-relaxed whitespace-pre-wrap outline-none selection:bg-cyan-200 selection:text-cyan-900 relative rounded-sm">
                         <textarea 
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            className="w-full h-full bg-transparent resize-none focus:outline-none"
                            spellCheck={false}
                         />
                    </div>
                </div>
                
                {/* AI Sidebar Toggle */}
                <div className="w-16 border-l border-slate-800 bg-slate-900 flex flex-col items-center py-6 gap-6 z-10 shadow-xl">
                    <ToolButton icon={<MessageSquare size={20}/>} label="Chat" active={activeTool === AIFeature.CHAT} onClick={() => setActiveTool(activeTool === AIFeature.CHAT ? null : AIFeature.CHAT)} />
                    <ToolButton icon={<BookOpen size={20}/>} label="Research" active={activeTool === AIFeature.LEGAL_RESEARCH} onClick={() => setActiveTool(activeTool === AIFeature.LEGAL_RESEARCH ? null : AIFeature.LEGAL_RESEARCH)} />
                    <ToolButton icon={<Mic size={20}/>} label="Voice" active={activeTool === AIFeature.VOICE_ASSISTANT} onClick={() => setActiveTool(activeTool === AIFeature.VOICE_ASSISTANT ? null : AIFeature.VOICE_ASSISTANT)} />
                </div>

                {/* AI Panel (Slide-out) */}
                {activeTool && (
                    <div className="w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl p-0 flex flex-col h-full absolute right-16 top-0 bottom-0 shadow-2xl animate-fade-in z-20">
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Sparkles size={16} className="text-cyan-400"/> {activeTool}
                            </h3>
                            <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white"><X size={18}/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-4">
                            {activeTool === AIFeature.CHAT && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-grow space-y-4 mb-4">
                                        {chatMessages.length === 0 && (
                                            <div className="text-center text-slate-500 mt-10 text-sm">
                                                <MessageSquare size={32} className="mx-auto mb-2 opacity-50"/>
                                                Ask questions about your draft or legal strategy.
                                            </div>
                                        )}
                                        {chatMessages.map((m, i) => (
                                            <div key={i} className={`p-3 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-cyan-900/30 text-cyan-100 ml-8 border border-cyan-500/20' : 'bg-slate-800 text-slate-300 mr-8 border border-slate-700'}`}>
                                                {m.content}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-sm focus:border-cyan-500 outline-none" 
                                            value={chatInput} onChange={e => setChatInput(e.target.value)} 
                                            onKeyPress={e => e.key === 'Enter' && handleChatSend()} placeholder="Ask Gemini..." />
                                        <button onClick={handleChatSend} className="absolute right-2 top-2 p-1 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500"><ArrowRight size={14}/></button>
                                    </div>
                                </div>
                            )}
                            {activeTool === AIFeature.LEGAL_RESEARCH && <ResearchPanel onInsert={(t) => setContent(c => c + '\n\n' + t)} />}
                            {activeTool === AIFeature.VOICE_ASSISTANT && <VoicePanel />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, active, onClick, label }) => (
    <div className="group relative flex flex-col items-center gap-1">
        <button onClick={onClick} className={`p-3 rounded-xl transition-all duration-300 ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'}`}>
            {icon}
        </button>
        <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300">{label}</span>
    </div>
);

// --- Sub-Panels ---

const Label: React.FC<{ children: React.ReactNode }> = ({children}) => <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{children}</label>;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none focus:border-cyan-500 transition-colors" {...props} />;

const ResearchPanel: React.FC<{ onInsert: (t: string) => void }> = ({ onInsert }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [sources, setSources] = useState<any[]>([]);

    const search = async () => {
        setLoading(true);
        const res = await geminiService.performLegalResearch(query);
        setResults(res.results);
        setSources(res.sources);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full">
             <div className="mb-4">
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-cyan-500 outline-none" 
                        value={query} onChange={e => setQuery(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && search()} placeholder="Search case law..." />
             </div>
             
             <div className="flex-grow space-y-3">
                 {loading && (
                    <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        Searching corpus...
                    </div>
                 )}

                 {sources.length > 0 && (
                     <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                         <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Sources</h4>
                         <div className="flex flex-col gap-1.5">
                             {sources.map((chunk: any, i: number) => {
                                 const uri = chunk.web?.uri;
                                 const title = chunk.web?.title || uri;
                                 if (!uri) return null;
                                 return (
                                     <a key={i} href={uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline truncate flex items-center gap-1">
                                         <ArrowRight size={10}/> {title}
                                     </a>
                                 );
                             })}
                         </div>
                     </div>
                 )}

                 {results.map((r, i) => (
                     <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group">
                         <div className="font-bold text-cyan-400 text-sm mb-2 font-serif">{r.citation}</div>
                         <div className="text-slate-400 text-xs leading-relaxed mb-3">{r.summary}</div>
                         <button onClick={() => onInsert(`[${r.citation}] ${r.summary}`)} className="w-full py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                             Insert Citation
                         </button>
                     </div>
                 ))}
             </div>
        </div>
    );
};

const VoicePanel: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const sessionRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        return () => {
             // Cleanup active session on unmount
             if (sessionRef.current) {
                 sessionRef.current.then(s => {
                     // LiveSession.close() is typically void/sync or handles itself.
                     // The previous error "reading 'catch' of undefined" implies close() returns void.
                     // We just call it without chaining .catch()
                     try {
                        s.close();
                     } catch (e) {
                         // Ignore close errors
                     }
                 }).catch(e => {
                     // Ignore connection promise errors
                 });
             }
             audioContextRef.current?.close();
        };
    }, []);

    const toggle = async () => {
        if (connected) {
            if (sessionRef.current) {
                const session = await sessionRef.current;
                session.close();
            }
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            setConnected(false);
        } else {
             if (!audioContextRef.current) {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
             }
             const ctx = audioContextRef.current;
             if (ctx.state === 'suspended') {
                 await ctx.resume();
             }

             sessionRef.current = geminiService.connectLive({
                 onopen: () => setConnected(true),
                 onclose: () => setConnected(false),
                 onmessage: async (msg: any) => {
                     const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                     if (base64Audio) {
                         try {
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            const now = ctx.currentTime;
                            if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                            source.onended = () => sourcesRef.current.delete(source);
                         } catch (e) { console.error("Audio decode error", e); }
                     }
                 }
             });
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${connected ? 'bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                <Mic size={40} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{connected ? 'Listening...' : 'Voice Mode'}</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
                Real-time conversation with Gemini. Speak naturally to brainstorm arguments or rehearse your opening statement.
            </p>
            <Button onClick={toggle} variant={connected ? 'danger' : 'primary'} className="w-full">
                {connected ? 'End Session' : 'Start Conversation'}
            </Button>
        </div>
    );
};

// --- Main App Controller ---

export default function App() {
  const [view, setView] = useState<'LANDING' | 'CASES' | 'DASHBOARD' | 'WIZARD' | 'EDITOR'>('LANDING');
  const [selectedCase, setSelectedCase] = useState<CaseProfile | null>(null);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);

  const handleCaseSelect = (c: CaseProfile) => {
    setSelectedCase(c);
    setView('DASHBOARD'); 
  };

  const handleUpdateCase = (updated: CaseProfile) => {
      setSelectedCase(updated);
  };

  const handleWizardComplete = (draft: Draft) => {
      setCurrentDraft(draft);
      setView('EDITOR');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
        {view === 'LANDING' && <Landing onEnter={() => setView('CASES')} />}

        {view === 'CASES' && (
             <CaseManager onSelectCase={handleCaseSelect} />
        )}

        {view === 'DASHBOARD' && selectedCase && (
            <CaseDashboard 
                caseProfile={selectedCase}
                onBack={() => setView('CASES')}
                onOpenWizard={() => setView('WIZARD')}
                onOpenDraft={(d) => { setCurrentDraft(d); setView('EDITOR'); }}
                onUpdateCase={handleUpdateCase}
            />
        )}

        {view === 'WIZARD' && selectedCase && (
            <FilingWizard 
                caseProfile={selectedCase} 
                onCancel={() => setView('DASHBOARD')}
                onComplete={handleWizardComplete}
            />
        )}

        {view === 'EDITOR' && currentDraft && selectedCase && (
            <Editor 
                draft={currentDraft} 
                caseProfile={selectedCase}
                onBack={() => { setCurrentDraft(null); setView('DASHBOARD'); }} 
            />
        )}
    </div>
  );
}

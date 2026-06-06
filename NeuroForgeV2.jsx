import { useState, useCallback, useRef, useEffect } from "react";

/* ─── INLINE SVG ICONS (thay lucide-react) ──────────────────────── */
const Copy = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const Download = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const Trash2 = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const CheckCheck = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>;
const AlertCircle = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const Loader = ({size=16,style={}}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
const Zap = ({size=16,color="currentColor",strokeWidth=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const ChevronRight = ({size=16,color="currentColor",strokeWidth=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const Upload = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const Sparkles = ({size=14,strokeWidth=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
const Shuffle = ({size=14,strokeWidth=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const Settings2 = ({size=14,strokeWidth=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>;
const Brain = ({size=15,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>;
const RotateCcw = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const Play = ({size=13}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const FileDown = ({size=13}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>;
const FolderOpen = ({size=13,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>;
const ShieldCheck = ({size=18,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const RefreshCw = ({size=13,style={}}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const Gauge = ({size=14,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>;

/* ─── BASE RULES ──────────────────────────────────────────────────── */
const BASE_RULES = `
OUTPUT FORMAT — Return ONLY a raw JSON object. No markdown fences, no explanation, no preamble.
{
  "items": [
    {
      "id": "sb-BATCHTS-INDEX",
      "index": 1,
      "label": "01",
      "originalText": "<copied from segment>",
      "type": "<copied from segment: video | image>",
      "duration": <number>,
      "wordCount": <number>,
      "prompt": "<English prompt>",
      "status": "done"
    }
  ],
  "promptMode": "<mode string>",
  "theme": <null or string>
}
ID: BATCHTS = 10-digit unix timestamp, INDEX = 0-based integer.
Label: zero-padded 2-digit string from 1-based index ("01","02",...).

VEO SAFETY — ALL MODES:
If originalText contains fighting, combat, weapons, injury, death, or conflict:
  BANNED: blood, gore, punch, kick, kill, murder, fight, violence, weapon, stab, shoot, blast, attack, brutal, assault
  USE INSTEAD: dynamic choreography, intense sparring, fast-paced movement, athletic action, dodging, cinematic martial arts display, acrobatic sequence, fluid motion, dramatic tension, forceful gesture

IMAGE vs VIDEO — ALL MODES:
  type "image" → static design/illustration prompt: composition, color palette, visual hierarchy, layout. 15–30 words.
  type "video" → cinematic motion prompt: camera movement (tracking/dolly/panning/zoom/handheld), lighting quality (cinematic/volumetric/golden hour/neon-lit), subject action. 20–40 words. Hard max 45 words.
All prompts MUST be written in English only.`;

/* ─── SYSTEM PROMPTS ─────────────────────────────────────────────── */
function buildSystemPrompt(mode, styles) {
  if (mode === "default") {
    return `You are a Storyboard Prompt Engine for NeuroForge — DEFAULT MODE.
Translate each Vietnamese segment into a clear, direct English visual prompt.
No style prefix tags ([S1] etc.). Accurately convey what should be seen on screen.
Maintain natural visual flow between adjacent segments.
Set "promptMode" to "Fixed" and "theme" to null in the output.
${BASE_RULES}`;
  }
  if (mode === "flexible") {
    const list = styles.join(", ");
    return `You are a Storyboard Prompt Engine for NeuroForge — FLEXIBLE MODE.
Active styles: [${list}]

RULE A — VISUAL CONTINUITY:
For segment N, read N-1 and N+1 context. If scenes flow naturally (same character, location, mood), maintain visual continuity. Do not break immersion with abrupt setting changes.

RULE B — STYLE ROTATION (IRON LAW):
• Every prompt MUST begin with its style tag: [S1], [S2], etc.
• Rotate freely through [${list}].
• NEVER repeat the same style 4+ consecutive times. After 3 consecutive uses → MUST switch.
• When switching style, adapt the subject description to that style's aesthetic.

Set "promptMode" to "Flexible" and "theme" to null in the output.
${BASE_RULES}`;
  }
  if (mode === "ai") {
    return `You are a Storyboard Prompt Engine for NeuroForge — AI STYLE MODE.
You have creative freedom. Your job is to analyze the full narrative and invent a unique, cohesive visual style.

PHASE 1 — DEEP NARRATIVE ANALYSIS (internal reasoning, not written in output):
Read ALL segments' originalText holistically. Understand the complete story arc, identify topic/characters/settings/emotional tone/target audience. For ambiguous segments: infer meaning from surrounding context.

PHASE 2 — UNIQUE STYLE INVENTION (result written in "theme" field):
Devise ONE specific, original visual style for the entire video. Write a concise 2–3 sentence description in the "theme" field.
Example quality: "Neo-noir city documentary. High-contrast shadows, rain-slicked neon reflections, hand-held urgency. Muted cyan-amber palette, deep blacks."

PHASE 3 — CONTEXTUAL PROMPT GENERATION:
Apply the invented style consistently to ALL segments. No style prefix tags — embed the style naturally in each prompt.

Set "promptMode" to "AI" in the output.
${BASE_RULES}`;
  }
}

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
const STYLE_OPTIONS = ["S1","S2","S3","S4","S5"];
const CHECKPOINT_VERSION = "nf-checkpoint-v1";

const MODES = [
  { id:"default",  label:"Mặc định",  icon:Settings2, desc:"Dịch trực tiếp, không style tag" },
  { id:"flexible", label:"Linh hoạt", icon:Shuffle,   desc:"Luân phiên styles đã chọn" },
  { id:"ai",       label:"AI Style",  icon:Sparkles,  desc:"AI tự phân tích & phát minh phong cách" },
];

const DEFAULT_MODELS = [
  { id:"claude-haiku-4-5",  label:"Haiku 4.5",  desc:"Nhanh · tiết kiệm",          maxTokens:64000,  color:"#fbbf24", rgb:"251,191,36",  thinking:false },
  { id:"claude-sonnet-4-6", label:"Sonnet 4.6", desc:"Khuyên dùng · cân bằng",     maxTokens:64000,  color:"#2ef2c4", rgb:"46,242,196",  thinking:true  },
  { id:"claude-opus-4-6",   label:"Opus 4.6",   desc:"Phân tích sâu · phức tạp",   maxTokens:128000, color:"#a78bfa", rgb:"167,139,250", thinking:true  },
];

// Bảng màu để gán lại cho model mới (theo thứ tự)
const MODEL_PALETTE = [
  { color:"#fbbf24", rgb:"251,191,36"  },
  { color:"#2ef2c4", rgb:"46,242,196"  },
  { color:"#a78bfa", rgb:"167,139,250" },
  { color:"#63b3ed", rgb:"99,179,237"  },
  { color:"#f472b6", rgb:"244,114,182" },
];

const EFFORT_LEVELS = [
  { id:"low",    label:"Low",  desc:"Đơn giản · khối lượng lớn" },
  { id:"medium", label:"Med",  desc:"Cân bằng production"       },
  { id:"high",   label:"High", desc:"Chất lượng cao (mặc định)" },
  { id:"max",    label:"Max",  desc:"Khó nhất · kỹ nhất"        },
];

/* ─── PRICING (per 1M tokens, USD) ──────────────────────────────── */
const PRICING = {
  "claude-haiku-4-5":  { input: 0.80,  output: 4.00  },
  "claude-sonnet-4-6": { input: 3.00,  output: 15.00 },
  "claude-opus-4-6":   { input: 15.00, output: 75.00 },
  "claude-opus-4-7":   { input: 15.00, output: 75.00 },
  "claude-opus-4-8":   { input: 15.00, output: 75.00 },
};
const DEFAULT_PRICE = { input: 3.00, output: 15.00 };

const PLACEHOLDER = `{
  "segments": [
    {
      "originalText": "Đây là đoạn nội dung đầu tiên...",
      "type": "video",
      "wordCount": 12,
      "duration": 5
    }
  ],
  "promptMode": "Flexible",
  "selectedStyles": ["S1","S2","S3"]
}`;

/* ─── HELPERS ────────────────────────────────────────────────────── */
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 300); i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
function extractPartialItems(raw) {
  const match = raw.match(/"items"\s*:\s*\[/);
  if (!match) return [];
  const content = raw.slice(match.index + match[0].length);
  const items = []; let depth = 0, start = -1;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (content[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { const o = JSON.parse(content.slice(start, i+1)); if (o.id && o.prompt) items.push(o); } catch {}
        start = -1;
      }
    }
  }
  return items;
}
function extractTheme(raw) {
  const m = raw.match(/"theme"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return m ? m[1] : null;
}
function fmtAge(ts) {
  if (!ts) return "";
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 2) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  return `${Math.round(mins/60)}h trước`;
}
function downloadJson(obj, filename) {
  try {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
  } catch(e) {
    console.error("Download failed:", e);
  }
}
function isCheckpointFile(obj) {
  return obj && obj.__type === CHECKPOINT_VERSION && obj.originalInput && obj.resumeData;
}

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────── */
function Badge({ children, color = "default", small }) {
  const C = {
    default: { bg:"rgba(255,255,255,0.06)", fg:"#8895aa", br:"rgba(255,255,255,0.08)" },
    teal:    { bg:"rgba(46,242,196,0.08)",  fg:"#2ef2c4", br:"rgba(46,242,196,0.2)"  },
    purple:  { bg:"rgba(167,139,250,0.1)",  fg:"#a78bfa", br:"rgba(167,139,250,0.25)"},
    amber:   { bg:"rgba(251,191,36,0.08)",  fg:"#fbbf24", br:"rgba(251,191,36,0.2)"  },
    red:     { bg:"rgba(248,113,113,0.08)", fg:"#f87171", br:"rgba(248,113,113,0.2)" },
    green:   { bg:"rgba(52,211,153,0.08)",  fg:"#34d399", br:"rgba(52,211,153,0.2)"  },
  }[color] || { bg:"rgba(255,255,255,0.06)", fg:"#8895aa", br:"rgba(255,255,255,0.08)" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding: small ? "2px 8px" : "3px 10px",
      borderRadius:20, background:C.bg, color:C.fg,
      border:`1px solid ${C.br}`,
      fontSize:small?10:11, fontWeight:600, letterSpacing:"0.4px",
      textTransform:"uppercase", fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap"
    }}>{children}</span>
  );
}

function PanelHeader({ dot, title, badge }) {
  const dotColor = dot==="purple" ? "#7c5ef4" : dot==="teal" ? "#2ef2c4" : "#fbbf24";
  const dotGlow  = dot==="purple" ? "rgba(124,94,244,0.7)" : dot==="teal" ? "rgba(46,242,196,0.7)" : "rgba(251,191,36,0.7)";
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.015)" }}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:dotColor, boxShadow:`0 0 6px ${dotGlow}` }}/>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.9px",textTransform:"uppercase",color:"#5f6880"}}>{title}</span>
      </div>
      {badge}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#3d4455",marginBottom:10}}>{children}</div>;
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function NeuroForgeConverter() {
  const [mode, setMode]                     = useState("flexible");
  const [selectedStyles, setSelectedStyles] = useState(["S1","S2","S3"]);
  const [input, setInput]                   = useState("");
  const [output, setOutput]                 = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [copied, setCopied]                 = useState(false);
  const [itemCount, setItemCount]           = useState(0);
  const [fileName, setFileName]             = useState("");
  const [selectedModel, setSelectedModel]   = useState("claude-sonnet-4-6");
  const [effortLevel, setEffortLevel]       = useState("high");
  const [thinkingOn, setThinkingOn]         = useState(false);
  const [resumeData, setResumeData]         = useState(null);
  const [checkpointLoaded, setCheckpointLoaded] = useState(false);
  const [tokenUsage, setTokenUsage]         = useState(null);
  const [models, setModels]                 = useState(DEFAULT_MODELS);
  const [updating, setUpdating]             = useState(false);
  const [updateMsg, setUpdateMsg]           = useState("");

  const fileRef       = useRef(null);
  const checkpointRef = useRef(null);

  const modelObj  = models.find(m => m.id === selectedModel) || models[0];
  // Thinking chỉ khả dụng khi model hỗ trợ; nếu không thì coi như tắt
  const thinkingAvailable = !!modelObj.thinking;
  const thinkingActive    = thinkingOn && thinkingAvailable;

  const toggleStyle = (s) => setSelectedStyles(prev =>
    prev.includes(s) ? (prev.length > 1 ? prev.filter(x => x !== s) : prev) : [...prev, s]
  );

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const r = new FileReader();
    r.onload = ev => {
      setInput(ev.target.result);
      setError(""); setOutput(""); setItemCount(0); setCheckpointLoaded(false);
    };
    r.readAsText(file);
    e.target.value = "";
  };

  const handleCheckpointImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (!isCheckpointFile(obj)) { setError("File không phải checkpoint hợp lệ của NeuroForge."); return; }
        setInput(obj.originalInput);
        setFileName(obj.originalFileName || "");
        setResumeData(obj.resumeData);
        setMode(obj.settings?.mode || "flexible");
        setSelectedStyles(obj.settings?.selectedStyles || ["S1","S2","S3"]);
        setSelectedModel(obj.settings?.selectedModel || "claude-sonnet-4-6");
        setEffortLevel(obj.settings?.effortLevel || "high");
        setThinkingOn(obj.settings?.thinkingOn || false);
        if (obj.resumeData?.partialItems?.length > 0) {
          const partial = obj.resumeData.partialItems;
          setOutput(JSON.stringify({ items: partial, promptMode: obj.settings?.mode === "ai" ? "AI" : obj.settings?.mode === "flexible" ? "Flexible" : "Fixed", theme: obj.resumeData.theme || null }, null, 2));
          setItemCount(partial.length);
        }
        setError(""); setCheckpointLoaded(true);
      } catch { setError("Không đọc được file checkpoint. File bị hỏng?"); }
    };
    r.readAsText(file);
    e.target.value = "";
  };

  const segCount = (() => { try { return JSON.parse(input).segments?.length ?? 0; } catch { return 0; } })();

  const getStorageKey = useCallback(() => {
    try {
      const p = JSON.parse(input);
      const sig = `${p.segments?.length}_${p.segments?.[0]?.originalText?.slice(0,60)||""}`;
      return `nf_state_${simpleHash(sig)}`;
    } catch { return `nf_state_${simpleHash(input.slice(0,150))}`; }
  }, [input]);

  useEffect(() => {
    if (!input.trim()) { setResumeData(null); return; }
    (async () => {
      try {
        const saved = await window.storage.get(getStorageKey());
        if (saved) {
          const parsed = JSON.parse(saved.value);
          setResumeData(parsed);
        } else {
          setResumeData(prev => prev && checkpointLoaded ? prev : null);
        }
      } catch {}
    })();
  }, [input, getStorageKey]);

  const saveResumeState = useCallback(async (partialItems, theme, totalSegments) => {
    try {
      await window.storage.set(getStorageKey(), JSON.stringify({ partialItems, theme, totalSegments, mode, selectedModel, timestamp: Date.now() }));
    } catch(e) { console.error("Resume save error:", e); }
  }, [getStorageKey, mode, selectedModel]);

  const clearResumeState = useCallback(async () => {
    try { await window.storage.delete(getStorageKey()); } catch {}
    setResumeData(null); setCheckpointLoaded(false);
  }, [getStorageKey]);

  const calcMaxTokens = useCallback(() => {
    // Cap an toàn cho artifact (tránh request quá lớn); model có thể hỗ trợ nhiều hơn
    return Math.min(modelObj.maxTokens, 16000);
  }, [modelObj]);

  const exportCheckpoint = useCallback(() => {
    if (!resumeData) return;
    const checkpoint = { __type: CHECKPOINT_VERSION, exportedAt: new Date().toISOString(), originalInput: input, originalFileName: fileName, resumeData, settings: { mode, selectedStyles, selectedModel, effortLevel, thinkingOn } };
    const done = resumeData.partialItems?.length || 0;
    const total = resumeData.totalSegments || "?";
    downloadJson(checkpoint, `nf_checkpoint_${done}of${total}_${Date.now()}.json`);
  }, [resumeData, input, fileName, mode, selectedStyles, selectedModel, effortLevel, thinkingOn]);

  const process = useCallback(async (isResume = false) => {
    if (!input.trim()) { setError("Paste hoặc import JSON Bước 2."); return; }
    let parsed;
    try { parsed = JSON.parse(input); } catch { setError("JSON không hợp lệ."); return; }
    if (!Array.isArray(parsed.segments) || !parsed.segments.length) { setError("Không tìm thấy mảng 'segments' trong JSON."); return; }

    const overridden = { ...parsed, promptMode: mode === "default" ? "Fixed" : mode === "flexible" ? "Flexible" : "AI", selectedStyles: mode === "flexible" ? selectedStyles : mode === "ai" ? ["AI"] : (parsed.selectedStyles ?? ["S1"]) };
    const max_tokens = calcMaxTokens();
    const headers = {
      "Content-Type": "application/json",
      "anthropic-beta": "effort-2025-11-24",
    };
    const existingItems = isResume && resumeData?.partialItems ? resumeData.partialItems : [];
    const savedTheme    = isResume && resumeData?.theme ? resumeData.theme : null;
    let userContent;

    if (isResume && existingItems.length > 0) {
      const N = existingItems.length; const total = parsed.segments.length;
      userContent = `RESUME — Already generated ${N} of ${total} items. Continue from item ${N+1}.\n\nFull original segment data:\n${JSON.stringify(overridden, null, 2)}\n\nLast 3 generated items (for visual continuity context):\n${JSON.stringify(existingItems.slice(-3), null, 2)}\n\n${savedTheme ? `Established visual theme: "${savedTheme}"\n\n` : ""}Generate ONLY items for segments ${N+1}–${total} (0-based index ${N} to ${total-1}).\nIDs: use current unix timestamp as BATCHTS, INDEX starts from ${N}.\nLabels start from "${String(N+1).padStart(2,"0")}".\nReturn same JSON structure with ONLY the NEW items in the "items" array.\nSet "theme" to ${savedTheme ? `"${savedTheme}"` : "null"}.`;
    } else {
      userContent = `Convert this Step 2 JSON to Step 3 Storyboard JSON:\n\n${JSON.stringify(overridden, null, 2)}`;
    }

    setLoading(true); setError(""); setOutput(""); setItemCount(0); setCheckpointLoaded(false);

    try {
      const body = {
        model: selectedModel,
        max_tokens,
        system: buildSystemPrompt(mode, selectedStyles),
        messages: [{ role: "user", content: userContent }],
        output_config: { effort: effortLevel },
      };
      // Adaptive thinking — đúng cho mọi model 4.6+ (Sonnet 4.6, Opus 4.6/4.7/4.8).
      // Effort đã truyền qua output_config ở trên để hướng dẫn lượng thinking.
      if (thinkingActive) { body.thinking = { type: "adaptive" }; }

      const res  = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { setError(`API Error: ${data.error.message}`); return; }

      // ── TOKEN USAGE ──
      if (data.usage) {
        const u = data.usage;
        const p = PRICING[selectedModel] || DEFAULT_PRICE;
        const inTok       = u.input_tokens        || 0;
        const outTok      = u.output_tokens       || 0;
        const thinkTok    = u.thinking_tokens      || 0;
        const cacheCreate = u.cache_creation_input_tokens || 0;
        const cacheRead   = u.cache_read_input_tokens     || 0;
        // Token thinking tính theo giá output
        const cost = (inTok / 1e6) * p.input
                   + ((outTok + thinkTok) / 1e6) * p.output;
        setTokenUsage(prev => ({
          last: { input: inTok, output: outTok, thinking: thinkTok, cacheCreate, cacheRead, cost },
          totalInput:    (prev?.totalInput    || 0) + inTok,
          totalOutput:   (prev?.totalOutput   || 0) + outTok,
          totalThinking: (prev?.totalThinking || 0) + thinkTok,
          totalCost:     (prev?.totalCost     || 0) + cost,
          calls: (prev?.calls || 0) + 1,
        }));
      }

      const stopReason = data.stop_reason;
      const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text || "").join("").replace(/```json\n?|```/g, "").trim();

      let parsedResult = null;
      try { parsedResult = JSON.parse(raw); } catch {}

      if (parsedResult?.items) {
        let finalItems = parsedResult.items;
        let finalTheme = parsedResult.theme || null;
        if (isResume && existingItems.length > 0) { finalItems = [...existingItems, ...finalItems]; finalTheme = finalTheme || savedTheme; }
        const finalResult = { ...parsedResult, items: finalItems, theme: finalTheme };
        setOutput(JSON.stringify(finalResult, null, 2));
        setItemCount(finalItems.length);
        if (stopReason === "max_tokens" && finalItems.length < parsed.segments.length) {
          await saveResumeState(finalItems, finalTheme, parsed.segments.length);
          setResumeData({ partialItems: finalItems, theme: finalTheme, totalSegments: parsed.segments.length, timestamp: Date.now() });
          setError(`⚠ Đã tạo ${finalItems.length}/${parsed.segments.length} items — hết token. Xuất checkpoint hoặc nhấn "Tiếp tục".`);
        } else { await clearResumeState(); }
      } else if (stopReason === "max_tokens") {
        const partial    = extractPartialItems(raw);
        const theme      = extractTheme(raw) || savedTheme;
        const allPartial = isResume ? [...existingItems, ...partial] : partial;
        if (allPartial.length > 0) {
          await saveResumeState(allPartial, theme, parsed.segments.length);
          setResumeData({ partialItems: allPartial, theme, totalSegments: parsed.segments.length, timestamp: Date.now() });
          setOutput(JSON.stringify({ items: allPartial, promptMode: mode === "ai" ? "AI" : mode === "flexible" ? "Flexible" : "Fixed", theme }, null, 2));
          setItemCount(allPartial.length);
          setError(`⚠ Đã tạo ${allPartial.length}/${parsed.segments.length} items — hết token. Xuất checkpoint hoặc nhấn "Tiếp tục".`);
        } else { setOutput(raw); setError("⚠ Bị cắt sớm, chưa có item hoàn chỉnh. Thử lại."); }
      } else { setOutput(raw); }
    } catch(e) { setError(`Lỗi kết nối: ${e.message}`); }
    finally    { setLoading(false); }
  }, [input, mode, selectedStyles, selectedModel, effortLevel, thinkingActive, modelObj, resumeData, calcMaxTokens, saveResumeState, clearResumeState]);

  // ── Gọi Claude (KHÔNG dùng tool) để hỏi danh sách model ──
  // Lưu ý: proxy zero-key của Artifact từ chối server tool như web_search_* (gây 400),
  // nên ta hỏi trực tiếp Claude từ kiến thức của model thay vì web_search.
  const callClaudeJSON = useCallback(async (prompt) => {
    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort: "low" },
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-beta": "effort-2025-11-24" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return (data.content || []).filter(b => b.type === "text").map(b => b.text || "").join("\n");
  }, []);

  // ── Cập nhật danh sách model (hỏi Claude trực tiếp, có thoái lui an toàn) ──
  const runUpdateModels = useCallback(async () => {
    setUpdating(true); setUpdateMsg("");
    try {
      const prompt =
        `List the current generally-available Anthropic Claude API chat models (Haiku/Sonnet/Opus families, version 4.5 and newer). ` +
        `Return ONLY a raw JSON array (no markdown fences, no prose) of objects:\n` +
        `[{"id":"<exact API model id string>","label":"<short name e.g. Sonnet 4.6>","desc":"<short Vietnamese description, max 6 words>","maxTokens":<max output tokens integer>}]\n` +
        `Order from cheapest/fastest to most capable. Use exact model id strings.`;
      const text = await callClaudeJSON(prompt);
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("Không parse được kết quả.");
      const arr = JSON.parse(m[0]);
      if (!Array.isArray(arr) || !arr.length) throw new Error("Danh sách rỗng.");

      const mapped = arr.map((mdl, i) => {
        const pal = MODEL_PALETTE[i % MODEL_PALETTE.length];
        // Suy ra thinking: 4.6 trở lên có (adaptive) thinking; 4.5 thì không
        const verMatch = String(mdl.id).match(/(\d+)-(\d+)/);
        let hasThinking = true;
        if (verMatch) {
          const major = parseInt(verMatch[1], 10), minor = parseInt(verMatch[2], 10);
          hasThinking = (major > 4) || (major === 4 && minor >= 6);
        }
        return {
          id: String(mdl.id),
          label: mdl.label || String(mdl.id),
          desc: mdl.desc || "",
          maxTokens: Number(mdl.maxTokens) > 0 ? Number(mdl.maxTokens) : 64000,
          color: pal.color, rgb: pal.rgb, thinking: hasThinking,
        };
      });

      setModels(mapped);
      if (!mapped.find(x => x.id === selectedModel)) setSelectedModel(mapped[0].id);
      setUpdateMsg(`✓ Đã cập nhật ${mapped.length} model`);
      setTimeout(() => setUpdateMsg(""), 4000);
    } catch(e) {
      // Thoái lui an toàn: giữ nguyên model hardcoded, báo lỗi nhẹ nhàng
      setUpdateMsg(`✕ Không cập nhật được (${e.message}). Giữ danh sách mặc định.`);
      setTimeout(() => setUpdateMsg(""), 6000);
    } finally {
      setUpdating(false);
    }
  }, [callClaudeJSON, selectedModel]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      // Fallback: dùng textarea + execCommand khi Clipboard API bị block
      try {
        const ta = document.createElement("textarea");
        ta.value = output;
        ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      } catch(e2) {
        console.error("Copy failed:", e2);
        setCopied(false);
      }
    }
    setTimeout(() => setCopied(false), 2200);
  };
  const dlOutput = () => {
    try {
      const blob = new Blob([output], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: `storyboard_step3_${Date.now()}.json` });
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
    } catch(e) {
      console.error("Download failed:", e);
    }
  };

  const modeColor = { default:"#8895aa", flexible:"#2ef2c4", ai:"#a78bfa" }[mode];
  const modeDot   = { default:"default",  flexible:"teal",   ai:"purple"  }[mode];
  const displayMaxTokens = calcMaxTokens();

  const isPartial = resumeData && resumeData.partialItems?.length > 0 &&
    resumeData.partialItems.length < (resumeData.totalSegments || Infinity);

  /* ─── STYLES ─────────────────────────────────────────────────────── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;}
    .nf-root{font-family:'Outfit',sans-serif;background:#0b0d14;min-height:100vh;padding:24px;color:#dde4f0;}
    .nf-ta{width:100%;background:transparent;border:none;outline:none;resize:none;color:#b0bbd0;font-family:'Space Mono',monospace;font-size:11.5px;line-height:1.75;padding:16px;}
    .nf-ta::placeholder{color:rgba(95,104,128,0.35);}
    .nf-out{font-family:'Space Mono',monospace;font-size:11.5px;line-height:1.75;color:#b0bbd0;white-space:pre-wrap;word-break:break-all;padding:16px;height:400px;overflow-y:auto;}
    .nf-out::-webkit-scrollbar{width:3px;}
    .nf-out::-webkit-scrollbar-thumb{background:rgba(46,242,196,0.2);border-radius:2px;}
    .nf-panel{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;}
    .nf-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.3px;transition:all .18s;}
    .nf-btn:disabled{opacity:.45;cursor:not-allowed;}
    .btn-teal{background:rgba(46,242,196,0.07);border:1px solid rgba(46,242,196,0.18);color:#2ef2c4;}
    .btn-teal:hover:not(:disabled){background:rgba(46,242,196,0.14);border-color:rgba(46,242,196,0.35);}
    .btn-purple{background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.22);color:#a78bfa;}
    .btn-purple:hover:not(:disabled){background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.38);}
    .btn-ghost{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#5f6880;}
    .btn-ghost:hover:not(:disabled){background:rgba(255,255,255,0.07);color:#8895aa;}
    .btn-import{background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.18);color:#fbbf24;}
    .btn-import:hover:not(:disabled){background:rgba(251,191,36,0.12);border-color:rgba(251,191,36,0.32);}
    .btn-amber{background:rgba(251,191,36,0.09);border:1px solid rgba(251,191,36,0.28);color:#fbbf24;}
    .btn-amber:hover:not(:disabled){background:rgba(251,191,36,0.16);border-color:rgba(251,191,36,0.45);}
    .btn-checkpoint-export{background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.25);color:#34d399;}
    .btn-checkpoint-export:hover:not(:disabled){background:rgba(52,211,153,0.14);border-color:rgba(52,211,153,0.4);}
    .btn-checkpoint-import{background:rgba(99,179,237,0.07);border:1px solid rgba(99,179,237,0.25);color:#63b3ed;}
    .btn-checkpoint-import:hover:not(:disabled){background:rgba(99,179,237,0.14);border-color:rgba(99,179,237,0.4);}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
    @keyframes slidein{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glow-pulse{0%,100%{box-shadow:0 0 10px rgba(52,211,153,0.2)}50%{box-shadow:0 0 22px rgba(52,211,153,0.5)}}
    .slide-in{animation:slidein .22s ease forwards;}
    .loading-dot{animation:pulse 1.2s ease-in-out infinite;}
    .loading-dot:nth-child(2){animation-delay:.18s;}
    .loading-dot:nth-child(3){animation-delay:.36s;}
    .mode-btn{display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#5f6880;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;transition:all .2s;white-space:nowrap;}
    .mode-btn:hover{background:rgba(255,255,255,0.04);color:#8895aa;}
    .style-chip{padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.03);color:#5f6880;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;transition:all .18s;}
    .style-chip:hover{border-color:rgba(46,242,196,0.25);color:#8895aa;}
    .style-chip.active{background:rgba(46,242,196,0.1);border-color:rgba(46,242,196,0.35);color:#2ef2c4;}
    .model-chip{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:9px 15px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#5f6880;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;}
    .model-chip:hover{background:rgba(255,255,255,0.04);}
    .effort-chip{padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.03);color:#5f6880;cursor:pointer;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.5px;transition:all .18s;}
    .effort-chip:hover{border-color:rgba(167,139,250,0.25);color:#8895aa;}
    .effort-chip.active{background:rgba(167,139,250,0.1);border-color:rgba(167,139,250,0.35);color:#a78bfa;}
    .checkpoint-banner{animation:glow-pulse 2.5s ease-in-out infinite;}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="nf-root">
        <div style={{maxWidth:1380,margin:"0 auto"}}>

          {/* ── HEADER ── */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:18,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#2ef2c4,#7c5ef4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Zap size={20} color="#0b0d14" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.5px",background:"linear-gradient(135deg,#2ef2c4,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                NeuroForge Storyboard Engine
              </div>
              <div style={{fontSize:11,fontWeight:500,letterSpacing:"1.2px",textTransform:"uppercase",color:"#3d4455",marginTop:1}}>
                Bước 2 → Bước 3 Converter
              </div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
              <input type="file" accept=".json" ref={checkpointRef} style={{display:"none"}} onChange={handleCheckpointImport}/>
              <button className="nf-btn btn-checkpoint-import" onClick={()=>checkpointRef.current?.click()}
                title="Import file checkpoint (.json) để tiếp tục từ chỗ dở dang">
                <FolderOpen size={13}/> Import Checkpoint
              </button>
              <Badge color="teal">AI-Powered</Badge>
              <Badge color="purple">Veo-Safe</Badge>
            </div>
          </div>

          {/* ── CHECKPOINT LOADED BANNER ── */}
          {checkpointLoaded && resumeData && (
            <div className="slide-in checkpoint-banner" style={{
              marginBottom:14, padding:"14px 20px", borderRadius:12,
              background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.3)",
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <ShieldCheck size={18} color="#34d399"/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#34d399"}}>✓ Checkpoint đã nạp thành công</div>
                  <div style={{fontSize:11,color:"rgba(52,211,153,0.55)",marginTop:2,fontFamily:"'Space Mono',monospace"}}>
                    Đã có {resumeData.partialItems?.length||0}/{resumeData.totalSegments||"?"} items &nbsp;·&nbsp;
                    Mode: {resumeData.mode || mode} &nbsp;·&nbsp;
                    Model: {resumeData.selectedModel || selectedModel}
                  </div>
                  {resumeData.theme && (
                    <div style={{fontSize:10,color:"rgba(52,211,153,0.4)",marginTop:3,maxWidth:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      theme: "{resumeData.theme.slice(0,100)}"
                    </div>
                  )}
                </div>
              </div>
              <button className="nf-btn btn-teal" onClick={()=>process(true)} disabled={loading} style={{fontSize:13,padding:"8px 18px"}}>
                <Play size={13}/> Chạy tiếp từ item {(resumeData.partialItems?.length||0)+1}
              </button>
            </div>
          )}

          {/* ── PANEL 1: CHẾ ĐỘ ── */}
          <div className="nf-panel" style={{marginBottom:10,padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:24,flexWrap:"wrap"}}>
              <div style={{flex:"0 0 auto"}}>
                <SectionLabel>Chế độ xử lý</SectionLabel>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {MODES.map(m => {
                    const active = mode === m.id;
                    const aC = {default:"#8895aa",flexible:"#2ef2c4",ai:"#a78bfa"}[m.id];
                    const aR = {default:"136,149,170",flexible:"46,242,196",ai:"167,139,250"}[m.id];
                    const Icon = m.icon;
                    return (
                      <button key={m.id} className="mode-btn" onClick={() => setMode(m.id)}
                        style={active ? {background:`rgba(${aR},0.08)`,borderColor:`rgba(${aR},0.3)`,color:aC,boxShadow:`0 0 14px rgba(${aR},0.08)`} : {}}>
                        <Icon size={14} strokeWidth={active?2.5:2}/>{m.label}
                        {active && <span style={{width:5,height:5,borderRadius:"50%",background:aC,marginLeft:2,boxShadow:`0 0 5px ${aC}`}}/>}
                      </button>
                    );
                  })}
                </div>
                <div style={{marginTop:8,fontSize:12,color:"#3d4455",fontStyle:"italic"}}>
                  {MODES.find(m2=>m2.id===mode)?.desc}
                </div>
              </div>

              <div style={{width:"1px",background:"rgba(255,255,255,0.06)",alignSelf:"stretch",margin:"0 4px"}}/>

              <div style={{flex:"1 1 auto",minWidth:200}}>
                {mode === "flexible" && (
                  <div className="slide-in">
                    <SectionLabel>
                      Styles áp dụng &nbsp;
                      <span style={{color:"rgba(46,242,196,0.45)",fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:10}}>(chọn ít nhất 2 để luân phiên)</span>
                    </SectionLabel>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {STYLE_OPTIONS.map(s => (
                        <button key={s} className={`style-chip ${selectedStyles.includes(s)?"active":""}`} onClick={()=>toggleStyle(s)}>{s}</button>
                      ))}
                    </div>
                    <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {selectedStyles.map(s=><Badge key={s} color="teal" small>{s} ✓</Badge>)}
                    </div>
                  </div>
                )}
                {mode === "default" && (
                  <div className="slide-in" style={{display:"flex",alignItems:"center",height:"100%",paddingTop:8}}>
                    <div style={{padding:"10px 16px",borderRadius:10,background:"rgba(136,149,170,0.05)",border:"1px solid rgba(136,149,170,0.1)",fontSize:12,color:"#5f6880",lineHeight:1.6}}>
                      Mỗi segment sẽ được dịch thẳng sang prompt tiếng Anh.<br/>
                      Không có style tag, không có rotation. Phù hợp cho nội dung đơn giản.
                    </div>
                  </div>
                )}
                {mode === "ai" && (
                  <div className="slide-in" style={{display:"flex",alignItems:"center",height:"100%",paddingTop:8}}>
                    <div style={{padding:"10px 16px",borderRadius:10,background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.12)",fontSize:12,color:"#7c6bb0",lineHeight:1.6}}>
                      AI đọc toàn bộ kịch bản → phân tích ngữ cảnh → phát minh phong cách hình ảnh riêng.<br/>
                      Kết quả xuất ra trường <span style={{fontFamily:"'Space Mono',monospace",color:"#a78bfa"}}>theme</span> trong JSON Bước 3.
                      <span style={{display:"block",marginTop:6,color:"rgba(167,139,250,0.6)",fontSize:11}}>💡 Khuyên dùng: Sonnet + Thinking ON High/Max</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── PANEL 2: ENGINE CONFIG ── */}
          <div className="nf-panel" style={{marginBottom:16,padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
              {/* MÔ HÌNH + nút Cập nhật */}
              <div style={{flex:"0 0 auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#3d4455"}}>
                    Mô hình AI <span style={{color:"#2d3340"}}>({models.length})</span>
                  </span>
                  <button className="nf-btn btn-checkpoint-import" style={{padding:"4px 10px",fontSize:11}}
                    onClick={runUpdateModels} disabled={updating}
                    title="Hỏi Claude danh sách model hiện hành và cập nhật">
                    <RefreshCw size={12} style={updating?{animation:"spin .8s linear infinite"}:{}}/>
                    {updating ? "Đang cập nhật…" : "Cập nhật"}
                  </button>
                  {updateMsg && (
                    <span style={{fontSize:10,fontWeight:600,fontFamily:"'Space Mono',monospace",
                      color: updateMsg.startsWith("✓") ? "#34d399" : "#f87171"}}>{updateMsg}</span>
                  )}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",maxWidth:560}}>
                  {models.map(m => {
                    const active = selectedModel === m.id;
                    return (
                      <button key={m.id} className="model-chip" onClick={()=>setSelectedModel(m.id)}
                        style={active ? {background:`rgba(${m.rgb},0.07)`,borderColor:`rgba(${m.rgb},0.32)`,boxShadow:`0 0 12px rgba(${m.rgb},0.07)`} : {}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:13,fontWeight:700,color:active?m.color:"#5f6880",transition:"color .2s"}}>{m.label}</span>
                          {m.thinking
                            ? <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.4px",color:"#a78bfa",background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,padding:"1px 6px"}}>THINKING</span>
                            : null}
                        </div>
                        <span style={{fontSize:10,color:active?`rgba(${m.rgb},0.55)`:"#3d4455",lineHeight:1.3}}>{m.desc}</span>
                        {active && <span style={{fontSize:9,fontFamily:"'Space Mono',monospace",color:`rgba(${m.rgb},0.45)`}}>max {(m.maxTokens/1000).toFixed(0)}K out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{width:"1px",background:"rgba(255,255,255,0.06)",alignSelf:"stretch",margin:"0 4px"}}/>

              {/* EFFORT — độc lập, luôn hiển thị */}
              <div style={{flex:"0 0 auto"}}>
                <SectionLabel>
                  Effort &nbsp;<span style={{color:"rgba(167,139,250,0.4)",fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:10}}>(độ kỹ của model)</span>
                </SectionLabel>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  {EFFORT_LEVELS.map(e => (
                    <button key={e.id} className={`effort-chip ${effortLevel===e.id?"active":""}`} onClick={()=>setEffortLevel(e.id)} title={e.desc}>
                      {e.label}
                    </button>
                  ))}
                </div>
                <div style={{marginTop:8,fontSize:10,color:"rgba(167,139,250,0.45)",maxWidth:200,lineHeight:1.5}}>
                  {EFFORT_LEVELS.find(e=>e.id===effortLevel)?.desc}. Effort càng cao → kết quả kỹ hơn, tốn token hơn.
                </div>

                {/* THINKING — toggle độc lập */}
                <div style={{marginTop:16}}>
                  <SectionLabel>Thinking Engine</SectionLabel>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <button onClick={()=>thinkingAvailable && setThinkingOn(v=>!v)}
                      disabled={!thinkingAvailable}
                      style={{
                        width:40,height:22,borderRadius:11,border:"none",
                        cursor:thinkingAvailable?"pointer":"not-allowed",
                        background:thinkingActive?"rgba(167,139,250,0.55)":"rgba(255,255,255,0.1)",
                        position:"relative",transition:"background .25s",flexShrink:0,
                        opacity:thinkingAvailable?1:0.4
                      }}>
                      <div style={{position:"absolute",top:3,left:thinkingActive?21:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
                    </button>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <Brain size={15} color={thinkingActive?"#a78bfa":"#3d4455"}/>
                      <span style={{fontSize:13,fontWeight:600,color:thinkingActive?"#a78bfa":"#3d4455",transition:"color .25s"}}>
                        {thinkingActive?"Thinking ON":"Thinking OFF"}
                      </span>
                    </div>
                  </div>
                  {!thinkingAvailable && (
                    <div style={{marginTop:6,fontSize:11,color:"#5f6880",fontStyle:"italic"}}>
                      {modelObj.label} không hỗ trợ Extended Thinking.
                    </div>
                  )}
                </div>
              </div>

              <div style={{width:"1px",background:"rgba(255,255,255,0.06)",alignSelf:"stretch",margin:"0 4px"}}/>

              {/* CẤU HÌNH HIỆN TẠI */}
              <div style={{flex:"1 1 180px",paddingTop:2}}>
                <SectionLabel>Cấu hình hiện tại</SectionLabel>
                <div style={{padding:"12px 15px",borderRadius:10,background:`rgba(${modelObj.rgb},0.04)`,border:`1px solid rgba(${modelObj.rgb},0.1)`,fontSize:12,lineHeight:1.9}}>
                  <div><span style={{color:"#3d4455"}}>Model: </span><span style={{color:modelObj.color,fontWeight:700}}>{modelObj.label}</span></div>
                  <div><span style={{color:"#3d4455"}}>Effort: </span><span style={{color:"#a78bfa",fontWeight:700,textTransform:"capitalize"}}>{effortLevel}</span></div>
                  <div><span style={{color:"#3d4455"}}>Max output: </span><span style={{color:"#8895aa",fontFamily:"'Space Mono',monospace",fontSize:11}}>{displayMaxTokens.toLocaleString()} tokens</span></div>
                  <div><span style={{color:"#3d4455"}}>Thinking: </span><span style={{color:thinkingActive?"#a78bfa":"#3d4455",fontWeight:600}}>{thinkingActive?"ON":thinkingAvailable?"OFF":"N/A"}</span></div>
                  <div><span style={{color:"#3d4455"}}>Auto-resume: </span><span style={{color:"#2ef2c4",fontWeight:600}}>Bật</span><span style={{color:"#2d3340",fontSize:10,marginLeft:5}}>lưu khi hết token</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RESUME BANNER (in-session) ── */}
          {resumeData && !checkpointLoaded && (
            <div className="slide-in" style={{marginBottom:14,padding:"12px 18px",borderRadius:12,background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.22)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <RotateCcw size={16} color="#fbbf24"/>
                <div>
                  <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>
                    Còn dở dang: {resumeData.partialItems?.length||0}/{resumeData.totalSegments||"?"} items
                  </span>
                  <span style={{fontSize:11,color:"rgba(251,191,36,0.45)",marginLeft:10,fontFamily:"'Space Mono',monospace"}}>{fmtAge(resumeData.timestamp)}</span>
                  {resumeData.theme && (
                    <div style={{fontSize:10,color:"rgba(251,191,36,0.4)",marginTop:2,maxWidth:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      theme: "{resumeData.theme.slice(0,80)}"
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {isPartial && (
                  <button className="nf-btn btn-checkpoint-export" onClick={exportCheckpoint} title="Lưu tiến trình ra file để dùng sau">
                    <FileDown size={12}/> Xuất Checkpoint
                  </button>
                )}
                <button className="nf-btn btn-amber" onClick={()=>process(true)}>
                  <Play size={12}/> Tiếp tục từ item {(resumeData.partialItems?.length||0)+1}
                </button>
                <button className="nf-btn btn-ghost" onClick={clearResumeState}>
                  <Trash2 size={12}/> Bỏ, làm lại từ đầu
                </button>
              </div>
            </div>
          )}

          {/* ── TWO PANELS ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 76px 1fr",gap:0,alignItems:"start"}}>

            {/* INPUT */}
            <div className="nf-panel">
              <PanelHeader dot="purple" title="Input — Bước 2 JSON" badge={segCount>0 && <Badge color="purple" small>{segCount} seg</Badge>}/>
              <textarea className="nf-ta" style={{height:400}} placeholder={PLACEHOLDER} value={input}
                onChange={e=>{setInput(e.target.value);setError("");setCheckpointLoaded(false);}} spellCheck={false}/>
              <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,flexWrap:"wrap",background:"rgba(255,255,255,0.01)"}}>
                <input type="file" accept=".json" ref={fileRef} style={{display:"none"}} onChange={handleFile}/>
                <button className="nf-btn btn-import" onClick={()=>fileRef.current?.click()}>
                  <Upload size={13}/> Import JSON
                </button>
                {fileName && <span style={{fontSize:11,color:"#3d4455",alignSelf:"center",fontFamily:"'Space Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{fileName}</span>}
                <button className="nf-btn btn-ghost" style={{marginLeft:"auto"}} onClick={()=>{setInput("");setFileName("");setError("");setResumeData(null);setCheckpointLoaded(false);setOutput("");setItemCount(0);}}>
                  <Trash2 size={13}/> Xóa
                </button>
              </div>
            </div>

            {/* MIDDLE */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:24,gap:12}}>
              {[0.35,0.2,0.08].map((o,i)=>(<div key={i} style={{width:2,height:5,borderRadius:1,background:`rgba(124,94,244,${o})`}}/>))}
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {loading && (
                  <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:"2px solid transparent",borderTopColor:modeColor,borderRightColor:"rgba(255,255,255,0.1)",animation:"spin .85s linear infinite"}}/>
                )}
                <button onClick={()=>process(false)} disabled={loading}
                  style={{width:52,height:52,borderRadius:"50%",border:"none",cursor:loading?"not-allowed":"pointer",
                    background:`linear-gradient(135deg,${modeColor==="#8895aa"?"#6b7280,#4b5563":modeColor+",#3b1f9e"})`,
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s",
                    boxShadow:loading?"none":`0 0 22px ${modeColor}30,0 0 44px ${modeColor}10`,opacity:loading ? 0.7 : 1}}
                  onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform="scale(1.09)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
                  {loading
                    ? <Loader size={20} color="#fff" strokeWidth={2.5} style={{animation:"spin .8s linear infinite"}}/>
                    : <ChevronRight size={20} color="#0b0d14" strokeWidth={3}/>}
                </button>
              </div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase",color:loading?modeColor:"#3d4455",textAlign:"center",transition:"color .3s",minHeight:16}}>
                {loading
                  ? <span style={{display:"flex",gap:3,color:modeColor}}>{["●","●","●"].map((d,i)=><span key={i} className="loading-dot">{d}</span>)}</span>
                  : "Process"}
              </div>
              {[0.08,0.2,0.35].map((o,i)=>(<div key={i} style={{width:2,height:5,borderRadius:1,background:`rgba(46,242,196,${o})`}}/>))}
              {error && (
                <div style={{maxWidth:68,textAlign:"center",padding:"8px 10px",background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:8,fontSize:10,color:"#f87171",fontWeight:500,lineHeight:1.5}}>
                  <AlertCircle size={11} style={{display:"block",margin:"0 auto 4px"}}/>{error}
                </div>
              )}
              {itemCount>0&&!loading&&!error && <Badge color="teal" small>✓ {itemCount}</Badge>}
            </div>

            {/* OUTPUT */}
            <div className="nf-panel">
              <PanelHeader dot={modeDot} title="Output — Bước 3 JSON"
                badge={
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {itemCount>0 && <Badge color="teal" small>{itemCount} items</Badge>}
                    {isPartial && <Badge color="amber" small>partial</Badge>}
                  </div>
                }
              />
              {loading ? (
                <div style={{height:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                  <Loader size={26} color={modeColor} style={{animation:"spin .8s linear infinite",opacity:.7}}/>
                  <div style={{fontSize:12,fontWeight:600,color:`${modeColor}99`,letterSpacing:"0.8px",fontFamily:"'Space Mono',monospace"}}>
                    {mode==="ai"?"Analysing narrative...":"Generating prompts..."}
                  </div>
                  <div style={{fontSize:10,color:"rgba(95,104,128,0.45)",fontFamily:"'Space Mono',monospace"}}>
                    {thinkingActive?`Thinking · effort ${effortLevel}`:mode==="flexible"?`Rotating ${selectedStyles.join(" → ")}`:`Effort ${effortLevel}`}
                  </div>
                  <div style={{fontSize:10,color:`rgba(${modelObj.rgb},0.35)`,fontFamily:"'Space Mono',monospace"}}>
                    {modelObj.label} · {displayMaxTokens.toLocaleString()}t max
                  </div>
                </div>
              ) : output ? (
                <div className="nf-out">{output}</div>
              ) : (
                <div style={{height:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:"rgba(95,104,128,0.3)"}}>
                  <div style={{fontSize:28,lineHeight:1}}>◈</div>
                  <div style={{fontSize:13,fontWeight:500}}>Output JSON xuất hiện ở đây</div>
                  <div style={{fontSize:10,fontFamily:"'Space Mono',monospace",opacity:.8}}>Awaiting input</div>
                </div>
              )}
              <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,background:"rgba(255,255,255,0.01)",minHeight:46,flexWrap:"wrap"}}>
                {output && <>
                  <button className="nf-btn btn-teal" onClick={copy}>
                    {copied?<><CheckCheck size={13}/> Đã copy!</>:<><Copy size={13}/> Copy JSON</>}
                  </button>
                  <button className="nf-btn btn-purple" onClick={dlOutput}>
                    <Download size={13}/> Tải về
                  </button>
                  {isPartial && (
                    <button className="nf-btn btn-checkpoint-export" onClick={exportCheckpoint}
                      title="Lưu toàn bộ tiến trình ra file checkpoint để tiếp tục sau">
                      <FileDown size={13}/> Xuất Checkpoint &nbsp;
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,opacity:.7}}>
                        {resumeData?.partialItems?.length||0}/{resumeData?.totalSegments||"?"}
                      </span>
                    </button>
                  )}
                </>}
              </div>
            </div>
          </div>

          {/* ── TOKEN USAGE ── */}
          {tokenUsage && (
            <div style={{marginTop:14,padding:"12px 18px",borderRadius:12,background:"rgba(46,242,196,0.03)",border:"1px solid rgba(46,242,196,0.1)",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#2ef2c4",boxShadow:"0 0 5px rgba(46,242,196,0.7)"}}/>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#3d4455"}}>Token Usage</span>
                {tokenUsage.calls > 1 && <Badge color="teal" small>×{tokenUsage.calls} calls</Badge>}
              </div>
              <div style={{fontSize:10,color:"#3d4455",fontFamily:"'Space Mono',monospace"}}>
                <span style={{color:"#5f6880"}}>Last — </span>
                <span style={{color:"#8895aa"}}>in: </span><span style={{color:"#dde4f0"}}>{tokenUsage.last.input.toLocaleString()}</span>
                <span style={{color:"#3d4455",margin:"0 6px"}}>·</span>
                <span style={{color:"#8895aa"}}>out: </span><span style={{color:"#dde4f0"}}>{tokenUsage.last.output.toLocaleString()}</span>
                {tokenUsage.last.thinking > 0 && <>
                  <span style={{color:"#3d4455",margin:"0 6px"}}>·</span>
                  <span style={{color:"#a78bfa"}}>think: </span><span style={{color:"#a78bfa"}}>{tokenUsage.last.thinking.toLocaleString()}</span>
                </>}
                {tokenUsage.last.cacheRead > 0 && <>
                  <span style={{color:"#3d4455",margin:"0 6px"}}>·</span>
                  <span style={{color:"#fbbf24"}}>cache↓: </span><span style={{color:"#fbbf24"}}>{tokenUsage.last.cacheRead.toLocaleString()}</span>
                </>}
                <span style={{color:"#3d4455",margin:"0 8px"}}>|</span>
                <span style={{color:"#2ef2c4",fontWeight:700}}>${tokenUsage.last.cost.toFixed(5)}</span>
              </div>
              {tokenUsage.calls > 1 && (
                <div style={{fontSize:10,color:"#3d4455",fontFamily:"'Space Mono',monospace",marginLeft:"auto"}}>
                  <span style={{color:"#5f6880"}}>Session — </span>
                  <span style={{color:"#8895aa"}}>in: </span><span style={{color:"#dde4f0"}}>{tokenUsage.totalInput.toLocaleString()}</span>
                  <span style={{color:"#3d4455",margin:"0 6px"}}>·</span>
                  <span style={{color:"#8895aa"}}>out: </span><span style={{color:"#dde4f0"}}>{tokenUsage.totalOutput.toLocaleString()}</span>
                  {tokenUsage.totalThinking > 0 && <>
                    <span style={{color:"#3d4455",margin:"0 6px"}}>·</span>
                    <span style={{color:"#a78bfa"}}>think: </span><span style={{color:"#a78bfa"}}>{tokenUsage.totalThinking.toLocaleString()}</span>
                  </>}
                  <span style={{color:"#3d4455",margin:"0 8px"}}>|</span>
                  <span style={{color:"#2ef2c4",fontWeight:700,fontSize:11}}>${tokenUsage.totalCost.toFixed(4)}</span>
                </div>
              )}
              <button className="nf-btn btn-ghost" style={{padding:"3px 10px",fontSize:10}} onClick={()=>setTokenUsage(null)}>Reset</button>
            </div>
          )}

          {/* ── CHECKPOINT GUIDE ── */}
          <div style={{marginTop:12,padding:"11px 18px",borderRadius:10,background:"rgba(99,179,237,0.04)",border:"1px solid rgba(99,179,237,0.1)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <FolderOpen size={13} color="#63b3ed" style={{flexShrink:0}}/>
            <div style={{fontSize:11,color:"#3d5060",lineHeight:1.6}}>
              <span style={{color:"#63b3ed",fontWeight:700}}>Checkpoint System:</span>
              {" "}Khi bị hết token giữa chừng → nhấn <span style={{color:"#34d399",fontWeight:600}}>Xuất Checkpoint</span> để lưu file.
              Lần sau mở tool → nhấn <span style={{color:"#63b3ed",fontWeight:600}}>Import Checkpoint</span> → hệ thống tự nhận diện và hiện nút <span style={{color:"#2ef2c4",fontWeight:600}}>Chạy tiếp</span>.
              File checkpoint chứa: input gốc + items đã tạo + theme + settings đầy đủ.
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              {l:"Rule A",d:"Context continuity"},
              {l:"Rule B",d:"Max 3× same style"},
              {l:"Rule C",d:"Veo-safe language"},
              {l:"Rule D",d:"Image vs Video"},
              {l:"Model",d:`${modelObj.label} · ${displayMaxTokens.toLocaleString()}t`},
              {l:"Checkpoint",d:"Export + Import dang dở"},
            ].map(r=>(
              <div key={r.l} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:8,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",fontSize:11,color:"#3d4455"}}>
                <span style={{fontWeight:700,color:"#5f6880"}}>{r.l}</span>
                <span>—</span>
                <span>{r.d}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

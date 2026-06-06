import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, Download, Sparkles, Cpu, Brain, ChevronDown, Check, X, Trash2,
  RefreshCw, Factory, Loader2, AlertTriangle, FolderInput, FileJson,
  FileText, Image as ImageIcon, Copy, Plus, Minus, Package, Ban,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TOOL 2 — PROMPT FACTORY  (Module 2 / 3)
   "Máy đẻ Prompt" — chức năng cốt lõi của Tool 2.
   - Import checkpoint từ Module 1 (channel + blueprint) làm context
   - Chọn loại + số lượng prompt → sinh hàng loạt (mỗi loại gắn sẵn `type`)
   - Chống trùng: import prompt cũ + lọc client-side
   - Sinh THEO LÔ (từng loại 1 lời gọi) để an toàn max_tokens + resume được
   - Export JSON (có `type` cho Tool 3) hoặc Markdown
   Cách gọi API tuân theo Claude.md: output_config.effort + adaptive thinking.
   ════════════════════════════════════════════════════════════════════ */

const FONT = '"Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace';

const DEFAULT_MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5",  badge: "Nhanh",       color: "#d97706" },
  { id: "claude-sonnet-4-6",         label: "Sonnet 4.6", badge: "Khuyên dùng", color: "#0d9488" },
  { id: "claude-opus-4-6",           label: "Opus 4.6",   badge: "",            color: "#7c3aed" },
  { id: "claude-opus-4-7",           label: "Opus 4.7",   badge: "",            color: "#7c3aed" },
  { id: "claude-opus-4-8",           label: "Opus 4.8",   badge: "Mạnh nhất",   color: "#6d28d9" },
];

const EFFORT_LEVELS = [
  { id: "low",    label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high",   label: "High", isDefault: true },
  { id: "max",    label: "Max" },
];

const PRICING = {
  "claude-haiku-4-5-20251001": { input: 0.80,  output: 4.00  },
  "claude-sonnet-4-6":         { input: 3.00,  output: 15.00 },
  "claude-opus-4-6":           { input: 15.00, output: 75.00 },
  "claude-opus-4-7":           { input: 15.00, output: 75.00 },
  "claude-opus-4-8":           { input: 15.00, output: 75.00 },
};

/* ─── LOẠI PROMPT — mỗi loại gắn sẵn `type` cho Tool 3 định tuyến ────
   text_generation → Tool 3 gọi Claude sinh nội dung.
   image_generation → Tool 3 chỉ hiện prompt + nút Copy cho Midjourney/...
   `brief` mô tả cho Claude biết loại prompt này cần sinh ra cái gì. */
const PROMPT_TYPES = [
  { key: "video_script", label: "Prompt Kịch bản Video", type: "text_generation", icon: "text", color: "#0d9488",
    brief: "Prompt để AI viết kịch bản voice-over hoàn chỉnh cho một video. Mỗi prompt là một ý tưởng video khác nhau, nêu rõ chủ đề, góc nhìn, và yêu cầu về cấu trúc/độ dài." },
  { key: "seo_title", label: "Prompt Tiêu đề SEO", type: "text_generation", icon: "text", color: "#0d9488",
    brief: "Prompt để AI tạo cụm tiêu đề YouTube tối ưu CTR cho một chủ đề. Mỗi prompt nhắm một chủ đề/video khác nhau." },
  { key: "description", label: "Prompt Mô tả SEO", type: "text_generation", icon: "text", color: "#0d9488",
    brief: "Prompt để AI viết phần mô tả video chuẩn SEO (hook, tóm tắt, từ khoá, CTA). Mỗi prompt cho một video khác nhau." },
  { key: "thumbnail", label: "Prompt Thumbnail", type: "image_generation", icon: "image", color: "#7c3aed",
    brief: "Prompt tạo ảnh thumbnail (dùng cho Midjourney/Leonardo/DALL-E). Mô tả bố cục, nhân vật, màu sắc, cảm xúc, text overlay gợi ý. Viết bằng tiếng Anh, chi tiết, sẵn sàng dán thẳng." },
  { key: "broll", label: "Prompt Ảnh/B-roll minh hoạ", type: "image_generation", icon: "image", color: "#7c3aed",
    brief: "Prompt tạo ảnh minh hoạ/b-roll cho video (dùng cho AI image). Mô tả cảnh, phong cách, ánh sáng. Viết bằng tiếng Anh, chi tiết." },
];

const CHECKPOINT_VERSION = "tool2-promptfactory-v1";
const STORAGE_KEY = "tool2_promptfactory_autosave";

/* ─── CLAUDE API (zero-key, streaming) — theo Claude.md ─────────────── */
async function callClaude(system, user, onChunk, cfg = {}) {
  const { model = "claude-sonnet-4-6", thinkingOn = false, effortId = "high", maxTokens = 8000 } = cfg;
  const body = {
    model, max_tokens: maxTokens, stream: true, system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: effortId },
  };
  if (thinkingOn) body.thinking = { type: "enabled" };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-beta": "effort-2025-11-24" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err.slice(0, 200)}`); }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "", usage = null, stopReason = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (d === "[DONE]") continue;
      try {
        const j = JSON.parse(d);
        if (j?.type === "message_start" && j?.message?.usage) usage = { ...j.message.usage };
        if (j?.type === "message_delta") {
          if (j?.usage) usage = { ...usage, ...j.usage };
          if (j?.delta?.stop_reason) stopReason = j.delta.stop_reason;
        }
        if (j?.delta?.type === "text_delta") { full += j.delta.text || ""; onChunk && onChunk(full); }
      } catch {}
    }
  }
  return { text: full, usage, stopReason };
}

/* ─── CLAUDE + WEB SEARCH (non-stream) cho nút Cập nhật ─────────────── */
async function callClaudeWithSearch(system, user, model = "claude-sonnet-4-6") {
  const body = {
    model, max_tokens: 4000, system,
    messages: [{ role: "user", content: user }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err.slice(0, 200)}`); }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return { text: (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") };
}

/* ─── helpers ──────────────────────────────────────────────────────── */
function extractJSONArray(raw) {
  if (!raw) return null;
  let s = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try { const v = JSON.parse(s); if (Array.isArray(v)) return v; if (Array.isArray(v?.prompts)) return v.prompts; if (Array.isArray(v?.models)) return v.models; } catch {}
  const first = s.indexOf("["), last = s.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) { try { return JSON.parse(s.slice(first, last + 1)); } catch {} }
  return null;
}
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const uid = () => Math.random().toString(36).slice(2, 9);

/* ════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════ */
export default function PromptFactoryTool2() {
  // model config
  const [models, setModels]         = useState(DEFAULT_MODELS);
  const [modelId, setModelId]       = useState("claude-sonnet-4-6");
  const [thinkingOn, setThinkingOn] = useState(false);
  const [effortId, setEffortId]     = useState("high");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateNote, setUpdateNote] = useState("");

  // context (từ Module 1)
  const [context, setContext]   = useState(null);   // { channel, blueprint }
  const [cpName, setCpName]      = useState("prompt-factory-1");

  // cấu hình lô: { typeKey: quantity }
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(PROMPT_TYPES.map(t => [t.key, t.key === "video_script" ? 5 : 0])));

  // kho prompt đã sinh: [{ id, type, category, categoryLabel, title, prompt }]
  const [prompts, setPrompts] = useState([]);

  // generation runtime
  const [genBusy, setGenBusy]   = useState(false);
  const [genLog, setGenLog]     = useState("");      // dòng trạng thái lô hiện tại
  const [genStream, setGenStream] = useState("");
  const [lastUsage, setLastUsage] = useState(null);

  // ui
  const [toast, setToast] = useState({ msg: "", vis: false });
  const [err, setErr]     = useState("");
  const ctxRef  = useRef(null);
  const cpRef   = useRef(null);
  const dupRef  = useRef(null);
  const cancelRef = useRef(false);

  const showToast = useCallback((msg) => {
    setToast({ msg, vis: true });
    setTimeout(() => setToast(t => ({ ...t, vis: false })), 2200);
  }, []);

  /* ── auto-save ── */
  useEffect(() => {
    const t = setTimeout(async () => {
      try { await window.storage?.set(STORAGE_KEY, JSON.stringify(buildCheckpoint())); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [context, prompts, quantities, models, modelId, thinkingOn, effortId, cpName]);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage?.get(STORAGE_KEY);
        if (r?.value) { applyCheckpoint(JSON.parse(r.value), true); showToast("Đã khôi phục phiên trước"); }
      } catch {}
    })();
    // eslint-disable-next-line
  }, []);

  function buildCheckpoint() {
    return {
      version: CHECKPOINT_VERSION, savedAt: new Date().toISOString(), name: cpName,
      config: { modelId, thinkingOn, effortId }, models,
      context, quantities, prompts,
    };
  }
  function applyCheckpoint(cp, silent) {
    if (!cp) return;
    if (Array.isArray(cp.models) && cp.models.length) setModels(cp.models);
    if (cp.config) {
      setModelId(cp.config.modelId || "claude-sonnet-4-6");
      setThinkingOn(!!cp.config.thinkingOn);
      setEffortId(cp.config.effortId || "high");
    }
    if (cp.context !== undefined) setContext(cp.context);
    if (cp.quantities) setQuantities(q => ({ ...q, ...cp.quantities }));
    if (Array.isArray(cp.prompts)) setPrompts(cp.prompts);
    if (cp.name) setCpName(cp.name);
    if (!silent) showToast("Đã nạp checkpoint");
  }

  /* ── import context từ Module 1 (checkpoint của Channel Studio) ── */
  function handleContextImport(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        // Module 1 checkpoint có { channel, blueprint }; chấp nhận cả file phẳng
        const channel   = data.channel || data.channelSettings || data;
        const blueprint = data.blueprint ?? null;
        setContext({ channel, blueprint });
        setErr(""); showToast("Đã nạp context từ Module 1");
      } catch { setErr("File context không phải JSON hợp lệ."); }
    };
    reader.readAsText(file); e.target.value = "";
  }

  /* ── import checkpoint của chính Module 2 ── */
  function handleCpImport(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const cp = (() => { try { return JSON.parse(ev.target.result); } catch { return null; } })();
      if (!cp) { setErr("Checkpoint không hợp lệ."); return; }
      if (cp.version && cp.version !== CHECKPOINT_VERSION) showToast("Cảnh báo: checkpoint khác phiên bản");
      applyCheckpoint(cp);
    };
    reader.readAsText(file); e.target.value = "";
  }

  /* ── import prompt cũ (chống trùng) — JSON hoặc MD ── */
  function handleDupImport(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;
      let items = [];
      const arr = extractJSONArray(raw);
      if (arr) {
        items = arr.map(p => ({
          id: p.id || uid(),
          type: p.type || "text_generation",
          category: p.category || "imported",
          categoryLabel: p.categoryLabel || p.category || "Imported",
          title: p.title || (p.prompt ? String(p.prompt).slice(0, 60) : "Imported"),
          prompt: p.prompt || p.text || "",
        }));
      } else {
        // MD: tách theo heading "## " hoặc dòng "- "
        const blocks = String(raw).split(/\n(?=#{1,3}\s|[-*]\s)/).map(s => s.trim()).filter(Boolean);
        items = blocks.map(b => ({
          id: uid(), type: "text_generation", category: "imported", categoryLabel: "Imported",
          title: b.replace(/^[#\-*\s]+/, "").slice(0, 60), prompt: b.replace(/^[#\-*\s]+/, ""),
        }));
      }
      if (!items.length) { setErr("Không đọc được prompt nào từ file."); return; }
      // gộp + lọc trùng theo title đã chuẩn hoá
      setPrompts(prev => {
        const seen = new Set(prev.map(p => norm(p.title)));
        const add = items.filter(p => p.title && !seen.has(norm(p.title)));
        return [...prev, ...add];
      });
      showToast(`Đã nạp ${items.length} prompt cũ để chống trùng`);
    };
    reader.readAsText(file); e.target.value = "";
  }

  /* ── chỉnh số lượng ── */
  function setQty(key, v) {
    const n = Math.max(0, Math.min(50, Math.round(Number(v) || 0)));
    setQuantities(q => ({ ...q, [key]: n }));
  }
  const totalToGen = Object.values(quantities).reduce((a, b) => a + b, 0);

  /* ── SINH HÀNG LOẠT — theo lô từng loại ── */
  async function runGenerate() {
    if (genBusy) return;
    if (!totalToGen) { setErr("Hãy chọn số lượng cho ít nhất một loại prompt."); return; }
    setGenBusy(true); setErr(""); setGenStream(""); cancelRef.current = false;

    const ch = context?.channel || {};
    const channelCtx = JSON.stringify(ch, null, 2);
    const bpCtx = context?.blueprint ? JSON.stringify(context.blueprint, null, 2) : "(không có)";

    let totalUsage = { input_tokens: 0, output_tokens: 0 };
    let stoppedEarly = false;

    try {
      for (const t of PROMPT_TYPES) {
        if (cancelRef.current) break;
        const want = quantities[t.key] || 0;
        if (!want) continue;

        setGenLog(`Đang sinh ${want} × ${t.label}…`);
        setGenStream("");

        // danh sách đã có cùng loại → chống trùng
        const existingSame = prompts.filter(p => p.category === t.key).map(p => p.title);
        const existingTitles = prompts.map(p => p.title);

        const system =
          `Bạn là chuyên gia sản xuất nội dung YouTube. Nhiệm vụ: tạo ${want} PROMPT thuộc loại "${t.label}".\n` +
          `Mô tả loại prompt này: ${t.brief}\n\n` +
          `QUAN TRỌNG — đây là "máy đẻ prompt": bạn tạo ra các PROMPT (chỉ thị để một AI khác thực thi sau), ` +
          `KHÔNG tạo nội dung cuối cùng.\n` +
          `Trả về DUY NHẤT một JSON ARRAY, KHÔNG giải thích, KHÔNG markdown fences. Mỗi phần tử:\n` +
          `{ "title": "<tiêu đề ngắn gọn, tiếng Việt, để người dùng nhận diện>", "prompt": "<nội dung prompt đầy đủ>" }\n` +
          (t.type === "image_generation"
            ? `Vì là prompt ẢNH: trường "prompt" viết bằng TIẾNG ANH, chi tiết, sẵn sàng dán vào Midjourney/Leonardo/DALL-E.\n`
            : `Trường "prompt" viết bằng tiếng Việt, rõ ràng, đầy đủ ngữ cảnh để AI thực thi tốt.\n`) +
          `Các tiêu đề PHẢI khác nhau và KHÔNG trùng với danh sách đã có dưới đây.`;

        const user =
          `# Thông tin kênh\n${channelCtx}\n\n` +
          `# Blueprint (Tool 1)\n${bpCtx}\n\n` +
          `# Tiêu đề ĐÃ CÓ (cùng loại — TUYỆT ĐỐI không lặp lại)\n` +
          `${existingSame.length ? existingSame.map(x => "- " + x).join("\n") : "(chưa có)"}\n\n` +
          `# Tiêu đề đã có (loại khác — tránh trùng ý)\n` +
          `${existingTitles.length ? existingTitles.slice(0, 40).map(x => "- " + x).join("\n") : "(chưa có)"}\n\n` +
          `Hãy tạo đúng ${want} prompt loại "${t.label}".`;

        // cấp token rộng theo số lượng để tránh cắt giữa JSON
        const maxTok = Math.min(2000 + want * 700, 16000);
        const { text, usage, stopReason } = await callClaude(system, user, (p) => setGenStream(p), {
          model: modelId, thinkingOn, effortId, maxTokens: maxTok,
        });
        if (usage) {
          totalUsage.input_tokens  += usage.input_tokens  || 0;
          totalUsage.output_tokens += usage.output_tokens || 0;
        }

        const arr = extractJSONArray(text);
        if (!arr) {
          setErr(`Lô "${t.label}" trả về không đọc được JSON. Các lô trước đã được giữ lại.`);
          stoppedEarly = true; break;
        }

        // chuẩn hoá + lọc trùng (so với toàn kho)
        setPrompts(prev => {
          const seen = new Set(prev.map(p => norm(p.title)));
          const add = [];
          for (const it of arr) {
            const title = String(it.title || it.prompt || "").slice(0, 120);
            if (!title || seen.has(norm(title))) continue;
            seen.add(norm(title));
            add.push({
              id: uid(), type: t.type, category: t.key, categoryLabel: t.label,
              title, prompt: String(it.prompt || it.text || ""),
            });
          }
          return [...prev, ...add];
        });

        // chạm trần token giữa lô → cảnh báo + dừng để resume
        if (stopReason === "max_tokens") {
          setErr(`Lô "${t.label}" chạm giới hạn token — đã lưu phần sinh được. Bấm "Tạo Prompt" lần nữa để sinh tiếp phần còn thiếu (đã chống trùng).`);
          stoppedEarly = true; break;
        }
      }

      const p = PRICING[modelId] || PRICING["claude-sonnet-4-6"];
      const cost = (totalUsage.input_tokens * p.input + totalUsage.output_tokens * p.output) / 1e6;
      setLastUsage({ ...totalUsage, cost });
      setGenLog(stoppedEarly ? "Dừng sớm — đã lưu checkpoint tự động." : "Hoàn tất sinh prompt.");
      if (!stoppedEarly && !cancelRef.current) showToast("Đã sinh xong prompt");
      if (cancelRef.current) { setGenLog("Đã huỷ — phần sinh được vẫn giữ lại."); }
    } catch (e) {
      setErr(String(e.message || e));
      setGenLog("Lỗi — các lô trước vẫn được giữ lại.");
    } finally {
      setGenBusy(false); setGenStream("");
    }
  }

  function cancelGenerate() { cancelRef.current = true; }

  /* ── kho prompt: xoá / sửa ── */
  function deletePrompt(id) { setPrompts(prev => prev.filter(p => p.id !== id)); }
  function clearPrompts() {
    if (!prompts.length) return;
    if (!window.confirm(`Xoá toàn bộ ${prompts.length} prompt?`)) return;
    setPrompts([]); showToast("Đã xoá kho prompt");
  }
  async function copyPrompt(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    showToast("Đã copy prompt");
  }

  /* ── export JSON / MD ── */
  function exportJSON() {
    if (!prompts.length) { setErr("Chưa có prompt để export."); return; }
    const payload = {
      tool: "tool2-prompt-factory", version: CHECKPOINT_VERSION,
      exportedAt: new Date().toISOString(),
      channel: context?.channel || null,
      prompts: prompts.map(p => ({
        id: p.id, type: p.type, category: p.category, categoryLabel: p.categoryLabel,
        title: p.title, prompt: p.prompt,
      })),
    };
    download(`${cpName || "prompts"}.json`, JSON.stringify(payload, null, 2), "application/json");
    showToast("Đã export JSON (kèm type)");
  }
  function exportMD() {
    if (!prompts.length) { setErr("Chưa có prompt để export."); return; }
    let md = `# Prompt Factory — ${context?.channel?.channelName || "Kênh"}\n\n`;
    md += `> Xuất ngày ${new Date().toLocaleString("vi-VN")} · ${prompts.length} prompt\n\n`;
    for (const t of PROMPT_TYPES) {
      const items = prompts.filter(p => p.category === t.key);
      if (!items.length) continue;
      md += `## ${t.label}  \`${t.type}\`\n\n`;
      items.forEach((p, i) => { md += `### ${i + 1}. ${p.title}\n\n${p.prompt}\n\n`; });
    }
    const other = prompts.filter(p => !PROMPT_TYPES.some(t => t.key === p.category));
    if (other.length) {
      md += `## Khác / Imported\n\n`;
      other.forEach((p, i) => { md += `### ${i + 1}. ${p.title}\n\n${p.prompt}\n\n`; });
    }
    download(`${cpName || "prompts"}.md`, md, "text/markdown");
    showToast("Đã export Markdown");
  }
  function exportCheckpoint() {
    download(`${cpName || "prompt-factory"}.checkpoint.json`, JSON.stringify(buildCheckpoint(), null, 2), "application/json");
    showToast("Đã export checkpoint");
  }
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  /* ── nút Cập nhật model ── */
  async function runUpdateModels() {
    if (updateBusy) return;
    setUpdateBusy(true); setErr(""); setUpdateNote("Đang tra cứu tài liệu Anthropic…");
    const system =
      `Bạn có web_search. Tra danh sách model Claude HIỆN HÀNH cho Messages API (nguồn: platform.claude.com/docs, ` +
      `github.com/anthropics/skills, github.com/anthropics/claude-code).\n` +
      `Trả DUY NHẤT một JSON ARRAY (không giải thích, không fences), mỗi phần tử ` +
      `{ "id":"<model id chính xác>", "label":"<tên ngắn>", "badge":"<nhãn ngắn hoặc rỗng>" }. ` +
      `Chỉ model active, mới nhất xếp cuối, dùng đúng id (vd claude-opus-4-8).`;
    try {
      const { text } = await callClaudeWithSearch(system, "Liệt kê model Claude hiện hành cho API.", modelId);
      const arr = extractJSONArray(text);
      if (!arr?.length) { setErr("Không đọc được danh sách model."); setUpdateNote(""); return; }
      const colorFor = (id) => id.includes("haiku") ? "#d97706" : id.includes("sonnet") ? "#0d9488"
        : id.includes("opus-4-8") ? "#6d28d9" : "#7c3aed";
      const normalized = arr.filter(m => m?.id?.startsWith?.("claude-")).map(m => ({
        id: m.id, label: String(m.label || m.id).slice(0, 24), badge: String(m.badge || "").slice(0, 14), color: colorFor(m.id),
      }));
      if (!normalized.length) { setErr("Danh sách không hợp lệ."); setUpdateNote(""); return; }
      const before = new Set(models.map(m => m.id));
      const added = normalized.filter(m => !before.has(m.id)).map(m => m.label);
      setModels(normalized);
      if (!normalized.some(m => m.id === modelId)) setModelId(normalized[normalized.length - 1].id);
      setUpdateNote(added.length ? `Đã cập nhật ${normalized.length} model. Mới: ${added.join(", ")}.` : `Đã làm mới ${normalized.length} model.`);
      showToast("Đã cập nhật model");
    } catch (e) { setErr("Cập nhật thất bại: " + String(e.message || e)); setUpdateNote(""); }
    finally { setUpdateBusy(false); }
  }

  const curModel = models.find(m => m.id === modelId) || models[0];
  const hasContext = !!context;
  const byType = { text: prompts.filter(p => p.type === "text_generation").length,
                   image: prompts.filter(p => p.type === "image_generation").length };

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logoBox}><Factory size={18} color="#fff" /></div>
          <div>
            <div style={S.title}>Prompt Factory</div>
            <div style={S.subtitle}>Tool 2 · Module 2 — Máy đẻ Prompt</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btnGhost} onClick={() => cpRef.current?.click()}><FolderInput size={14} /> Nạp CP</button>
          <button style={S.btnGhost} onClick={exportCheckpoint}><Download size={14} /> Lưu CP</button>
        </div>
      </div>

      <ModelSelector
        models={models} modelId={modelId} onModel={setModelId}
        thinkingOn={thinkingOn} onThinking={setThinkingOn}
        effortId={effortId} onEffort={setEffortId}
        updateBusy={updateBusy} updateNote={updateNote} onUpdate={runUpdateModels}
      />

      <div style={S.body}>
        {err && (
          <div style={S.errBox}><AlertTriangle size={14} /><span>{err}</span>
            <X size={14} style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => setErr("")} />
          </div>
        )}

        {/* A — CONTEXT */}
        <Section icon={<FileJson size={15} />} title="A · Nạp Context từ Module 1" tag="Input">
          {hasContext ? (
            <div style={S.ctxCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} /> {context.channel?.channelName || "Channel context đã nạp"}
                </span>
                <button style={S.btnGhostSm} onClick={() => setContext(null)}><Trash2 size={12} /> Gỡ</button>
              </div>
              <div style={{ fontSize: 12, color: "#78716c" }}>
                {summarizeChannel(context.channel)} · Blueprint: {context.blueprint ? "có" : "không"}
              </div>
            </div>
          ) : (
            <div style={S.dropZone} onClick={() => ctxRef.current?.click()}>
              <Upload size={22} color="#a8a29e" />
              <div style={{ marginTop: 6 }}>Nạp checkpoint JSON từ Module 1 (Channel Studio)</div>
              <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 2 }}>Có thể bỏ qua, nhưng prompt sẽ kém sát kênh hơn</div>
            </div>
          )}
        </Section>

        {/* B — CẤU HÌNH LÔ */}
        <Section icon={<Package size={15} />} title="B · Chọn loại & số lượng" tag="Offline">
          {PROMPT_TYPES.map(t => (
            <div key={t.key} style={S.qtyRow}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {t.icon === "image" ? <ImageIcon size={15} color={t.color} /> : <FileText size={15} color={t.color} />}
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                <span style={{ ...S.typeTag, color: t.color, borderColor: t.color + "55", background: t.color + "0f" }}>{t.type}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button style={S.stepBtn} onClick={() => setQty(t.key, (quantities[t.key] || 0) - 1)}><Minus size={13} /></button>
                <input style={S.qtyInput} value={quantities[t.key] || 0} onChange={e => setQty(t.key, e.target.value)} />
                <button style={S.stepBtn} onClick={() => setQty(t.key, (quantities[t.key] || 0) + 1)}><Plus size={13} /></button>
              </span>
            </div>
          ))}
          <div style={S.genBar}>
            <button style={{ ...S.btnPrimary, opacity: genBusy ? 0.6 : 1 }} disabled={genBusy} onClick={runGenerate}>
              {genBusy ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {genBusy ? "Đang sinh…" : `Tạo ${totalToGen} Prompt`}
            </button>
            {genBusy && <button style={S.btnGhost} onClick={cancelGenerate}><Ban size={14} /> Huỷ</button>}
            <button style={S.btnGhost} onClick={() => dupRef.current?.click()}><Upload size={14} /> Nạp prompt cũ</button>
            <span style={S.apiTag}>TỐN API</span>
          </div>
          {(genBusy || genLog) && (
            <div style={S.genStatus}>
              <span>{genLog}</span>
              {lastUsage && <span style={S.usage}>{lastUsage.input_tokens}→{lastUsage.output_tokens} tok · ${lastUsage.cost.toFixed(4)}</span>}
            </div>
          )}
          {genBusy && genStream && <pre style={S.streamPre}>{genStream.slice(-500)}</pre>}
        </Section>

        {/* C — KHO PROMPT */}
        <Section icon={<Factory size={15} />} title={`C · Kho Prompt (${prompts.length})`} tag={`text:${byType.text} · image:${byType.image}`}>
          {prompts.length === 0 ? (
            <div style={S.empty}>Chưa có prompt nào. Chọn loại & số lượng ở trên rồi bấm "Tạo Prompt".</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <button style={S.btnPrimaryOutline} onClick={exportJSON}><FileJson size={14} /> Export JSON</button>
                <button style={S.btnPrimaryOutline} onClick={exportMD}><FileText size={14} /> Export MD</button>
                <button style={S.btnGhost} onClick={clearPrompts}><Trash2 size={14} /> Xoá hết</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {prompts.map(p => (
                  <div key={p.id} style={S.promptCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      {p.type === "image_generation" ? <ImageIcon size={13} color="#7c3aed" /> : <FileText size={13} color="#0d9488" />}
                      <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{p.title}</span>
                      <span style={{ ...S.typeTagSm, color: p.type === "image_generation" ? "#7c3aed" : "#0d9488" }}>{p.categoryLabel}</span>
                      <Copy size={13} style={{ cursor: "pointer", color: "#a8a29e" }} onClick={() => copyPrompt(p.prompt)} />
                      <Trash2 size={13} style={{ cursor: "pointer", color: "#d6d3d1" }} onClick={() => deletePrompt(p.id)} />
                    </div>
                    <div style={S.promptBody}>{p.prompt}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      <input ref={ctxRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleContextImport} />
      <input ref={cpRef}  type="file" accept=".json" style={{ display: "none" }} onChange={handleCpImport} />
      <input ref={dupRef} type="file" accept=".json,.md,.txt" style={{ display: "none" }} onChange={handleDupImport} />

      <div style={{ ...S.toast, opacity: toast.vis ? 1 : 0, transform: toast.vis ? "translateY(0)" : "translateY(8px)" }}>{toast.msg}</div>
      <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
        textarea,input{font-family:${FONT}}`}</style>
    </div>
  );
}

/* ─── helpers render ─────────────────────────────────────────────── */
function summarizeChannel(ch) {
  if (!ch) return "—";
  const pillars = Array.isArray(ch.contentPillars) ? ch.contentPillars.slice(0, 3).join(", ") : "";
  return pillars || ch.tagline || ch.description?.slice(0, 50) || "context cơ bản";
}

function Section({ icon, title, tag, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionHead}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#44403c", fontWeight: 600, fontSize: 13 }}>{icon} {title}</span>
        {tag && <span style={S.sectionTag}>{tag}</span>}
      </div>
      {children}
    </div>
  );
}

function ModelSelector({ models, modelId, onModel, thinkingOn, onThinking, effortId, onEffort, updateBusy, updateNote, onUpdate }) {
  const [effortOpen, setEffortOpen] = useState(false);
  const curEffort = EFFORT_LEVELS.find(e => e.id === effortId) || EFFORT_LEVELS[2];
  return (
    <div style={S.modelBar}>
      <div style={S.modelRow}>
        <Cpu size={13} color="#a8a29e" />
        {models.map(m => {
          const active = modelId === m.id;
          return (
            <div key={m.id} onClick={() => onModel(m.id)}
              style={{ ...S.modelChip, ...(active ? { borderColor: m.color, background: "#fff", boxShadow: `0 0 0 1px ${m.color}` } : {}) }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: m.color }} />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{m.label}</span>
              {m.badge && <span style={S.modelBadge}>{m.badge}</span>}
            </div>
          );
        })}
        <button onClick={onUpdate} disabled={updateBusy} style={S.updateBtn} title="Tra docs Anthropic tìm model mới">
          {updateBusy ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
          {updateBusy ? "Đang cập nhật…" : "Cập nhật"}
        </button>
      </div>
      {updateNote && <div style={S.updateNote}>{updateNote}</div>}
      <div style={S.modelRow}>
        <div style={{ position: "relative" }}>
          <button style={S.effortBtn} onClick={() => setEffortOpen(o => !o)}>
            <span style={{ color: "#a8a29e" }}>Effort</span>
            <span style={{ fontWeight: 600 }}>{curEffort.label}</span>
            <ChevronDown size={12} />
          </button>
          {effortOpen && (
            <div style={S.effortMenu}>
              {EFFORT_LEVELS.map(e => (
                <div key={e.id} onClick={() => { onEffort(e.id); setEffortOpen(false); }}
                  style={{ ...S.effortItem, background: e.id === effortId ? "#f0fdfa" : "transparent" }}>
                  <span style={{ fontWeight: e.id === effortId ? 600 : 400 }}>{e.label}</span>
                  {e.isDefault && <span style={{ color: "#a8a29e", fontSize: 11 }}>Default</span>}
                  {e.id === effortId && <Check size={13} color="#0d9488" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onThinking(!thinkingOn)} title="Cho phép model suy nghĩ kỹ hơn"
          style={{ ...S.thinkBtn, background: thinkingOn ? "#f5f3ff" : "#fff",
            borderColor: thinkingOn ? "#7c3aed" : "#e7e5e4", color: thinkingOn ? "#7c3aed" : "#78716c" }}>
          <Brain size={13} /> Thinking
          <span style={{ ...S.toggleTrack, background: thinkingOn ? "#7c3aed" : "#d6d3d1" }}>
            <span style={{ ...S.toggleKnob, transform: thinkingOn ? "translateX(13px)" : "translateX(0)" }} />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─── STYLES ───────────────────────────────────────────────────────── */
const S = {
  root: { fontFamily: FONT, maxWidth: 760, margin: "0 auto", background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 14, overflow: "hidden", color: "#292524" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#fff", borderBottom: "1px solid #f0eeec" },
  logoBox: { width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  subtitle: { fontSize: 11, color: "#a8a29e" },
  body: { padding: 16 },
  section: { background: "#fff", border: "1px solid #f0eeec", borderRadius: 11, padding: 14, marginBottom: 14 },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTag: { fontSize: 10, fontWeight: 600, color: "#78716c", background: "#f5f5f4", border: "1px solid #e7e5e4", borderRadius: 6, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.04em" },
  dropZone: { border: "2px dashed #e7e5e4", borderRadius: 10, padding: "26px 16px", textAlign: "center", color: "#78716c", fontSize: 13, cursor: "pointer", background: "#fafaf9" },
  ctxCard: { border: "1px solid #ccfbf1", background: "#f0fdfa", borderRadius: 9, padding: 12 },
  qtyRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f4" },
  typeTag: { fontSize: 9.5, fontWeight: 600, border: "1px solid", borderRadius: 5, padding: "1px 6px", fontFamily: MONO },
  typeTagSm: { fontSize: 10, fontWeight: 600 },
  stepBtn: { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e7e5e4", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#57534e" },
  qtyInput: { width: 42, textAlign: "center", padding: "5px 0", border: "1px solid #e7e5e4", borderRadius: 7, fontSize: 13, outline: "none" },
  genBar: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  btnPrimaryOutline: { display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", color: "#57534e", border: "1px solid #e7e5e4", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnGhostSm: { display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", color: "#78716c", border: "1px solid #e7e5e4", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  apiTag: { fontSize: 9, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 5, padding: "2px 7px", marginLeft: "auto" },
  genStatus: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "#78716c" },
  usage: { fontSize: 11, color: "#a8a29e", fontFamily: MONO },
  streamPre: { fontFamily: MONO, fontSize: 11, color: "#6d28d9", background: "#faf9ff", border: "1px solid #ede9fe", borderRadius: 7, padding: 9, maxHeight: 140, overflow: "auto", whiteSpace: "pre-wrap", marginTop: 8 },
  empty: { textAlign: "center", color: "#a8a29e", fontSize: 13, padding: "20px 10px" },
  promptCard: { border: "1px solid #f0eeec", borderRadius: 9, padding: "10px 12px", background: "#fafaf9" },
  promptBody: { fontSize: 12, color: "#57534e", lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" },
  errBox: { display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 14 },
  modelBar: { display: "flex", flexDirection: "column", gap: 8, padding: "10px 18px", background: "#fff", borderBottom: "1px solid #f0eeec" },
  modelRow: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" },
  modelChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: "1px solid #e7e5e4", background: "#fafaf9", cursor: "pointer", userSelect: "none" },
  modelBadge: { fontSize: 9, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.04em" },
  updateBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px dashed #c4b5fd", background: "#faf9ff", color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: 4 },
  updateNote: { fontSize: 11.5, color: "#6d28d9", background: "#faf9ff", border: "1px solid #ede9fe", borderRadius: 7, padding: "6px 10px" },
  thinkBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  toggleTrack: { width: 26, height: 14, borderRadius: 99, position: "relative", display: "inline-block", transition: "background 0.2s", flexShrink: 0 },
  toggleKnob: { position: "absolute", top: 2, left: 2, width: 10, height: 10, borderRadius: 99, background: "#fff", transition: "transform 0.2s" },
  effortBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#57534e" },
  effortMenu: { position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", zIndex: 20, minWidth: 140 },
  effortItem: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#44403c" },
  toast: { position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "#292524", color: "#fff", fontSize: 12.5, padding: "9px 16px", borderRadius: 9, transition: "all 0.25s", zIndex: 50, pointerEvents: "none" },
};

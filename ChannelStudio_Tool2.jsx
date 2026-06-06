import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, Download, Save, FileJson, Sparkles, Settings2, Cpu, Brain,
  ChevronDown, Check, X, Plus, Trash2, RefreshCw, Layers, Loader2,
  AlertTriangle, FolderInput, Tags, Hash,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TOOL 2 — CHANNEL STUDIO  (Module 1 / 3)
   "Channel Creator" half of Tool 2.
   - Import Tool 1 blueprint JSON  → context
   - Channel settings + AI Fill
   - Model selector (Haiku/Sonnet/Opus) + Thinking + Effort
   - Checkpoint system: window.storage auto-save + Import/Export JSON
   Module 2 (Prompt Factory) will read the state this module produces.
   ════════════════════════════════════════════════════════════════════ */

const FONT = '"Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace';

/* ─── MODELS — danh sách gốc. Nút "Cập nhật" có thể thay bằng danh sách
   mới do Claude tra từ docs Anthropic. Xem Claude.md mục 2 & 7. ── */
const DEFAULT_MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5",  badge: "Nhanh",       desc: "Nhanh · tiết kiệm token",     color: "#d97706" },
  { id: "claude-sonnet-4-6",         label: "Sonnet 4.6", badge: "Khuyên dùng", desc: "Hiệu quả cho việc hằng ngày", color: "#0d9488" },
  { id: "claude-opus-4-6",           label: "Opus 4.6",   badge: "",            desc: "Opus thế hệ trước",           color: "#7c3aed" },
  { id: "claude-opus-4-7",           label: "Opus 4.7",   badge: "",            desc: "Opus cải tiến",               color: "#7c3aed" },
  { id: "claude-opus-4-8",           label: "Opus 4.8",   badge: "Mạnh nhất",   desc: "Mạnh nhất cho việc tham vọng", color: "#6d28d9" },
];

/* Effort là mức của MODEL, gửi thẳng qua output_config.effort.
   high = mặc định của API (bỏ qua cũng tương đương). */
const EFFORT_LEVELS = [
  { id: "low",    label: "Low",    desc: "Nhanh, tiết kiệm token" },
  { id: "medium", label: "Medium", desc: "Cân bằng cho việc sản xuất" },
  { id: "high",   label: "High",   isDefault: true, desc: "Mặc định · kỹ lưỡng" },
  { id: "max",    label: "Max",    desc: "Tối đa, cho việc khó nhất" },
];

const PRICING = {
  "claude-haiku-4-5-20251001": { input: 0.80,  output: 4.00  },
  "claude-sonnet-4-6":         { input: 3.00,  output: 15.00 },
  "claude-opus-4-6":           { input: 15.00, output: 75.00 },
  "claude-opus-4-7":           { input: 15.00, output: 75.00 },
  "claude-opus-4-8":           { input: 15.00, output: 75.00 },
};

const CHECKPOINT_VERSION = "tool2-channelstudio-v1";
const STORAGE_KEY = "tool2_channelstudio_autosave";

/* ─── CHANNEL FIELDS + suggestion chips (offline, no API) ──────────── */
const CHANNEL_FIELDS = [
  { key: "channelName",   label: "Tên kênh",        ph: "VD: Vùng Đất Tỉnh Thức",            multi: false, chips: [] },
  { key: "tagline",       label: "Tagline",         ph: "Một câu slogan ngắn gọn",           multi: false, chips: ["Kiến thức mỗi ngày", "Hiểu sâu, sống tỉnh", "Câu chuyện chưa kể", "Khoa học dễ hiểu"] },
  { key: "description",   label: "Mô tả kênh",      ph: "Mô tả 2-3 câu về kênh",             multi: false, area: true, chips: [] },
  { key: "targetAudience",label: "Đối tượng",       ph: "Khán giả mục tiêu",                 multi: true,  chips: ["18-24 tuổi", "25-34 tuổi", "35-44 tuổi", "Học sinh/SV", "Dân văn phòng", "Người yêu khoa học", "Người mê lịch sử"] },
  { key: "contentPillars",label: "Trụ cột nội dung",ph: "Các chủ đề chính",                  multi: true,  chips: ["Khoa học", "Lịch sử", "Tâm lý học", "Triết học", "Công nghệ", "Vũ trụ", "Self-help", "Bí ẩn"] },
  { key: "toneVoice",     label: "Giọng điệu",      ph: "Phong cách trình bày",              multi: true,  chips: ["Thông thái", "Gần gũi", "Kịch tính", "Hài hước", "Trang trọng", "Truyền cảm hứng", "Bí ẩn"] },
  { key: "videoFormat",   label: "Định dạng video", ph: "Kiểu video chủ đạo",                multi: true,  chips: ["Voice-over + b-roll", "Talking head", "Animation", "Documentary", "Top list", "Kể chuyện", "Phân tích"] },
  { key: "uploadCadence", label: "Tần suất đăng",   ph: "VD: 2 video/tuần",                  multi: false, chips: ["Hàng ngày", "3 video/tuần", "2 video/tuần", "1 video/tuần"] },
];

/* ─── CLAUDE API (zero-key, streaming) — theo tài liệu Anthropic ───────
   • Effort: gửi qua output_config.effort ("low"|"medium"|"high"|"max").
     Đây là field model, độc lập, dùng được kể cả khi KHÔNG bật thinking.
     effort="high" là mặc định. Cần beta header effort-2025-11-24 cho an toàn
     với một số model/đời.
   • Thinking: các model 4.6/4.7/4.8 dùng adaptive thinking — chỉ cần
     thinking:{type:"enabled"}. KHÔNG gửi budget_tokens (đã deprecated) và
     KHÔNG ép temperature (4.7/4.8 không nhận temperature).
   • max_tokens vẫn là hard cap output, set rộng tay để không bị cắt. */
async function callClaude(system, user, onChunk, cfg = {}) {
  const { model = "claude-sonnet-4-6", thinkingOn = false, effortId = "high", maxTokens = 16000 } = cfg;

  const body = {
    model,
    max_tokens: maxTokens,
    stream: true,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: effortId },
  };
  if (thinkingOn) body.thinking = { type: "enabled" };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-beta": "effort-2025-11-24",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err.slice(0, 200)}`); }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "", usage = null;
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
        if (j?.type === "message_delta" && j?.usage) usage = { ...usage, ...j.usage };
        // chỉ stream text_delta — bỏ qua thinking_delta
        if (j?.delta?.type === "text_delta" || (j?.delta?.text && j?.delta?.type !== "thinking_delta")) {
          const delta = j.delta.text || "";
          if (delta) { full += delta; onChunk && onChunk(full); }
        }
      } catch {}
    }
  }
  return { text: full, usage };
}

/* ─── helper: trích JSON từ output có thể kèm prose/```fences ─────── */
function extractJSON(raw) {
  if (!raw) return null;
  let s = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try { return JSON.parse(s); } catch {}
  const first = s.indexOf("{"), last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(s.slice(first, last + 1)); } catch {}
  }
  return null;
}

/* trích JSON ARRAY (dùng cho danh sách model khi Update) */
function extractJSONArray(raw) {
  if (!raw) return null;
  let s = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : (Array.isArray(v?.models) ? v.models : null); } catch {}
  const first = s.indexOf("["), last = s.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(s.slice(first, last + 1)); } catch {}
  }
  return null;
}

/* ─── CLAUDE API + WEB SEARCH (non-stream) — dùng cho nút "Cập nhật" ──
   Code trong Artifact không tự fetch docs được, nên nhờ chính Claude tra
   cứu qua web_search tool rồi trả JSON. Gọi non-stream cho đơn giản vì còn
   phải gom nhiều loại content block (text / server_tool_use / search_result). */
async function callClaudeWithSearch(system, user, model = "claude-sonnet-4-6") {
  const body = {
    model,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err.slice(0, 200)}`); }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  // gom mọi block text (lọc theo type, không dựa vị trí)
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return { text, usage: data.usage || null };
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function ChannelStudioTool2() {
  // ── model config ──
  const [models, setModels]         = useState(DEFAULT_MODELS);
  const [modelId, setModelId]       = useState("claude-sonnet-4-6");
  const [thinkingOn, setThinkingOn] = useState(false);
  const [effortId, setEffortId]     = useState("high");

  // ── Update (tự tra docs Anthropic qua web_search) ──
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateNote, setUpdateNote] = useState("");

  // ── data state ──
  const [blueprint, setBlueprint]   = useState(null);      // imported from Tool 1
  const [channel, setChannel]       = useState({});        // { fieldKey: string | string[] }
  const [checkpointName, setCheckpointName] = useState("channel-studio-1");

  // ── AI Fill ──
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiBusy, setAiBusy]   = useState(false);
  const [aiStream, setAiStream] = useState("");
  const [lastUsage, setLastUsage] = useState(null);

  // ── ui ──
  const [toast, setToast] = useState({ msg: "", vis: false });
  const [err, setErr]     = useState("");
  const blueprintRef = useRef(null);
  const cpRef        = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, vis: true });
    setTimeout(() => setToast(t => ({ ...t, vis: false })), 2200);
  }, []);

  /* ── AUTO-SAVE to window.storage (debounced) ── */
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        await window.storage?.set(STORAGE_KEY, JSON.stringify(buildCheckpoint()));
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [blueprint, channel, models, modelId, thinkingOn, effortId, checkpointName]);

  /* ── LOAD autosave on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage?.get(STORAGE_KEY);
        if (r?.value) {
          const cp = JSON.parse(r.value);
          applyCheckpoint(cp, true);
          showToast("Đã khôi phục phiên làm việc trước");
        }
      } catch {}
    })();
    // eslint-disable-next-line
  }, []);

  /* ── checkpoint build / apply ── */
  function buildCheckpoint() {
    return {
      version: CHECKPOINT_VERSION,
      savedAt: new Date().toISOString(),
      name: checkpointName,
      config: { modelId, thinkingOn, effortId },
      models,
      blueprint,
      channel,
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
    if (cp.blueprint !== undefined) setBlueprint(cp.blueprint);
    if (cp.channel) setChannel(cp.channel);
    if (cp.name) setCheckpointName(cp.name);
    if (!silent) showToast("Đã nạp checkpoint");
  }

  /* ── import blueprint từ Tool 1 ── */
  function handleBlueprintImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setBlueprint(data);
        setErr("");
        // auto-suggest tên kênh nếu blueprint có
        const guess = data?.channelName || data?.name || data?.summary?.channelName;
        if (guess && !channel.channelName) setChannel(c => ({ ...c, channelName: guess }));
        showToast("Đã import Blueprint từ Tool 1");
      } catch {
        setErr("File blueprint không phải JSON hợp lệ.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  /* ── import / export checkpoint ── */
  function handleCpImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const cp = (() => { try { return JSON.parse(ev.target.result); } catch { return null; } })();
      if (!cp) { setErr("Checkpoint không hợp lệ."); return; }
      if (cp.version && cp.version !== CHECKPOINT_VERSION)
        showToast("Cảnh báo: checkpoint khác phiên bản, vẫn thử nạp");
      applyCheckpoint(cp);
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  function exportCheckpoint() {
    const blob = new Blob([JSON.stringify(buildCheckpoint(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${checkpointName || "channel-studio"}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast("Đã export checkpoint");
  }

  /* ── field helpers ── */
  function setField(key, val) { setChannel(c => ({ ...c, [key]: val })); }
  function toggleChip(key, chip, multi) {
    setChannel(c => {
      if (!multi) return { ...c, [key]: c[key] === chip ? "" : chip };
      const arr = Array.isArray(c[key]) ? c[key] : [];
      return { ...c, [key]: arr.includes(chip) ? arr.filter(x => x !== chip) : [...arr, chip] };
    });
  }

  /* ── AI FILL ── */
  async function runAIFill() {
    if (aiBusy) return;
    setAiBusy(true); setErr(""); setAiStream("");

    const fieldSpec = CHANNEL_FIELDS.map(f =>
      `- "${f.key}" (${f.label})${f.multi ? " — array of strings" : " — string"}`
    ).join("\n");

    const system =
      `Bạn là chuyên gia chiến lược kênh YouTube. Nhiệm vụ: điền thông tin kênh dựa trên ` +
      `yêu cầu của người dùng và bộ khung (blueprint) từ Tool 1.\n` +
      `Trả về DUY NHẤT một JSON object, KHÔNG kèm giải thích, KHÔNG markdown fences.\n` +
      `Các trường cần điền:\n${fieldSpec}\n` +
      `Trường array trả về mảng string ngắn gọn. Tiếng Việt. Giữ nhất quán với blueprint.`;

    const user =
      `# Yêu cầu của người dùng\n${aiInstruction || "(không có — hãy suy ra từ blueprint)"}\n\n` +
      `# Blueprint từ Tool 1\n${blueprint ? JSON.stringify(blueprint, null, 2) : "(chưa import blueprint)"}\n\n` +
      `# Thông tin kênh hiện có (giữ nếu hợp lý, bổ sung phần còn thiếu)\n${JSON.stringify(channel, null, 2)}`;

    try {
      const { text, usage } = await callClaude(system, user, (p) => setAiStream(p), {
        model: modelId, thinkingOn, effortId, maxTokens: 8000,
      });
      const parsed = extractJSON(text);
      if (!parsed) { setErr("AI trả về không phải JSON đọc được. Xem stream bên dưới."); return; }
      setChannel(c => {
        const next = { ...c };
        for (const f of CHANNEL_FIELDS) {
          if (parsed[f.key] == null) continue;
          next[f.key] = f.multi
            ? (Array.isArray(parsed[f.key]) ? parsed[f.key] : [String(parsed[f.key])])
            : String(parsed[f.key]);
        }
        return next;
      });
      if (usage) {
        const p = PRICING[modelId] || (modelId.includes("haiku") ? PRICING["claude-haiku-4-5-20251001"]
          : modelId.includes("sonnet") ? PRICING["claude-sonnet-4-6"] : PRICING["claude-opus-4-8"]);
        const cost = ((usage.input_tokens || 0) * p.input + (usage.output_tokens || 0) * p.output) / 1e6;
        setLastUsage({ ...usage, cost });
      }
      showToast("AI đã điền thông tin kênh");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setAiBusy(false);
    }
  }

  function clearAll() {
    if (!window.confirm("Xóa toàn bộ thông tin kênh hiện tại?")) return;
    setChannel({}); showToast("Đã xóa thông tin kênh");
  }

  /* ── CẬP NHẬT: nhờ Claude tra docs Anthropic (web_search) → model mới ── */
  async function runUpdateModels() {
    if (updateBusy) return;
    setUpdateBusy(true); setErr(""); setUpdateNote("Đang tra cứu tài liệu Anthropic…");

    const system =
      `Bạn có quyền dùng web_search. Hãy tra danh sách model Claude HIỆN HÀNH cho Anthropic Messages API.\n` +
      `Nguồn ưu tiên: platform.claude.com/docs (Models overview), github.com/anthropics/skills, ` +
      `github.com/anthropics/claude-code.\n` +
      `Sau khi tra xong, trả về DUY NHẤT một JSON ARRAY (không giải thích, không markdown fences), mỗi phần tử:\n` +
      `{ "id": "<model id chính xác dùng cho API>", "label": "<tên ngắn>", "badge": "<nhãn ngắn hoặc rỗng>", "desc": "<mô tả ngắn tiếng Việt>" }\n` +
      `CHỈ gồm model đang active, mới nhất xếp cuối. Dùng ĐÚNG model id (vd claude-opus-4-8), không bịa.`;
    const user = `Liệt kê các model Claude hiện hành cho API tính đến hôm nay. Trả JSON array như mô tả.`;

    try {
      const { text } = await callClaudeWithSearch(system, user, modelId);
      const arr = extractJSONArray(text);
      if (!arr || !arr.length) {
        setErr("Không đọc được danh sách model từ kết quả tra cứu. Giữ nguyên danh sách hiện tại.");
        setUpdateNote("");
        return;
      }
      // chuẩn hóa + gán màu ổn định theo dòng model
      const colorFor = (id) => id.includes("haiku") ? "#d97706" : id.includes("sonnet") ? "#0d9488"
        : id.includes("opus-4-8") ? "#6d28d9" : "#7c3aed";
      const normalized = arr
        .filter(m => m && typeof m.id === "string" && m.id.startsWith("claude-"))
        .map(m => ({
          id: m.id,
          label: String(m.label || m.id).slice(0, 24),
          badge: String(m.badge || "").slice(0, 14),
          desc: String(m.desc || "").slice(0, 60),
          color: colorFor(m.id),
        }));
      if (!normalized.length) { setErr("Danh sách trả về không hợp lệ."); setUpdateNote(""); return; }

      const before = new Set(models.map(m => m.id));
      const added = normalized.filter(m => !before.has(m.id)).map(m => m.label);
      setModels(normalized);
      // nếu model đang chọn không còn → chuyển về model cuối (mới nhất)
      if (!normalized.some(m => m.id === modelId)) setModelId(normalized[normalized.length - 1].id);
      setUpdateNote(added.length
        ? `Đã cập nhật ${normalized.length} model. Mới: ${added.join(", ")}.`
        : `Đã làm mới ${normalized.length} model (không có model mới).`);
      showToast("Đã cập nhật danh sách model");
    } catch (e) {
      setErr("Cập nhật thất bại: " + String(e.message || e));
      setUpdateNote("");
    } finally {
      setUpdateBusy(false);
    }
  }

  const curModel = models.find(m => m.id === modelId) || models[0];

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logoBox}><Layers size={18} color="#fff" /></div>
          <div>
            <div style={S.title}>Channel Studio</div>
            <div style={S.subtitle}>Tool 2 · Module 1 — Channel Creator</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btnGhost} onClick={() => cpRef.current?.click()}><FolderInput size={14} /> Nạp CP</button>
          <button style={S.btnGhost} onClick={exportCheckpoint}><Download size={14} /> Lưu CP</button>
        </div>
      </div>

      {/* MODEL SELECTOR */}
      <ModelSelector
        models={models}
        modelId={modelId} onModel={setModelId}
        thinkingOn={thinkingOn} onThinking={setThinkingOn}
        effortId={effortId} onEffort={setEffortId}
        updateBusy={updateBusy} updateNote={updateNote} onUpdate={runUpdateModels}
      />

      <div style={S.body}>
        {err && (
          <div style={S.errBox}><AlertTriangle size={14} /> <span>{err}</span>
            <X size={14} style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => setErr("")} />
          </div>
        )}

        {/* SECTION A — IMPORT BLUEPRINT */}
        <Section icon={<FileJson size={15} />} title="A · Import Blueprint từ Tool 1" tag="Input">
          {blueprint ? (
            <div style={S.bpCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} /> Blueprint đã nạp
                </span>
                <button style={S.btnGhostSm} onClick={() => setBlueprint(null)}><Trash2 size={12} /> Gỡ</button>
              </div>
              <pre style={S.bpPre}>{JSON.stringify(blueprint, null, 2).slice(0, 1200)}
                {JSON.stringify(blueprint, null, 2).length > 1200 ? "\n… (rút gọn)" : ""}</pre>
            </div>
          ) : (
            <div style={S.dropZone} onClick={() => blueprintRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) { const r = new FileReader(); r.onload = ev => { try { setBlueprint(JSON.parse(ev.target.result)); showToast("Đã import Blueprint"); } catch { setErr("JSON không hợp lệ"); } }; r.readAsText(f); }
              }}>
              <Upload size={22} color="#a8a29e" />
              <div style={{ marginTop: 6 }}>Click hoặc kéo thả file JSON blueprint (từ Tool 1)</div>
              <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 2 }}>Không có cũng được — bạn vẫn điền thủ công / dùng AI Fill</div>
            </div>
          )}
        </Section>

        {/* SECTION B — CHANNEL SETTINGS */}
        <Section icon={<Settings2 size={15} />} title="B · Thiết lập thông tin kênh" tag="Offline + AI">
          {/* AI Fill box */}
          <div style={S.aiBox}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Sparkles size={14} color="#7c3aed" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#44403c" }}>AI Điền tự động</span>
              <span style={S.apiTag}>TỐN API</span>
            </div>
            <textarea
              style={S.textarea}
              rows={2}
              placeholder="VD: Kênh kể chuyện khoa học vũ trụ cho người trẻ, giọng kịch tính, đăng 2 video/tuần…"
              value={aiInstruction}
              onChange={e => setAiInstruction(e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btnPrimary, opacity: aiBusy ? 0.6 : 1 }} disabled={aiBusy} onClick={runAIFill}>
                {aiBusy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                {aiBusy ? "Đang điền…" : "AI Điền"}
              </button>
              {lastUsage && (
                <span style={S.usage}>
                  {lastUsage.input_tokens}→{lastUsage.output_tokens} tok · ${lastUsage.cost.toFixed(4)}
                </span>
              )}
            </div>
            {aiBusy && aiStream && <pre style={S.streamPre}>{aiStream.slice(-600)}</pre>}
          </div>

          {/* Fields */}
          {CHANNEL_FIELDS.map(f => (
            <FieldRow key={f.key} field={f} value={channel[f.key]} onSet={setField} onChip={toggleChip} />
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={S.btnGhost} onClick={clearAll}><Trash2 size={14} /> Xóa hết</button>
          </div>
        </Section>

        {/* SECTION C — STATUS / handoff sang Module 2 */}
        <Section icon={<Tags size={15} />} title="C · Trạng thái → Prompt Factory" tag="Module 2">
          <div style={S.statusGrid}>
            <StatCard label="Blueprint" value={blueprint ? "Đã nạp" : "Trống"} ok={!!blueprint} />
            <StatCard label="Trường đã điền" value={`${CHANNEL_FIELDS.filter(f => { const v = channel[f.key]; return Array.isArray(v) ? v.length : !!v; }).length}/${CHANNEL_FIELDS.length}`} ok />
            <StatCard label="Model" value={curModel.label} ok />
          </div>
          <div style={S.note}>
            <Hash size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Module 1 chuẩn bị xong "Channel Context". Module 2 (Prompt Factory) sẽ đọc state này để đẻ
            prompt hàng loạt, mỗi prompt gắn <code style={S.code}>type</code> (text_generation / image_generation)
            cho Tool 3. Nhớ <b>Lưu CP</b> trước khi sang module sau.</span>
          </div>
        </Section>
      </div>

      {/* hidden inputs */}
      <input ref={blueprintRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleBlueprintImport} />
      <input ref={cpRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleCpImport} />

      {/* toast */}
      <div style={{ ...S.toast, opacity: toast.vis ? 1 : 0, transform: toast.vis ? "translateY(0)" : "translateY(8px)" }}>
        {toast.msg}
      </div>

      <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
        textarea,input{font-family:${FONT}}`}</style>
    </div>
  );
}

/* ─── SUB-COMPONENTS ───────────────────────────────────────────────── */
function Section({ icon, title, tag, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionHead}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#44403c", fontWeight: 600, fontSize: 13 }}>
          {icon} {title}
        </span>
        {tag && <span style={S.sectionTag}>{tag}</span>}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ field, value, onSet, onChip }) {
  const isMulti = field.multi;
  const arr = Array.isArray(value) ? value : [];
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.fieldLabel}>{field.label}</label>
      {field.area ? (
        <textarea style={S.textarea} rows={2} placeholder={field.ph}
          value={value || ""} onChange={e => onSet(field.key, e.target.value)} />
      ) : (
        <input style={S.input} placeholder={field.ph}
          value={isMulti ? arr.join(", ") : (value || "")}
          onChange={e => onSet(field.key, isMulti ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : e.target.value)} />
      )}
      {field.chips.length > 0 && (
        <div style={S.chipWrap}>
          {field.chips.map(chip => {
            const active = isMulti ? arr.includes(chip) : value === chip;
            return (
              <span key={chip} onClick={() => onChip(field.key, chip, isMulti)}
                style={{ ...S.chip, ...(active ? S.chipOn : {}) }}>
                {active && <Check size={11} />} {chip}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, ok }) {
  return (
    <div style={S.statCard}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: ok ? "#0d9488" : "#a8a29e" }}>{value}</div>
    </div>
  );
}

function ModelSelector({ models, modelId, onModel, thinkingOn, onThinking, effortId, onEffort, updateBusy, updateNote, onUpdate }) {
  const [effortOpen, setEffortOpen] = useState(false);
  const curEffort = EFFORT_LEVELS.find(e => e.id === effortId) || EFFORT_LEVELS[0];
  return (
    <div style={S.modelBar}>
      {/* Hàng model — Effort là mức của model, luôn hiện */}
      <div style={S.modelRow}>
        <Cpu size={13} color="#a8a29e" />
        {models.map(m => {
          const active = modelId === m.id;
          return (
            <div key={m.id} onClick={() => onModel(m.id)} title={m.desc}
              style={{ ...S.modelChip, ...(active ? { borderColor: m.color, background: "#fff", boxShadow: `0 0 0 1px ${m.color}` } : {}) }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: m.color }} />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{m.label}</span>
              {m.badge && <span style={S.modelBadge}>{m.badge}</span>}
            </div>
          );
        })}
        {/* Nút Cập nhật — tự tra docs Anthropic qua web_search */}
        <button onClick={onUpdate} disabled={updateBusy} style={S.updateBtn}
          title="Tra tài liệu Anthropic để tìm model/thay đổi mới nhất">
          {updateBusy ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
          {updateBusy ? "Đang cập nhật…" : "Cập nhật"}
        </button>
      </div>

      {updateNote && <div style={S.updateNote}>{updateNote}</div>}

      {/* Hàng điều khiển — Effort (luôn có) + Thinking (toggle riêng) */}
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

        <button onClick={() => onThinking(!thinkingOn)}
          title="Cho phép model suy nghĩ kỹ hơn cho tác vụ phức tạp"
          style={{ ...S.thinkBtn,
            background: thinkingOn ? "#f5f3ff" : "#fff", borderColor: thinkingOn ? "#7c3aed" : "#e7e5e4",
            color: thinkingOn ? "#7c3aed" : "#78716c" }}>
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
  logoBox: { width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#0d9488,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  subtitle: { fontSize: 11, color: "#a8a29e" },
  body: { padding: 16 },
  section: { background: "#fff", border: "1px solid #f0eeec", borderRadius: 11, padding: 14, marginBottom: 14 },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTag: { fontSize: 10, fontWeight: 600, color: "#78716c", background: "#f5f5f4", border: "1px solid #e7e5e4", borderRadius: 6, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.04em" },
  fieldLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#57534e", marginBottom: 5 },
  input: { width: "100%", padding: "8px 11px", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" },
  textarea: { width: "100%", padding: "8px 11px", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", background: "#fff" },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 },
  chip: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, padding: "4px 10px", borderRadius: 99, border: "1px solid #e7e5e4", background: "#fafaf9", color: "#78716c", cursor: "pointer", userSelect: "none" },
  chipOn: { background: "#f0fdfa", borderColor: "#0d9488", color: "#0d9488", fontWeight: 600 },
  aiBox: { background: "#faf9ff", border: "1px solid #ede9fe", borderRadius: 9, padding: 12, marginBottom: 16 },
  apiTag: { fontSize: 9, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 5, padding: "1px 6px", marginLeft: "auto" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", color: "#57534e", border: "1px solid #e7e5e4", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnGhostSm: { display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", color: "#78716c", border: "1px solid #e7e5e4", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  dropZone: { border: "2px dashed #e7e5e4", borderRadius: 10, padding: "26px 16px", textAlign: "center", color: "#78716c", fontSize: 13, cursor: "pointer", background: "#fafaf9" },
  bpCard: { border: "1px solid #ccfbf1", background: "#f0fdfa", borderRadius: 9, padding: 12 },
  bpPre: { fontFamily: MONO, fontSize: 11, color: "#0f766e", background: "#fff", border: "1px solid #ccfbf1", borderRadius: 7, padding: 10, maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", margin: 0 },
  streamPre: { fontFamily: MONO, fontSize: 11, color: "#6d28d9", background: "#fff", border: "1px solid #ede9fe", borderRadius: 7, padding: 9, maxHeight: 160, overflow: "auto", whiteSpace: "pre-wrap", marginTop: 8 },
  usage: { fontSize: 11, color: "#a8a29e", fontFamily: MONO },
  statusGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 12 },
  statCard: { background: "#fafaf9", border: "1px solid #f0eeec", borderRadius: 9, padding: "9px 11px" },
  statLabel: { fontSize: 10, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: 700 },
  note: { display: "flex", gap: 7, fontSize: 12, color: "#78716c", lineHeight: 1.55, background: "#fafaf9", border: "1px solid #f0eeec", borderRadius: 8, padding: "10px 12px" },
  code: { fontFamily: MONO, fontSize: 11, background: "#f5f5f4", padding: "1px 4px", borderRadius: 4, color: "#7c3aed" },
  errBox: { display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 14 },
  modelBar: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 18px", background: "#fff", borderBottom: "1px solid #f0eeec" },
  modelRow: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" },
  modelChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: "1px solid #e7e5e4", background: "#fafaf9", cursor: "pointer", userSelect: "none" },
  modelBadge: { fontSize: 9, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.04em" },
  updateBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px dashed #c4b5fd", background: "#faf9ff", color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: 4 },
  updateNote: { fontSize: 11.5, color: "#6d28d9", background: "#faf9ff", border: "1px solid #ede9fe", borderRadius: 7, padding: "6px 10px", marginTop: 8 },
  thinkBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  toggleTrack: { width: 26, height: 14, borderRadius: 99, position: "relative", display: "inline-block", transition: "background 0.2s", flexShrink: 0 },
  toggleKnob: { position: "absolute", top: 2, left: 2, width: 10, height: 10, borderRadius: 99, background: "#fff", transition: "transform 0.2s" },
  effortBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#57534e" },
  effortMenu: { position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", zIndex: 20, minWidth: 140 },
  effortItem: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#44403c" },
  toast: { position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "#292524", color: "#fff", fontSize: 12.5, padding: "9px 16px", borderRadius: 9, transition: "all 0.25s", zIndex: 50, pointerEvents: "none" },
};

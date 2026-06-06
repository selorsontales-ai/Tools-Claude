import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "superprompt_v1";
const WB_STORAGE_KEY = "worldbuilder_v1";

const CHAPTER_TONES = [
  "Hành động căng thẳng", "Cảm xúc sâu lắng", "Bí ẩn & hồi hộp",
  "Nhẹ nhàng / slice-of-life", "Đau thương & mất mát", "Hài hước",
  "Lãng mạn", "Kinh dị / u ám", "Sử thi / hoành tráng",
];

const TEMPLATES = {
  default: `[BỐI CẢNH CÂU CHUYỆN]
{world_lore}

[NHÂN VẬT]
{characters}

[LỊCH SỬ GẦN ĐÂY]
{history}

[NHIỆM VỤ CHƯƠNG {chapter_number}]
Tone: {tone}
Định hướng: {direction}

[DÀN Ý CHI TIẾT]
{beats}

[YÊU CẦU]
- Viết bằng tiếng Việt, văn xuôi tự nhiên, giàu cảm xúc
- Độ dài: khoảng {word_count} từ
- Góc nhìn: {pov}
- Không tóm tắt — viết đầy đủ từng beat`,

  minimalist: `Chương {chapter_number} — {tone}

Nhân vật: {characters}
Bối cảnh trước: {history}

Beats:
{beats}

Viết chương hoàn chỉnh (~{word_count} từ), tiếng Việt, góc nhìn {pov}.`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const now = () => new Date().toISOString();
const estimateTokens = (text) => Math.ceil((text || "").length / 3.5);
const truncateToTokens = (text, maxTokens) => {
  const maxChars = maxTokens * 3.5;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n[... đã cắt bớt để tiết kiệm token ...]";
};

// ─── Storage ──────────────────────────────────────────────────────────────────
async function storageGet(key) {
  try {
    if (window.storage) {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    }
  } catch {}
  return null;
}
async function storageSet(key, val) {
  try {
    if (window.storage) await window.storage.set(key, JSON.stringify(val));
  } catch {}
}

// ─── Claude API ───────────────────────────────────────────────────────────────
async function callClaude(system, user, onChunk, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (d === "[DONE]") continue;
      try {
        const delta = JSON.parse(d)?.delta?.text || "";
        if (delta) { full += delta; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "20px 16px" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #e5e7eb" },
  logoMark: { width: 30, height: 30, background: "#7c3aed", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600, marginRight: 10, flexShrink: 0 },
  tabBar: { display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 20 },
  tab: (a) => ({ padding: "6px 14px", borderRadius: 7, fontSize: 13, cursor: "pointer", border: "none", background: a ? "#fff" : "transparent", color: a ? "#111" : "#666", fontWeight: a ? 600 : 400, boxShadow: a ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s", whiteSpace: "nowrap" }),
  btn: (v = "default", disabled = false) => ({
    display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500, border: "1px solid", opacity: disabled ? 0.5 : 1, transition: "opacity 0.15s",
    ...(v === "primary" ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" } : {}),
    ...(v === "blue"    ? { background: "#2563eb", color: "#fff", borderColor: "#2563eb" } : {}),
    ...(v === "green"   ? { background: "#059669", color: "#fff", borderColor: "#059669" } : {}),
    ...(v === "default" ? { background: "#fff", color: "#374151", borderColor: "#d1d5db" } : {}),
    ...(v === "danger"  ? { background: "#fff", color: "#dc2626", borderColor: "#fca5a5" } : {}),
    ...(v === "ghost"   ? { background: "transparent", color: "#6b7280", borderColor: "transparent" } : {}),
  }),
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 },
  input: { width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", background: "transparent", color: "#111", outline: "none", boxSizing: "border-box" },
  textarea: (h = 100) => ({ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", background: "transparent", color: "#111", outline: "none", boxSizing: "border-box", minHeight: h, resize: "vertical", lineHeight: 1.6 }),
  tokenBadge: (used, max) => {
    const pct = used / max;
    return { fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: pct > 0.9 ? "#fef2f2" : pct > 0.7 ? "#fefce8" : "#f0fdf4", color: pct > 0.9 ? "#dc2626" : pct > 0.7 ? "#92400e" : "#065f46" };
  },
  aiBox: { background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "14px 16px", marginBottom: 14 },
  aiOutput: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.8, color: "#111", whiteSpace: "pre-wrap", marginTop: 10, maxHeight: 500, overflowY: "auto" },
  superPromptBox: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: "14px 16px", fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" },
  toast: (v) => ({ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, zIndex: 999, opacity: v ? 1 : 0, transition: "opacity 0.25s", pointerEvents: "none", whiteSpace: "nowrap" }),
  progressBar: (pct, color) => ({ height: 4, borderRadius: 2, background: "#e5e7eb", overflow: "hidden", marginTop: 4 }),
  progressFill: (pct, color) => ({ height: "100%", width: Math.min(pct, 100) + "%", background: color, transition: "width 0.3s", borderRadius: 2 }),
  beatItem: (dragging) => ({ display: "flex", alignItems: "flex-start", gap: 8, background: dragging ? "#f0fdf4" : "#fff", border: "1px solid " + (dragging ? "#86efac" : "#e5e7eb"), borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "grab" }),
  importArea: { border: "2px dashed #d1d5db", borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer", color: "#9ca3af", transition: "border-color 0.15s, background 0.15s" },
};

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState(""); const [vis, setVis] = useState(false);
  const t = useRef();
  const show = useCallback((m, d = 2500) => { setMsg(m); setVis(true); clearTimeout(t.current); t.current = setTimeout(() => setVis(false), d); }, []);
  return { msg, vis, show };
}

// ─── Context Viewer ───────────────────────────────────────────────────────────
function TokenBar({ label, used, max, color }) {
  const pct = Math.round(used / max * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 2 }}>
        <span>{label}</span>
        <span style={S.tokenBadge(used, max)}>{used} / {max} tokens ({pct}%)</span>
      </div>
      <div style={S.progressBar(pct, color)}>
        <div style={S.progressFill(pct, color)} />
      </div>
    </div>
  );
}

// ─── Beat editor ──────────────────────────────────────────────────────────────
function BeatEditor({ beats, onChange }) {
  const [newBeat, setNewBeat] = useState("");
  const add = () => {
    const t = newBeat.trim();
    if (!t) return;
    onChange([...beats, { id: uid(), text: t }]);
    setNewBeat("");
  };
  const update = (id, text) => onChange(beats.map(b => b.id === id ? { ...b, text } : b));
  const remove = (id) => onChange(beats.filter(b => b.id !== id));
  const move = (from, to) => {
    const arr = [...beats];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div>
      {beats.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>
          Chưa có beat nào. Dùng AI Brainstorm ở trên hoặc thêm thủ công.
        </div>
      )}
      {beats.map((b, i) => (
        <div key={b.id} style={S.beatItem(false)}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", minWidth: 22, paddingTop: 2 }}>#{i + 1}</span>
          <textarea
            style={{ ...S.textarea(40), flex: 1, minHeight: 40, fontSize: 13, border: "none", padding: 0, background: "transparent", resize: "none" }}
            value={b.text}
            onChange={e => update(b.id, e.target.value)}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button style={{ ...S.btn("ghost"), padding: "2px 5px", fontSize: 12 }} onClick={() => i > 0 && move(i, i - 1)} disabled={i === 0} title="Lên">▲</button>
            <button style={{ ...S.btn("ghost"), padding: "2px 5px", fontSize: 12 }} onClick={() => i < beats.length - 1 && move(i, i + 1)} disabled={i === beats.length - 1} title="Xuống">▼</button>
            <button style={{ ...S.btn("ghost"), padding: "2px 5px", fontSize: 12, color: "#dc2626" }} onClick={() => remove(b.id)} title="Xóa">×</button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input style={S.input} value={newBeat} placeholder="Thêm beat thủ công rồi nhấn Enter..." onChange={e => setNewBeat(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button style={S.btn()} onClick={add}>＋</button>
      </div>
    </div>
  );
}

// ─── Step 1: Context ──────────────────────────────────────────────────────────
function StepContext({ wbData, budgets, onBudgetsChange, contextPackage, onContextBuild }) {
  const hasData = wbData && (wbData.entities?.length > 0 || wbData.chapter_logs?.length > 0);

  const buildContext = useCallback(() => {
    if (!wbData) return;
    const { entities = [], chapter_logs = [], project = {} } = wbData;

    // History: 3 chương gần nhất
    const sorted = [...chapter_logs].sort((a, b) => b.chapter_number - a.chapter_number).slice(0, 3);
    const historyRaw = sorted.map(c =>
      `[Chương ${c.chapter_number}${c.title ? " — " + c.title : ""}]\n${c.summary}${c.events?.length ? "\nSự kiện: " + c.events.join("; ") : ""}`
    ).join("\n\n");

    // Characters: CHR entities
    const chars = entities.filter(e => e.type === "CHR");
    const charsRaw = chars.map(e =>
      `• ${e.name}${e.aliases?.length ? " (bí danh: " + e.aliases.join(", ") + ")" : ""}: ${e.description || "(chưa có mô tả)"}`
    ).join("\n");

    // World lore: LOC + LGD + ORG + ITM + EVT
    const lore = entities.filter(e => e.type !== "CHR");
    const loreRaw = lore.map(e =>
      `[${e.type}] ${e.name}: ${e.description || "(chưa có mô tả)"}`
    ).join("\n");

    const pkg = {
      history:    truncateToTokens(historyRaw, budgets.history),
      characters: truncateToTokens(charsRaw,   budgets.characters),
      world_lore: truncateToTokens(loreRaw,     budgets.world_lore),
      historyTokens:    estimateTokens(historyRaw),
      charsTokens:      estimateTokens(charsRaw),
      loreTokens:       estimateTokens(loreRaw),
      projectTitle:     project.title || "",
      charCount:        chars.length,
      chapterCount:     chapter_logs.length,
    };
    onContextBuild(pkg);
  }, [wbData, budgets, onContextBuild]);

  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>📦 Nguồn dữ liệu</div>
        {hasData ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
            <strong style={{ color: "#065f46" }}>✓ Đã tải từ WorldBuilder</strong>
            <div style={{ color: "#555", marginTop: 4, fontSize: 12 }}>
              {wbData.entities?.length || 0} entities · {wbData.chapter_logs?.length || 0} chapter logs · Dự án: "{wbData.project?.title || "Chưa đặt tên"}"
            </div>
          </div>
        ) : (
          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
            ⚠️ Chưa có dữ liệu từ WorldBuilder. Hãy mở WorldBuilder, thêm entities + chapter logs, rồi quay lại tab này.
            <div style={{ fontSize: 11, marginTop: 4, color: "#b45309" }}>
              (Nếu đang dùng Artifacts khác nhau, hãy Export JSON từ WorldBuilder rồi Import vào đây.)
            </div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>⚖️ Token Budget</div>
        <TokenBar label="Lịch sử chương (History)"  used={contextPackage?.historyTokens || 0} max={budgets.history}    color="#3b82f6" />
        <TokenBar label="Nhân vật (Characters)"      used={contextPackage?.charsTokens   || 0} max={budgets.characters} color="#10b981" />
        <TokenBar label="Thế giới / Lore"            used={contextPackage?.loreTokens     || 0} max={budgets.world_lore} color="#8b5cf6" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
          {[
            { key: "history",    label: "History",    color: "#3b82f6" },
            { key: "characters", label: "Characters", color: "#10b981" },
            { key: "world_lore", label: "Lore",       color: "#8b5cf6" },
          ].map(item => (
            <div key={item.key}>
              <label style={{ ...S.label, color: item.color }}>{item.label}</label>
              <input type="range" min={100} max={2000} step={50} value={budgets[item.key]}
                style={{ width: "100%" }}
                onChange={e => onBudgetsChange({ ...budgets, [item.key]: parseInt(e.target.value) })}
              />
              <div style={{ fontSize: 11, textAlign: "center", color: "#888" }}>{budgets[item.key]} tokens</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={S.btn("primary")} onClick={buildContext} disabled={!hasData}>
            {contextPackage ? "↺ Rebuild Context" : "▶ Build Context"}
          </button>
          {contextPackage && <span style={{ fontSize: 12, color: "#059669", marginLeft: 10 }}>✓ Context đã sẵn sàng</span>}
        </div>
      </div>

      {contextPackage && (
        <div style={S.card}>
          <div style={S.sectionTitle}>👁 Preview Context</div>
          {[
            { label: "📖 Lịch sử 3 chương gần nhất", text: contextPackage.history, color: "#3b82f6" },
            { label: "👥 Nhân vật",                  text: contextPackage.characters, color: "#10b981" },
            { label: "🌍 Thế giới & Lore",           text: contextPackage.world_lore, color: "#8b5cf6" },
          ].map(({ label, text, color }) => (
            <details key={label} style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 13, fontWeight: 500, cursor: "pointer", color, padding: "4px 0" }}>{label}</summary>
              <pre style={{ ...S.superPromptBox, marginTop: 6, fontSize: 11, maxHeight: 150 }}>{text || "(trống)"}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Brainstorm ───────────────────────────────────────────────────────
function StepBrainstorm({ contextPackage, chapterNum, onChapterNumChange, tone, onToneChange, direction, onDirectionChange, beats, onBeatsChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const brainstorm = async () => {
    if (!contextPackage) { setError("Hãy build context trước (Tab 1)"); return; }
    if (!direction.trim()) { setError("Vui lòng nhập định hướng chương"); return; }
    setError(""); setLoading(true); onBeatsChange([]);

    const systemPrompt = `Bạn là trợ lý sáng tác tiểu thuyết. Nhiệm vụ: tạo dàn ý beats (plot beats) chi tiết cho một chương truyện.
Trả lời bằng tiếng Việt. Mỗi beat là 1 dòng bắt đầu bằng "- ".
Không có preamble, không có tiêu đề, chỉ danh sách beats.`;

    const userPrompt = `Dự án: ${contextPackage.projectTitle || "Tiểu thuyết"}
Chương số: ${chapterNum}
Tone: ${tone}
Định hướng: ${direction}

Nhân vật chính:
${contextPackage.characters || "(chưa có)"}

Lịch sử gần đây:
${contextPackage.history || "(chưa có)"}

Lore/Bối cảnh:
${contextPackage.world_lore || "(chưa có)"}

Tạo 8-12 beats chi tiết cho chương này. Mỗi beat mô tả 1 cảnh/sự kiện cụ thể, đủ để viết thành văn.`;

    try {
      let rawText = "";
      await callClaude(systemPrompt, userPrompt, (text) => { rawText = text; }, 1000);
      const parsed = rawText
        .split("\n")
        .map(l => l.replace(/^[-•*]\s*/, "").trim())
        .filter(l => l.length > 10)
        .map(text => ({ id: uid(), text }));
      onBeatsChange(parsed);
    } catch (err) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>⚙️ Tham số chương</div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Số chương</label>
            <input style={S.input} type="number" min={1} value={chapterNum} onChange={e => onChapterNumChange(parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label style={S.label}>Tone / Cảm xúc</label>
            <select style={S.input} value={tone} onChange={e => onToneChange(e.target.value)}>
              {CHAPTER_TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={S.label}>Định hướng chương <span style={{ color: "#dc2626" }}>*</span></label>
          <textarea style={S.textarea(70)} value={direction} placeholder="Ví dụ: Nhân vật chính phát hiện bí mật về người thầy, dẫn đến xung đột nội tâm và quyết định rời bỏ môn phái..." onChange={e => onDirectionChange(e.target.value)} />
        </div>
      </div>

      <div style={S.aiBox}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#6d28d9" }}>✦ AI Brainstorm Beats</div>
          <button style={S.btn("primary", loading || !contextPackage)} onClick={brainstorm} disabled={loading || !contextPackage}>
            {loading ? "⏳ Đang brainstorm..." : "✦ Tạo Beats với Claude"}
          </button>
        </div>
        {!contextPackage && <div style={{ fontSize: 12, color: "#b45309" }}>⚠️ Hãy build context ở Tab 1 trước.</div>}
        {error && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{error}</div>}
        {loading && <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 6 }}>Claude đang suy nghĩ... beats sẽ hiện sau khi hoàn tất.</div>}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={S.sectionTitle}>📋 Beats Editor <span style={{ fontSize: 12, fontWeight: 400, color: "#888", marginLeft: 4 }}>({beats.length} beats)</span></div>
          {beats.length > 0 && (
            <button style={{ ...S.btn("ghost"), fontSize: 12, color: "#dc2626" }} onClick={() => { if (confirm("Xóa tất cả beats?")) onBeatsChange([]); }}>🗑 Xóa tất cả</button>
          )}
        </div>
        <BeatEditor beats={beats} onChange={onBeatsChange} />
      </div>
    </div>
  );
}

// ─── Step 3: SuperPrompt ──────────────────────────────────────────────────────
function StepSuperPrompt({ contextPackage, chapterNum, tone, direction, beats, pov, onPovChange, wordCount, onWordCountChange, templateKey, onTemplateKeyChange, superPrompt, onSuperPromptChange }) {

  const assemble = useCallback(() => {
    if (!contextPackage || beats.length === 0) return;
    const beatsText = beats.map((b, i) => `${i + 1}. ${b.text}`).join("\n");
    let tpl = TEMPLATES[templateKey] || TEMPLATES.default;
    const prompt = tpl
      .replace(/{world_lore}/g,      contextPackage.world_lore  || "(chưa có thông tin thế giới)")
      .replace(/{characters}/g,      contextPackage.characters  || "(chưa có nhân vật)")
      .replace(/{history}/g,         contextPackage.history     || "(đây là chương đầu tiên)")
      .replace(/{chapter_number}/g,  String(chapterNum))
      .replace(/{tone}/g,            tone)
      .replace(/{direction}/g,       direction)
      .replace(/{beats}/g,           beatsText)
      .replace(/{word_count}/g,      String(wordCount))
      .replace(/{pov}/g,             pov);
    onSuperPromptChange(prompt);
  }, [contextPackage, chapterNum, tone, direction, beats, pov, wordCount, templateKey, onSuperPromptChange]);

  const copyToClipboard = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = superPrompt; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
  };

  const totalTokens = estimateTokens(superPrompt);

  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>⚙️ Tham số output</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Góc nhìn (POV)</label>
            <select style={S.input} value={pov} onChange={e => onPovChange(e.target.value)}>
              {["Ngôi thứ ba hạn chế", "Ngôi thứ ba toàn tri", "Ngôi thứ nhất", "Ngôi thứ hai (thử nghiệm)"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Số từ mục tiêu</label>
            <select style={S.input} value={wordCount} onChange={e => onWordCountChange(parseInt(e.target.value))}>
              {[800, 1200, 1500, 2000, 2500, 3000].map(w => <option key={w} value={w}>{w.toLocaleString()} từ</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Template</label>
            <select style={S.input} value={templateKey} onChange={e => onTemplateKeyChange(e.target.value)}>
              <option value="default">Đầy đủ (mặc định)</option>
              <option value="minimalist">Tối giản</option>
            </select>
          </div>
        </div>
        <button style={S.btn("primary")} onClick={assemble} disabled={!contextPackage || beats.length === 0}>
          ⚡ Assemble SuperPrompt
        </button>
        {(!contextPackage || beats.length === 0) && (
          <span style={{ fontSize: 12, color: "#b45309", marginLeft: 10 }}>
            {!contextPackage ? "Cần build context (Tab 1)" : "Cần có beats (Tab 2)"}
          </span>
        )}
      </div>

      {superPrompt && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ ...S.sectionTitle, marginBottom: 0 }}>
              📄 SuperPrompt
              <span style={{ fontSize: 11, fontWeight: 400, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 8px", color: "#555" }}>~{totalTokens} tokens</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn()} onClick={copyToClipboard}>📋 Copy</button>
            </div>
          </div>
          <div style={S.superPromptBox}>{superPrompt}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
            Copy prompt này để paste vào ChatGPT, Claude.ai, hoặc bất kỳ AI nào. Hoặc dùng Tab 4 để Claude viết trực tiếp.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Write ────────────────────────────────────────────────────────────
function StepWrite({ superPrompt, chapterNum }) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const outputRef = useRef();
  const toast = useToast();

  const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

  const write = async () => {
    if (!superPrompt) { setError("Cần assembly SuperPrompt ở Tab 3 trước."); return; }
    setError(""); setLoading(true); setOutput(""); setWordCount(0);

    const system = `Bạn là tác giả tiểu thuyết chuyên nghiệp. Viết văn xuôi tiếng Việt đẹp, giàu cảm xúc, sinh động.
Chỉ trả về nội dung chương, không có lời giải thích hay comment nào khác.`;

    try {
      await callClaude(system, superPrompt, (text) => {
        setOutput(text);
        setWordCount(countWords(text));
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }, 1000);
    } catch (err) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = output; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
      toast.show("Đã copy nội dung chương ✓");
    } catch {}
  };

  const exportTxt = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chuong_${chapterNum}_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.show("Đã export .txt ✓");
  };

  return (
    <div>
      <div style={S.aiBox}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#6d28d9" }}>✦ AI Viết Chương {chapterNum}</div>
          <button style={S.btn("primary", loading || !superPrompt)} onClick={write} disabled={loading || !superPrompt}>
            {loading ? "✍️ Đang viết..." : "✦ Viết với Claude"}
          </button>
        </div>
        {!superPrompt && <div style={{ fontSize: 12, color: "#b45309" }}>⚠️ Hãy assembly SuperPrompt ở Tab 3 trước.</div>}
        {error && <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
        {loading && (
          <div style={{ fontSize: 12, color: "#7c3aed", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: "none" }}>●</span>
            Claude đang viết... ({wordCount} từ)
          </div>
        )}
      </div>

      {output && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ ...S.sectionTitle, marginBottom: 0 }}>
              📖 Chương {chapterNum}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#666", marginLeft: 4 }}>{wordCount.toLocaleString()} từ</span>
              {loading && <span style={{ fontSize: 11, color: "#7c3aed", marginLeft: 4 }}>(đang viết...)</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.btn()} onClick={copyOutput}>📋 Copy</button>
              <button style={S.btn()} onClick={exportTxt}>⬇ .txt</button>
            </div>
          </div>
          <div ref={outputRef} style={{ ...S.aiOutput, maxHeight: 600, fontSize: 14, lineHeight: 1.9 }}>{output}</div>
        </div>
      )}

      <div style={S.toast(toast.vis)}>{toast.msg}</div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("context");
  const [wbData, setWbData] = useState(null);
  const [budgets, setBudgets] = useState({ history: 600, characters: 800, world_lore: 1000 });
  const [contextPackage, setContextPackage] = useState(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [tone, setTone] = useState("Hành động căng thẳng");
  const [direction, setDirection] = useState("");
  const [beats, setBeats] = useState([]);
  const [pov, setPov] = useState("Ngôi thứ ba hạn chế");
  const [wordCount, setWordCount] = useState(1500);
  const [templateKey, setTemplateKey] = useState("default");
  const [superPrompt, setSuperPrompt] = useState("");
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();
  const fileRef = useRef();

  // Load WorldBuilder data + saved state
  useEffect(() => {
    Promise.all([storageGet(WB_STORAGE_KEY), storageGet(STORAGE_KEY)]).then(([wb, saved]) => {
      if (wb) setWbData(wb);
      if (saved) {
        if (saved.budgets)      setBudgets(saved.budgets);
        if (saved.chapterNum)   setChapterNum(saved.chapterNum);
        if (saved.tone)         setTone(saved.tone);
        if (saved.direction)    setDirection(saved.direction);
        if (saved.beats)        setBeats(saved.beats);
        if (saved.pov)          setPov(saved.pov);
        if (saved.wordCount)    setWordCount(saved.wordCount);
        if (saved.templateKey)  setTemplateKey(saved.templateKey);
        if (saved.superPrompt)  setSuperPrompt(saved.superPrompt);
      }
      setLoaded(true);
    });
  }, []);

  // Auto-save session state
  useEffect(() => {
    if (!loaded) return;
    storageSet(STORAGE_KEY, { budgets, chapterNum, tone, direction, beats, pov, wordCount, templateKey, superPrompt });
  }, [loaded, budgets, chapterNum, tone, direction, beats, pov, wordCount, templateKey, superPrompt]);

  // Import WorldBuilder JSON
  const importWB = () => fileRef.current?.click();
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        setWbData(d);
        setContextPackage(null);
        if (d.settings?.token_budgets) setBudgets(d.settings.token_budgets);
        toast.show(`Import OK: ${d.entities?.length || 0} entities, ${d.chapter_logs?.length || 0} chương`);
      } catch { toast.show("Lỗi đọc file JSON"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const TABS = [
    { id: "context",     label: "1 · Context",     desc: "Build context từ WorldBuilder" },
    { id: "brainstorm",  label: "2 · Brainstorm",   desc: "AI tạo beats, chỉnh sửa dàn ý" },
    { id: "superprompt", label: "3 · SuperPrompt",  desc: "Assembly & copy prompt" },
    { id: "write",       label: "4 · Viết",         desc: "Claude viết chương trực tiếp" },
  ];

  if (!loaded) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải...</div>;

  return (
    <div style={S.app}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={S.logoMark}>S</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>SuperPromptBuilder</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {wbData ? `"${wbData.project?.title || "Chưa đặt tên"}" · Chương ${chapterNum}` : "Module 3 · Selorson Co-Writer"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {wbData && <span style={{ fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 8px", color: "#065f46" }}>✓ WorldBuilder linked</span>}
          <button style={{ ...S.btn(), fontSize: 12, padding: "5px 10px" }} onClick={importWB}>⬆ Import WorldBuilder JSON</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ ...S.tabBar, width: "100%" }}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...S.tab(tab === t.id), flex: 1, justifyContent: "center" }} onClick={() => setTab(t.id)} title={t.desc}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "context" && (
        <StepContext
          wbData={wbData} budgets={budgets} onBudgetsChange={setBudgets}
          contextPackage={contextPackage} onContextBuild={setContextPackage}
        />
      )}
      {tab === "brainstorm" && (
        <StepBrainstorm
          contextPackage={contextPackage}
          chapterNum={chapterNum} onChapterNumChange={setChapterNum}
          tone={tone} onToneChange={setTone}
          direction={direction} onDirectionChange={setDirection}
          beats={beats} onBeatsChange={setBeats}
        />
      )}
      {tab === "superprompt" && (
        <StepSuperPrompt
          contextPackage={contextPackage}
          chapterNum={chapterNum} tone={tone} direction={direction} beats={beats}
          pov={pov} onPovChange={setPov}
          wordCount={wordCount} onWordCountChange={setWordCount}
          templateKey={templateKey} onTemplateKeyChange={setTemplateKey}
          superPrompt={superPrompt} onSuperPromptChange={setSuperPrompt}
        />
      )}
      {tab === "write" && (
        <StepWrite superPrompt={superPrompt} chapterNum={chapterNum} />
      )}

      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
      <div style={S.toast(toast.vis)}>{toast.msg}</div>
    </div>
  );
}

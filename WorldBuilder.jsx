import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "worldbuilder_v1";
const ENTITY_TYPES = [
  { id: "CHR", label: "Nhân vật",      color: "#2563eb", bg: "#eff6ff" },
  { id: "LOC", label: "Địa danh",      color: "#059669", bg: "#ecfdf5" },
  { id: "LGD", label: "Truyền thuyết", color: "#7c3aed", bg: "#f5f3ff" },
  { id: "ITM", label: "Vật phẩm",      color: "#c2410c", bg: "#fff7ed" },
  { id: "EVT", label: "Sự kiện",       color: "#b45309", bg: "#fefce8" },
  { id: "ORG", label: "Tổ chức",       color: "#166534", bg: "#f0fdf4" },
];

const DEFAULT_PROJECT = { title: "Dự án mới", description: "" };
const DEFAULT_BUDGETS = { history: 600, characters: 800, world_lore: 1000 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const now = () => new Date().toISOString();
const typeInfo = (id) => ENTITY_TYPES.find((t) => t.id === id) || ENTITY_TYPES[0];

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: "20px 16px" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #e5e7eb" },
  logoMark: { width: 30, height: 30, background: "#0f172a", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600, marginRight: 10 },
  logoTitle: { fontSize: 15, fontWeight: 600, color: "#111", margin: 0 },
  logoSub: { fontSize: 11, color: "#888", margin: 0 },
  tabBar: { display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" },
  tab: (active) => ({ padding: "6px 14px", borderRadius: 7, fontSize: 13, cursor: "pointer", border: "none", background: active ? "#fff" : "transparent", color: active ? "#111" : "#666", fontWeight: active ? 500 : 400, boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }),
  btn: (variant = "default") => ({
    display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 500, border: "1px solid",
    ...(variant === "primary"  ? { background: "#2563eb", color: "#fff", borderColor: "#2563eb" } : {}),
    ...(variant === "default"  ? { background: "#fff", color: "#374151", borderColor: "#d1d5db" } : {}),
    ...(variant === "danger"   ? { background: "#fff", color: "#dc2626", borderColor: "#fca5a5" } : {}),
    ...(variant === "ghost"    ? { background: "transparent", color: "#6b7280", borderColor: "transparent" } : {}),
    transition: "opacity 0.15s",
  }),
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" },
  inputBase: { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", background: "transparent", color: "#111", outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4 },
  badge: (color, bg) => ({ fontSize: 11, padding: "2px 7px", borderRadius: 6, fontWeight: 600, color, background: bg }),
  statCard: { background: "#f9fafb", borderRadius: 8, padding: "10px 14px", flex: 1 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  emptyState: { textAlign: "center", padding: "40px 0", color: "#9ca3af" },
  tag: { fontSize: 11, padding: "2px 8px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, color: "#555" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modalBox: { background: "#fff", borderRadius: 12, padding: "20px 22px", width: "min(500px, 90vw)", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  toast: (visible) => ({ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, zIndex: 999, opacity: visible ? 1 : 0, transition: "opacity 0.25s", pointerEvents: "none" }),
  aiSection: { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px" },
  aiOutput: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.7, color: "#111", minHeight: 80, whiteSpace: "pre-wrap", marginTop: 10 },
};

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [vis, setVis] = useState(false);
  const timer = useRef();
  const show = useCallback((m, dur = 2400) => {
    setMsg(m); setVis(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVis(false), dur);
  }, []);
  return { msg, vis, show };
}

// ─── Claude API call ──────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        const delta = j?.delta?.text || "";
        if (delta) { full += delta; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ─── Alias chip input ─────────────────────────────────────────────────────────
function AliasInput({ aliases, onChange }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !aliases.includes(t)) onChange([...aliases, t]);
    setVal("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={S.inputBase} value={val} placeholder="Nhập bí danh, nhấn Enter" onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button style={S.btn()} onClick={add}>+</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
        {aliases.map((a, i) => (
          <span key={i} style={{ ...S.tag, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {a}
            <span style={{ cursor: "pointer", color: "#dc2626", fontWeight: 700 }} onClick={() => onChange(aliases.filter((_, j) => j !== i))}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── List input (events / plot seeds) ────────────────────────────────────────
function ListInput({ items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t) onChange([...items, t]);
    setVal("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={S.inputBase} value={val} placeholder={placeholder} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button style={S.btn()} onClick={add}>+</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}>
            <span style={{ opacity: 0.4 }}>▸</span>
            <span style={{ flex: 1 }}>{item}</span>
            <span style={{ cursor: "pointer", color: "#dc2626" }} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Entity Modal ─────────────────────────────────────────────────────────────
function EntityModal({ entity, onSave, onClose }) {
  const isNew = !entity.id;
  const [form, setForm] = useState({ type: "CHR", name: "", aliases: [], description: "", ...entity });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) { alert("Vui lòng nhập tên"); return; }
    const saved = { ...form, name: form.name.trim(), description: form.description.trim(), updated_at: now() };
    if (!saved.id) { saved.id = saved.type + "_" + uid().toUpperCase(); saved.created_at = now(); }
    onSave(saved);
  };

  return (
    <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modalBox}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isNew ? "Thêm entity mới" : "Chỉnh sửa entity"}</div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Loại</label>
          <select style={S.inputBase} value={form.type} onChange={e => set("type", e.target.value)}>
            {ENTITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.id} — {t.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Tên <span style={{ color: "#dc2626" }}>*</span></label>
          <input style={S.inputBase} value={form.name} placeholder="Tên chính thức" autoFocus onChange={e => set("name", e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Bí danh / Alias</label>
          <AliasInput aliases={form.aliases} onChange={v => set("aliases", v)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Mô tả</label>
          <textarea style={{ ...S.inputBase, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} value={form.description} placeholder="Mô tả chi tiết..." onChange={e => set("description", e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
          <button style={S.btn()} onClick={onClose}>Hủy</button>
          <button style={S.btn("primary")} onClick={save}>✓ Lưu</button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Modal ────────────────────────────────────────────────────────────
function ChapterModal({ chapter, onSave, onClose }) {
  const isNew = !chapter.id;
  const [form, setForm] = useState({ chapter_number: 1, title: "", summary: "", events: [], plot_seeds: [], ...chapter });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.summary.trim()) { alert("Vui lòng nhập tóm tắt"); return; }
    const saved = { ...form, title: form.title || ("Chương " + form.chapter_number), updated_at: now() };
    if (!saved.id) { saved.id = "LOG_" + uid().toUpperCase(); saved.created_at = now(); }
    onSave(saved);
  };

  return (
    <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modalBox}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isNew ? "Thêm nhật ký chương" : "Chỉnh sửa nhật ký"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Số chương</label>
            <input style={S.inputBase} type="number" min={1} value={form.chapter_number} onChange={e => set("chapter_number", parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label style={S.label}>Tiêu đề</label>
            <input style={S.inputBase} value={form.title} placeholder="Tiêu đề chương" autoFocus onChange={e => set("title", e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Tóm tắt <span style={{ color: "#dc2626" }}>*</span></label>
          <textarea style={{ ...S.inputBase, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} value={form.summary} placeholder="Tóm tắt nội dung chương..." onChange={e => set("summary", e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Sự kiện chính</label>
          <ListInput items={form.events} onChange={v => set("events", v)} placeholder="Thêm sự kiện, nhấn Enter" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Phục bút / Plot seeds</label>
          <ListInput items={form.plot_seeds} onChange={v => set("plot_seeds", v)} placeholder="Thêm phục bút, nhấn Enter" />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
          <button style={S.btn()} onClick={onClose}>Hủy</button>
          <button style={S.btn("primary")} onClick={save}>✓ Lưu</button>
        </div>
      </div>
    </div>
  );
}

// ─── Entities Tab ─────────────────────────────────────────────────────────────
function EntitiesTab({ entities, onSave, onDelete }) {
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState(null); // null | entity object

  const counts = Object.fromEntries(ENTITY_TYPES.map(t => [t.id, entities.filter(e => e.type === t.id).length]));
  const filtered = filter === "ALL" ? entities : entities.filter(e => e.type === filter);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#888" }}>Tổng</div><div style={{ fontSize: 22, fontWeight: 600 }}>{entities.length}</div></div>
        {ENTITY_TYPES.slice(0, 5).map(t => (
          <div key={t.id} style={S.statCard}>
            <div style={{ fontSize: 11, color: "#888" }}>{t.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: t.color }}>{counts[t.id] || 0}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={S.sectionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Entities</span>
          <span style={{ fontSize: 11, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 10, padding: "2px 8px", color: "#666" }}>{filtered.length}</span>
        </div>
        <button style={S.btn("primary")} onClick={() => setModal({})}>＋ Thêm mới</button>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[{ id: "ALL", label: `Tất cả (${entities.length})` }, ...ENTITY_TYPES.map(t => ({ id: t.id, label: `${t.label} (${counts[t.id] || 0})` }))].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...S.btn(filter === f.id ? "default" : "ghost"), background: filter === f.id ? "#f3f4f6" : "transparent", fontWeight: filter === f.id ? 600 : 400, fontSize: 12, padding: "4px 10px" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📚</div>
          <div style={{ fontSize: 14 }}>Chưa có entity nào{filter !== "ALL" ? " thuộc loại này" : ""}.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Bấm "+ Thêm mới" để bắt đầu xây dựng thế giới.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {filtered.map(e => {
            const info = typeInfo(e.type);
            return (
              <div key={e.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{e.name}</div>
                  <span style={S.badge(info.color, info.bg)}>{e.type}</span>
                </div>
                {e.description && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6 }}>{e.description}</div>}
                {e.aliases?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                    {e.aliases.map((a, i) => <span key={i} style={{ ...S.tag, fontSize: 10 }}>{a}</span>)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", marginTop: 8 }}>
                  <button style={{ ...S.btn(), padding: "4px 8px", fontSize: 12 }} onClick={() => setModal(e)}>✏️</button>
                  <button style={{ ...S.btn("danger"), padding: "4px 8px", fontSize: 12 }} onClick={() => onDelete(e.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <EntityModal
          entity={modal}
          onSave={(saved) => { onSave(saved); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Chapters Tab ─────────────────────────────────────────────────────────────
function ChaptersTab({ chapters, entities, onSave, onDelete }) {
  const [modal, setModal] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOut, setAiOut] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);

  const analyzeWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiOut("");
    try {
      const charList = entities.filter(e => e.type === "CHR").map(e => `- ${e.name}: ${e.description || "(chưa có mô tả)"}`).join("\n");
      const system = `Bạn là trợ lý phân tích chương truyện. Trả lời bằng tiếng Việt, súc tích và chính xác.
Nhân vật đã biết:\n${charList || "(chưa có nhân vật nào)"}`;
      const user = `Phân tích đoạn văn/tóm tắt sau và trả về:
1. **Tóm tắt** (2-3 câu)
2. **Sự kiện chính** (3-5 bullet)
3. **Phục bút / Plot seeds** (nếu có)
4. **Nhân vật xuất hiện**

---
${aiPrompt}`;
      await callClaude(system, user, (text) => setAiOut(text));
    } catch (err) {
      setAiOut("Lỗi: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* AI Analyzer */}
      <div style={{ ...S.aiSection, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#0369a1" }}>🤖 AI Phân tích chương (thử nghiệm)</div>
        <textarea
          style={{ ...S.inputBase, minHeight: 80, resize: "vertical", lineHeight: 1.5, fontSize: 12 }}
          placeholder="Paste nội dung hoặc tóm tắt chương vào đây để AI phân tích..."
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={S.btn("primary")} onClick={analyzeWithAI} disabled={aiLoading}>
            {aiLoading ? "⏳ Đang phân tích..." : "✦ Phân tích với Claude"}
          </button>
          {aiOut && <button style={S.btn()} onClick={() => setAiOut("")}>Xóa</button>}
        </div>
        {aiOut && <div style={S.aiOutput}>{aiOut}</div>}
      </div>

      {/* Header */}
      <div style={S.sectionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Biên niên sử</span>
          <span style={{ fontSize: 11, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 10, padding: "2px 8px", color: "#666" }}>{chapters.length} chương</span>
        </div>
        <button style={S.btn("primary")} onClick={() => setModal({ chapter_number: chapters.length + 1 })}>＋ Thêm nhật ký</button>
      </div>

      {sorted.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📜</div>
          <div style={{ fontSize: 14 }}>Chưa có nhật ký chương nào.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Ghi lại tóm tắt sau mỗi chương viết xong.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(c => (
            <div key={c.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>Chương {c.chapter_number}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={{ ...S.btn(), padding: "3px 8px", fontSize: 12 }} onClick={() => setModal(c)}>✏️</button>
                  <button style={{ ...S.btn("danger"), padding: "3px 8px", fontSize: 12 }} onClick={() => onDelete(c.id)}>🗑</button>
                </div>
              </div>
              {c.title && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>}
              {c.summary && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 8 }}>{c.summary}</div>}
              {c.events?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                  {c.events.map((ev, i) => <span key={i} style={{ ...S.tag, fontSize: 11 }}>▸ {ev}</span>)}
                </div>
              )}
              {c.plot_seeds?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {c.plot_seeds.map((p, i) => <span key={i} style={{ ...S.tag, fontSize: 11, borderStyle: "dashed", color: "#7c3aed" }}>🌱 {p}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ChapterModal
          chapter={modal}
          onSave={(saved) => { onSave(saved); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Project Tab ──────────────────────────────────────────────────────────────
function ProjectTab({ project, settings, onProjectChange, onSettingsChange, onExport, onImport, onClearAll }) {
  const b = settings.token_budgets;
  const total = b.history + b.characters + b.world_lore;
  const pct = (v) => Math.round(v / total * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Project info */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📖 Thông tin dự án</div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Tên truyện</label>
          <input style={S.inputBase} value={project.title} onChange={e => onProjectChange({ ...project, title: e.target.value })} placeholder="Tên truyện" />
        </div>
        <div>
          <label style={S.label}>Mô tả / Tagline</label>
          <textarea style={{ ...S.inputBase, minHeight: 70, resize: "vertical", lineHeight: 1.5 }} value={project.description} placeholder="Mô tả ngắn về câu chuyện..." onChange={e => onProjectChange({ ...project, description: e.target.value })} />
        </div>
      </div>

      {/* Token budgets */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>⚖️ Token Budget (cho SuperPrompt)</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Tổng: <strong>{total}</strong> tokens. Dùng khi assembly context ở Module 3.</div>
        {[
          { key: "history", label: "Lịch sử chương", color: "#3b82f6" },
          { key: "characters", label: "Nhân vật", color: "#10b981" },
          { key: "world_lore", label: "Thế giới / Lore", color: "#8b5cf6" },
        ].map(item => (
          <div key={item.key} style={{ marginBottom: 12 }}>
            <label style={{ ...S.label, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: item.color }}>{item.label}</span>
              <strong>{b[item.key]} tokens ({pct(b[item.key])}%)</strong>
            </label>
            <input type="range" min={100} max={2000} step={50} value={b[item.key]}
              style={{ width: "100%" }}
              onChange={e => onSettingsChange({ ...settings, token_budgets: { ...b, [item.key]: parseInt(e.target.value) } })}
            />
          </div>
        ))}
        <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex" }}>
          <div style={{ background: "#3b82f6", width: pct(b.history) + "%" }} />
          <div style={{ background: "#10b981", width: pct(b.characters) + "%" }} />
          <div style={{ background: "#8b5cf6", width: pct(b.world_lore) + "%" }} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 11, color: "#888" }}>
          {[["#3b82f6", "History"], ["#10b981", "Characters"], ["#8b5cf6", "World lore"]].map(([c, l]) => (
            <span key={l}><span style={{ display: "inline-block", width: 8, height: 8, background: c, borderRadius: 2, marginRight: 4 }} />{l}</span>
          ))}
        </div>
      </div>

      {/* Data management */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>💾 Data Management</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={S.btn("primary")} onClick={onExport}>⬇ Export JSON</button>
          <button style={S.btn()} onClick={onImport}>⬆ Import JSON</button>
          <button style={S.btn("danger")} onClick={onClearAll}>🗑 Xóa tất cả</button>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10, lineHeight: 1.6 }}>
          Dữ liệu lưu trong <code>window.storage</code> của Claude Artifacts. Export thường xuyên để không mất dữ liệu giữa các session.<br />
          JSON tương thích với Selorson Co-Writer schema (<code>entities</code>, <code>chapter_logs</code>, <code>settings</code>).
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("entities");
  const [entities, setEntities] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [settings, setSettings] = useState({ token_budgets: { ...DEFAULT_BUDGETS } });
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();
  const fileRef = useRef();

  // Load from storage on mount
  useEffect(() => {
    storageGet(STORAGE_KEY).then(data => {
      if (data) {
        if (data.entities) setEntities(data.entities);
        if (data.chapters) setChapters(data.chapters);
        if (data.project) setProject(data.project);
        if (data.settings) setSettings(data.settings);
      }
      setLoaded(true);
    });
  }, []);

  // Auto-save whenever data changes
  useEffect(() => {
    if (!loaded) return;
    storageSet(STORAGE_KEY, { entities, chapters, project, settings });
  }, [entities, chapters, project, settings, loaded]);

  const saveEntity = useCallback((saved) => {
    setEntities(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      return idx >= 0 ? prev.map((e, i) => i === idx ? saved : e) : [...prev, saved];
    });
    toast.show("Đã lưu: " + saved.name);
  }, [toast]);

  const deleteEntity = useCallback((id) => {
    if (!confirm("Xóa entity này?")) return;
    setEntities(prev => prev.filter(e => e.id !== id));
    toast.show("Đã xóa");
  }, [toast]);

  const saveChapter = useCallback((saved) => {
    setChapters(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      return idx >= 0 ? prev.map((c, i) => i === idx ? saved : c) : [...prev, saved];
    });
    toast.show("Đã lưu chương " + saved.chapter_number);
  }, [toast]);

  const deleteChapter = useCallback((id) => {
    if (!confirm("Xóa log này?")) return;
    setChapters(prev => prev.filter(c => c.id !== id));
    toast.show("Đã xóa");
  }, [toast]);

  const exportData = useCallback(() => {
    const data = {
      version: "1.0",
      exported_at: now(),
      project,
      entities,
      chapter_logs: chapters,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (project.title || "worldbuilder").replace(/\s+/g, "_") + "_" + Date.now() + ".json";
    a.click();
    URL.revokeObjectURL(url);
    toast.show("Đã export JSON ✓");
  }, [project, entities, chapters, settings, toast]);

  const importData = () => fileRef.current?.click();

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.entities) setEntities(d.entities);
        if (d.chapter_logs) setChapters(d.chapter_logs);
        if (d.project) setProject(d.project);
        if (d.settings) setSettings(d.settings);
        toast.show(`Import thành công: ${d.entities?.length || 0} entities, ${d.chapter_logs?.length || 0} chương`);
      } catch {
        toast.show("Lỗi đọc file JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearAll = () => {
    if (!confirm("Xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác.")) return;
    setEntities([]); setChapters([]);
    setProject(DEFAULT_PROJECT); setSettings({ token_budgets: { ...DEFAULT_BUDGETS } });
    toast.show("Đã xóa tất cả dữ liệu");
  };

  const TABS = [
    { id: "entities", label: "🗂 Entities" },
    { id: "chapters", label: "📜 Biên niên sử" },
    { id: "project",  label: "⚙️ Dự án" },
  ];

  if (!loaded) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải...</div>;

  return (
    <div style={S.app}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={S.logoMark}>W</div>
          <div>
            <div style={S.logoTitle}>WorldBuilder</div>
            <div style={S.logoSub}>Story Context Manager · Module 1</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn(), fontSize: 12, padding: "5px 10px" }} onClick={importData}>⬆ Import</button>
          <button style={{ ...S.btn("primary"), fontSize: 12, padding: "5px 10px" }} onClick={exportData}>⬇ Export</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "entities" && <EntitiesTab entities={entities} onSave={saveEntity} onDelete={deleteEntity} />}
      {tab === "chapters" && <ChaptersTab chapters={chapters} entities={entities} onSave={saveChapter} onDelete={deleteChapter} />}
      {tab === "project"  && <ProjectTab project={project} settings={settings} onProjectChange={p => setProject(p)} onSettingsChange={s => setSettings(s)} onExport={exportData} onImport={importData} onClearAll={clearAll} />}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileImport} />

      {/* Toast */}
      <div style={S.toast(toast.vis)}>{toast.msg}</div>
    </div>
  );
}

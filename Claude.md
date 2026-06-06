# Claude.md — Tài liệu chuẩn gọi Anthropic API trong Claude Artifacts

> **Mục đích:** Đây là nguồn tham chiếu DUY NHẤT, ĐÁNG TIN cho mọi tool trong repo
> (`Tools-Claude`) về cách gọi Anthropic API từ bên trong Claude Artifacts.
> Mọi session sau PHẢI đọc file này trước khi viết/sửa code gọi API.
> Nếu thông tin ở đây mâu thuẫn với trí nhớ — **tin file này**, vì trí nhớ model có thể cũ.
>
> **Nguồn chính thức** (tra khi nghi ngờ, theo thứ tự ưu tiên):
> 1. https://platform.claude.com/docs/en/about-claude/models/overview — danh sách model + max output
> 2. https://platform.claude.com/docs/en/build-with-claude/extended-thinking — thinking
> 3. https://github.com/anthropics/skills (thư mục `skills/claude-api/shared/`) — model catalog
> 4. https://github.com/anthropics/claude-code — tài liệu chính thức của Anthropic
>
> Cập nhật lần cuối: 2026-06-06.

---

## 1. Nguyên tắc nền tảng

Mọi tool chạy trong **iframe sandbox** của Claude Artifacts. Điều này quyết định mọi thứ:

- Chỉ gọi được `fetch("https://api.anthropic.com/v1/messages")` — **không cần API key**, Claude tự inject auth.
- **KHÔNG** fetch được domain khác (CORS/CSP của sandbox chặn). Nghĩa là code trong Artifact
  không tự tra GitHub/docs được. Muốn "tra cứu" phải nhờ chính API messages kèm `web_search` tool
  (xem mục 6).
- **KHÔNG** có filesystem, **KHÔNG** có backend/database. Lưu trữ chỉ qua:
  - `window.storage.set/get/delete/list` (API nội bộ, bất đồng bộ — `await`).
  - Import/Export JSON qua `FileReader` + `Blob`.
- Clipboard: `navigator.clipboard` thường bị chặn → fallback `document.execCommand("copy")`.
- `max_tokens` là **hard cap** output → tool dài cần checkpoint/resume.

---

## 2. Model ID hợp lệ (CHỈ dùng đúng các chuỗi này)

> **Không bao giờ tự bịa hoặc ghép chuỗi model ID.** ID sai → API lỗi 404.

| Tên       | Model ID (alias dùng được)        | Context | Max output | Ghi chú |
| --------- | --------------------------------- | ------- | ---------- | ------- |
| Haiku 4.5 | `claude-haiku-4-5`                | 200K    | 64K        | Nhanh, rẻ. Full ID `claude-haiku-4-5-20251001` |
| Sonnet 4.6| `claude-sonnet-4-6`               | 200K (1M beta) | 64K | Cân bằng — khuyên dùng |
| Opus 4.6  | `claude-opus-4-6`                 | 200K (1M beta) | 128K | Opus đời trước |
| Opus 4.7  | `claude-opus-4-7`                 | 1M      | 128K       | Adaptive thinking only |
| Opus 4.8  | `claude-opus-4-8`                 | 1M      | 128K       | **Mạnh nhất hiện tại**, effort mặc định `high` |

Mặc định an toàn cho tool: `claude-sonnet-4-6`.

---

## 3. Cấu trúc request chuẩn

```javascript
const body = {
  model: "claude-sonnet-4-6",      // mục 2
  max_tokens: 16000,               // hard cap output; set rộng tay
  stream: true,                    // tool nên stream
  system: "...",                   // system prompt
  messages: [{ role: "user", content: "..." }],
  output_config: { effort: "high" }, // mục 4 — Effort
};
// Thinking (mục 5) — chỉ thêm khi bật:
if (thinkingOn) body.thinking = { type: "adaptive" };

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "anthropic-beta": "effort-2025-11-24", // cần cho output_config.effort
  },
  body: JSON.stringify(body),
});
```

**KHÔNG** truyền `api-key` / `x-api-key` / `authorization` — sandbox tự lo. Truyền vào có thể hỏng.

---

## 4. Effort — QUAN TRỌNG, dễ hiểu sai

**Effort là field API thật**, KHÔNG phải khái niệm chỉ-có-ở-app. Gửi qua:

```javascript
output_config: { effort: "low" | "medium" | "high" | "max" }
```

Sự thật cần nhớ:
- Effort gắn với **model**, độc lập — **dùng được kể cả khi KHÔNG bật thinking**.
- Effort điều khiển *toàn bộ* token spend: text trả lời, tool calls, và cả thinking (nếu bật).
- `effort: "high"` = hành vi mặc định (bỏ qua field cũng tương đương). Opus 4.8 mặc định `high`.
- `low` cho việc đơn giản/khối lượng lớn (phân loại, trích xuất); `medium` cho production cân bằng;
  `high`/`max` cho việc cần chất lượng/độ khó cao.
- Cần beta header `effort-2025-11-24`.

**Sai lầm đã từng mắc (đừng lặp lại):** map Effort → `thinking.budget_tokens`. SAI.
Các model 4.6/4.7/4.8 không dùng budget_tokens nữa (xem mục 5). Effort đi qua `output_config`, không
qua thinking.

---

## 5. Extended Thinking — theo từng đời model

```javascript
// Cách ĐÚNG cho model 4.6 / 4.7 / 4.8 (adaptive thinking):
if (thinkingOn) body.thinking = { type: "adaptive" };
```

Quy tắc theo đời:
- **Sonnet 4.6 / Opus 4.6:** `budget_tokens` đã **deprecated** → dùng adaptive thinking + effort.
- **Opus 4.7 / 4.8:** chỉ adaptive thinking. **KHÔNG nhận `budget_tokens`. KHÔNG nhận `temperature`**
  (gửi temperature vào → lỗi hoặc bị bỏ qua kèm cảnh báo).
- **Đời cũ 4.5 trở về trước:** mới dùng `thinking: { type: "enabled", budget_tokens: N }` + `temperature: 1`.

Vì tool này chủ yếu xài model 4.6+ nên: **không gửi budget_tokens, không gửi temperature.** Chỉ
`{ type: "adaptive" }`.

---

## 6. Đọc stream (SSE)

```javascript
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
      // CHỈ lấy text_delta — bỏ thinking_delta để không lẫn nội dung suy nghĩ vào output
      if (j?.delta?.type === "text_delta") { full += j.delta.text || ""; onChunk(full); }
    } catch {}
  }
}
```

`usage` dùng để hiển thị token + ước tính chi phí (mục 8).

---

## 7. Web Search trong API (cho tính năng "Update")

Code trong Artifact KHÔNG tự fetch docs được, nhưng API messages hỗ trợ `web_search` tool — tức là
nhờ chính Claude tra cứu lúc gọi:

```javascript
body.tools = [{ type: "web_search_20250305", name: "web_search" }];
```

Khi đó `data.content` (hoặc stream) trả về hỗn hợp các block: `text`, `server_tool_use`,
`web_search_tool_result`. Lấy text bằng cách lọc theo `type`, KHÔNG dựa vào vị trí:

```javascript
const textParts = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
```

Đây là cách nút "Cập nhật" tự phát hiện model mới: gọi Claude + web_search, yêu cầu trả JSON danh
sách model hiện hành từ docs Anthropic, rồi parse và thay `MODELS`.

> Lưu ý: với web_search, NÊN gọi **không stream** (`stream:false`, đọc `await res.json()`), vì còn
> phải gom nhiều loại block — đơn giản và ít lỗi hơn.

---

## 8. Pricing (USD / 1M token) — để ước tính chi phí

| Model      | Input | Output |
| ---------- | ----- | ------ |
| Haiku 4.5  | 0.80  | 4.00   |
| Sonnet 4.6 | 3.00  | 15.00  |
| Opus 4.6/4.7/4.8 | 15.00 | 75.00 |

```javascript
const cost = (usage.input_tokens * p.input + usage.output_tokens * p.output) / 1e6;
```
Token thinking tính theo giá output. **Luôn làm tròn** số hiển thị (`.toFixed`).

---

## 9. Lưu trữ & Checkpoint (bắt buộc với mọi tool)

```javascript
await window.storage.set(KEY, JSON.stringify(state)); // auto-save (debounce ~0.8s)
const r = await window.storage.get(KEY);              // khôi phục: r?.value
```
- Auto-save vào `window.storage` + Import/Export JSON đầy đủ state, có `version` tag.
- Truy cập key không tồn tại có thể **throw**, không trả null → bọc try/catch.
- `window.storage` chỉ JSON/text, value < 5MB/key, key < 200 ký tự, không khoảng trắng/dấu nháy.

---

## 10. Checklist trước khi gọi API (tự rà)

- [ ] Model ID có nằm trong bảng mục 2 không? (không tự bịa)
- [ ] Có gửi `output_config.effort` + header `effort-2025-11-24` không?
- [ ] Nếu bật thinking: chỉ `{ type: "adaptive" }` (cho 4.6+), KHÔNG budget_tokens, KHÔNG temperature?
- [ ] KHÔNG truyền API key thủ công?
- [ ] Stream: chỉ lấy `text_delta`, bỏ `thinking_delta`?
- [ ] web_search: gọi non-stream, lọc block theo `type`?
- [ ] Có try/catch quanh `fetch` và `window.storage`?

---

## 11. Lịch sử sai lầm (để không lặp lại)

| Ngày       | Sai | Đúng |
| ---------- | --- | ---- |
| 2026-06-06 | Khẳng định "API không có field effort" | Effort CÓ thật, qua `output_config.effort` |
| 2026-06-06 | Map Effort → `thinking.budget_tokens`, gộp Effort vào trong Thinking | Effort độc lập qua `output_config`; Thinking riêng, adaptive |
| 2026-06-06 | Gửi `temperature: 1` cho thinking | 4.7/4.8 KHÔNG nhận temperature |
| 2026-06-06 | Coi `budget_tokens` là cách bật thinking | Deprecated trên 4.6+; dùng `{type:"adaptive"}` |

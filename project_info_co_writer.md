# Thông Tin Dự Án: Trợ Lý Sáng Tác (AI Co-Writer)

> Mục tiêu: Tạo một tool chạy trong Claude Artifacts để hỗ trợ viết truyện, tận dụng tối đa khả năng của Claude API (zero-key trong Artifacts) kết hợp với dữ liệu RAG đã có sẵn từ hệ thống Selorson.

---

## 1. Hệ Thống Hiện Tại — Selorson V3

### 1.1 Kiến trúc tổng thể
- **Backend**: Rust + Axum (port 8001) — 28 handler files, 38 entities
- **Frontend**: SvelteKit + Svelte 5 Runes (port 3001)
- **Database**: PostgreSQL (Neon) — 36 bảng
- **Desktop**: Tauri (đang phát triển) — bổ sung tính năng chỉ có trên desktop
- **Mobile**: Capacitor (config only, chưa init native)
- **Dữ liệu Co-Writer**: SQLite riêng biệt (`co-writer-data/co_writer.db`)

### 1.2 Công cụ AI hiện tại trong Admin Panel
Admin Panel của Selorson có 3 module AI quan trọng:

| Module | Chức năng |
|--------|-----------|
| **🤖 Cổng AI (LLM Gateway)** | Quản lý multi-provider API keys (Google, Groq, OpenRouter, GitHub, Cloudflare, Mistral), routing thông minh với fallback order, RTK token compression, thống kê token |
| **💬 Claude Chat Manager** | Pool tài khoản Claude free, xoay vòng khi bị rate-limit, mở phiên Claude riêng biệt (Tauri desktop = cookie isolation) |
| **✍️ Trợ Lý Sáng Tác** | Hệ thống RAG hoàn chỉnh hỗ trợ viết truyện (chi tiết bên dưới) |

---

## 2. Chi Tiết Hệ Thống Trợ Lý Sáng Tác

### 2.1 Giao diện — 3 Tab chính

#### Tab 1: ✍️ Xưởng Viết (Workshop)
- **Brainstorm**: Nhập số chương + định hướng → AI tạo dàn ý chi tiết (beats)
- **Beats Editor**: Chỉnh sửa dàn ý AI tạo ra
- **Generate**: 2 chế độ:
  - *Chỉ xuất Super Prompt* → copy sang ChatGPT/Claude/bất kỳ AI nào
  - *AI viết trực tiếp* → gọi LLM qua Gateway
- **Tham số nâng cao**: MMR Lambda (đa dạng), Temporal Lambda (ưu tiên chương gần), Custom Summary
- **Token Budget Display**: Hiển thị phân bổ token cho History/Characters/World Lore

#### Tab 2: 🌍 Kinh Thánh Thế Giới (World Bible)
- **Entity types**: 6 loại — Nhân Vật (CHR), Địa Danh (LOC), Truyền Thuyết (LGD), Vật Phẩm (ITM), Sự Kiện (EVT), Tổ Chức (ORG)
- **AI Detection**: Import file → AI tự phát hiện entities, đánh dấu mới/trùng
- **Alias System**: Mỗi entity có nhiều bí danh → hệ thống tự nhận diện khi scan
- **Collision Priority**: Xử lý trùng tên giữa các entity

#### Tab 3: 📜 Biên Niên Sử (Chronicle)
- **AI Phân Tích Tự Động**: Import chương → AI tóm tắt, trích xuất sự kiện, tìm mầm cốt truyện (plot seeds)
- **Nhật Ký Thủ Công**: Nhập tay tóm tắt, sự kiện, phục bút
- **Timeline Cốt Truyện**: Hiển thị timeline các chương đã ghi
- **Nguồn Dữ Liệu & Index**: Quản lý thư mục quét, Scan & Index (incremental)
- **Folder Browser**: Duyệt thư mục trên máy (chỉ desktop)

### 2.2 Backend RAG Pipeline (Rust)

Toàn bộ engine nằm trong `backend-v3/src/services/co_writer/`:

| File | Chức năng |
|------|-----------|
| `db.rs` (31KB) | SQLite wrapper — CRUD entities, chapter logs, documents, chunks, embeddings, templates, scan sources |
| `chunker.rs` (10KB) | Text splitting 3 tầng: paragraph → sentence → overlap (~120 chars). Hỗ trợ tiếng Việt. Trích xuất entity mentions bằng alias matching |
| `embedder.rs` (5KB) | Gemini embedding API (gemini-embedding-001, fallback text-embedding-004). Batch embed với rate-limiting 40ms/call |
| `indexer.rs` (11KB) | Incremental scan: quét thư mục → phát hiện file mới/thay đổi → chunk → embed → lưu DB. Xóa file cũ tự động |
| `search.rs` (7KB) | Vector similarity search + Temporal weighting + MMR diversity selection. Brute-force cosine similarity (phù hợp <10K chunks) |
| `prompt_builder.rs` (7KB) | Super Prompt assembly: lấy 3 chapter logs gần nhất + character profiles + RAG chunks → điền vào template với token budgets |

### 2.3 Luồng hoạt động RAG chi tiết

```
Admin thêm thư mục nguồn
    ↓
Scan & Index (incremental)
    ↓
Đọc file .md/.txt → chunk_document() 
    ↓
3-tier chunking: paragraphs → sentences → overlap
    ↓
extract_entity_mentions() cho mỗi chunk
    ↓
embed_batch_gemini() → vector 768 dimensions
    ↓
Lưu vào SQLite (documents + chunks + chunk_embeddings)
    ↓
═══════════════════════════════════════
Khi viết chương mới:
    ↓
Nhập số chương + định hướng → Brainstorm (AI tạo beats)
    ↓
Chỉnh sửa beats → Generate
    ↓
build_super_prompt():
    1. Lấy 3 chapter logs gần nhất → history_text (budget ~600 tokens)
    2. RAG search: embed beats → cosine similarity → temporal decay → MMR select top 4 → world_lore_text (budget ~1000 tokens)
    3. List character entities → characters_text (budget ~800 tokens)
    4. Điền vào template → Super Prompt
    ↓
Hoặc: Copy Super Prompt sang AI khác
Hoặc: Gọi LLM Gateway → AI viết trực tiếp
```

### 2.4 Dữ liệu hiện tại
- SQLite: `E:/Selorson/co-writer-data/co_writer.db`
- Manuscripts: `co-writer-data/manuscripts/` (1 file mẫu)
- Worldbook: `co-writer-data/worldbook/` (1 file mẫu)
- Embedding model: Gemini (768 dimensions)

---

## 3. Mục Tiêu Dự Án Tool Claude Artifacts

### 3.1 Vấn đề hiện tại
- Hệ thống Co-Writer hiện tại **phụ thuộc vào backend Rust** chạy trên localhost
- Embedding dùng **Gemini API key** (free tier giới hạn)
- Tác giả đang dùng **Claude free** (không có API key) → không thể tích hợp Claude vào LLM Gateway
- Cần một cách để **Claude hỗ trợ trực tiếp** trong quy trình viết truyện mà không cần API key

### 3.2 Giải pháp đề xuất
Tạo tool chạy trong **Claude Artifacts** (sử dụng kỹ thuật "Anthropic API in Artifacts" như NeuroForge):
- Tool gọi Claude API trực tiếp từ iframe (zero-key auth)
- Thay thế/bổ sung các chức năng mà các API free khác đang làm
- Tận dụng context window lớn của Claude cho story writing

### 3.3 Các chức năng cần xây dựng (ưu tiên)

1. **Story Context Manager** — Quản lý nhân vật, thế giới, timeline ngay trong Artifacts
2. **Super Prompt Builder** — Tổng hợp context thành prompt tối ưu cho Claude
3. **Chapter Analyzer** — AI phân tích chương, tóm tắt, trích xuất sự kiện
4. **Brainstorm Engine** — AI brainstorm dàn ý dựa trên context đã có
5. **Writing Assistant** — AI viết trực tiếp với full context

---

## 4. Tài Nguyên Bổ Sung (D:\kho github)

| Dự án | Tiềm năng |
|-------|-----------|
| **context-router** | Lớp định tuyến context cho AI agents — có thể tham khảo cách quản lý context budget, session, handoff |
| **turbovec** | Google TurboQuant cho vector search — có thể tham khảo kỹ thuật quantization embedding |
| **Open-LLM-VTuber** | VTuber AI — không liên quan trực tiếp |
| **openreel-video** | Video editor browser-based — không liên quan |
| **pyvideotrans** | Video translation — không liên quan |
| **voice-pro** | AI voice — không liên quan |

### Đặc biệt quan trọng: context-router
- Giải quyết vấn đề **context budget management** khi agent làm việc với nhiều file
- Có thể tham khảo kiến trúc để xây dựng **context allocation** trong tool Artifacts
- Giúp tối ưu việc nhồi RAG context vào prompt mà không vượt token limit

---

## 5. Thông tin kỹ thuật Claude Artifacts

### 5.1 Kỹ thuật "Anthropic API in Artifacts"
- File JSX chạy trong iframe sandbox của Claude
- `fetch("https://api.anthropic.com/v1/messages")` **không cần API key** — Claude tự inject auth
- Hỗ trợ: streaming, extended thinking, prompt caching
- Persistence: `window.storage.set/get/delete` (API nội bộ)
- Clipboard: fallback `execCommand("copy")` vì iframe chặn `navigator.clipboard`
- File I/O: `FileReader` + `Blob` URL (import/export JSON)

### 5.2 Giới hạn
- Không truy cập filesystem
- Không có backend/database — phải dùng `window.storage` hoặc export/import JSON
- Max tokens output bị giới hạn → cần checkpoint/resume system (như NeuroForge)
- Chỉ gọi được Anthropic API, không gọi được Gemini/OpenAI/etc.

---

## 6. Chiến Lược Phát Triển

### Phase 1: Story Context Manager (Tool đầu tiên)
- Cho phép import/export dữ liệu entities + chapter logs dạng JSON
- Tương thích định dạng dữ liệu của Selorson Co-Writer
- Quản lý nhân vật, thế giới, timeline trong Artifacts
- Sử dụng Claude để phân tích, brainstorm, viết

### Phase 2: RAG-in-Browser
- Client-side chunking (port logic từ Rust chunker)
- Client-side embedding (dùng Claude thay Gemini)
- In-memory vector search
- Super Prompt assembly

### Phase 3: Full Writing Suite
- Tích hợp tất cả chức năng vào một tool hoàn chỉnh
- Export kết quả tương thích với Selorson backend

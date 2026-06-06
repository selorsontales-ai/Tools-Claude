# Thông Tin Dự Án: YouTube Channel System

> Mục tiêu: Xây dựng một hệ thống pipeline chuyên nghiệp cho YouTube, bắt đầu từ khâu tạo kênh.
> Mỗi bước trong pipeline sẽ xuất ra output (JSON/MD) là input cho bước tiếp theo.
> Triết lý cốt lõi: **Mọi thứ AI tạo ra đều bắt nguồn từ Prompt → Hệ thống này là nhà máy sản xuất Prompt.**

---

## 1. Tổng Quan Pipeline

```
[Tool 1: Channel Blueprint] → JSON bộ khung          ✅ DONE
        ↓
[Tool 2: Channel Creator + Prompt Factory] → JSON/MD prompts   ← CURRENT
        ↓
[Tool 3: Content Production Studio] → Final content (scripts, titles, SEO, thumbnail prompt clipboard)
        ↓
[Tool 4+: Post-Production, Analytics...] → (tương lai)
```

Hiện tại tập trung xây **Tool 2**. Tool 1 đã hoàn thành.

---

## 2. Tool 1: Channel Blueprint Builder (Bộ Khung Kênh)

### 2.1 Mục đích
Giúp người dùng từ một ý tưởng mơ hồ → ra một bộ khung kênh YouTube chi tiết và chuyên nghiệp, thông qua hệ thống gợi ý phân tầng (không tốn API) + AI phân tích tổng hợp (tốn API ở bước cuối).

### 2.2 Các thành phần chính

#### A. Khu vực ý tưởng tự do (Free-form Input)
- Ô text lớn để người dùng viết ý tưởng, suy nghĩ, ghi chú cá nhân
- Nút Import file .md → hệ thống đọc và hiển thị nội dung, Claude sẽ dùng nội dung này làm context khi phân tích

#### B. Hệ thống gợi ý phân tầng (Hierarchical Suggestions) — KHÔNG TỐN API
Đây là phần cốt lõi. Gồm nhiều **danh mục lớn (Level 1)**, mỗi danh mục khi được chọn sẽ mở ra **các lựa chọn con (Level 2, Level 3, ...)** cho đến khi người dùng cảm thấy đã đủ chi tiết.

Ví dụ cấu trúc phân tầng:

| Level 1 (Danh mục lớn) | Level 2 (Ví dụ) | Level 3 (Ví dụ) |
|-------------------------|------------------|------------------|
| 🎯 Chủ đề / Niche | Tech, Gaming, Education, Finance, Health, Entertainment, Lifestyle... | Tech → AI, Programming, Gadget Review, SaaS... |
| 🎬 Định dạng nội dung | Faceless, Talking Head, Vlog, Tutorial, Shorts-first, Podcast, Documentary... | Faceless → AI Voiceover, Text-on-screen, Stock footage, Animation... |
| 👥 Đối tượng khán giả | Gen Z, Millennials, Professionals, Students, Parents... | Professionals → Developers, Marketers, Designers... |
| 💰 Chiến lược kiếm tiền | AdSense, Sponsorship, Affiliate, Digital Products, Membership, Services... | Digital Products → Courses, Templates, SaaS tools... |
| 🌍 Ngôn ngữ & Thị trường | Tiếng Việt, English, Bilingual, Multi-language... | English → US market, Global, UK... |
| 📅 Tần suất đăng | Hàng ngày, 3-5/tuần, 1-2/tuần, 2-4/tháng... | — |
| 🎨 Phong cách sản xuất | Low-budget DIY, Mid-range, High-production, AI-assisted... | AI-assisted → AI Script, AI Voice, AI Images, AI Video... |
| 📏 Độ dài video | Shorts (<60s), Short-form (1-5min), Mid (8-15min), Long (20-45min), Podcast (60min+)... | — |
| 🧩 USP / Điểm khác biệt | Humor, Deep analysis, Simplification, Storytelling, Data-driven... | — |
| 🔄 Chiến lược tái chế | Shorts từ video dài, Blog posts, Twitter threads, TikTok, Podcast audio... | — |

**Quy tắc quan trọng:**
- Người dùng có thể chọn NHIỀU lựa chọn ở mỗi level (multi-select)
- Không bắt buộc phải chọn hết — chọn bao nhiêu cũng được
- Toàn bộ quá trình chọn này KHÔNG gọi API — chỉ là UI tĩnh
- Các lựa chọn này được hardcode sẵn trong JSX (dựa trên kiến thức về YouTube)

#### C. Nút "Tạo Bộ Khung" (Generate Blueprint) — TỐN API
Khi người dùng đã chọn xong các lựa chọn + viết ý tưởng → bấm nút này:
- Claude nhận TẤT CẢ: ý tưởng tự do + nội dung file MD đã import + tất cả lựa chọn đã tick
- Claude phân tích tổng hợp → trả về một **bộ khung kênh hoàn chỉnh** dạng cấu trúc (JSON)
- Bộ khung này bao gồm: tên kênh gợi ý, mô tả kênh, content pillars, upload schedule, monetization roadmap, growth strategy, v.v.

#### D. Nút "Update" (Cập nhật hệ thống)
- Khi bấm → Claude tự tìm hiểu về các thay đổi mới nhất của chính nó (model mới, tính năng mới)
- Sau đó cập nhật lại form gợi ý (thêm lựa chọn mới nếu cần)
- Ví dụ: nếu Claude có model mới tối ưu cho video editing → thêm vào mục "AI-assisted production"

#### E. Hệ thống Checkpoint
- Import/Export JSON để tiếp tục nếu session bị dừng
- `window.storage` cho auto-save

### 2.3 Output
File JSON chứa bộ khung kênh hoàn chỉnh → sẽ là input cho Tool 2.

---

## 3. Tool 2: Channel Creator + Prompt Factory (Máy Đẻ Prompt)

### 3.1 Mục đích
Nhận bộ khung kênh (JSON từ Tool 1) → cho phép người dùng thiết lập chi tiết kênh → **sinh ra các prompt chuyên nghiệp** để dùng với bất kỳ AI nào.

### 3.2 Các thành phần chính

#### A. Import bộ khung
- Nhận file JSON từ Tool 1 (Channel Blueprint)
- Tự động điền các thông số hệ thống từ bộ khung

#### B. Hệ thống điền thông tin kênh
- Các trường để người dùng tự điền (tên kênh, mô tả, tagline, target audience, content pillars, ...)
- Mỗi trường có **danh mục gợi ý** (dropdown/chips) để chọn nếu không nghĩ ra
- **Nút "AI Điền" (AI Fill)**: Người dùng nhập một prompt yêu cầu → Claude tự điền tất cả các trường dựa trên prompt đó + context từ bộ khung

#### C. Máy đẻ Prompt (Prompt Factory) — CHỨC NĂNG CỐT LÕI
- Sau khi thiết lập xong thông tin kênh → đây là nơi sinh prompt
- Có ô chọn **số lượng prompt muốn tạo** (ví dụ: 5, 10, 20...)
- Có ô chọn **loại prompt** (video script prompt, thumbnail prompt, title prompt, description prompt...)
- Nút "Tạo Prompt" → Claude sinh ra danh sách prompt dựa trên tất cả context
- **Import prompts đã tạo** (JSON/MD) → để Claude không tạo trùng
- **Export kết quả** ra JSON hoặc MD tùy chọn

#### D. Lựa chọn mô hình AI
- Giống NeuroForge: chọn model (Haiku/Sonnet/Opus), thinking mode on/off, thinking effort level
- Hiển thị ước tính token usage

#### E. Hệ thống Checkpoint
- Import/Export JSON
- Auto-save vào `window.storage`

### 3.3 Output
- File JSON hoặc MD chứa các prompt đã sinh
- Sẽ là input cho Tool 3 (Content Generator — tương lai)

---

## 4. Tool 3: Content Production Studio (Tầm nhìn — Chưa xây)

### 4.1 Mục đích
Nhận danh sách prompts từ Tool 2 → thực thi tạo nội dung cuối cùng.

### 4.2 Input
File JSON chứa danh sách prompts từ Tool 2. Mỗi prompt phải có trường phân loại rõ ràng (`type`) để Tool 3 biết cách xử lý:
- `text_generation` → Tool 3 sẽ gọi Claude API để sinh nội dung (script, title, SEO description...)
- `image_generation` → Tool 3 chỉ hiển thị prompt + nút Copy để user mang đi Midjourney/Leonardo/DALL-E

### 4.3 Output
- Kịch bản video hoàn chỉnh (Markdown)
- Tiêu đề + mô tả SEO
- Clipboard manager cho thumbnail prompts

### 4.4 Ảnh hưởng đến Tool 2
> **Quan trọng:** Tool 2 khi export JSON phải phân loại rõ `type` của từng prompt. Đây là yêu cầu thiết kế dữ liệu, không phải yêu cầu UI.

---

## 5. Yêu Cầu Kỹ Thuật Chung

### 4.1 Pattern từ NeuroForge (tham khảo)
- Model selection: Haiku 4.5, Sonnet 4.6, Opus 4.6 (với pricing display)
- Thinking mode: on/off + effort levels (Low/Med/High/Max)
- Checkpoint system: export/import JSON với version tag
- Streaming response: đọc stream từ API
- `lucide-react` icons

### 4.2 Chiến lược phát triển
- Chia mỗi Tool thành các module nhỏ, mỗi module hoàn thành trong 1-2 messages Claude free
- Bước nào có nguy cơ hết token → cảnh báo người dùng trước
- Claude quyết định lộ trình chia module

### 4.3 Bắt buộc
- Hệ thống Import/Export JSON checkpoint (non-negotiable)
- Tất cả lựa chọn UI phải hoạt động offline (không tốn API)
- Chỉ tốn API khi bấm nút Generate/Create/AI Fill

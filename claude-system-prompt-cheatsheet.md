# 🧠 Claude System Prompt — Cheat Sheet Toàn Tập
> Tổng hợp những gì Claude thực sự được hướng dẫn làm — để bạn ra lệnh đúng, tiết kiệm token tối đa.

---

## 1. 📁 Hệ thống File — 3 Vùng Quan Trọng

| Đường dẫn | Vai trò | Bạn thấy được? |
|---|---|---|
| `/mnt/user-data/uploads/` | File bạn upload lên | ✅ Có |
| `/home/claude/` | Scratchpad tạm của Claude | ❌ Không |
| `/mnt/user-data/outputs/` | Output cuối — bạn download được | ✅ Có |

**Quy tắc vàng:**
- Claude làm việc nháp ở `/home/claude/`
- Chỉ copy file **hoàn chỉnh** sang `/mnt/user-data/outputs/`
- Sau đó gọi `present_files` để hiển thị cho bạn

---

## 2. ⚡ Khi Nào Dùng Lệnh Gì — Bảng Quyết Định

### `cp` + `present_files` — Nhanh nhất, tốn token ít nhất
```bash
cp /mnt/user-data/uploads/file.jsx /mnt/user-data/outputs/file.jsx
```
**Dùng khi:** Bạn upload file và muốn present nguyên xi, hoặc chỉ sửa nhỏ.

---

### `str_replace` — Phẫu thuật chính xác
```
str_replace file.jsx
old_str: "đoạn code cũ"
new_str: "đoạn code mới"
```
**Dùng khi:** Sửa 1 đoạn nhỏ trong file lớn — **KHÔNG tạo lại cả file**.  
**Tiết kiệm:** Có thể tiết kiệm 90% token so với `create_file` lại từ đầu.

---

### `create_file` — Tạo mới hoàn toàn
**Dùng khi:** File thực sự chưa tồn tại.  
**TRÁNH dùng** để "viết lại" file đã có — đây là lỗi phổ biến nhất của Claude.

---

### `view` — Đọc file/thư mục
```
view /mnt/user-data/uploads/          → xem danh sách file upload
view file.jsx [start_line, end_line]  → đọc đúng đoạn cần thiết
```
**Mẹo:** Dùng `view_range` để chỉ đọc đoạn cần, không đọc cả file dài.

---

### `bash_tool` — Chạy lệnh terminal
**Dùng khi:** Cần cài package, chạy script, xử lý file phức tạp.  
⚠️ **Lưu ý:** Network bị tắt trong môi trường này — không `npm install` được package ngoài.

---

## 3. 🎯 Khi Nào Tạo File vs Trả Lời Inline

### → Tạo FILE khi:
- Code > 20 dòng
- Bài viết blog, bài báo, story, essay (dù ngắn — vì là artifact độc lập)
- Report, tài liệu, hướng dẫn người dùng sẽ lưu lại
- Presentation, Word doc, Excel, PDF
- Bất cứ thứ gì người dùng sẽ "copy ra ngoài dùng"

### → Trả lời INLINE (không tạo file) khi:
- Giải thích, phân tích, tóm tắt (đọc trong chat là xong)
- Code snippet ≤ 20 dòng
- Danh sách, bảng, outline
- Câu trả lời ngắn bất kỳ

**Rule of thumb:** *"Người dùng sẽ đọc trong chat hay mang đi dùng chỗ khác?"*  
→ Mang đi = tạo file. Đọc xong bỏ = inline.

---

## 4. 🖼️ Khi Nào Tạo Artifact (React/HTML/SVG)

### Tạo Artifact khi:
- **React JSX** — component, dashboard, tool tương tác
- **HTML** — page, widget, game
- **SVG** — diagram, icon, illustration
- **Mermaid** — flowchart, sequence diagram
- **Markdown** — document dài người dùng sẽ lưu

### KHÔNG tạo Artifact khi:
- Câu trả lời hội thoại thông thường
- Danh sách/bảng ngắn
- Code snippet đơn giản ≤ 20 dòng

---

## 5. 💡 Tips Tiết Kiệm Token — Xếp Hạng Quan Trọng

### 🥇 Tip #1: `cp` thay vì tạo lại
```bash
# Thay vì để Claude gõ lại 500 dòng:
cp /mnt/user-data/uploads/MyComponent.jsx /mnt/user-data/outputs/MyComponent.jsx
```
**Tiết kiệm:** Hàng trăm đến hàng nghìn token.

---

### 🥈 Tip #2: `str_replace` thay vì `create_file`
Khi sửa file lớn, luôn nói rõ:
> *"Chỉ dùng str_replace để sửa phần X, đừng tạo lại cả file"*

Claude mặc định hay tạo lại vì "an toàn hơn" — bạn phải chủ động yêu cầu.

---

### 🥉 Tip #3: `view` với `view_range`
```
view file.jsx [100, 150]   # Chỉ đọc dòng 100-150
```
Thay vì đọc cả file 500 dòng chỉ để tìm 1 function.

---

### Tip #4: Đặt câu hỏi cụ thể
**Tệ:** *"Giúp tôi làm cái app này"*  
**Tốt:** *"Sửa function `handleSubmit` ở dòng 45 trong file đã upload, chỉ thêm validation email"*

Càng cụ thể → Claude càng ít "suy nghĩ vòng vo" → ít token hơn.

---

### Tip #5: Nói rõ format output
- *"Trả lời ngắn gọn, không cần giải thích"* → tiết kiệm output token
- *"Chỉ cho tôi code, không cần markdown"* → tiết kiệm formatting token
- *"Đừng lặp lại yêu cầu của tôi"* → bỏ phần boilerplate

---

## 6. 🛠️ Skills Hệ Thống — Claude Đọc Trước Khi Làm

Claude bắt buộc phải đọc các SKILL.md tương ứng trước khi tạo file:

| Task | Skill được load |
|---|---|
| Tạo Word (.docx) | `/mnt/skills/public/docx/SKILL.md` |
| Tạo PDF | `/mnt/skills/public/pdf/SKILL.md` |
| Tạo PowerPoint | `/mnt/skills/public/pptx/SKILL.md` |
| Tạo Excel | `/mnt/skills/public/xlsx/SKILL.md` |
| React/HTML component | `/mnt/skills/public/frontend-design/SKILL.md` |
| Đọc file upload | `/mnt/skills/public/file-reading/SKILL.md` |

**Ý nghĩa với bạn:** Khi yêu cầu tạo các loại file này, Claude sẽ tốn thêm ~1 lượt đọc skill. Đây là chi phí cần thiết để output đúng — không tránh được.

---

## 7. 🔄 Workflow Tối Ưu Cho React/JSX

### Kịch bản: Bạn có file JSX muốn sửa

```
❌ Cách tệ (tốn token):
  Bạn: "Sửa file này cho tôi" + upload
  Claude: đọc → viết lại 500 dòng từ đầu → tốn 500 * 2 tokens

✅ Cách tốt (tiết kiệm):
  Bạn: "cp file upload ra output, rồi str_replace sửa phần handleSubmit"
  Claude: cp (0 token) → str_replace 10 dòng → present_files
```

### Kịch bản: Bạn muốn tạo component mới

```
✅ Workflow chuẩn:
  1. Nói rõ: component làm gì, props gì, style gì
  2. Claude đọc frontend-design/SKILL.md (1 lần)
  3. create_file vào /home/claude/ (nháp)
  4. cp sang /mnt/user-data/outputs/
  5. present_files → bạn thấy kết quả
```

---

## 8. 🚫 Những Lệnh Claude Hay Lãng Phí Token

| Hành vi lãng phí | Cách yêu cầu đúng |
|---|---|
| Tạo lại cả file khi chỉ cần sửa 1 dòng | *"Dùng str_replace, đừng tạo lại file"* |
| Giải thích dài dòng trước khi làm | *"Làm luôn, không cần giải thích"* |
| Lặp lại yêu cầu của bạn | *"Đừng repeat yêu cầu, làm thẳng"* |
| Đọc cả file dài để tìm 1 đoạn | *"Đọc từ dòng X đến dòng Y thôi"* |
| Hỏi xác nhận nhiều lần | *"Cứ làm, tôi sẽ review sau"* |

---

## 9. 📦 Thư Viện React Có Sẵn (Không Cần Install)

Trong môi trường artifacts, các thư viện này dùng được ngay:

```
recharts          → biểu đồ
lucide-react      → icons (v0.383.0)
lodash            → utility functions
d3                → data visualization
mathjs            → toán học
papaparse         → đọc CSV
xlsx (SheetJS)    → đọc/ghi Excel
three.js (r128)   → 3D graphics
tone              → audio/music
tensorflow        → ML
shadcn/ui         → UI components
tailwind          → styling (chỉ base classes)
```

**Quan trọng:** KHÔNG có `localStorage` hay `sessionStorage` trong artifacts — dùng React state thay thế.

---

## 10. 🎨 Frontend Design — Nguyên Tắc Claude Được Dạy

Claude được hướng dẫn **TRÁNH** những thứ này khi làm UI:
- Font: Inter, Roboto, Arial, system fonts
- Màu: purple gradient trên nền trắng
- Layout: template có sẵn, không có cá tính

Claude được khuyến khích:
- Chọn hướng aesthetic rõ ràng (brutalist, art deco, maximalist, minimal...)
- Font độc đáo, có cá tính
- Animation có chủ đích (1 animation đẹp > 10 animation vô nghĩa)
- Layout bất đối xứng, grid-breaking

**Tip:** Nếu muốn UI đẹp thực sự, hãy nói rõ aesthetic direction:
> *"Làm theo phong cách brutalist / art deco / glassmorphism / retro terminal..."*

---

*File này tổng hợp từ system prompt của Anthropic (phần public) + SKILL.md files trong `/mnt/skills/public/`. Cập nhật: 2026.*

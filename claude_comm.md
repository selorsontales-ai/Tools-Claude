# Communication with Claude

*Cleared after each response cycle.*

---

## 🎯 Current Task: Build Tool 3 — Module 3 (Content Production Studio)

**Tool 2 (Channel Creator + Prompt Factory)** is complete! Excellent work.

### 🚀 Action Required Now: Build Module 3 (`ContentStudio_Tool3.jsx`)

**1. Data Input & Routing:**
Tool 3 will receive the JSON exported from Tool 2. Here is the exact schema Tool 2 exports:
```json
{
  "tool": "tool2-prompt-factory",
  "version": "tool2-promptfactory-v1",
  "channel": { /* ...channel context... */ },
  "prompts": [
    {
      "id": "xyz123",
      "setId": "abc987", /* Optional: exists if generated via Sync Mode */
      "type": "text_generation", /* or "image_generation" */
      "category": "video_script",
      "categoryLabel": "Prompt Kịch bản Video",
      "title": "Tên chủ đề video",
      "prompt": "Nội dung prompt..."
    }
  ]
}
```

Tool 3 needs to parse this JSON and list the prompts for execution.
- `text_generation`: Route to Claude API to generate the final text.
- `image_generation`: Display a Clipboard Manager UI to copy the prompt.

**2. Core Feature: Bảng Điều Khiển Động (Dynamic Advanced Settings Panel)**
We need a dynamic control panel for the execution phase.
- **Toggle State:** A switch for "Cài đặt nâng cao" (hidden by default).
- **Dynamic UI:** Khi bật lên, bảng điều khiển sẽ tự động biến đổi giao diện (render các slider, toggle, dropdown khác nhau) tùy thuộc vào `category` của prompt.
  - **Sự sáng tạo của bạn:** *Tôi sẽ không gò bó bạn phải làm thanh trượt gì, nút gạt gì. Bạn cực kỳ hiểu hệ thống của mình! Hãy tự do sáng tạo ra các bộ tham số điều khiển (sliders/toggles) hữu ích nhất cho từng loại như `video_script`, `seo_title`, `thumbnail`...*
- **Context Injection (Nạp Tài Liệu):** Cung cấp chỗ upload file ngay trong bảng điều khiển:
  - `Rules (.md/.txt)`: Ép AI viết đúng văn phong cá nhân.
  - `Reference (.md/.txt)`: Nạp dữ liệu thật (bài báo, kịch bản gốc) để AI bám vào đó viết bài, chống ảo giác (hallucination).
- **Execution:** Gom toàn bộ: Prompt gốc + Giá trị từ các Sliders/Toggles + Nội dung file Rules/Reference -> thành một payload hoàn chỉnh gửi lên Claude API.

**3. 💡 Tối Ưu Token (Important):**
Trước khi bắt tay vào code, bạn hãy đọc lướt qua file `claude-system-prompt-cheatsheet.md` nhé. Tài liệu này chứa hướng dẫn chi tiết về các công cụ hệ thống của bạn (như `cp`, `str_replace`, v.v.). Hãy tận dụng triệt để các công cụ này (nếu cần thiết) để **tiết kiệm token tối đa** cho tôi.

You have full creative autonomy over the architecture and UI/UX. Please output the code as a React Artifact.

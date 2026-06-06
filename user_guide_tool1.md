# Hướng Dẫn Sử Dụng Tool 1: Channel Blueprint Builder

Chào mừng bạn đến với **Tool 1: Channel Blueprint Builder** — công cụ đầu tiên trong Hệ Thống Quy Trình YouTube Chuyên Nghiệp. Tool này đóng vai trò như một "kiến trúc sư", giúp bạn biến những ý tưởng mông lung thành một bản thiết kế (blueprint) kênh YouTube chi tiết, chuẩn xác và sẵn sàng để sản xuất.

---

## 🌟 Tổng Quan Quy Trình

Quy trình sử dụng Tool 1 gồm **4 bước chính**:
1. Cung cấp nguyên liệu (Ý tưởng + Tài liệu).
2. Định hướng bằng hệ thống gợi ý (Click & Chọn).
3. AI Phân tích & Tạo Blueprint (Bấm nút Generate).
4. Lưu trữ & Xuất dữ liệu (Export JSON).

---

## 🛠 Hướng Dẫn Từng Bước

### Bước 1: Chuẩn bị nguyên liệu (Không tốn token API)
Để AI (Claude) có thể tạo ra một bộ khung kênh mang đậm dấu ấn cá nhân của bạn, hãy cung cấp ngữ cảnh ban đầu:
- **💡 Ý tưởng tự do:** Tại ô text nhập liệu, hãy gõ bất kỳ suy nghĩ nào của bạn. (VD: *"Tôi muốn làm kênh nói về bí ẩn lịch sử Việt Nam, nhưng dựng video dạng animation vui nhộn"*).
- **📄 Import tài liệu (.md):** Nếu bạn đã có sẵn file ghi chú nghiên cứu đối thủ, chiến lược nội dung từ trước, hãy bấm hoặc kéo thả file `.md` vào khu vực Import. Claude sẽ đọc file này để làm nền tảng.

### Bước 2: Định hướng bằng hệ thống gợi ý (Không tốn token API)
Đây là phần "Buffet Lựa Chọn". Hệ thống cung cấp sẵn 10 danh mục lớn mà một kênh YouTube cần phải có định hướng rõ ràng. 
- Mở từng danh mục (như *Chủ đề, Định dạng nội dung, Đối tượng khán giả, USP...*).
- Click vào các "chip" để chọn những định hướng bạn muốn. Bạn có thể chọn nhiều thẻ trong cùng một danh mục (Multi-select).
- *Mẹo:* Nếu bạn không biết chọn gì, cứ bỏ qua! Claude sẽ tự động đề xuất dựa trên những gì bạn đã nhập ở Bước 1.

### Bước 3: Cấu hình AI & Sinh Blueprint (Tốn token API)
Khi đã thấy khung lựa chọn đủ tốt, hãy di chuyển xuống khu vực **"Tạo Channel Blueprint"**:
1. **Chọn Model:** 
   - *Haiku 4.5:* Nếu bạn muốn test thử nhanh, tiết kiệm token.
   - *Sonnet 4.6 (Khuyên dùng):* Cân bằng hoàn hảo giữa thông minh và tốc độ.
   - *Opus 4.6:* Dùng khi bạn đưa vào file tài liệu rất khó, cần tư duy sâu.
2. **Bật Thinking (Tùy chọn):** Nếu bài toán phức tạp, hãy gạt công tắc *Thinking* sang ON. Claude sẽ suy nghĩ nội tâm trước khi trả lời.
3. **Chọn Effort:** Bấm vào chữ "Effort" để chọn độ dài/sâu của câu trả lời (Low / Medium / High / Max). Khuyên dùng **Medium** cho nhu cầu thông thường.
4. **🚀 Bấm nút "Tạo Blueprint":** Ngồi nhâm nhi cà phê và xem Claude stream kết quả trực tiếp ra màn hình.

### Bước 4: Đọc kết quả & Xuất File
Khi Claude chạy xong, một bảng **✅ Channel Blueprint** sẽ hiện ra. Hệ thống chia thành 5 tab dễ nhìn:
- **🏠 Tổng quan:** Tên kênh gợi ý, Tagline, Đối tượng khán giả...
- **📋 Nội dung:** Trụ cột nội dung (Pillars), Lịch đăng video, Cách setup thiết bị...
- **💰 Doanh thu:** Chiến lược kiếm tiền theo từng giai đoạn (Phase 1, 2...).
- **📈 Tăng trưởng:** Công thức viết Hook, Style Thumbnail, Cách đi link collab...
- **💡 Ý tưởng:** 10 ý tưởng video đầu tiên để bạn bắt tay vào làm ngay.

> **[QUAN TRỌNG] - XUẤT FILE:** 
> Bấm nút **"⬇ Export JSON"** màu đen ở góc trên bên phải của bảng kết quả. File JSON này chính là nguyên liệu bắt buộc để đưa vào **Tool 2 (Prompt Factory)** sau này. Đừng quên bước này nhé!

---

## 💾 Hệ Thống Checkpoint (Auto-Save)
- **Auto-save:** Mọi thứ bạn gõ hay chọn đều được lưu tự động vào trình duyệt (window.storage). F5 không mất dữ liệu.
- **Tên Checkpoint:** Ở góc trên cùng, bạn có thể nhập tên cho phiên làm việc hiện tại (VD: `kenh_lich_su_hoat_hinh`).
- **Export / Import Checkpoint:** Ở thanh công cụ trên cùng (Topbar), bạn có thể xuất toàn bộ quá trình đang làm dở ra file JSON, và import lại vào bất kỳ lúc nào (rất hữu ích khi hết token giữa chừng và phải đổi account).

---

## 🔄 Tính năng: Cập nhật xu hướng
Ở dưới cùng Tool có nút **"🔄 Update xu hướng"**. 
Thế giới AI và thuật toán YouTube thay đổi hàng ngày. Thi thoảng, hãy bấm nút này. Claude sẽ tự dùng hiểu biết mới nhất của nó để cập nhật lại hệ thống, thông báo cho bạn biết có Model AI nào mới ra mắt phù hợp để dựng video hay không!

Chúc bạn tạo ra những siêu kênh YouTube triệu view với Tool 1! 🚀

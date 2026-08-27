# Blood Donor Management

Hệ thống quản lý hiến máu và cộng đồng người hiến máu, hỗ trợ từ đăng ký tài khoản, tìm kiếm người hiến, quản lý sự kiện hiến máu, phản hồi tình nguyện khẩn cấp cho đến chatbot hỗ trợ thông tin y tế và phần thưởng cho người tham gia.

## Tổng quan

Dự án này bao gồm hai phần chính:

- Backend: Django + Django REST Framework
- Frontend: React + Vite + Material UI

Mục tiêu của hệ thống là tạo ra một nền tảng kết nối người hiến máu, nhân viên y tế và các đơn vị tổ chức sự kiện hiến máu, đồng thời tăng trải nghiệm người dùng bằng các tính năng như tích hợp AI hỏi đáp, quản lý hồ sơ, theo dõi quy trình hiến máu và huy động máu khẩn cấp.

## Tính năng chính

### 1. Quản lý tài khoản và người hiến máu
- Đăng ký tài khoản cho người hiến máu và nhân viên
- Xác thực OTP qua email
- Quên mật khẩu / đặt lại mật khẩu
- Cập nhật hồ sơ cá nhân, ảnh đại diện, thông tin sức khỏe, địa điểm
- Phân quyền theo vai trò: Admin, Donor, Staff

### 2. Quản lý sự kiện hiến máu
- Tạo và xem danh sách các sự kiện hiến máu
- Đăng ký tham gia sự kiện
- Duyệt / từ chối đơn đăng ký
- Check-in, khám sàng lọc, thu thập máu và hoàn tất quy trình
- Theo dõi trạng thái từng đăng ký theo từng sự kiện

### 3. Yêu cầu hiến máu khẩn cấp
- Tạo các yêu cầu khẩn cấp từ bệnh viện / tình huống cần máu
- Nhân viên xử lý yêu cầu và phản hồi người hiến phù hợp
- Theo dõi quy trình khám sàng lọc và hiệu quả xử lý từng yêu cầu

### 4. Mạng lưới cộng đồng người hiến máu
- Thêm bạn, chấp nhận / từ chối lời mời kết bạn
- Xem danh sách bạn bè và trạng thái kết bạn
- Tìm kiếm người hiến phù hợp theo thông tin cá nhân

### 5. Phần thưởng và đổi quà
- Hệ thống danh mục quà tặng
- Chuyển đổi điểm thưởng của người hiến
- Lịch sử đổi quà
- Quản lý thông tin người nhận quà

### 6. Chatbot hỗ trợ AI (RAG)
- Hỏi đáp về kiến thức hiến máu, sức khỏe, quy trình, lưu ý sau hiến máu
- Sử dụng LangChain, Chroma vectorstore và embeddings để truy vấn dữ liệu tri thức
- Dữ liệu nguồn có thể từ CSV/PDF trong thư mục data/knowledgebase
- Hỗ trợ tìm kiếm thông tin từ cơ sở dữ liệu tri thức theo ngữ cảnh

### 7. Bảng điều khiển quản trị
- Thống kê sự kiện theo tháng / quý / năm
- Thống kê người tham gia và số lượt đăng ký hoàn tất
- Giao diện quản trị Django Admin

## Công nghệ sử dụng

### Backend
- Python 3.x
- Django 5.x
- Django REST Framework
- Django OAuth Toolkit
- Channels + WebSocket
- MySQL
- Cloudinary
- drf-yasg
- Prometheus metrics

### Frontend
- React 19
- Vite
- React Router DOM
- Material UI
- Axios
- Tailwind CSS
- Leaflet (bản đồ / vị trí)
- Framer Motion

### AI / Data
- LangChain
- Chroma
- Hugging Face Embeddings
- Fireworks AI / OpenAI-compatible model
- MLflow
- Ragas

## Cấu trúc thư mục

```text
Blood-Donor-Management/
├── README.md
├── blooddonor/
│   ├── manage.py
│   ├── requirements.txt
│   ├── blooddonor/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── blooddonorapp/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── consumers.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   ├── routing.py
│   │   ├── migrations/
│   │   ├── services/
│   │   ├── static/
│   │   ├── templates/
│   │   └── utils/
│   ├── data/
│   │   └── knowledgebase/
│   ├── logs/
│   └── mlf runs/
├── uiblooddonor/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
└── staticfiles/
```

## Luồng người dùng chính

### Vai trò Donor
1. Đăng ký / đăng nhập
2. Cập nhật hồ sơ cá nhân
3. Tham gia sự kiện hiến máu hoặc yêu cầu khẩn cấp
4. Chia sẻ / kết bạn với người hiến máu khác
5. Thu thập điểm thưởng và đổi quà
6. Tra cứu thông tin bằng chatbot AI

### Vai trò Staff
1. Quản lý sự kiện hiến máu
2. Duyệt đơn đăng ký
3. Kiểm tra sức khỏe người hiến
4. Theo dõi tình trạng thu thập máu và kết quả
5. Quản lý các phản hồi khẩn cấp

### Vai trò Admin
1. Quản lý hệ thống người dùng
2. Theo dõi thống kê tổng quan
3. Quản lý nội dung và dữ liệu tri thức
4. Điều phối hoạt động hiến máu và phần thưởng

## Cài đặt và chạy dự án

### Yêu cầu
- Python 3.10+
- Node.js 18+
- MySQL
- npm hoặc yarn
- Git

### 1. Clone dự án

```bash
git clone https://github.com/ducminhscode/Blood-Donor-Management.git
cd Blood-Donor-Management
```

### 2. Cài đặt backend

```bash
cd blooddonor
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `blooddonor/` với nội dung tương tự:

```env
DATABASE_NAME=blood_donor
DATABASE_PASSWORD=your_mysql_password
EMAIL_SEND=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_cloud_api_key
CLOUD_API_SECRET=your_cloud_api_secret
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
TOGETHER_API_KEY=your_fireworks_or_openai_key
```

> Lưu ý: dự án đang dùng MySQL và Cloudinary, nên cần cấu hình đúng thông tin truy cập trước khi chạy.

### 4. Chạy migrations và khởi tạo dữ liệu

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. Khởi chạy Backend

```bash
python manage.py runserver 0.0.0.0:8000
```

Backend mặc định chạy tại:
- http://127.0.0.1:8000

### 6. Cài đặt Frontend

```bash
cd ../uiblooddonor
npm install
```

### 7. Khởi chạy Frontend

```bash
npm run dev
```

Frontend mặc định chạy tại:
- http://127.0.0.1:5173

## API và endpoint chính

Dự án backend sử dụng Django REST Framework và cung cấp các nhóm endpoint như:

- `/api/account/`
- `/api/register/`
- `/api/donor/`
- `/api/staff/`
- `/api/donation-event/`
- `/api/emergency-request/`
- `/api/reward/`
- `/api/reward-history/`
- `/api/event-registration/`
- `/api/chat-sessions/`
- `/api/knowledge/`

Ngoài ra, hệ thống có endpoint metrics Prometheus:

- `/metrics`

## Hướng dẫn phát triển

- Backend code nằm trong `blooddonor/blooddonorapp/`
- UI code nằm trong `uiblooddonor/src/`
- AI data và vectorstore nằm trong `blooddonor/data/` và `blooddonor/vectorstores/`
- Log hệ thống được lưu dưới `blooddonor/logs/`

## Liên hệ / đóng góp

Dự án này phù hợp cho việc học tập, khảo sát hệ thống thông tin quản lý hiến máu, và có thể mở rộng thêm các tính năng như:
- thông báo push realtime
- báo cáo thống kê nâng cao
- tích hợp bản đồ vị trí bệnh viện và cơ sở hiến máu
- AI phân tích tác động và khuyến nghị chiến lược huy động máu

Nếu bạn muốn đóng góp, hãy fork repo, tạo nhánh mới và gửi pull request với mô tả rõ ràng về chức năng bạn đã cải thiện.

## Giấy phép

Dự án này hiện đang được phát triển cho mục đích nội bộ / nghiên cứu và có thể tùy chỉnh theo yêu cầu của nhóm phát triển.

---

Mô tả ngắn gọn: Blood Donor Management là hệ thống quản lý cộng đồng hiến máu hiện đại, kết hợp backend Django, frontend React và AI hỗ trợ tư vấn, giúp tối ưu hoá quy trình đăng ký, tổ chức sự kiện và quản lý nguồn máu hiệu quả hơn.

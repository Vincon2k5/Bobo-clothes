# BoBo Fashion - MERN Stack E-Commerce

BoBo Fashion is a modern MERN stack e-commerce platform for a clothing brand, featuring product browsing, cart and checkout flows, guest checkout, and admin tools for managing products and orders.
sử dụng React/Vite/Tailwind ở frontend, Node.js/Express ở backend và MongoDB làm cơ sở dữ liệu.


## Khởi chạy nhanh

### Yêu cầu
- Node.js >= 18
- MongoDB (local hoặc Atlas)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Điền MONGO_URI và các biến khác
npm run dev            # Chạy ở port 5000
npm run seed           # Seed dữ liệu mẫu
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # Chạy ở port 5173
```

Mở trình duyệt: `http://localhost:5173`

## Cấu trúc thư mục

```
├── backend/
│   ├── config/db.js              # Kết nối MongoDB
│   ├── controllers/
│   │   ├── productController.js  # CRUD + Cross-selling API
│   │   ├── cartController.js     # Quản lý giỏ hàng (guest + user)
│   │   └── orderController.js    # Tạo đơn hàng + Checkout
│   ├── middleware/
│   │   ├── auth.js               # JWT Authentication
│   │   └── errorHandler.js       # Global error handler
│   ├── models/
│   │   ├── Product.js            # Schema với variants (size/color/stock)
│   │   ├── Cart.js               # Giỏ hàng (hỗ trợ guest)
│   │   ├── Order.js              # Đơn hàng + trạng thái
│   │   └── User.js               # Người dùng + địa chỉ
│   ├── routes/                   # API routes
│   ├── services/
│   │   ├── shippingService.js    # GHN placeholder
│   │   └── paymentService.js     # MoMo/ZaloPay/VietQR placeholder
│   └── server.js                 # Entry point + security middleware
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Header/           # Header + Search + Mobile menu
        │   ├── Footer/           # Footer + Newsletter
        │   ├── MiniCart/         # Drawer giỏ hàng
        │   └── ProductCard/      # Card + hover effect + QuickAdd modal
        ├── context/CartContext.jsx  # Global cart state
        ├── pages/
        │   ├── HomePage.jsx      # Hero + Categories + Products
        │   ├── ProductDetailPage.jsx  # Detail + Complete the Look
        │   ├── CartPage.jsx      # Giỏ hàng
        │   └── CheckoutPage.jsx  # Guest Checkout + 3 bước
        └── services/api.js       # Axios instance + API functions
```

## Tích hợp bên thứ 3

Mở file tương ứng và làm theo hướng dẫn trong comments:

| Service | File | Docs |
|---------|------|------|
| Giao Hàng Nhanh | `backend/services/shippingService.js` | https://ghn.vn |
| MoMo | `backend/services/paymentService.js` | https://developers.momo.vn |
| ZaloPay | `backend/services/paymentService.js` | https://docs.zalopay.vn |
| VietQR | Đã tích hợp (không cần API key) | https://vietqr.io |

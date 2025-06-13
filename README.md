# SaaS Multi-Tenant Platform

Nền tảng SaaS multi-tenant được xây dựng với Fiber Golang (backend) và Next.js (frontend), hỗ trợ subdomain routing và hệ thống phân quyền RBAC chặt chẽ.

## Tính năng chính

🏢 **Multi-Tenant Architecture**: Hỗ trợ nhiều tenant với subdomain routing  
🔐 **RBAC System**: Phân quyền 3 cấp (System/Tenant/Customer)  
🌐 **Custom Domain**: Hỗ trợ domain riêng cho tenant  
📊 **Module System**: Bật/tắt modules theo nhu cầu  
💳 **Subscription Management**: Quản lý gói cước linh hoạt  
🔄 **Real-time Notifications**: Thông báo thời gian thực  
📱 **Responsive Design**: Giao diện tương thích mọi thiết bị  

## Công nghệ sử dụng

### Backend
- **Fiber**: High-performance Go web framework
- **GORM**: Object-relational mapping cho Go
- **PostgreSQL**: Database chính với schema separation
- **Redis**: Cache và session management
- **JWT**: Token-based authentication

### Frontend
- **Next.js 13+**: React framework với App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching và caching

### Infrastructure
- **Docker**: Containerization
- **Nginx**: Reverse proxy và SSL termination
- **Let's Encrypt**: SSL certificates
- **Prometheus/Grafana**: Monitoring

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 Reverse Proxy (Nginx)                      │
│           Subdomain/Domain Routing Logic                   │
└─────────┬───────────────────────────────┬───────────────────┘
          │                               │
    ┌─────┴─────┐                  ┌─────┴─────┐
    │  System   │                  │  Tenant   │
    │  Domain   │                  │ Subdomains│
    │zplus.vn   │                  │*.zplus.vn │
    └─────┬─────┘                  └─────┬─────┘
          │                               │
┌─────────┴───────────────────────────────┴───────────────────┐
│                Backend Services (Fiber Go)                 │
└─────────┬───────────────────────────────┬───────────────────┘
          │                               │
┌─────────┴─────┐                  ┌─────┴─────┐
│   Database    │                  │   Cache   │
│ (PostgreSQL)  │                  │  (Redis)  │
└───────────────┘                  └───────────┘
```

## Cấu trúc dự án

```
golang_saas/
├── backend/              # Fiber Go backend
├── frontend/             # Next.js frontend
├── docker/              # Docker configurations
├── docs/                # Comprehensive documentation
├── scripts/             # Build và deployment scripts
└── README.md           # Tài liệu này
```

## Cấu trúc phân quyền

### System Level (zplus.vn/admin)
- **Super Admin**: Quản lý toàn hệ thống
- **Super Manager**: Quản lý vận hành

### Tenant Level (tenant1.zplus.vn/admin)
- **Tenant Admin**: Quản lý tenant
- **Tenant Manager**: Quản lý vận hành tenant
- **Staff**: Nhân viên sử dụng services

### Customer Level (tenant1.zplus.vn/)
- **Premium Customer**: Khách hàng cao cấp
- **Standard Customer**: Khách hàng tiêu chuẩn
- **Free Customer**: Khách hàng miễn phí

## Bắt đầu nhanh

### 1. Clone repository
```bash
git clone https://github.com/ilmsadmin/golang_saas.git
cd golang_saas
```

### 2. Setup với Docker Compose (Khuyến nghị)
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Check services
docker-compose ps
```

### 3. Setup thủ công

#### Backend
```bash
cd backend
go mod download
cp .env.example .env
# Cấu hình database trong .env
go run main.go migrate
go run main.go
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Cấu hình API URL trong .env.local
npm run dev
```

### 4. Truy cập ứng dụng
- **System Admin**: http://localhost/admin
- **Tenant Demo**: http://tenant1.localhost/
- **API Documentation**: http://localhost:3000/swagger

## Tài liệu chi tiết

Xem thư mục [docs/](./docs/) để có tài liệu đầy đủ:

1. [**Tổng quan dự án**](./docs/01-project-overview.md) - Giới thiệu và mục tiêu
2. [**Kiến trúc hệ thống**](./docs/02-system-architecture.md) - Thiết kế tổng thể
3. [**Multi-Tenant Design**](./docs/03-multi-tenant-design.md) - Thiết kế đa tenant
4. [**RBAC System**](./docs/04-rbac-system.md) - Hệ thống phân quyền
5. [**Setup & Deployment**](./docs/05-setup-deployment.md) - Cài đặt và triển khai
6. [**API Documentation**](./docs/06-api-documentation.md) - Tài liệu API
7. [**Database Schema**](./docs/07-database-schema.md) - Schema database
8. [**Frontend Integration**](./docs/08-frontend-integration.md) - Tích hợp frontend
9. [**Development Workflow**](./docs/09-development-workflow.md) - Quy trình phát triển
10. [**Domain Configuration**](./docs/10-domain-configuration.md) - Cấu hình domain

## Demo Modules

Hệ thống hỗ trợ các modules có thể bật/tắt:

- **👥 User Management**: Quản lý người dùng cơ bản
- **📱 QR Check-in**: Điểm danh bằng QR code
- **🎓 LMS**: Learning Management System
- **🤝 CRM**: Customer Relationship Management
- **📊 Analytics**: Báo cáo và thống kê
- **📧 Notifications**: Hệ thống thông báo

## Roadmap

### Phase 1: Core Platform ✅
- [x] Multi-tenant architecture
- [x] Basic RBAC system
- [x] Subdomain routing
- [x] User management module

### Phase 2: Advanced Features 🚧
- [ ] Custom domain support
- [ ] QR Check-in module
- [ ] LMS module
- [ ] Advanced analytics
- [ ] API for third-party integration

### Phase 3: Enterprise Features 📋
- [ ] Advanced security features
- [ ] Advanced customization
- [ ] Mobile app support
- [ ] AI/ML integration

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

Đọc [Development Workflow](./docs/09-development-workflow.md) để biết chi tiết quy trình phát triển.

## License

Dự án này sử dụng MIT License. Xem file [LICENSE](LICENSE) để biết chi tiết.

## Hỗ trợ

- 📧 Email: support@zplus.vn
- 💬 Discord: [Join our Discord](https://discord.gg/zplus)
- 📖 Documentation: [Full Documentation](./docs/README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/ilmsadmin/golang_saas/issues)

---

Made with ❤️ by [ZPlus Team](https://zplus.vn)
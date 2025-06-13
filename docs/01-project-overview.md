# Tổng quan dự án

## Giới thiệu

Nền tảng SaaS Multi-Tenant là một hệ thống cho phép cung cấp dịch vụ phần mềm dưới dạng SaaS (Software as a Service) với khả năng phục vụ nhiều tenant (người thuê) trên cùng một hệ thống.

## Mục tiêu dự án

### 1. Cung cấp nền tảng SaaS linh hoạt
- Cho phép nhiều tenant sử dụng cùng một hệ thống
- Mỗi tenant có domain/subdomain riêng
- Dữ liệu được cách ly hoàn toàn giữa các tenant

### 2. Hệ thống phân quyền chặt chẽ
- **System Level**: Super Admin, Super Manager
- **Tenant Level**: Admin, Manager
- **Customer Level**: End Users

### 3. Quản lý module và gói cước
- System admin quản lý modules cho tenant
- Tenant admin quản lý services cho customers
- Flexible pricing plans

## Các thành phần chính

### 1. System Management (zplus.vn/admin)
- Quản lý tenant
- Quản lý gói cước (plans) cho tenant
- Quản lý modules (QR Check-in, LMS, CRM...)
- Bật/tắt modules cho từng tenant
- Giám sát hệ thống

### 2. Tenant Management (tenant1.zplus.vn/admin)
- Quản lý customers
- Quản lý gói cước cho customers
- Quản lý nội dung và dịch vụ
- Thông báo cho customers
- Báo cáo và thống kê

### 3. Customer Interface (tenant1.zplus.vn/)
- Sử dụng các dịch vụ được cung cấp
- Quản lý profile cá nhân
- Đăng ký/hủy gói services
- Nhận thông báo từ tenant

## Lợi ích

### Đối với System Owner
- Thu nhập từ subscription của tenant
- Quản lý tập trung
- Scalability cao

### Đối với Tenant
- Chi phí thấp (không cần phát triển từ đầu)
- Focus vào business logic
- Subdomain/domain riêng
- Customization theo nhu cầu

### Đối với Customer
- Trải nghiệm seamless
- Giá cả hợp lý
- Nhiều lựa chọn services

## Mô hình kinh doanh

1. **B2B2C Model**: System Owner → Tenant → Customer
2. **Subscription-based**: Monthly/Yearly plans
3. **Module-based pricing**: Pay for what you use
4. **White-label solution**: Tenant có thể brand riêng

## Roadmap phát triển

### Phase 1: Core Platform
- Multi-tenant architecture
- Basic RBAC system
- Subdomain routing
- Basic modules (User Management, Billing)

### Phase 2: Advanced Features
- Custom domain support
- Advanced modules (QR Check-in, LMS, CRM)
- Advanced analytics
- API for third-party integration

### Phase 3: Enterprise Features
- Advanced security features
- Advanced customization
- Mobile app support
- AI/ML integration
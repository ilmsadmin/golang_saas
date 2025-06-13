# SaaS Multi-Tenant Platform Documentation

Chào mừng bạn đến với tài liệu hướng dẫn cho nền tảng SaaS Multi-Tenant. Dự án này được xây dựng với Fiber Golang cho backend và Next.js cho frontend.

## Mục lục

1. [Tổng quan dự án](./01-project-overview.md)
2. [Kiến trúc hệ thống](./02-system-architecture.md)
3. [Thiết kế Multi-Tenant](./03-multi-tenant-design.md)
4. [Hệ thống phân quyền RBAC](./04-rbac-system.md)
5. [Cài đặt và triển khai](./05-setup-deployment.md)
6. [API Documentation](./06-api-documentation.md)
7. [Database Schema](./07-database-schema.md)
8. [Frontend Integration](./08-frontend-integration.md)
9. [Development Workflow](./09-development-workflow.md)
10. [Cấu hình Domain và Subdomain](./10-domain-configuration.md)

## Cấu trúc thư mục

```
golang_saas/
├── backend/              # Fiber Golang backend
├── frontend/             # Next.js frontend
├── docker/              # Docker configurations
├── docs/                # Documentation (thư mục này)
├── scripts/             # Build và deployment scripts
└── README.md
```

## Công nghệ sử dụng

### Backend
- **Fiber**: Web framework cho Go
- **GORM**: ORM cho Go
- **PostgreSQL**: Database chính
- **Redis**: Cache và session management
- **Docker**: Containerization

### Frontend
- **Next.js**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

## Bắt đầu nhanh

1. Clone repository
2. Đọc [Setup và Deployment](./05-setup-deployment.md)
3. Cấu hình environment
4. Khởi chạy services với Docker Compose

## Liên hệ và hỗ trợ

Đối với các câu hỏi về documentation, vui lòng tạo issue trong repository.
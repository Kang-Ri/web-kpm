# Web KPM - LMS & Product Management System

Full-stack application untuk Learning Management System (LMS) dengan fitur Product Management terintegrasi.

## 🏗️ Project Structure

```
web-kpm/
├── backend/          # Express.js API
│   ├── app/         # Application code
│   ├── migrations/  # Database migrations
│   └── ...
│
├── frontend/        # Next.js Application
│   ├── app/        # Next.js App Router
│   ├── components/ # React components
│   ├── lib/        # Utilities & API client
│   └── ...
│
└── README.md       # This file
```

## 🚀 Tech Stack

### Backend
- **Framework:** Express.js
- **Database:** MySQL (Sequelize ORM)
- **Authentication:** JWT
- **Payment:** Midtrans (planned)

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand + React Query
- **UI Components:** Custom components with shadcn/ui style

## 📦 Features

### LMS Module
- ✅ Student Management (Siswa)
- ✅ Parent Data Management (Orang Tua)
- ✅ Class Enrollment (Siswa Kelas)
- ✅ Material Access Control (Akses Materi)
- ✅ Dynamic CTA Buttons with Scheduling (Materi Button)
- ✅ Re-registration with Payment

### Product Management
- ✅ 3-Level Product Hierarchy (Parent1, Parent2, Product)
- ✅ Dynamic Form Builder
- ✅ Order Management with Snapshot
- ✅ Payment Integration (planned)

## 🛠️ Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Configure your environment
npm run dev
```

## 🌐 URLs

- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:3000

## 📚 Documentation

- [API Documentation](./docs/api-documentation.md)
- [Database Schema](./docs/database-schema.md)
- [LMS Module Guide](./docs/lms-module.md)

## 👥 User Roles

1. **Super Admin** - Full access
2. **Admin** - Manage content & users
3. **Guru** - Manage materials & classes
4. **PJ** - Manage specific programs
5. **Siswa** - Access materials & classes

## 📝 License

Private - All rights reserved

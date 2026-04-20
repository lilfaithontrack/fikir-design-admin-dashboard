# Fikir Design Admin Dashboard

A modern, bilingual (English/Amharic) admin dashboard and inventory management system built with Next.js 14, TypeScript, and MongoDB. Features Ethiopian flag-inspired branding with green, gold, and red color scheme.

## 🎨 Features

- **Bilingual Support**: Full English and Amharic language support
- **Ethiopian Branding**: Color scheme inspired by Ethiopian flag (Green, Gold, Red)
- **Modern UI**: Built with Tailwind CSS and custom components
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Dashboard Analytics**: Real-time statistics and data visualization
- **Product Management**: Complete CRUD operations for products
- **Order Management**: Track orders from creation to delivery
- **Inventory Tracking**: Real-time stock monitoring with low-stock alerts
- **Customer Management**: Comprehensive customer database
- **Analytics & Reports**: Business intelligence and performance metrics

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Fonts**: Inter (English) + Noto Sans Ethiopic (Amharic)

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager

## 🛠️ Installation

1. **Navigate to the project directory**:
```bash
cd "c:/Users/kalu4/Pictures/fikir design inventory/fikir-admin-dashboard"
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Login

This is a demo prototype. Use any credentials to login:
- Email: `admin@fikirdesign.com` (or any email)
- Password: `password` (or any password)

## 📱 Pages

### Authentication
- **Login Page** (`/login`) - Bilingual login with Ethiopian branding

### Dashboard
- **Dashboard Home** (`/dashboard`) - Overview with statistics, recent orders, and low stock alerts
- **Products** (`/dashboard/products`) - Product catalog management
- **Orders** (`/dashboard/orders`) - Order tracking and management
- **Customers** (`/dashboard/customers`) - Customer database
- **Inventory** (`/dashboard/inventory`) - Stock level monitoring
- **Analytics** (`/dashboard/analytics`) - Business analytics and reports
- **Settings** (`/dashboard/settings`) - System configuration

## 🎨 Color Scheme

### Primary Colors (Ethiopian Flag)
- **Green** (`#078930`): Growth, prosperity - Primary actions
- **Gold** (`#FCDD09`): Quality, premium - Highlights and accents
- **Red** (`#DA121A`): Strength, urgency - Alerts and warnings
- **White** (`#FFFFFF`): Purity, cleanliness - Backgrounds

### Extended Palette
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#3B82F6`

## 🌍 Internationalization

The dashboard supports both English and Amharic languages:

- **English**: Default language
- **Amharic**: Full translation support with Noto Sans Ethiopic font

Toggle between languages using the language switcher in the header.

## 📁 Project Structure

```
fikir-admin-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── login/             # Login page
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Layout components
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## 🎯 Key Components

### UI Components
- **Button**: Multiple variants (default, secondary, destructive, outline, ghost)
- **Card**: Container component with header, content, and footer
- **Input**: Form input with focus states
- **Badge**: Status indicators with color variants

### Layout Components
- **Sidebar**: Navigation menu with Ethiopian branding
- **Header**: Search, notifications, and user profile
- **Dashboard Layout**: Main layout wrapper

## 📊 Demo Data

The prototype includes sample data for:
- Revenue statistics
- Order tracking
- Product inventory
- Customer information
- Low stock alerts

## 🔧 Customization

### Changing Colors
Edit `tailwind.config.ts` to modify the color scheme:

```typescript
colors: {
  primary: { DEFAULT: '#078930', ... },
  secondary: { DEFAULT: '#FCDD09', ... },
  accent: { DEFAULT: '#DA121A', ... },
}
```

### Adding Translations
Add new translation keys in the component files or create a centralized i18n system.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
```bash
vercel deploy
```

## 📝 Development Roadmap

- [x] Project setup and configuration
- [x] Ethiopian brand colors and fonts
- [x] Authentication pages
- [x] Dashboard layout
- [x] Dashboard home page
- [ ] Products management page
- [ ] Orders management page
- [ ] Inventory management page
- [ ] Customers management page
- [ ] Analytics page
- [ ] Settings page
- [ ] MongoDB integration
- [ ] API endpoints
- [ ] Full i18n implementation

## 🤝 Contributing

This is a prototype/demo project. For production use, additional features needed:
- Real authentication system
- MongoDB database integration
- API security
- Form validation
- Error handling
- Testing suite

## 📄 License

This project is for demonstration purposes.

## 👨‍💻 Author

Created for Fikir Design - Ethiopian Admin Dashboard Prototype

---

**Note**: This is a demo prototype. For production deployment, implement proper authentication, database connections, and security measures.

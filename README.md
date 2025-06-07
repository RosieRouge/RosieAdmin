# Community Connect - Admin Panel

A comprehensive admin panel for managing the Community Connect platform. Built with Vue 3, TypeScript, and modern web technologies.

## Features

### Dashboard
- Real-time platform statistics and metrics
- User growth analytics
- Community activity monitoring
- Recent activity feed

### User Management
- Comprehensive user listing with search and filtering
- User status management (Active, Inactive, Banned)
- Role-based permissions (Admin, Moderator, Member)
- Bulk operations for user management
- Detailed user profiles and activity tracking

### Community Management
- Community oversight and moderation
- Member management and role assignments
- Community analytics and performance metrics

### Content Moderation
- Topic and discussion management
- Message monitoring and moderation tools
- Content reporting and resolution

### Event Management
- Platform-wide event oversight
- Event approval and moderation
- Attendance tracking and analytics

### Analytics & Reporting
- Detailed platform analytics
- User engagement metrics
- Community growth tracking
- Export functionality for reports

## Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Custom CSS with modern design patterns
- **Icons**: Font Awesome
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Chart.js (planned)
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
admin-panel/
├── src/
│   ├── components/          # Reusable components
│   │   └── AdminLayout.vue  # Main layout component
│   │   └── ...
│   ├── views/               # Page components
│   │   ├── DashboardView.vue
│   │   ├── UsersView.vue
│   │   ├── CommunitiesView.vue
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   ├── lib/                 # Utility libraries
│   │   └── supabase.ts      # Supabase client
│   └── router/              # Vue Router configuration
├── public/                  # Static assets
└── ...
```

## Features Roadmap

### ✅ Completed
- Basic admin layout and navigation
- Dashboard with statistics
- User management interface
- Responsive design

### 🚧 In Progress
- Real-time data integration with Supabase
- Advanced filtering and search
- Bulk operations

### 📋 Planned
- Advanced analytics and charts
- Content moderation tools
- Community management features
- Event management interface
- Settings and configuration panel
- Export and reporting features
- Real-time notifications
- Audit logging

## Development

### Code Style
- ESLint for code linting
- TypeScript for type safety
- Vue 3 Composition API
- Modular component architecture

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Follow the existing code style and structure
2. Use TypeScript for all new code
3. Write descriptive commit messages
4. Test features thoroughly before submitting

## Related Projects

- [Community Connect App](../community-connect-vue/) - Main user-facing application

## License

This project is part of the Community Connect platform.

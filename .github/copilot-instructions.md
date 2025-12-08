# Monarch Property Management - AI Agent Instructions

## Architecture Overview
- React 18 SPA with TypeScript and Vite for build optimization
- Supabase backend with PostgreSQL and Row Level Security (RLS)
- Components using Radix UI primitives with Tailwind CSS styling
- Real-time features via Supabase WebSocket subscriptions
- File storage using Supabase Storage buckets

## Critical Patterns

### State Management
- Use `@tanstack/react-query` for server state
- Component-local state with React hooks
- Real-time subscriptions for live updates
- Example: `src/hooks/useRealTimeNotifications.ts`

### Authentication & Authorization
- All database access must respect RLS policies
- Use role-based access control (RBAC) via Supabase
- Always check user roles before rendering sensitive UI
- Example: `src/components/ProtectedRoute.tsx`

### Data Access Patterns
- Use typed Supabase client from `src/lib/supabase`
- Implement optimistic updates for better UX
- Cache invalidation via React Query
- Example: `src/api/vendors.ts`

### Component Development
- Follow atomic design pattern in `src/design-system`
- Use Radix UI primitives with custom styling
- Story-first development with Storybook
- Example: `src/design-system/Button`

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run Storybook
npm run storybook
```

### Common Tasks
- New components: Create in `src/design-system` with stories
- Database changes: Add migrations in `supabase/migrations`
- Role changes: Update RLS in `supabase/migrations`

### Testing & Verification
- Run `npm run test` for unit tests
- Use admin testing center at `/admin/test`
- Verify changes in Storybook

## Integration Points
- Stripe: Payment processing via Edge Functions
- Resend: Email automation system
- CDN: Asset delivery through Vercel Edge Network
- Analytics: Custom events tracking

## Project Structure
```
src/
  ├── api/          # API client functions
  ├── components/   # Shared components
  ├── design-system/# UI component library
  ├── hooks/        # Custom React hooks
  ├── lib/          # Utilities and configs
  ├── pages/        # Route components
  └── types/        # TypeScript definitions
```

## Performance Guidelines
- Implement lazy loading for routes and large components
- Use React.memo() for expensive renders
- Optimize images via next/image
- Cache expensive queries with React Query
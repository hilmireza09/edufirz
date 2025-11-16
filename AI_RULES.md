# AI Development Rules

## Tech Stack Overview

• **Frontend Framework**: React 18 with TypeScript for building user interfaces
• **Styling**: Tailwind CSS with shadcn/ui components for consistent, responsive design
• **Routing**: React Router v6 for client-side navigation
• **State Management**: React Context API with custom hooks for state management
• **Backend Integration**: Supabase for authentication, database, and real-time features
• **Data Fetching**: TanStack Query (React Query) for server state management
• **Form Handling**: React Hook Form with Zod for validation
• **UI Components**: Radix UI primitives with Tailwind styling
• **Build Tool**: Vite for fast development and optimized builds
• **Deployment**: Lovable platform with automatic CI/CD

## Library Usage Rules

### Authentication & User Management
- **Supabase Auth** is the only authentication system. Do not add alternatives like Firebase Auth or Auth0.
- Use the existing `useAuth` hook for all authentication needs.
- Store user preferences in the `profiles` table in Supabase.

### UI Components
- **shadcn/ui** components are the standard. Customize them only through Tailwind classes.
- **Radix UI** primitives can be used directly when shadcn/ui doesn't have the needed component.
- **Tailwind CSS** is the only styling solution. Do not use styled-components, emotion, or inline styles.
- **Lucide React** is the exclusive icon library. Do not引入 other icon libraries.

### Data Management
- **TanStack Query** must be used for all server state management.
- **Supabase client** is the only data fetching mechanism. Do not add axios, fetch, or other HTTP clients.
- **Zod** is required for all form and API response validation.

### Form Handling
- **React Hook Form** is mandatory for all forms.
- Always use Zod resolvers for form validation.
- Implement proper error handling and user feedback for all forms.

### Routing
- **React Router v6** is the only routing solution.
- All new pages must be added to the router in `src/App.tsx`.
- Use the existing route structure and naming conventions.

### State Management
- Use **React Context** for global state that isn't server-related.
- **TanStack Query** handles all server state - do not duplicate this in context or component state.
- Keep component state local unless it's truly needed globally.

### Notifications & Toasts
- **Sonner** is used for all toast notifications.
- **shadcn/ui Toast** component is used for form validation messages.
- Do not引入 other toast/notification libraries.

### Charts & Data Visualization
- **Recharts** is the approved charting library.
- Use Tailwind for any data visualization that doesn't require complex charts.

### Animations
- Use **Tailwind's animation utilities** for simple animations.
- Leverage existing keyframes defined in `tailwind.config.ts`.
- Do not引入 additional animation libraries like Framer Motion or GSAP.

### File Structure
- Pages go in `src/pages/`
- Components go in `src/components/`
- Hooks go in `src/hooks/`
- Shared utilities go in `src/lib/`
- Supabase integration files remain in `src/integrations/supabase/`

### Code Quality
- All TypeScript files must pass type checking.
- Follow existing code patterns and conventions.
- Keep components small and focused (under 150 lines when possible).
- Create new files for new components rather than adding to existing ones.
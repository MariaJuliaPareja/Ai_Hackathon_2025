# Care Connect - Next.js 14 Project

A Next.js 14 application with TypeScript, Shadcn/ui, and Firebase integration for connecting caregivers, seniors, and families.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Shadcn/ui** components
- **Firebase Authentication** with email/password and Google sign-in
- **Three User Roles**: Caregiver, Senior, and Family
- **Role-based routing** and redirects
- **Protected routes** with authentication guards

## Project Structure

```
├── app/
│   ├── dashboard/      # Main dashboard page
│   ├── matches/         # Matching functionality
│   ├── training/        # Training resources
│   ├── community/       # Community features
│   ├── onboarding/     # User onboarding
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── layout.tsx      # Root layout with AuthProvider
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   ├── ui/             # Shadcn/ui components
│   └── AuthGuard.tsx   # Authentication guard component
├── contexts/
│   └── AuthContext.tsx # Firebase auth context
├── lib/
│   ├── firebase/       # Firebase configuration and auth
│   └── utils.ts        # Utility functions
└── middleware.ts       # Next.js middleware

```

## Quick Start

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Quick Setup (5 minutes)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication (Email/Password + Google)
   - Create Firestore database
   - Create Storage bucket

3. **Configure environment**:
   Create `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

**For complete setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## User Roles

- **Caregiver**: Professional caregivers looking to connect with seniors
- **Senior**: Seniors seeking caregiving services
- **Family**: Family members managing care for seniors

## Authentication Flow

1. User registers/logs in with email/password or Google
2. New users are redirected to `/onboarding` to select their role
3. After onboarding, users are redirected to `/dashboard`
4. All protected routes use `AuthGuard` to verify authentication and role

## Pages

- `/` - Home page (redirects to dashboard if logged in)
- `/login` - Login page
- `/register` - Registration page
- `/onboarding` - Role selection for new users
- `/dashboard` - Main dashboard (protected)
- `/matches` - Matching functionality (protected)
- `/training` - Training resources (protected)
- `/community` - Community features (protected)

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Firebase (Auth, Firestore)
- React Context API

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

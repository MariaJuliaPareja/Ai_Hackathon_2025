# Step-by-Step Setup Guide

This guide will walk you through setting up and running the Care Connect application.

## Prerequisites

Before starting, ensure you have:
- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Firebase account** ([Create account](https://firebase.google.com/))
- **Google Cloud account** (for Cloud Functions - optional for basic setup)

## Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies including:
- Next.js 14
- React & React DOM
- Firebase SDK
- Shadcn/ui components
- Framer Motion
- React Hook Form & Zod
- React Dropzone (for photo uploads)
- And more...

**Expected time**: 2-5 minutes

## Step 2: Set Up Firebase Project

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "care-connect")
4. Follow the setup wizard
5. Enable Google Analytics (optional)

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Enable **Google** provider
5. Add authorized domains if needed

### 2.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Enable**

### 2.4 Set Up Firebase Storage (Optional - for certification files only)

**Note**: Profile photos are stored as Base64 strings in Firestore to eliminate storage costs. Storage is only needed if you want to upload certification files.

If you need certification file uploads:
1. Go to **Storage**
2. Click **Get started**
3. Start in test mode
4. Use default bucket location

### 2.5 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web** icon (`</>`)
4. Register app with nickname (e.g., "Care Connect Web")
5. Copy the Firebase configuration object

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Mac/Linux
touch .env.local
```

Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: For embedding function (if deployed)
NEXT_PUBLIC_EMBEDDING_FUNCTION_URL=https://us-central1-your-project.cloudfunctions.net/generate_embedding
```

**Important**: Replace all placeholder values with your actual Firebase config values.

## Step 4: Set Up Firestore Security Rules (Development)

For development, you can use these permissive rules. **Update for production!**

Go to **Firestore Database** → **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Caregivers can read/write their own profile
    match /caregivers/{caregiverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == caregiverId;
    }
    
    // Seniors can read/write their own data
    match /seniors/{seniorId} {
      allow read, write: if request.auth != null && request.auth.uid == seniorId;
      
      // Matches subcollection
      match /matches/{matchId} {
        allow read, write: if request.auth != null && request.auth.uid == seniorId;
      }
    }
    
    // Matching queue
    match /matching_queue/{queueId} {
      allow read, write: if request.auth != null;
    }
    
    // Interests
    match /interests/{interestId} {
      allow read, write: if request.auth != null;
    }
    
    // Matches
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
    
    // Config
    match /config/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

## Step 5: Set Up Storage Security Rules (Optional)

**Note**: Profile photos use Base64 storage in Firestore. Storage rules are only needed for certification file uploads.

If you set up Storage for certification files, go to **Storage** → **Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Certification files (profile photos use Base64 in Firestore)
    match /caregivers/{userId}/certifications/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 6: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

## Step 7: Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Step 8: Test the Application

### 8.1 Create an Account

1. Click **Register**
2. Fill in:
   - Display Name
   - Email
   - Password (min 6 characters)
   - Select Role: **Caregiver**, **Senior**, or **Family**
3. Click **Register**

### 8.2 Complete Onboarding (for Caregivers)

If you registered as a **Caregiver**:
1. You'll be redirected to onboarding
2. Complete all 5 steps:
   - Personal Information
   - Professional Information
   - Experience Description
   - Availability
   - Preferences
3. Submit the form

### 8.3 Test Other Features

- **Dashboard**: View your dashboard after login
- **Matches**: View matches (for seniors)
- **Training**: Access training resources
- **Community**: View community features

## Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Solution**: Check your `.env.local` file has all required variables and correct values.

### Issue: "Permission denied" in Firestore

**Solution**: 
1. Check Firestore security rules
2. Ensure you're authenticated
3. Verify user has correct permissions

### Issue: "Module not found" errors

**Solution**: 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution**: 
```bash
# Use a different port
npm run dev -- -p 3001
```

### Issue: Firebase Storage upload fails

**Solution**:
1. Check Storage rules
2. Verify bucket exists
3. Check file size limits

## Optional: Set Up Cloud Functions

If you want to use the Cloud Functions (embedding generation, matching, etc.):

### Prerequisites
- Google Cloud SDK installed
- Billing enabled on GCP project
- Service account with permissions

### Deploy Functions

1. **Generate Embedding Function**:
```bash
cd functions/generate_embedding
chmod +x deploy.sh
# Edit deploy.sh with your project details
./deploy.sh
```

2. **Process Matching Function**:
```bash
cd functions/process_matching
chmod +x deploy.sh
# Edit deploy.sh with your project details
./deploy.sh
```

3. **Retrain Ranking Model Function**:
```bash
cd functions/retrain_ranking_model
chmod +x deploy.sh
chmod +x setup_scheduler.sh
# Edit deploy.sh with your project details
./deploy.sh
./setup_scheduler.sh
```

## Production Build

To create a production build:

```bash
npm run build
npm start
```

## Next Steps

1. **Add more features**: Customize the UI and add more functionality
2. **Set up Cloud SQL**: For production matching (requires PostgreSQL with pgvector)
3. **Deploy to Vercel**: 
   ```bash
   npm install -g vercel
   vercel
   ```
4. **Set up monitoring**: Configure error tracking and analytics
5. **Update security rules**: Make Firestore/Storage rules production-ready

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] `.env.local` file created with Firebase config
- [ ] Firestore security rules configured
- [ ] Storage security rules configured
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at http://localhost:3000
- [ ] Test account created
- [ ] Onboarding completed (for caregivers)

## Getting Help

- Check the [README.md](./README.md) for project overview
- Review Firebase documentation: https://firebase.google.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Review function-specific READMEs in `functions/` directories

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Firebase (if using Firebase CLI)
firebase login
firebase init
firebase deploy
```

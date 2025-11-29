# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (if not done)
```bash
npm install
```

### Step 2: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name → **Continue**
4. Disable Google Analytics (optional) → **Create project**
5. Click **Continue**

### Step 3: Enable Firebase Services

#### Authentication
1. Click **Authentication** in left menu
2. Click **Get started**
3. Enable **Email/Password** → **Save**
4. Enable **Google** → **Save**

#### Firestore Database
1. Click **Firestore Database** in left menu
2. Click **Create database**
3. Select **Start in test mode** → **Next**
4. Choose location → **Enable**

#### Storage (Optional - Only for Certification Files)
**Note**: Profile photos are stored as Base64 strings in Firestore to eliminate storage costs.

If you need to upload certification files, you can set up Storage:
1. Click **Storage** in left menu
2. Click **Get started**
3. Start in **test mode** → **Next**
4. Use default location → **Done**

### Step 4: Get Firebase Config

1. Click **⚙️ Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **Web** icon (`</>`)
4. Register app: Name it "Care Connect" → **Register app**
5. **Copy the config object** (you'll need this)

### Step 5: Create Environment File

Create `.env.local` in the project root:

**Windows (PowerShell)**:
```powershell
New-Item -Path .env.local -ItemType File
notepad .env.local
```

**Mac/Linux**:
```bash
touch .env.local
nano .env.local
```

**Paste this template and fill in your values**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 6: Set Firestore Rules (Temporary - Development Only)

1. Go to **Firestore Database** → **Rules** tab
2. Replace with this (for development):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click **Publish**

**⚠️ WARNING**: These rules allow any authenticated user to read/write. Update for production!

### Step 7: Set Storage Rules (Optional)

**Note**: Profile photos use Base64 storage in Firestore. Storage is only needed for certification file uploads.

If you set up Storage:
1. Go to **Storage** → **Rules** tab
2. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click **Publish**

### Step 8: Run the App

```bash
npm run dev
```

### Step 9: Open Browser

Navigate to: **http://localhost:3000**

### Step 10: Test It!

1. Click **Register**
2. Create an account:
   - Name: "Test User"
   - Email: test@example.com
   - Password: test123456
   - Role: **Caregiver**
3. Complete onboarding form
4. Explore the dashboard!

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install` completed)
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created
- [ ] Storage bucket created (optional - only for certification files)
- [ ] `.env.local` file created with correct values
- [ ] Firestore rules updated
- [ ] Storage rules updated (optional)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can register a new account
- [ ] Can log in

## 🐛 Common Issues

### "Firebase: Error (auth/configuration-not-found)"
- Check `.env.local` exists and has all 6 variables
- Restart dev server after creating `.env.local`

### "Permission denied" errors
- Check Firestore/Storage rules are published
- Ensure you're logged in

### Port 3000 in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Module not found errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

- Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
- Check [README.md](./README.md) for project overview
- Review function READMEs in `functions/` for Cloud Functions setup

## 🎯 What You Can Do Now

- ✅ Register/Login with email or Google
- ✅ Complete caregiver onboarding (5-step form with photo upload)
- ✅ Upload profile photos (automatically compressed to Base64)
- ✅ View dashboard
- ✅ Access matches page (for seniors)
- ✅ View training and community pages

## 📸 Profile Photos (Base64)

This app stores profile photos as Base64-encoded strings directly in Firestore to eliminate storage costs. Images are automatically compressed to ~200KB before encoding.

⚠️ **Important**: Firestore documents have a 1MB limit. Our compression ensures photos stay well under this limit.

## 🔧 Optional: Cloud Functions

Cloud Functions are optional for basic functionality:
- `generate_embedding` - Generates embeddings (needs model in Cloud Storage)
- `process_matching` - Processes matches (needs Cloud SQL)
- `retrain_ranking_model` - Retrains model (needs training data)

See function-specific READMEs for deployment.


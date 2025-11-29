# 🚀 How to Run This Project - Step by Step

## Prerequisites Check

Before starting, make sure you have:
- ✅ **Node.js 18+** installed ([Download here](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **A web browser** (Chrome, Firefox, Edge, etc.)

Check Node.js:
```bash
node --version
# Should show v18.x.x or higher
```

---

## Step 1: Install Dependencies (2 minutes)

Open terminal/command prompt in this folder and run:

```bash
npm install
```

**What this does**: Downloads all required packages (Next.js, React, Firebase, etc.)

**Expected output**: 
```
added 482 packages, and audited 482 packages
```

**If you see errors**: Make sure you're in the project directory (`D:\New\Ai_Hackathon_2025`)

---

## Step 2: Create Firebase Project (5 minutes)

### 2.1 Go to Firebase Console
1. Open browser → Go to https://console.firebase.google.com/
2. Sign in with Google account

### 2.2 Create New Project
1. Click **"Add project"** (or "Create a project")
2. Enter project name: `care-connect` (or any name)
3. Click **Continue**
4. **Disable Google Analytics** (optional, for simplicity)
5. Click **Create project**
6. Wait for setup → Click **Continue**

### 2.3 Enable Authentication
1. In Firebase Console, click **Authentication** (left menu)
2. Click **Get started**
3. Click **Email/Password** tab
4. Toggle **Enable** → Click **Save**
5. Click **Google** tab
6. Toggle **Enable** → Enter support email → Click **Save**

### 2.4 Create Firestore Database
1. Click **Firestore Database** (left menu)
2. Click **Create database**
3. Select **Start in test mode** → Click **Next**
4. Choose location (pick closest to you) → Click **Enable**
5. Wait for database to initialize

### 2.5 Create Storage Bucket (Optional)
**Note**: Profile photos are stored as Base64 in Firestore. Storage is only needed for certification file uploads.

If you want to upload certification files:
1. Click **Storage** (left menu)
2. Click **Get started**
3. Select **Start in test mode** → Click **Next**
4. Use default location → Click **Done**

---

## Step 3: Get Firebase Configuration (2 minutes)

1. In Firebase Console, click **⚙️ (Settings)** → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click **Web** icon (`</>`)
4. Register app:
   - App nickname: `Care Connect Web`
   - Click **Register app**
5. **Copy the config** - You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

---

## Step 4: Create Environment File (1 minute)

### Windows (PowerShell):
```powershell
# Create the file
New-Item -Path .env.local -ItemType File

# Open in Notepad
notepad .env.local
```

### Mac/Linux:
```bash
touch .env.local
nano .env.local
```

### Add this content (replace with YOUR values from Step 3):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Save the file** (Ctrl+S or Cmd+S)

---

## Step 5: Set Firestore Rules (1 minute)

1. In Firebase Console → **Firestore Database** → **Rules** tab
2. Replace the rules with:
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

**⚠️ Note**: These are permissive rules for development. Update for production!

---

## Step 6: Set Storage Rules (Optional - 1 minute)

**Note**: Profile photos use Base64 storage. Storage rules are only needed for certification files.

If you set up Storage:
1. In Firebase Console → **Storage** → **Rules** tab
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

---

## Step 7: Verify Setup (30 seconds)

Run the verification script:

```bash
npm run verify
```

**Expected output**:
```
✅ .env.local file exists with all required variables
✅ node_modules directory exists
✅ Key dependencies present
✅ Setup looks good! You can run: npm run dev
```

If you see errors, fix them before proceeding.

---

## Step 8: Start Development Server (30 seconds)

```bash
npm run dev
```

**Expected output**:
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  ✓ Ready in 2.5s
```

---

## Step 9: Open in Browser

1. Open your browser
2. Go to: **http://localhost:3000**

You should see the **Care Connect** home page!

---

## Step 10: Test the Application

### Create Your First Account

1. Click **"Register"** button
2. Fill in the form:
   - **Display Name**: Your name
   - **Email**: your-email@example.com
   - **Password**: (at least 6 characters)
   - **I am a**: Select **Caregiver** (to test onboarding)
3. Click **Register**

### Complete Onboarding (if Caregiver)

1. You'll be redirected to onboarding
2. Complete all 5 steps:
   - **Step 1**: Personal info (name, location, photo)
   - **Step 2**: Professional info (experience, specializations, certifications)
   - **Step 3**: Experience description
   - **Step 4**: Availability schedule
   - **Step 5**: Preferences
3. Click **"Completar Perfil"** (Complete Profile)

### Explore the App

- **Dashboard**: View your main dashboard
- **Matches**: See matches (for seniors)
- **Training**: Access training resources
- **Community**: View community features

---

## 🎉 Success!

If you can:
- ✅ See the home page
- ✅ Register an account
- ✅ Log in
- ✅ Complete onboarding
- ✅ View dashboard

**You're all set!** 🚀

---

## 🐛 Troubleshooting

### Problem: "Firebase: Error (auth/configuration-not-found)"

**Solution**:
1. Check `.env.local` file exists
2. Verify all 6 environment variables are present
3. Make sure values match your Firebase config (no quotes needed)
4. **Restart the dev server** after creating `.env.local`

### Problem: "Permission denied" in Firestore

**Solution**:
1. Go to Firebase Console → Firestore → Rules
2. Make sure rules are published
3. Verify you're logged in to the app

### Problem: Port 3000 already in use

**Solution**:
```bash
# Use a different port
npm run dev -- -p 3001
# Then go to http://localhost:3001
```

### Problem: Module not found errors

**Solution**:
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Can't see matches

**Solution**:
- Matches are generated by the `process_matching` Cloud Function
- For testing, you can manually create match documents in Firestore
- Or deploy the Cloud Functions (see function READMEs)

---

## 📚 Additional Resources

- **Detailed Setup**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Quick Reference**: See [QUICK_START.md](./QUICK_START.md)
- **Project Overview**: See [README.md](./README.md)

---

## 🎯 What's Next?

1. **Customize the UI**: Modify colors, fonts, layouts
2. **Add Features**: Extend functionality
3. **Deploy**: Deploy to Vercel or other hosting
4. **Set up Cloud Functions**: For full matching functionality
5. **Add Tests**: Write unit and integration tests

---

## 💡 Tips

- Keep the terminal open while developing (shows errors)
- Check browser console (F12) for client-side errors
- Firebase Console shows real-time database changes
- Use `npm run verify` anytime to check setup

---

**Need Help?** Check the troubleshooting section or review the detailed guides!


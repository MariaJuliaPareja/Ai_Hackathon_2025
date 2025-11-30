# Seeder Scripts

## Caregiver Seeder

Uploads caregiver data from CSV to Firestore.

### Usage

```bash
# Use default CSV file (cuidador_processed.csv)
npm run seed:caregivers

# Or specify a custom CSV file
npm run seed:caregivers -- path/to/custom.csv
```

### Prerequisites

1. **Firebase Configuration**: The script uses the same Firebase Web SDK as your Next.js app.

   **Required Environment Variables** (in `.env.local`):
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

   The script automatically loads `.env.local` using `dotenv` and uses the Firebase config from `lib/firebase/config.ts`.

   **Alternative**: If you prefer a simpler approach (no API key needed), you can use `firebase-admin` SDK instead:
   - Only needs `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - No API key required for server-side writes
   - See comment in `seedCaregiversFromCSV.ts` for implementation

2. **CSV File Format**: The script expects `cuidador_processed.csv` in the project root with these columns:
   - `user_code`: Document ID in Firestore
   - `Name`: Caregiver name
   - `age`: Age
   - `exp_years`: Years of experience
   - `gender_type`: Gender (1=F, 2=M)
   - `payment`: Hourly rate
   - `CARE01-CARE09`: Care skills (1=has skill, 0=doesn't)
   - `HEALTH01-HEALTH14`: Health conditions (1=specialized, 0=not)
   - `Lunes-Domingo`: Availability (1=available, 0=not)
   - `especializacion_val`, `certificacion_val`, `descripcion_val`, `turno_val`: Encoded values

### What It Does

1. Reads CSV file
2. Parses each row
3. Maps CSV fields to Firestore structure:
   - CARE01-CARE09 → `skills` array
   - HEALTH01-HEALTH14 → `specializations` array
   - Lunes-Domingo → `availability` object
   - Other fields → direct mapping
4. Uploads to `/caregivers/{user_code}` collection
5. Sets `active: true` and `onboardingCompleted: true`

### Output

The script will:
- Show progress for each caregiver uploaded
- Display summary with success/error counts
- Log any errors encountered

### Example Output

```
🌱 Caregiver Seeder Script
==========================

📁 CSV file: /path/to/cuidador_processed.csv

✅ Firebase Admin initialized with service account
📖 Reading CSV file: cuidador_processed.csv
✅ CSV file read successfully
📊 Parsing CSV...
✅ Parsed 18 rows
🚀 Starting upload to Firestore...
✅ [1/18] Uploaded: user_00001 - Jennifer Perez
✅ [2/18] Uploaded: user_00002 - Sara Martinez
...

📊 Upload Summary:
   ✅ Success: 18
   ❌ Errors: 0
   📝 Total: 18

🎉 Successfully seeded 18 caregivers to Firestore!
```

### Troubleshooting

**Error: "Firebase not initialized"**
- Make sure `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables set
- See `QUICK_START.md` for Firebase setup instructions

**Error: "CSV file not found"**
- Ensure `cuidador_processed.csv` is in the project root
- Or provide full path: `npm run seed:caregivers -- /full/path/to/file.csv`

**Error: "Permission denied"**
- Check your Firestore security rules allow writes to `/caregivers` collection
- For development, you can temporarily allow writes:
  ```javascript
  match /caregivers/{document=**} {
    allow read, write: if true;
  }
  ```


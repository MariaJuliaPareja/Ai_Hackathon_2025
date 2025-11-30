/**
 * Seeder script to upload caregivers from CSV to Firestore
 * 
 * Usage: npm run seed:caregivers
 * 
 * This script reads cuidador_processed.csv and uploads each row to Firestore
 * collection 'caregivers' with document ID = user_code
 * 
 * Uses Firebase Web SDK (same as Next.js app) - requires .env.local with Firebase config
 * 
 * NOTE: Alternative approach using firebase-admin SDK (simpler, no API key needed):
 *   - Change imports to: import { initializeApp } from 'firebase-admin/app'; import { getFirestore } from 'firebase-admin/firestore';
 *   - Initialize with: initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
 *   - Use: db.collection('caregivers').doc(userCode).set(firestoreDoc);
 */

// Load environment variables from .env.local
import 'dotenv/config';
import { config } from 'dotenv';
import * as path from 'path';

// Explicitly load .env.local (dotenv/config loads .env by default)
config({ path: path.join(__dirname, '..', '.env.local') });

import * as fs from 'fs';
import { parse } from 'papaparse';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase directly in the script
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (reuse if already initialized)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Verify Firebase is initialized
if (!db) {
  console.error('❌ Firebase not initialized');
  console.error('💡 Make sure .env.local has all NEXT_PUBLIC_FIREBASE_* variables set');
  console.error('📖 See QUICK_START.md for Firebase setup instructions');
  process.exit(1);
}

console.log('✅ Firebase initialized directly in seeder script');

// Mapping functions for CSV fields to Firestore structure
const CARE_SKILLS_MAP: { [key: string]: string } = {
  'CARE01': 'Baño y aseo personal',
  'CARE02': 'Alimentación y nutrición',
  'CARE03': 'Movilización y transferencias',
  'CARE04': 'Administración de medicamentos',
  'CARE05': 'Compañía y supervisión',
  'CARE06': 'Tareas del hogar',
  'CARE07': 'Acompañamiento a citas médicas',
  'CARE08': 'Apoyo en terapia física',
  'CARE09': 'Cuidado de heridas',
};

const HEALTH_CONDITIONS_MAP: { [key: string]: string } = {
  'HEALTH01': 'Alzheimer',
  'HEALTH02': 'Demencia',
  'HEALTH03': 'Diabetes',
  'HEALTH04': 'Hipertensión',
  'HEALTH05': 'Artritis',
  'HEALTH06': 'Parkinson',
  'HEALTH07': 'Enfermedades cardíacas',
  'HEALTH08': 'Osteoporosis',
  'HEALTH09': 'Depresión',
  'HEALTH10': 'Ansiedad',
  'HEALTH11': 'Incontinencia',
  'HEALTH12': 'Problemas de visión',
  'HEALTH13': 'Problemas de audición',
  'HEALTH14': 'Movilidad reducida',
};

const DAYS_MAP: { [key: string]: string } = {
  'Lunes': 'monday',
  'Martes': 'tuesday',
  'Miercoles': 'wednesday',
  'Jueves': 'thursday',
  'Viernes': 'friday',
  'Sabado': 'saturday',
  'Domingo': 'sunday',
};

const TURNO_MAP: { [key: number]: string } = {
  1: 'Mañana',
  2: 'Tarde',
  3: 'Noche',
};

const ESPECIALIZACION_MAP: { [key: number]: string } = {
  1: 'Cuidado general',
  2: 'Cuidado de demencia',
  3: 'Cuidado post-operatorio',
  4: 'Cuidado de diabetes',
  5: 'Cuidado de Alzheimer',
  6: 'Cuidado de Parkinson',
  7: 'Cuidado de enfermedades cardíacas',
  8: 'Cuidado de movilidad reducida',
};

function mapCsvRowToFirestore(row: any): any {
  const userCode = row.user_code;
  const name = row.Name || 'Sin nombre';
  const age = parseInt(row.age) || 0;
  const expYears = parseInt(row.exp_years) || 0;
  const genderType = parseInt(row.gender_type) || 1;
  const payment = parseInt(row.payment) || 0;
  
  // Map care skills (CARE01-CARE09)
  const skills: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const careKey = `CARE${String(i).padStart(2, '0')}`;
    if (row[careKey] === '1') {
      skills.push(CARE_SKILLS_MAP[careKey] || careKey);
    }
  }
  
  // Map health conditions (HEALTH01-HEALTH14)
  const specializations: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const healthKey = `HEALTH${String(i).padStart(2, '0')}`;
    if (row[healthKey] === '1') {
      const condition = HEALTH_CONDITIONS_MAP[healthKey] || healthKey;
      specializations.push(condition);
    }
  }
  
  // Add especializacion_val if available
  const especializacionVal = parseInt(row.especializacion_val);
  if (especializacionVal && ESPECIALIZACION_MAP[especializacionVal]) {
    if (!specializations.includes(ESPECIALIZACION_MAP[especializacionVal])) {
      specializations.push(ESPECIALIZACION_MAP[especializacionVal]);
    }
  }
  
  // Map availability (Lunes-Domingo)
  const availability: any = {};
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const turnoVal = parseInt(row.turno_val) || 2; // Default to afternoon
  
  days.forEach(day => {
    const dayValue = row[day];
    const dayKey = DAYS_MAP[day];
    
    if (dayValue === '1') {
      // Available - set based on turno_val
      availability[dayKey] = {
        morning: {
          start: turnoVal === 1 ? '08:00' : '00:00',
          end: turnoVal === 1 ? '12:00' : '00:00',
          available: turnoVal === 1,
        },
        afternoon: {
          start: turnoVal === 2 ? '12:00' : '00:00',
          end: turnoVal === 2 ? '18:00' : '00:00',
          available: turnoVal === 2,
        },
        evening: {
          start: turnoVal === 3 ? '18:00' : '00:00',
          end: turnoVal === 3 ? '22:00' : '00:00',
          available: turnoVal === 3,
        },
      };
    } else {
      // Not available
      availability[dayKey] = {
        morning: { start: '00:00', end: '00:00', available: false },
        afternoon: { start: '00:00', end: '00:00', available: false },
        evening: { start: '00:00', end: '00:00', available: false },
      };
    }
  });
  
  // Build description from available data
  const descripcionVal = parseInt(row.descripcion_val) || 5;
  const description = `Cuidador profesional con ${expYears} años de experiencia. ` +
    `Especializado en ${specializations.slice(0, 3).join(', ')}. ` +
    `Disponible para cuidado ${TURNO_MAP[turnoVal]?.toLowerCase() || 'general'}.`;
  
  // Build Firestore document structure (matching CaregiverData interface)
  const firestoreDoc = {
    userId: userCode,
    
    // Personal Info (flat structure for compatibility with existing code)
    name: name,
    email: `${userCode}@caregiver.demo`, // Generate email from user_code
    location: 'Lima, Perú', // Default location - you may want to add this to CSV
    age: age,
    gender: genderType === 1 ? 'F' : 'M',
    
    // Professional Info (flat structure matching CaregiverData)
    yearsExperience: expYears,
    skills: skills.length > 0 ? skills : ['Cuidado general'],
    specializations: specializations.length > 0 ? specializations : ['Cuidado general'],
    hourlyRate: payment,
    
    // Experience Description
    bio: description,
    experienceDescription: {
      experienceDescription: description,
    },
    
    // Availability (matching CaregiverOnboardingFormData structure)
    availability: availability,
    
    // Preferences
    preferences: {
      conditionsComfortableWith: specializations,
    },
    
    // System fields
    active: true,
    onboardingCompleted: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    
    // Additional CSV fields (for reference/debugging)
    _csvData: {
      currently_training: row.currently_training,
      career_clean: row.career_clean,
      edu: row.edu,
      certificacion_val: row.certificacion_val,
      turno_val: turnoVal,
      especializacion_val: especializacionVal,
    },
  };
  
  return firestoreDoc;
}

async function seedCaregivers(csvPath: string) {
  console.log(`📖 Reading CSV file: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  console.log('✅ CSV file read successfully');
  
  console.log('📊 Parsing CSV...');
  const parseResult = parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });
  
  if (parseResult.errors.length > 0) {
    console.warn('⚠️ CSV parsing errors:', parseResult.errors);
  }
  
  const rows = parseResult.data as any[];
  console.log(`✅ Parsed ${rows.length} rows`);
  
  console.log('🚀 Starting upload to Firestore...');
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const userCode = row.user_code;
    
    if (!userCode) {
      console.warn(`⚠️ Skipping row ${i + 1}: No user_code`);
      errorCount++;
      continue;
    }
    
    try {
      const firestoreDoc = mapCsvRowToFirestore(row);
      
      // Upload to Firestore using Web SDK
      await setDoc(doc(db, 'caregivers', userCode), firestoreDoc);
      
      successCount++;
      console.log(`✅ [${i + 1}/${rows.length}] Uploaded: ${userCode} - ${firestoreDoc.name}`);
    } catch (error: any) {
      errorCount++;
      console.error(`❌ [${i + 1}/${rows.length}] Error uploading ${userCode}:`, error.message);
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${rows.length}`);
  
  if (successCount > 0) {
    console.log(`\n🎉 Successfully seeded ${successCount} caregivers to Firestore!`);
  }
}

// Main execution
const csvFile = process.argv[2] || path.join(__dirname, '..', 'cuidador_processed.csv');

console.log('🌱 Caregiver Seeder Script');
console.log('==========================\n');
console.log(`📁 CSV file: ${csvFile}\n`);

seedCaregivers(csvFile)
  .then(() => {
    console.log('\n✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });


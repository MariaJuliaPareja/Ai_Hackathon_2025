// Load environment variables from .env.local
import 'dotenv/config';
import { config } from 'dotenv';
import * as path from 'path';

// Explicitly load .env.local (dotenv/config loads .env by default)
config({ path: path.join(__dirname, '..', '.env.local') });

import * as fs from 'fs';
import { parse } from 'papaparse';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CSV_PATH = path.join(process.cwd(), 'abuelitos_processed.csv');

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Map HEALTH columns to condition names
const HEALTH_CONDITIONS: { [key: string]: string } = {
  HEALTH01: 'Diabetes',
  HEALTH02: 'Hipertensión',
  HEALTH03: 'Artritis',
  HEALTH04: 'Enfermedad cardíaca',
  HEALTH05: 'Osteoporosis',
  HEALTH06: 'Problemas de visión',
  HEALTH07: 'Problemas auditivos',
  HEALTH08: 'Depresión',
  HEALTH09: 'Ansiedad',
  HEALTH10: 'Alzheimer/Demencia',
  HEALTH11: 'Parkinson',
  HEALTH12: 'Problemas respiratorios',
  HEALTH13: 'Problemas digestivos',
  HEALTH14: 'Problemas de movilidad',
  HEALTH15: 'Otras condiciones crónicas',
};

// Map CARE columns to new assistance task categories
const CARE_TASK_MAP: { [key: string]: string } = {
  CARE01: 'higiene_personal',
  CARE02: 'preparacion_alimentos',
  CARE03: 'movilizacion',
  CARE04: 'administracion_medicamentos',
  CARE05: 'compania',
  CARE06: 'preparacion_alimentos', // Duplicate, but keep for mapping
  CARE07: 'movilizacion', // Duplicate
  CARE08: 'cuidado_postradas',
  CARE09: 'primeros_auxilios_basicos',
};

const ASSISTANCE_TASK_LABELS: { [key: string]: string } = {
  compania: 'Compañía',
  higiene_personal: 'Higiene Personal',
  preparacion_alimentos: 'Preparación de alimentos saludables',
  administracion_medicamentos: 'Administración de medicamentos',
  movilizacion: 'Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.',
  cuidado_postradas: 'Cuidado de personas postradas',
  primeros_auxilios_basicos: 'Primeros Auxilios Básicos',
  primeros_auxilios_psicologicos: 'Primeros Auxilios Psicológicos',
  carga_fisica: 'Cargar físicamente a la persona adulta mayor',
};

// Map mobility values (1-4) to mobility_score (1-4)
function mapMobility(movilidadVal: string): number {
  const val = parseInt(movilidadVal);
  return val >= 1 && val <= 4 ? val : 2; // Default to 2 if invalid
}

// Map cognitive values (1-4) to cognitive_status
function mapCognitiveStatus(cognitivoVal: string): 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment' {
  const val = parseInt(cognitivoVal);
  switch (val) {
    case 1: return 'normal';
    case 2: return 'mild_impairment';
    case 3: return 'moderate_impairment';
    case 4: return 'severe_impairment';
    default: return 'mild_impairment';
  }
}

// Map care intensity (1-4) to care_intensity
function mapCareIntensity(intensidadVal: string): 'light' | 'moderate' | 'intensive' | '24_7' {
  const val = parseInt(intensidadVal);
  switch (val) {
    case 1: return 'light';
    case 2: return 'moderate';
    case 3: return 'intensive';
    case 4: return '24_7';
    default: return 'moderate';
  }
}

// Map gender (1=M, 2=F) to gender
function mapGender(generoVal: string): 'M' | 'F' | 'other' {
  const val = parseInt(generoVal);
  return val === 1 ? 'M' : val === 2 ? 'F' : 'other';
}

// Extract medical conditions from HEALTH columns
function extractMedicalConditions(row: any): string {
  const conditions: string[] = [];
  for (const [key, label] of Object.entries(HEALTH_CONDITIONS)) {
    if (row[key] === '1') {
      conditions.push(label);
    }
  }
  return conditions.length > 0 ? conditions.join(', ') : 'Ninguna condición específica';
}

// Extract assistance tasks from CARE columns
function extractAssistanceTasks(row: any): string[] {
  const tasks = new Set<string>();
  for (const [key, taskId] of Object.entries(CARE_TASK_MAP)) {
    if (row[key] === '1') {
      tasks.add(ASSISTANCE_TASK_LABELS[taskId] || taskId);
    }
  }
  // If no tasks found, add default
  if (tasks.size === 0) {
    tasks.add(ASSISTANCE_TASK_LABELS['compania']);
  }
  return Array.from(tasks);
}

// Extract availability from day columns
function extractAvailability(row: any): string {
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const availableDays: string[] = [];
  days.forEach(day => {
    if (row[day] === '1') {
      availableDays.push(day);
    }
  });
  return availableDays.length > 0 ? availableDays.join(', ') : 'Lunes a Viernes';
}

// Determine budget range from PAY columns
function extractBudgetRange(row: any): string {
  if (row.PAY_MORE100 === '1') return 'Más de S/100 por hora';
  if (row.PAY80_100 === '1') return 'S/80 - S/100 por hora';
  if (row.PAY50_80 === '1') return 'S/50 - S/80 por hora';
  if (row.PAY20_50 === '1') return 'S/20 - S/50 por hora';
  if (row.PAY_MENOS_20 === '1') return 'Menos de S/20 por hora';
  return 'S/20 - S/50 por hora'; // Default
}

// Generate random medication times
function generateMedicationTimes(): string {
  const times = ['08:00', '12:00', '18:00', '20:00'];
  const selected = times.slice(0, Math.floor(Math.random() * 3) + 1);
  return selected.join(', ');
}

// Generate family contact info
function generateFamilyContact(name: string): {
  family_name: string;
  family_relationship: string;
  family_phone: string;
  family_email: string;
} {
  const relationships = ['Hijo/a', 'Hijo/a', 'Hijo/a', 'Cónyuge', 'Hermano/a', 'Sobrino/a', 'Cuñado/a'];
  const relationship = relationships[Math.floor(Math.random() * relationships.length)];
  const lastName = name.split(' ').pop() || 'Familia';
  
  return {
    family_name: `Familiar de ${name.split(' ')[0]}`,
    family_relationship: relationship,
    family_phone: `+51 9${Math.floor(Math.random() * 90000000) + 10000000}`,
    family_email: `familia.${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  };
}

async function seedSeniorsFromCSV() {
  console.log('📖 Reading CSV file:', CSV_PATH);
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV file not found:', CSV_PATH);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

  parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      console.log(`\n📊 Found ${results.data.length} senior profiles to process\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < results.data.length; i++) {
        const row: any = results.data[i];
        
        try {
          // Skip empty rows
          if (!row.Name || !row.edad_adulto_mayor) {
            console.log(`⏭️  Skipping row ${i + 1}: Missing required fields`);
            continue;
          }

          const clientCode = row.client_code || `senior_${Date.now()}_${i}`;
          const userId = `senior_${clientCode}`;
          
          // Extract and map data
          const name = row.Name.trim();
          const age = parseInt(row.edad_adulto_mayor) || 70;
          const gender = mapGender(row.genero_adulto_mayor);
          const location = `${row.departamento || 'Lima'}, Perú`;
          const mobilityScore = mapMobility(row.movilidad_val);
          const cognitiveStatus = mapCognitiveStatus(row.cognitivo_val);
          const careIntensity = mapCareIntensity(row.intensidad_cuidado);
          const medicalConditions = extractMedicalConditions(row);
          const assistanceTasks = extractAssistanceTasks(row);
          const availability = extractAvailability(row);
          const budgetRange = extractBudgetRange(row);
          const medicationTimes = generateMedicationTimes();
          const familyContact = generateFamilyContact(name);

          // Generate email
          const email = `${name.toLowerCase().replace(/\s+/g, '.')}@senior.example.com`;

          // Create senior profile document
          const seniorData = {
            userId,
            email,
            role: 'senior' as const,
            
            // Basic Info
            name,
            age,
            gender,
            location,
            // profilePhoto: null, // Optional, skip for now
            
            // Medical Profile
            medical_comorbidities: medicalConditions,
            mobility_score: mobilityScore,
            cognitive_status: cognitiveStatus,
            
            // Care Needs
            routine_medication_times: medicationTimes,
            routine_assistance_tasks: assistanceTasks,
            care_intensity: careIntensity,
            special_requirements: `Disponibilidad: ${availability}. Presupuesto: ${budgetRange}.`,
            
            // Family Contact
            family_name: familyContact.family_name,
            family_relationship: familyContact.family_relationship,
            family_phone: familyContact.family_phone,
            family_email: familyContact.family_email,
            
            // System
            onboardingCompleted: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Matching
            match_status: 'ready' as const,
            match_count: 0,
          };

          // Save to Firestore
          await setDoc(doc(db, 'seniors', userId), seniorData);
          
          console.log(`✅ [${i + 1}/${results.data.length}] Saved: ${name} (${age} años, ${location})`);
          successCount++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: any) {
          console.error(`❌ [${i + 1}/${results.data.length}] Error processing row:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n✨ Seeding complete!`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`\n📋 Senior profiles are now available in the caregiver job board!\n`);
      
      process.exit(0);
    },
    error: (error: any) => {
      console.error('❌ Error parsing CSV:', error.message);
      process.exit(1);
    },
  });
}

// Run the seeder
seedSeniorsFromCSV().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


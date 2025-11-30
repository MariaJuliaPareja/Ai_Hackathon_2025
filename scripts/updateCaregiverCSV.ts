/**
 * Script to update caregiver CSV with new skill categories
 * Maps existing CARE01-CARE09 columns to new 9 categories
 * Outputs updated CSV with skills field as JSON array
 */

import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// New skill categories (matching SeniorNeedsStep.tsx)
const NEW_SKILL_CATEGORIES = [
  'Compañía',
  'Higiene Personal',
  'Preparación de alimentos saludables',
  'Administración de medicamentos',
  'Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.',
  'Cuidado de personas postradas',
  'Primeros Auxilios Básicos',
  'Primeros Auxilios Psicológicos',
  'Cargar físicamente a la persona adulta mayor',
];

// Mapping from old CARE columns to new categories
const CARE_TO_NEW_SKILLS_MAP: { [key: string]: string[] } = {
  'CARE01': ['Higiene Personal'], // Baño y aseo personal
  'CARE02': ['Preparación de alimentos saludables'], // Alimentación y nutrición
  'CARE03': ['Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.', 'Cargar físicamente a la persona adulta mayor'], // Movilización y transferencias
  'CARE04': ['Administración de medicamentos'], // Administración de medicamentos
  'CARE05': ['Compañía'], // Compañía y supervisión
  'CARE06': ['Preparación de alimentos saludables'], // Tareas del hogar (mapped to food prep)
  'CARE07': ['Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.'], // Acompañamiento a citas médicas
  'CARE08': ['Cuidado de personas postradas', 'Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.'], // Apoyo en terapia física
  'CARE09': ['Primeros Auxilios Básicos'], // Cuidado de heridas
};

// Additional mappings based on other fields
const PSIC1_TO_SKILLS: { [key: string]: string[] } = {
  '1': ['Primeros Auxilios Psicológicos'],
  '2': ['Primeros Auxilios Psicológicos'],
};

const PSIC2_TO_SKILLS: { [key: string]: string[] } = {
  '1': ['Primeros Auxilios Psicológicos'],
  '2': ['Primeros Auxilios Psicológicos'],
};

function mapRowToSkills(row: any): string[] {
  const skillsSet = new Set<string>();
  
  // Map CARE01-CARE09 columns
  for (let i = 1; i <= 9; i++) {
    const careKey = `CARE${String(i).padStart(2, '0')}`;
    if (row[careKey] === '1') {
      const mappedSkills = CARE_TO_NEW_SKILLS_MAP[careKey] || [];
      mappedSkills.forEach(skill => skillsSet.add(skill));
    }
  }
  
  // Map PSIC1 (psychological support)
  if (row.PSIC1 && PSIC1_TO_SKILLS[row.PSIC1]) {
    PSIC1_TO_SKILLS[row.PSIC1].forEach(skill => skillsSet.add(skill));
  }
  
  // Map PSIC2 (psychological support)
  if (row.PSIC2 && PSIC2_TO_SKILLS[row.PSIC2]) {
    PSIC2_TO_SKILLS[row.PSIC2].forEach(skill => skillsSet.add(skill));
  }
  
  // If no skills found, add "Compañía" as default
  if (skillsSet.size === 0) {
    skillsSet.add('Compañía');
  }
  
  // Return sorted array for consistency
  return Array.from(skillsSet).sort();
}

async function updateCaregiverCSV() {
  const inputPath = path.join(__dirname, '..', 'cuidador_processed.csv');
  const outputPath = path.join(__dirname, '..', 'cuidador_processed_updated.csv');
  
  console.log('📖 Reading CSV file:', inputPath);
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file not found:', inputPath);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  
  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log(`✅ Parsed ${results.data.length} rows`);
      
      const updatedRows = results.data.map((row: any) => {
        const skills = mapRowToSkills(row);
        
        // Create updated row with skills as JSON array
        const updatedRow = {
          ...row,
          skills: JSON.stringify(skills), // Store as JSON string for CSV compatibility
        };
        
        return updatedRow;
      });
      
      // Convert back to CSV
      const updatedCsv = Papa.unparse(updatedRows, {
        header: true,
        columns: [
          ...Object.keys(results.data[0] as any),
          'skills', // Add skills column at the end
        ],
      });
      
      // Write to output file
      fs.writeFileSync(outputPath, updatedCsv, 'utf-8');
      
      console.log(`✅ Updated CSV written to: ${outputPath}`);
      console.log(`📊 Total rows processed: ${updatedRows.length}`);
      
      // Show sample of mapped skills
      console.log('\n📋 Sample skill mappings:');
      updatedRows.slice(0, 5).forEach((row: any, index: number) => {
        const skills = JSON.parse(row.skills);
        console.log(`  Row ${index + 1} (${row.user_code || row.Name}):`, skills.join(', '));
      });
      
      console.log('\n✅ CSV update complete!');
    },
    error: (error) => {
      console.error('❌ Error parsing CSV:', error);
      process.exit(1);
    },
  });
}

// Run the script
updateCaregiverCSV().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});


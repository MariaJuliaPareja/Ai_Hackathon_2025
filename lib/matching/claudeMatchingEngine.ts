/**
 * Claude API-based matching engine
 * Compares senior profiles with caregiver profiles using Claude's intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CaregiverMatch, MatchScore, MLReasoning } from '@/lib/types/matching';
import { getAnthropicAPIKey, logAPIKeyStatus } from '@/lib/utils/apiCheck';

// Initialize Anthropic client with API key check
const apiKey = getAnthropicAPIKey();
logAPIKeyStatus();

// ⚠️ WARNING: dangerouslyAllowBrowser is enabled for hackathon demo only
// In production, this MUST run on a backend API route to protect the API key
const anthropic = apiKey ? new Anthropic({ 
  apiKey,
  dangerouslyAllowBrowser: true, // Required for client-side execution in Next.js
}) : null;

interface SeniorProfile {
  name: string;
  age: number;
  location: string;
  medical_comorbidities: string;
  mobility_score: number;
  cognitive_status: string;
  routine_medication_times: string;
  routine_assistance_tasks: string[];
  care_intensity: string;
  special_requirements?: string;
}

interface CaregiverProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  yearsExperience: number;
  skills: string[];
  certifications: string[];
  bio: string;
  specializations?: string[];
  hourlyRate: number;
  availability: any;
  avgRating?: number;
  profilePhoto?: any;
}

/**
 * Generate a compatibility score and reasoning using Claude
 */
export async function evaluateMatch(
  senior: SeniorProfile,
  caregiver: CaregiverProfile
): Promise<{ score: MatchScore; reasoning: MLReasoning }> {
  // Parse care intensity to understand urgency
  const careIntensityMap: { [key: string]: string } = {
    'light': 'Cuidado ligero: asistencia ocasional, supervisión básica',
    'moderate': 'Cuidado moderado: asistencia diaria, ayuda con actividades básicas',
    'intensive': 'Cuidado intensivo: asistencia constante, necesidades médicas complejas',
    '24_7': 'Cuidado 24/7: supervisión continua, alta dependencia'
  };
  
  const cognitiveStatusMap: { [key: string]: string } = {
    'normal': 'Estado cognitivo normal',
    'mild_impairment': 'Deterioro cognitivo leve (olvidos ocasionales)',
    'moderate_impairment': 'Deterioro cognitivo moderado (necesita recordatorios frecuentes)',
    'severe_impairment': 'Deterioro cognitivo severo (requiere supervisión constante)'
  };

  const prompt = `Eres un experto sistema de matching de cuidadores para adultos mayores en Perú. Tu tarea es analizar la compatibilidad entre este adulto mayor y este cuidador, considerando factores médicos, logísticos, culturales y de experiencia.

═══════════════════════════════════════════════════════════════
PERFIL DEL ADULTO MAYOR
═══════════════════════════════════════════════════════════════

INFORMACIÓN BÁSICA:
- Edad: ${senior.age} años
- Ubicación: ${senior.location}
- Género: ${(senior as any).gender || 'No especificado'}

SALUD Y MOVILIDAD:
- Condiciones Médicas: ${senior.medical_comorbidities || 'No especificadas'}
- Nivel de Movilidad: ${senior.mobility_score}/4 
  * 1 = Encamado (requiere transferencias completas)
  * 2 = Movilidad limitada (necesita ayuda para caminar)
  * 3 = Movilidad asistida (usa bastón/andador)
  * 4 = Independiente (camina sin ayuda)
- Estado Cognitivo: ${cognitiveStatusMap[senior.cognitive_status] || senior.cognitive_status}

NECESIDADES DE CUIDADO:
- Horarios de Medicación: ${senior.routine_medication_times || 'No especificado'}
- Tareas de Asistencia Requeridas: ${senior.routine_assistance_tasks?.join(', ') || 'Ninguna especificada'}
- Intensidad de Cuidado: ${careIntensityMap[senior.care_intensity] || senior.care_intensity}
${senior.special_requirements ? '- Requisitos Especiales: ' + senior.special_requirements : ''}

═══════════════════════════════════════════════════════════════
PERFIL DEL CUIDADOR
═══════════════════════════════════════════════════════════════

INFORMACIÓN PERSONAL:
- Nombre: ${caregiver.name}
- Edad: ${caregiver.age} años
- Ubicación: ${caregiver.location}

EXPERIENCIA Y CAPACITACIÓN:
- Años de Experiencia: ${caregiver.yearsExperience} años
- Habilidades: ${caregiver.skills?.join(', ') || 'No especificadas'}
- Certificaciones: ${caregiver.certifications?.join(', ') || 'Ninguna'}
${caregiver.specializations ? '- Especializaciones: ' + (caregiver.specializations?.join(', ') || 'Ninguna especificada') : ''}
${caregiver.avgRating ? '- Calificación Promedio: ' + caregiver.avgRating + '/5 estrellas' : ''}

DESCRIPCIÓN PROFESIONAL:
${caregiver.bio || 'No disponible'}

INFORMACIÓN ECONÓMICA:
- Tarifa por Hora: S/${caregiver.hourlyRate}

═══════════════════════════════════════════════════════════════
INSTRUCCIONES DE EVALUACIÓN
═══════════════════════════════════════════════════════════════

Evalúa la compatibilidad considerando:

1. COMPATIBILIDAD MÉDICA (CRÍTICO - 40% del peso):
   - ¿El cuidador tiene experiencia con las condiciones médicas del adulto mayor?
   - ¿Las especializaciones/certificaciones son relevantes?
   - ¿Puede manejar el nivel de movilidad y cognitivo requerido?
   - ¿Tiene experiencia con la intensidad de cuidado necesaria?

2. MATCH DE HABILIDADES (IMPORTANTE - 25% del peso):
   - ¿Puede realizar todas las tareas de asistencia requeridas?
   - ¿Tiene habilidades específicas mencionadas en las necesidades?
   - ¿Su experiencia general es suficiente?

3. PROXIMIDAD GEOGRÁFICA (IMPORTANTE - 20% del peso):
   - Misma ubicación/distrito = 100 puntos
   - Misma ciudad/departamento = 70-90 puntos
   - Diferente región pero accesible = 40-60 puntos
   - Muy lejos = 0-30 puntos

4. NIVEL DE EXPERIENCIA (MODERADO - 10% del peso):
   - 5+ años con especializaciones relevantes = 90-100
   - 3-5 años con experiencia relevante = 70-89
   - 1-3 años con buena capacitación = 50-69
   - Menos de 1 año = 30-49

5. DISPONIBILIDAD Y LOGÍSTICA (MODERADO - 5% del peso):
   - ¿Puede cubrir los horarios necesarios?
   - ¿La tarifa es razonable para el nivel de cuidado?

═══════════════════════════════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════════════════════════════

Responde ÚNICAMENTE con un objeto JSON válido en este formato EXACTO (sin markdown, sin bloques de código):

{
  "score": {
    "overall": <número 0-100, calculado como promedio ponderado>,
    "breakdown": {
      "semantic_similarity": <0-100: qué tan bien la experiencia del cuidador coincide con las condiciones médicas>,
      "skills_match": <0-100: porcentaje de tareas requeridas que puede realizar>,
      "location_proximity": <0-100: proximidad geográfica>,
      "availability_fit": <0-100: compatibilidad de horarios>,
      "experience_level": <0-100: años de experiencia + especializaciones relevantes>
    }
  },
  "reasoning": {
    "summary": "<resumen de una oración en español explicando por qué es un buen match>",
    "strengths": [
      "<fortaleza específica 1>",
      "<fortaleza específica 2>",
      "<fortaleza específica 3>"
    ],
    "considerations": [
      "<consideración o limitación 1 (si existe)>",
      "<consideración o limitación 2 (si existe)>"
    ],
    "compatibility_factors": {
      "medical_expertise": "<análisis detallado en español sobre compatibilidad médica, experiencia con condiciones similares, capacidad para manejar necesidades específicas>",
      "care_approach": "<análisis en español sobre el estilo de cuidado, personalidad, y cómo se adapta al adulto mayor>",
      "practical_fit": "<análisis en español sobre logística: ubicación, disponibilidad, tarifa, y viabilidad práctica>"
    }
  }
}

REGLAS CRÍTICAS:
1. El overall debe ser un promedio ponderado: (semantic_similarity * 0.40) + (skills_match * 0.25) + (location_proximity * 0.20) + (experience_level * 0.10) + (availability_fit * 0.05)
2. Todos los textos deben estar en ESPAÑOL
3. Sé específico: menciona condiciones médicas, habilidades, ubicaciones concretas
4. Sé honesto: si hay limitaciones, menciónalas en "considerations"
5. NO uses markdown, NO uses bloques de código, SOLO JSON válido
6. Las fortalezas deben ser concretas y específicas (ej: "5 años de experiencia con Alzheimer" no "experiencia")
7. El summary debe ser claro y convincente para la familia

IMPORTANTE: Si el cuidador NO tiene experiencia relevante con las condiciones médicas del adulto mayor, reduce significativamente el overall score (máximo 60-70). La compatibilidad médica es CRÍTICA.`;

  // Check if API key is available
  if (!anthropic || !apiKey) {
    console.warn('⚠️ Claude API not available, using fallback scoring');
    return generateFallbackScore(senior, caregiver);
  }

  try {
    console.log(`🤖 Calling Claude API for match evaluation: ${caregiver.name}`);
    const startTime = Date.now();
    
    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Using latest stable Claude Sonnet model
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      // Timeout after 30 seconds
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout after 30s')), 30000)
      )
    ]) as any;

    const duration = Date.now() - startTime;
    console.log(`✅ Claude API response received in ${duration}ms`);

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Clean response (remove markdown if Claude added it despite instructions)
    let jsonText = content.text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const result = JSON.parse(jsonText);

    // Validate result structure
    if (!result.score || !result.reasoning) {
      throw new Error('Invalid response structure from Claude');
    }

    console.log(`✅ Match evaluated: ${caregiver.name} - Score: ${result.score.overall}%`);
    
    return {
      score: result.score,
      reasoning: result.reasoning,
    };
  } catch (error: any) {
    console.error(`❌ Error calling Claude API for ${caregiver.name}:`, error);
    console.error('   Error details:', error.message || error);
    // Fallback to heuristic scoring if Claude fails
    console.log(`   Using fallback scoring for ${caregiver.name}`);
    return generateFallbackScore(senior, caregiver);
  }
}

/**
 * Fallback scoring when Claude API fails
 */
function generateFallbackScore(
  senior: SeniorProfile,
  caregiver: CaregiverProfile
): { score: MatchScore; reasoning: MLReasoning } {
  // Extract caregiver data (handle both old and new schema)
  const caregiverName = caregiver.name || (caregiver as any).personalInfo?.name || 'Cuidador';
  const caregiverLocation = caregiver.location || (caregiver as any).personalInfo?.location || 'Lima';
  const caregiverYearsExp = caregiver.yearsExperience || (caregiver as any).professionalInfo?.yearsOfExperience || 5;
  const caregiverSkills = caregiver.skills || (caregiver as any).professionalInfo?.specializations || [];
  const caregiverSpecializations = caregiver.specializations || (caregiver as any).professionalInfo?.specializations || [];
  const caregiverBio = caregiver.bio || (caregiver as any).experienceDescription?.experienceDescription || '';
  const caregiverHourlyRate = caregiver.hourlyRate || 30;
  const caregiverRating = caregiver.avgRating;

  // Improved heuristic matching with better weights
  const seniorTasks = senior.routine_assistance_tasks || [];
  const skillsMatch = calculateSkillsMatch(seniorTasks, caregiverSkills);
  
  // Location matching: same location = 100, same city = 70, different = 40
  const seniorLocation = senior.location || '';
  let locationMatch = 40;
  if (seniorLocation === caregiverLocation) {
    locationMatch = 100;
  } else if (seniorLocation.toLowerCase().includes(caregiverLocation.toLowerCase()) || 
             caregiverLocation.toLowerCase().includes(seniorLocation.toLowerCase())) {
    locationMatch = 70;
  }
  
  // Experience score: 5+ years = 90-100, 3-5 = 70-89, 1-3 = 50-69, <1 = 30-49
  let experienceScore = 50;
  if (caregiverYearsExp >= 5) {
    experienceScore = 90 + Math.min(caregiverYearsExp - 5, 10);
  } else if (caregiverYearsExp >= 3) {
    experienceScore = 70 + ((caregiverYearsExp - 3) / 2) * 19;
  } else if (caregiverYearsExp >= 1) {
    experienceScore = 50 + ((caregiverYearsExp - 1) / 2) * 20;
  } else {
    experienceScore = 30;
  }
  experienceScore = Math.min(experienceScore, 100);
  
  // Medical compatibility (semantic similarity): check if caregiver has relevant experience
  const medicalConditions = (senior.medical_comorbidities || '').toLowerCase();
  const caregiverBioLower = caregiverBio.toLowerCase();
  const caregiverSkillsLower = (caregiverSkills || []).map((s: string) => s.toLowerCase()).join(' ');
  const caregiverSpecializationsLower = (caregiverSpecializations || []).map((s: string) => s.toLowerCase()).join(' ');
  const allCaregiverText = `${caregiverBioLower} ${caregiverSkillsLower} ${caregiverSpecializationsLower}`;
  
  // Check for medical condition keywords
  const medicalKeywords = medicalConditions.split(/[,;]\s*/).filter(c => c.length > 3);
  const matches = medicalKeywords.filter(keyword => 
    allCaregiverText.includes(keyword.toLowerCase())
  );
  const semanticSimilarity = medicalKeywords.length > 0 
    ? Math.round((matches.length / medicalKeywords.length) * 100)
    : 50; // Default to 50 if no medical conditions specified
  
  // Availability fit (default to 70 if we can't calculate)
  const availabilityFit = 70;

  // Overall score with improved weights matching Claude prompt
  const overall = Math.round(
    semanticSimilarity * 0.40 +  // Medical compatibility (CRITICAL)
    skillsMatch * 0.25 +           // Skills match (IMPORTANT)
    locationMatch * 0.20 +          // Location (IMPORTANT)
    experienceScore * 0.10 +         // Experience (MODERATE)
    availabilityFit * 0.05           // Availability (MODERATE)
  );

  return {
    score: {
      overall,
      breakdown: {
        semantic_similarity: semanticSimilarity,
        skills_match: skillsMatch,
        location_proximity: locationMatch,
        availability_fit: availabilityFit,
        experience_level: experienceScore,
      },
    },
    reasoning: {
      summary: (overall >= 80 ? 'Excelente' : overall >= 60 ? 'Buen' : 'Aceptable') + ' match basado en ' + (semanticSimilarity >= 70 ? 'experiencia médica relevante' : 'perfil general') + ', ' + (locationMatch >= 80 ? 'misma ubicación' : 'ubicación accesible') + ', y ' + caregiverYearsExp + ' años de experiencia',
      strengths: [
        `${caregiverYearsExp} años de experiencia profesional`,
        locationMatch >= 80 ? 'Misma ubicación' : locationMatch >= 60 ? 'Ubicación cercana' : 'Ubicación accesible',
        `${caregiverSkills.length} habilidades certificadas`,
        semanticSimilarity >= 70 ? 'Experiencia relevante con condiciones médicas similares' : 'Experiencia general en cuidado',
      ],
      considerations: [
        'Análisis detallado con IA no disponible (usando sistema de respaldo)',
        semanticSimilarity < 50 ? 'Experiencia limitada con las condiciones médicas específicas' : undefined,
      ].filter(Boolean) as string[],
      compatibility_factors: {
        medical_expertise: semanticSimilarity >= 70 
          ? 'Experiencia relevante con condiciones similares. ' + (matches.length > 0 ? 'Menciona experiencia con: ' + (matches?.join(', ') || 'varias condiciones') : 'Experiencia general en cuidado de adultos mayores.')
          : 'Evaluación detallada de compatibilidad médica pendiente. Se recomienda verificar experiencia específica.',
        care_approach: 'Perfil compatible basado en ' + caregiverYearsExp + ' años de experiencia y ' + caregiverSkills.length + ' habilidades registradas. ' + (caregiverBio ? 'Descripción profesional disponible.' : ''),
        practical_fit: 'Ubicado en ' + caregiverLocation + (locationMatch >= 80 ? ' (misma ubicación)' : '') + ', tarifa S/' + caregiverHourlyRate + '/hora' + (caregiverRating ? ', calificación ' + caregiverRating + '/5 estrellas' : ''),
      },
    },
  };
}

function calculateSkillsMatch(requiredTasks: string[], caregiverSkills: string[]): number {
  if (requiredTasks.length === 0) return 100;

  const matches = requiredTasks.filter(task =>
    caregiverSkills.some(skill =>
      skill.toLowerCase().includes(task.toLowerCase()) ||
      task.toLowerCase().includes(skill.toLowerCase())
    )
  );

  return Math.round((matches.length / requiredTasks.length) * 100);
}

/**
 * Batch evaluate multiple caregivers against a senior
 */
export async function batchEvaluateMatches(
  senior: SeniorProfile,
  caregivers: CaregiverProfile[],
  progressCallback?: (progress: number, step: string) => void
): Promise<CaregiverMatch[]> {
  const matches: CaregiverMatch[] = [];

  for (let i = 0; i < caregivers.length; i++) {
    const caregiver = caregivers[i];

    if (progressCallback) {
      const progress = Math.round(((i + 1) / caregivers.length) * 100);
      progressCallback(progress, `Evaluando compatibilidad con ${caregiver.name}...`);
    }

    try {
      const { score, reasoning } = await evaluateMatch(senior, caregiver);

      matches.push({
        matchId: `match_${Date.now()}_${i}`,
        caregiverId: caregiver.id,
        seniorId: '', // Will be set by caller
        score,
        mlReasoning: reasoning,
        caregiver: {
          name: caregiver.name,
          age: caregiver.age,
          location: caregiver.location,
          yearsExperience: caregiver.yearsExperience,
          skills: caregiver.skills || [],
          certifications: caregiver.certifications || [],
          bio: caregiver.bio,
          profilePhoto: caregiver.profilePhoto,
          hourlyRate: caregiver.hourlyRate,
          availability: caregiver.availability,
          avgRating: caregiver.avgRating,
        },
        status: 'pending',
        createdAt: new Date(),
        rank: 0, // Will be set after sorting
      });
    } catch (error) {
      console.error(`Error evaluating ${caregiver.name}:`, error);
    }
  }

  // Sort by overall score and assign ranks
  matches.sort((a, b) => b.score.overall - a.score.overall);
  matches.forEach((match, index) => {
    match.rank = index + 1;
  });

  return matches;
}


/**
 * Questionnaire question loader and parser
 * Loads questions from CSV files and structures them for the questionnaire UI
 */

import Papa from 'papaparse';

export interface Question {
  id: string; // e.g., "DIM1_1"
  test: 'burden' | 'empathy' | 'big5';
  dimension?: string; // e.g., "DIM1", "DIM2"
  questionNumber: number; // e.g., 1, 2, 3
}

export interface QuestionnaireData {
  burden: Question[];
  empathy: Question[];
  big5: Question[];
}

/**
 * Generate question text from dimension ID
 * This is a placeholder - in production, you'd have a mapping file
 */
function generateQuestionText(dimId: string, test: string): string {
  const [dim, num] = dimId.split('_');
  const dimensionMap: { [key: string]: string } = {
    'DIM1': 'Dimensión 1',
    'DIM2': 'Dimensión 2',
    'DIM3': 'Dimensión 3',
    'DIM4': 'Dimensión 4',
    'DIM5': 'Dimensión 5',
  };
  
  const testMap: { [key: string]: string } = {
    'burden': 'Maslach Burnout Inventory (MBI-HSS)',
    'empathy': 'Escala de Empatía',
    'big5': 'Big 5 Personalidad',
  };
  
  return `${testMap[test]} - ${dimensionMap[dim] || dim} - Pregunta ${num}`;
}

/**
 * Parse CSV and extract question IDs
 * Maintains the original order from CSV files (important for proper question sequence)
 */
function parseCSVQuestions(csvContent: string, testName: 'burden' | 'empathy' | 'big5'): Question[] {
  const result = Papa.parse(csvContent, { header: true });
  const questions: Question[] = [];
  
  if (result.data.length === 0) return questions;
  
  // Get headers (first row) - this preserves the order from CSV
  const headers = Object.keys(result.data[0] as any);
  
  // Filter out 'user', 'maleuser' columns and extract question IDs in CSV order
  headers.forEach((header) => {
    if (header !== 'user' && header !== 'maleuser' && header.startsWith('DIM')) {
      const [dimension, number] = header.split('_');
      questions.push({
        id: header,
        test: testName,
        dimension: dimension,
        questionNumber: parseInt(number) || 0,
      });
    }
  });
  
  // Return questions in CSV order (no sorting) to maintain the original sequence
  return questions;
}

/**
 * Load all questionnaires from CSV files
 */
export async function loadQuestionnaires(): Promise<QuestionnaireData> {
  try {
    // Load all three CSV files in parallel
    const [burdenRes, empathyRes, big5Res] = await Promise.all([
      fetch('/questionnaires/BURDEN_CAREGIVER_TEST.csv'),
      fetch('/questionnaires/EMPATHY_TEST.csv'),
      fetch('/questionnaires/BIG_5_SUB_ESCALAS.csv'),
    ]);
    
    const [burdenText, empathyText, big5Text] = await Promise.all([
      burdenRes.text(),
      empathyRes.text(),
      big5Res.text(),
    ]);
    
    return {
      burden: parseCSVQuestions(burdenText, 'burden'),
      empathy: parseCSVQuestions(empathyText, 'empathy'),
      big5: parseCSVQuestions(big5Text, 'big5'),
    };
  } catch (error) {
    console.error('Error loading questionnaires:', error);
    throw new Error('Failed to load questionnaire data');
  }
}

/**
 * Calculate score for Burden test (0-6 scale, 22 questions)
 */
export function calculateBurdenScore(answers: { [questionId: string]: number }): number {
  const burdenQuestions = Object.keys(answers).filter(k => k.startsWith('DIM'));
  if (burdenQuestions.length === 0) return 0;
  
  const total = burdenQuestions.reduce((sum, qId) => sum + (answers[qId] || 0), 0);
  const maxScore = burdenQuestions.length * 6;
  return Math.round((total / maxScore) * 100); // Convert to percentage
}

/**
 * Calculate score for Empathy test (0-3 scale, 29 questions)
 */
export function calculateEmpathyScore(answers: { [questionId: string]: number }): number {
  const empathyQuestions = Object.keys(answers).filter(k => k.startsWith('DIM'));
  if (empathyQuestions.length === 0) return 0;
  
  const total = empathyQuestions.reduce((sum, qId) => sum + (answers[qId] || 0), 0);
  const maxScore = empathyQuestions.length * 3; // Updated to 3 for new scale
  return Math.round((total / maxScore) * 100); // Convert to percentage
}

/**
 * Calculate score for Big 5 test (1-5 scale, 20 questions)
 */
export function calculateBig5Score(answers: { [questionId: string]: number }): number {
  const big5Questions = Object.keys(answers).filter(k => k.startsWith('DIM'));
  if (big5Questions.length === 0) return 0;
  
  const total = big5Questions.reduce((sum, qId) => sum + (answers[qId] || 0), 0);
  const maxScore = big5Questions.length * 5;
  const minScore = big5Questions.length * 1;
  return Math.round(((total - minScore) / (maxScore - minScore)) * 100); // Convert to percentage
}

/**
 * Get scale options for a test
 * Based on the actual CSV files provided
 */
export function getScaleOptions(test: 'burden' | 'empathy' | 'big5'): { value: number; label: string }[] {
  switch (test) {
    case 'burden':
      // Escala Zarit: 0-6 (Nunca a Siempre)
      return [
        { value: 0, label: 'Nunca' },
        { value: 1, label: 'Raramente' },
        { value: 2, label: 'A veces' },
        { value: 3, label: 'Bastantes veces' },
        { value: 4, label: 'Casi siempre' },
        { value: 5, label: 'Casi siempre' },
        { value: 6, label: 'Siempre' },
      ];
    case 'empathy':
      // Escala de Empatía: 0-3 (Muy bajo, Bajo, Promedio, Muy alto)
      return [
        { value: 0, label: 'Muy bajo' },
        { value: 1, label: 'Bajo' },
        { value: 2, label: 'Promedio' },
        { value: 3, label: 'Muy alto' },
      ];
    case 'big5':
      // Escala Big 5: 1-5 (Muy en desacuerdo a Muy de acuerdo)
      return [
        { value: 1, label: 'Muy en desacuerdo' },
        { value: 2, label: 'En desacuerdo' },
        { value: 3, label: 'Ni de acuerdo ni en desacuerdo' },
        { value: 4, label: 'De acuerdo' },
        { value: 5, label: 'Muy de acuerdo' },
      ];
    default:
      return [];
  }
}


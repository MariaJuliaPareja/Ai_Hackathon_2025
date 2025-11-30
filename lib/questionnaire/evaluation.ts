/**
 * Questionnaire Results Evaluation
 * Determines if a caregiver profile is acceptable based on test results
 */

export interface QuestionnaireScores {
  burden: number; // 0-100 (lower is better for burden)
  empathy: number; // 0-100 (higher is better for empathy)
  big5: number; // 0-100 (higher is generally better)
}

export interface EvaluationResult {
  isAcceptable: boolean;
  reason: string;
  details: {
    burden: {
      score: number;
      status: 'acceptable' | 'warning' | 'unacceptable';
      message: string;
    };
    empathy: {
      score: number;
      status: 'acceptable' | 'warning' | 'unacceptable';
      message: string;
    };
    big5: {
      score: number;
      status: 'acceptable' | 'warning' | 'unacceptable';
      message: string;
    };
  };
}

/**
 * Evaluate questionnaire results and determine if profile is acceptable
 * 
 * Criteria:
 * - Burden: Score < 50% is acceptable (low burden), 50-70% is warning, >70% is unacceptable
 * - Empathy: Score > 40% is acceptable, 30-40% is warning, <30% is unacceptable
 * - Big5: Score > 50% is acceptable, 40-50% is warning, <40% is unacceptable
 * 
 * Overall: Profile is acceptable if:
 * - Burden < 70% AND
 * - Empathy > 30% AND
 * - Big5 > 40%
 */
export function evaluateQuestionnaireResults(scores: QuestionnaireScores): EvaluationResult {
  const burdenStatus = scores.burden < 50 
    ? 'acceptable' 
    : scores.burden < 70 
    ? 'warning' 
    : 'unacceptable';
  
  const empathyStatus = scores.empathy > 40 
    ? 'acceptable' 
    : scores.empathy > 30 
    ? 'warning' 
    : 'unacceptable';
  
  const big5Status = scores.big5 > 50 
    ? 'acceptable' 
    : scores.big5 > 40 
    ? 'warning' 
    : 'unacceptable';

  const details = {
    burden: {
      score: scores.burden,
      status: burdenStatus,
      message: burdenStatus === 'acceptable' 
        ? 'Nivel de carga bajo. Perfil adecuado para cuidado.'
        : burdenStatus === 'warning'
        ? 'Nivel de carga moderado. Se recomienda apoyo adicional.'
        : 'Nivel de carga alto. Se requiere evaluación adicional antes de asignar casos.',
    },
    empathy: {
      score: scores.empathy,
      status: empathyStatus,
      message: empathyStatus === 'acceptable'
        ? 'Nivel de empatía adecuado. Capacidad de comprensión emocional apropiada.'
        : empathyStatus === 'warning'
        ? 'Nivel de empatía moderado. Se recomienda desarrollo de habilidades emocionales.'
        : 'Nivel de empatía bajo. Se requiere capacitación adicional en habilidades emocionales.',
    },
    big5: {
      score: scores.big5,
      status: big5Status,
      message: big5Status === 'acceptable'
        ? 'Perfil de personalidad adecuado para el cuidado.'
        : big5Status === 'warning'
        ? 'Perfil de personalidad moderado. Algunas áreas pueden requerir desarrollo.'
        : 'Perfil de personalidad requiere evaluación adicional.',
    },
  };

  // Overall evaluation: Profile is acceptable if no test is "unacceptable"
  const isAcceptable = burdenStatus !== 'unacceptable' 
    && empathyStatus !== 'unacceptable' 
    && big5Status !== 'unacceptable';

  let reason = '';
  if (isAcceptable) {
    const warnings = [burdenStatus, empathyStatus, big5Status].filter(s => s === 'warning').length;
    if (warnings === 0) {
      reason = 'Perfil aprobado. Todos los indicadores están en rangos aceptables.';
    } else if (warnings === 1) {
      reason = 'Perfil aprobado con observaciones. Un indicador requiere atención.';
    } else {
      reason = 'Perfil aprobado con recomendaciones. Varios indicadores requieren desarrollo.';
    }
  } else {
    const issues: string[] = [];
    if (burdenStatus === 'unacceptable') issues.push('carga del cuidador');
    if (empathyStatus === 'unacceptable') issues.push('empatía');
    if (big5Status === 'unacceptable') issues.push('perfil de personalidad');
    
    reason = `Perfil no aprobado. Se requiere evaluación adicional en: ${issues.join(', ')}.`;
  }

  return {
    isAcceptable,
    reason,
    details,
  };
}


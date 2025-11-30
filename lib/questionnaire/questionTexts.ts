/**
 * Real question texts for caregiver questionnaires
 * Extracted from Excel files: BURDEN CAREGIVER TEST.xlsx, EMPATHY TEST.xlsx, BIG 5 SUB ESCALAS.xlsx
 * Maps dimension IDs to actual question text
 */

/**
 * BURDEN CAREGIVER TEST (Maslach Burnout Inventory - MBI-HSS)
 * 22 preguntas en orden según CSV: DIM1_1, DIM1_2, DIM1_3, DIM3_1, DIM2_1, DIM1_4, DIM3_2, DIM1_5, DIM3_3, DIM2_2, DIM2_3, DIM3_4, DIM1_6, DIM1_7, DIM2_4, DIM1_8, DIM3_5, DIM3_6, DIM3_7, DIM2_5, DIM3_8, DIM2_6
 * Escala: 0 (Nunca) a 6 (Siempre)
 */
export const BURDEN_QUESTIONS: { [key: string]: string } = {
  'DIM1_1': 'Me siento emocionalmente agotado por mi trabajo',
  'DIM1_2': 'Cuando termino mi jornada de trabajo me siento vacío',
  'DIM1_3': 'Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado',
  'DIM1_4': 'Siento que trabajar todo el día con la gente me cansa',
  'DIM1_5': 'Siento que mi trabajo me está desgastando',
  'DIM1_6': 'Me siento frustrado en mi trabajo',
  'DIM1_7': 'Siento que estoy demasiado tiempo en mi trabajo',
  'DIM1_8': 'Siento que trabajar en contacto directo con la gente me cansa',
  'DIM2_1': 'Siento que estoy tratando a algunos pacientes como si fueran objetos impersonales',
  'DIM2_2': 'Siento que me he hecho más duro con la gente',
  'DIM2_3': 'Me preocupa que este trabajo me esté endureciendo emocionalmente',
  'DIM2_4': 'Siento que realmente no me importa lo que les ocurra a mis pacientes',
  'DIM2_5': 'Me siento como si estuviera al límite de mis posibilidades',
  'DIM2_6': 'Me parece que los pacientes me culpan de alguno de sus problemas',
  'DIM3_1': 'Siento que puedo entender fácilmente a los pacientes',
  'DIM3_2': 'Siento que trato con mucha eficacia los problemas de mis pacientes',
  'DIM3_3': 'Siento que estoy influyendo positivamente en la vida de otras personas a través de mi trabajo',
  'DIM3_4': 'Me siento con mucha energía en mi trabajo',
  'DIM3_5': 'Siento que puedo crear con facilidad un clima agradable con mis pacientes',
  'DIM3_6': 'Me siento estimado después de haber trabajado íntimamente con mis pacientes',
  'DIM3_7': 'Creo que consigo muchas cosas valiosas en este trabajo',
  'DIM3_8': 'Siento que en mi trabajo los problemas emocionales son tratados de forma adecuada',
};

/**
 * EMPATHY TEST (Escala de Empatía)
 * 29 preguntas en orden según CSV: DIM1_1 a DIM1_13, luego DIM2_1 a DIM2_9, luego DIM3_1 a DIM3_7
 * Escala: 0 (Muy bajo), 1 (Promedio), 2 (Muy alto)
 */
export const EMPATHY_QUESTIONS: { [key: string]: string } = {
  // DIM1 - Cognitive Empathy (13 questions)
  'DIM1_1': 'Puedo saber fácilmente si alguien más quiere participar en una conversación.',
  'DIM1_2': 'Puedo entender rápidamente si alguien dice una cosa pero quiere decir otra.',
  'DIM1_3': 'Soy bueno prediciendo cómo se sentirá alguien.',
  'DIM1_4': 'Soy rápido en detectar cuando alguien en un grupo se siente incómodo o incómodo.',
  'DIM1_5': 'Otras personas me dicen que soy bueno entendiendo cómo se sienten y qué están pensando.',
  'DIM1_6': 'Puedo saber fácilmente si alguien más está interesado o aburrido con lo que estoy diciendo.',
  'DIM1_7': 'Los amigos suelen hablar conmigo de sus problemas porque dicen que soy muy comprensiva.',
  'DIM1_8': 'Puedo sentir si estoy entrometiendo, incluso si la otra persona no me lo dice.',
  'DIM1_9': 'Puedo sintonizarme con los sentimientos de otra persona de manera rápida e intuitiva.',
  'DIM1_10': 'Puedo entender fácilmente lo que otra persona podría querer decir.',
  'DIM1_11': 'Puedo saber si alguien está enmascarando su verdadera emoción.',
  'DIM1_12': 'Soy bueno prediciendo lo que alguien hará.',
  'DIM1_13': 'Generalmente puedo apreciar el punto de vista de la otra persona, incluso si no estoy de acuerdo con él.',
  // DIM2 - Emotional Empathy (9 questions)
  'DIM2_1': 'En una conversación, tiendo a centrarme en mis propios pensamientos en lugar de en lo que pueda estar pensando mi oyente.',
  'DIM2_2': 'Si digo algo que ofende a otra persona, pienso que es su problema, no mío.',
  'DIM2_3': 'Ver a la gente llorar realmente no me molesta.',
  'DIM2_4': 'Me enojo si veo gente sufriendo en los programas de noticias.',
  'DIM2_5': 'A veces la gente me dice que he ido demasiado lejos con las bromas.',
  'DIM2_6': 'Otras personas a menudo dicen que soy insensible, aunque no siempre entiendo por qué.',
  'DIM2_7': 'Si veo a un extraño en un grupo, pienso que es su responsabilidad hacer el esfuerzo de unirse.',
  'DIM2_8': 'Generalmente me mantengo emocionalmente distante cuando veo una película.',
  'DIM2_9': 'Tengo tendencia a involucrarme emocionalmente con los problemas de mis amigos.',
  // DIM3 - Social Empathy (7 questions)
  'DIM3_1': 'Me resulta difícil explicar a los demás cosas que entiendo fácilmente, cuando ellos no las entienden a la primera.',
  'DIM3_2': 'Me resulta difícil saber qué hacer en una situación social.',
  'DIM3_3': 'Las amistades y las relaciones son demasiado difíciles, por lo que tiendo a no molestarme con ellas.',
  'DIM3_4': 'A menudo me resulta difícil juzgar si algo es grosero o educado.',
  'DIM3_5': 'Me resulta difícil entender por qué algunas cosas molestan tanto a la gente.',
  'DIM3_6': 'No suelo encontrar confusas las situaciones sociales.',
  'DIM3_7': 'No desarrollo conscientemente las reglas de las situaciones sociales.',
};

/**
 * BIG 5 SUB ESCALAS (Big Five Personality Test)
 * 20 preguntas en orden según CSV: DIM1_1, DIM3_1, DIM2_1, DIM4_1, DIM5_1, DIM3_2, DIM1_2, DIM2_2, DIM5_2, DIM3_3, DIM1_3, DIM2_3, DIM5_3, DIM4_2, DIM1_4, DIM4_3, DIM3_4, DIM5_4, DIM4_4, DIM2_4
 * Escala: 1 (Muy en desacuerdo) a 5 (Muy de acuerdo)
 */
export const BIG5_QUESTIONS: { [key: string]: string } = {
  // DIM1 - Extraversion (4 questions)
  'DIM1_1': 'Me resulta fácil convencer a los demás de mis ideas',
  'DIM1_2': 'Me gusta la aventura y asumir los riesgos',
  'DIM1_3': 'Si alguien me grita, suelo responder gritando',
  'DIM1_4': 'Procuro destacarme en cualquier actividad',
  // DIM2 - Agreeableness (4 questions)
  'DIM2_1': 'Procuro ser cortés incluso con los que no me caen bien',
  'DIM2_2': 'Los que me conocen saben que siempre pueden contar conmigo',
  'DIM2_3': 'Rara vez soy yo el que comienza una disputa con otra persona',
  'DIM2_4': 'Prefiero cooperar a competir',
  // DIM3 - Conscientiousness (4 questions)
  'DIM3_1': 'En general se puede confiar en que cumpliré mis compromisos',
  'DIM3_2': 'Cuando emprendo una tarea, no me desanimo fácilmente',
  'DIM3_3': 'Tiendo a ser riguroso y ordenado en todo',
  'DIM3_4': 'Cuando tomo una decisión, procuro siempre llevarla a cabo',
  // DIM4 - Neuroticism (4 questions)
  'DIM4_1': 'No me irrito fácilmente',
  'DIM4_2': 'Olvido fácilmente las ofensas que recibo',
  'DIM4_3': 'Me siento satisfecho de cómo me va la vida',
  'DIM4_4': 'Es difícil que pierda el control sobre mis actos',
  // DIM5 - Openness (4 questions)
  'DIM5_1': 'Siempre decido tras tomar en cuenta distintas alternativas y puntos de vista',
  'DIM5_2': 'Me entusiasma conocer la vida y costumbres de otros pueblos y culturas',
  'DIM5_3': 'Me atraen las situaciones y experiencias nuevas y desconocidas',
  'DIM5_4': 'Realmente disfruto de la contemplación de una obra de arte',
};

/**
 * Get question text by ID and test type
 */
export function getQuestionText(questionId: string, test: 'burden' | 'empathy' | 'big5'): string {
  switch (test) {
    case 'burden':
      return BURDEN_QUESTIONS[questionId] || `Pregunta ${questionId}`;
    case 'empathy':
      return EMPATHY_QUESTIONS[questionId] || `Pregunta ${questionId}`;
    case 'big5':
      return BIG5_QUESTIONS[questionId] || `Pregunta ${questionId}`;
    default:
      return `Pregunta ${questionId}`;
  }
}

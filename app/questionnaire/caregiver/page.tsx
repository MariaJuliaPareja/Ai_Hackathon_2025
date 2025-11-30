'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { 
  loadQuestionnaires, 
  calculateBurdenScore, 
  calculateEmpathyScore, 
  calculateBig5Score,
  getScaleOptions,
  type Question,
  type QuestionnaireData 
} from '@/lib/questionnaire/questions';
import { getQuestionText } from '@/lib/questionnaire/questionTexts';
import { evaluateQuestionnaireResults, type EvaluationResult } from '@/lib/questionnaire/evaluation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type TestType = 'burden' | 'empathy' | 'big5';

interface Answers {
  [questionId: string]: number;
}

const TEST_NAMES: { [key in TestType]: string } = {
  burden: 'Maslach Burnout Inventory (MBI-HSS)',
  empathy: 'Escala de Empatía',
  big5: 'Big 5 - Personalidad',
};

const TEST_DESCRIPTIONS: { [key in TestType]: string } = {
  burden: 'Evalúa el nivel de carga y estrés asociado al cuidado de un familiar. Responde según la frecuencia con la que experimentas cada situación (Nunca a Siempre).',
  empathy: 'Mide tu capacidad de empatía y comprensión emocional. Indica tu nivel de acuerdo con cada afirmación (Muy bajo, Bajo, Promedio, Muy alto).',
  big5: 'Evalúa tus rasgos de personalidad en cinco dimensiones: Extraversión, Amabilidad, Responsabilidad, Neuroticismo y Apertura. Indica tu nivel de acuerdo (Muy en desacuerdo a Muy de acuerdo).',
};

export default function CaregiverQuestionnaire() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [currentTest, setCurrentTest] = useState<TestType>('burden');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionnaireData | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      
      // Load questionnaires
      try {
        const data = await loadQuestionnaires();
        setQuestions(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading questionnaires:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getCurrentQuestions = (): Question[] => {
    if (!questions) return [];
    return questions[currentTest];
  };

  const getCurrentQuestion = (): Question | null => {
    const currentQuestions = getCurrentQuestions();
    return currentQuestions[currentQuestionIndex] || null;
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    const currentQuestions = getCurrentQuestions();
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to next test
      const testOrder: TestType[] = ['burden', 'empathy', 'big5'];
      const currentIndex = testOrder.indexOf(currentTest);
      if (currentIndex < testOrder.length - 1) {
        setCurrentTest(testOrder[currentIndex + 1]);
        setCurrentQuestionIndex(0);
      } else {
        // All tests completed, submit
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Go back to previous test
      const testOrder: TestType[] = ['burden', 'empathy', 'big5'];
      const currentIndex = testOrder.indexOf(currentTest);
      if (currentIndex > 0) {
        setCurrentTest(testOrder[currentIndex - 1]);
        const prevQuestions = questions?.[testOrder[currentIndex - 1]] || [];
        setCurrentQuestionIndex(prevQuestions.length - 1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!userId || !questions) return;

    setIsSubmitting(true);
    try {
      // Calculate scores for each test
      const burdenAnswers: { [key: string]: number } = {};
      const empathyAnswers: { [key: string]: number } = {};
      const big5Answers: { [key: string]: number } = {};

      questions.burden.forEach(q => {
        if (answers[q.id] !== undefined) {
          burdenAnswers[q.id] = answers[q.id];
        }
      });

      questions.empathy.forEach(q => {
        if (answers[q.id] !== undefined) {
          empathyAnswers[q.id] = answers[q.id];
        }
      });

      questions.big5.forEach(q => {
        if (answers[q.id] !== undefined) {
          big5Answers[q.id] = answers[q.id];
        }
      });

      const burdenScore = calculateBurdenScore(burdenAnswers);
      const empathyScore = calculateEmpathyScore(empathyAnswers);
      const big5Score = calculateBig5Score(big5Answers);

      // Evaluate results
      const evaluation = evaluateQuestionnaireResults({
        burden: burdenScore,
        empathy: empathyScore,
        big5: big5Score,
      });
      setEvaluationResult(evaluation);

      // Save to Firestore
      const resultsData = {
        burden_test: {
          score: burdenScore,
          answers: burdenAnswers,
        },
        empathy_test: {
          score: empathyScore,
          answers: empathyAnswers,
        },
        big5_test: {
          score: big5Score,
          answers: big5Answers,
        },
        evaluation: {
          isAcceptable: evaluation.isAcceptable,
          reason: evaluation.reason,
        },
        completedAt: serverTimestamp(),
      };

      await setDoc(
        doc(db, 'caregivers', userId, 'questionnaire_results', 'latest'),
        resultsData
      );

      // Update caregiver profile
      await updateDoc(doc(db, 'caregivers', userId), {
        questionnaire_completed: true,
        questionnaire_scores: {
          burden: burdenScore,
          empathy: empathyScore,
          big5: big5Score,
        },
        profile_approved: evaluation.isAcceptable,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Questionnaire results saved');
      
      // Show results before redirecting
      setShowResults(true);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Error al guardar las respuestas. Por favor, intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  const getProgress = (): number => {
    if (!questions) return 0;
    
    const testOrder: TestType[] = ['burden', 'empathy', 'big5'];
    const currentTestIndex = testOrder.indexOf(currentTest);
    const totalQuestions = questions.burden.length + questions.empathy.length + questions.big5.length;
    
    let completedQuestions = 0;
    for (let i = 0; i < currentTestIndex; i++) {
      completedQuestions += questions[testOrder[i]].length;
    }
    
    completedQuestions += currentQuestionIndex + 1;
    
    return Math.round((completedQuestions / totalQuestions) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando cuestionarios...</p>
        </div>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar los cuestionarios</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentQuestions = getCurrentQuestions();
  const scaleOptions = getScaleOptions(currentTest);
  const progress = getProgress();
  const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
  const isLastTest = currentTest === 'big5';

  // Show results screen after completion
  if (showResults && evaluationResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Resultados de la Evaluación
              </CardTitle>
              <CardDescription className="text-center">
                Análisis de tu perfil como cuidador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Result */}
              <div className={`p-6 rounded-lg border-2 ${
                evaluationResult.isAcceptable 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-3xl ${evaluationResult.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                    {evaluationResult.isAcceptable ? '✓' : '✗'}
                  </span>
                  <h2 className={`text-xl font-bold ${
                    evaluationResult.isAcceptable ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {evaluationResult.isAcceptable ? 'Perfil Aprobado' : 'Perfil Requiere Evaluación'}
                  </h2>
                </div>
                <p className={`text-base ${
                  evaluationResult.isAcceptable ? 'text-green-700' : 'text-red-700'
                }`}>
                  {evaluationResult.reason}
                </p>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Detalle por Test:</h3>
                
                {/* Burden Test */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-700">Maslach Burnout Inventory (MBI-HSS)</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      evaluationResult.details.burden.status === 'acceptable'
                        ? 'bg-green-100 text-green-800'
                        : evaluationResult.details.burden.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {evaluationResult.details.burden.status === 'acceptable' ? 'Aceptable' :
                       evaluationResult.details.burden.status === 'warning' ? 'Advertencia' :
                       'No Aceptable'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Puntuación: {evaluationResult.details.burden.score}%</span>
                      <span>Menor es mejor</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      evaluationResult.details.burden.status === 'acceptable' ? 'bg-green-200' :
                      evaluationResult.details.burden.status === 'warning' ? 'bg-yellow-200' :
                      'bg-red-200'
                    }`}>
                      <div 
                        className={`h-full ${
                          evaluationResult.details.burden.status === 'acceptable' ? 'bg-green-600' :
                          evaluationResult.details.burden.status === 'warning' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${evaluationResult.details.burden.score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{evaluationResult.details.burden.message}</p>
                </div>

                {/* Empathy Test */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-700">Escala de Empatía</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      evaluationResult.details.empathy.status === 'acceptable'
                        ? 'bg-green-100 text-green-800'
                        : evaluationResult.details.empathy.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {evaluationResult.details.empathy.status === 'acceptable' ? 'Aceptable' :
                       evaluationResult.details.empathy.status === 'warning' ? 'Advertencia' :
                       'No Aceptable'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Puntuación: {evaluationResult.details.empathy.score}%</span>
                      <span>Mayor es mejor</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      evaluationResult.details.empathy.status === 'acceptable' ? 'bg-green-200' :
                      evaluationResult.details.empathy.status === 'warning' ? 'bg-yellow-200' :
                      'bg-red-200'
                    }`}>
                      <div 
                        className={`h-full ${
                          evaluationResult.details.empathy.status === 'acceptable' ? 'bg-green-600' :
                          evaluationResult.details.empathy.status === 'warning' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${evaluationResult.details.empathy.score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{evaluationResult.details.empathy.message}</p>
                </div>

                {/* Big5 Test */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-700">Big 5 - Personalidad</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      evaluationResult.details.big5.status === 'acceptable'
                        ? 'bg-green-100 text-green-800'
                        : evaluationResult.details.big5.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {evaluationResult.details.big5.status === 'acceptable' ? 'Aceptable' :
                       evaluationResult.details.big5.status === 'warning' ? 'Advertencia' :
                       'No Aceptable'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Puntuación: {evaluationResult.details.big5.score}%</span>
                      <span>Mayor es mejor</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      evaluationResult.details.big5.status === 'acceptable' ? 'bg-green-200' :
                      evaluationResult.details.big5.status === 'warning' ? 'bg-yellow-200' :
                      'bg-red-200'
                    }`}>
                      <div 
                        className={`h-full ${
                          evaluationResult.details.big5.status === 'acceptable' ? 'bg-green-600' :
                          evaluationResult.details.big5.status === 'warning' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${evaluationResult.details.big5.score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{evaluationResult.details.big5.message}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/dashboard/caregiver')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Continuar al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No hay más preguntas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cuestionarios de Evaluación
          </h1>
          <p className="text-gray-600">
            Completa estos cuestionarios para mejorar tu perfil y matching
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {TEST_NAMES[currentTest]}
            </span>
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} de {currentQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            Progreso general: {progress}%
          </p>
        </div>

        {/* Test Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">{TEST_NAMES[currentTest]}</CardTitle>
            <CardDescription>{TEST_DESCRIPTIONS[currentTest]}</CardDescription>
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Question */}
              <div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {TEST_NAMES[currentTest]}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {getQuestionText(currentQuestion.id, currentTest)}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Pregunta {currentQuestionIndex + 1} de {currentQuestions.length}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {scaleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.value}
                      checked={answers[currentQuestion.id] === option.value}
                      onChange={() => handleAnswer(currentQuestion.id, option.value)}
                      className="mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 && currentTest === 'burden'}
            variant="outline"
            className="flex-1"
          >
            Atrás
          </Button>
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isLastQuestion && isLastTest
              ? isSubmitting
                ? 'Guardando...'
                : 'Finalizar'
              : 'Siguiente'}
          </Button>
        </div>

        {/* Test Navigation */}
        <div className="mt-6 flex justify-center gap-2">
          {(['burden', 'empathy', 'big5'] as TestType[]).map((test) => (
            <button
              key={test}
              onClick={() => {
                setCurrentTest(test);
                setCurrentQuestionIndex(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTest === test
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {TEST_NAMES[test].split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

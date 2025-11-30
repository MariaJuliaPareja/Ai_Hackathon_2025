'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { CaregiverMatch } from '@/lib/types/matching';
import MatchingInProgress from './components/MatchingInProgress';
import MatchCard from './components/MatchCard';
import APIStatusBanner from './components/APIStatusBanner';
import { processMatchingForSenior } from '@/lib/firebase/functions/processMatching';

const demoMatches: CaregiverMatch[] = [
  {
    matchId: 'demo-claudia',
    caregiverId: 'demo-caregiver-1',
    seniorId: 'demo-senior',
    score: {
      overall: 94,
      breakdown: {
        semantic_similarity: 96,
        skills_match: 93,
        location_proximity: 90,
        availability_fit: 88,
        experience_level: 95,
      },
    },
    mlReasoning: {
      summary: 'IA identifica a Claudia como la mejor candidata para cuidado de Alzheimer con disponibilidad diaria y tarifas claras.',
      strengths: [
        '5+ años de experiencia con Alzheimer y demencia',
        'Vive en Miraflores, Lima (misma zona)',
        'Disponible lunes a sábado de 8am a 6pm',
      ],
      considerations: ['Tarifa premium por su especialización', 'No trabaja fines de semana completos'],
      compatibility_factors: {
        medical_expertise: 'Fuerte experiencia en Alzheimer y diabetes, maneja medicación inyectable y monitoreo glicémico.',
        care_approach: 'Estilo tranquilo, educación en enfermería y comunicación constante con la familia.',
        practical_fit: 'Ubicada en Miraflores, disponibilidad diaria de 8am a 6pm, tarifa S/38/h.',
      },
    },
    caregiver: {
      name: 'Claudia Ríos',
      age: 34,
      location: 'Miraflores, Lima',
      yearsExperience: 8,
      skills: ['Cuidado de Alzheimer', 'Administración de medicamentos', 'Movilización segura'],
      certifications: ['Enfermería Geriátrica', 'Primeros Auxilios Avanzados'],
      bio: 'Cuidadora con 8 años atendiendo adultos mayores con requerimientos médicos complejos en Lima.',
      hourlyRate: 38,
      availability: {
        lun: [8, 18],
        mar: [8, 18],
        mie: [8, 18],
        jue: [8, 18],
        vie: [8, 18],
      },
      avgRating: 4.9,
      totalHours: 3200,
    },
    status: 'pending',
    createdAt: new Date(),
    rank: 1,
  },
  {
    matchId: 'demo-miguel',
    caregiverId: 'demo-caregiver-2',
    seniorId: 'demo-senior',
    score: {
      overall: 88,
      breakdown: {
        semantic_similarity: 85,
        skills_match: 82,
        location_proximity: 78,
        availability_fit: 92,
        experience_level: 90,
      },
    },
    mlReasoning: {
      summary: 'IA señala a Miguel como match sólido para cuidados cotidianos y movilidad leve.',
      strengths: [
        '10 años de experiencia en cuidado continuo',
        'Disponible 7 días con turnos rotativos',
        'Capacitación en terapia ocupacional básica',
      ],
      considerations: ['Vive en San Isidro, requiere 20 min de traslado extra'],
      compatibility_factors: {
        medical_expertise: 'Amplia experiencia en geriatría general y cuidados postoperatorios.',
        care_approach: 'Enfoque proactivo, documenta avances y mantiene comunicación diaria.',
        practical_fit: 'Ubicado en San Isidro, tarifa S/34/h, alta disponibilidad nocturna.',
      },
    },
    caregiver: {
      name: 'Miguel Tapia',
      age: 41,
      location: 'San Isidro, Lima',
      yearsExperience: 10,
      skills: ['Movilización', 'Cuidado postoperatorio', 'Apoyo en terapia ocupacional'],
      certifications: ['Certificación en Cuidados Paliativos'],
      bio: 'Cuidadores con recorrido en clínicas privadas y hogares con necesidades de rehabilitación.',
      hourlyRate: 34,
      availability: {
        lun: [8, 20],
        mar: [8, 20],
        mie: [8, 20],
        jue: [8, 20],
        vie: [8, 18],
        sab: [8, 14],
      },
      avgRating: 4.8,
      totalHours: 4100,
    },
    status: 'pending',
    createdAt: new Date(),
    rank: 2,
  },
];

export default function SeniorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState<'queued' | 'processing' | 'ready' | 'error'>('queued');
  const [matchProgress, setMatchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [matches, setMatches] = useState<CaregiverMatch[]>([]);
  const [seniorName, setSeniorName] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const hasLiveMatches = matches.length > 0;
  const matchesToDisplay = hasLiveMatches ? matches : demoMatches;

  // First useEffect: Load senior profile and set up auth listener
  useEffect(() => {
    let statusUnsubscribe = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      setUserId(firebaseUser.uid);

      try {
        const seniorDoc = await getDoc(doc(db, 'seniors', firebaseUser.uid));
        if (!seniorDoc.exists()) {
          router.push('/onboarding/senior');
          return;
        }

        const seniorData = seniorDoc.data();
        setSeniorName(seniorData.name || 'Usuario');
        setMatchStatus(seniorData.match_status || 'queued');
        setMatchProgress(seniorData.match_progress || 0);
        setCurrentStep(seniorData.match_current_step || '');

        // If queued or pending, trigger matching (with error handling)
        if (seniorData.match_status === 'queued' || seniorData.match_status === 'pending') {
          try {
            await processMatchingForSenior(firebaseUser.uid);
          } catch (error) {
            console.error('Error processing matching:', error);
            // Don't block the UI, let it show demo matches if available
          }
        }

        statusUnsubscribe = onSnapshot(doc(db, 'seniors', firebaseUser.uid), (doc) => {
          const data = doc.data();
          if (data) {
            setMatchStatus(data.match_status || 'queued');
            setMatchProgress(data.match_progress || 0);
            setCurrentStep(data.match_current_step || '');
          }
        });
      } catch (error) {
        console.error('Error loading senior dashboard:', error);
        setErrorMessage('No se pudo cargar el perfil. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      statusUnsubscribe();
    };
  }, [router]);

  // Second useEffect: Subscribe to matches when status is ready
  useEffect(() => {
    if (!userId) return;
    if (matchStatus !== 'ready') {
      setMatches([]);
      return;
    }

    const matchesQuery = query(
      collection(db, 'seniors', userId, 'matches'),
      orderBy('rank', 'asc')
    );

    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        matchId: doc.id,
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date(),
      })) as CaregiverMatch[];

      setMatches(matchesData);
    });

    return () => unsubscribeMatches();
  }, [userId, matchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <APIStatusBanner />
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {seniorName}
          </h1>
          <p className="text-gray-600 mt-1">
            Encuentra el cuidador perfecto con ayuda de inteligencia artificial
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {matchStatus === 'processing' || matchStatus === 'queued' ? (
          <MatchingInProgress 
            progress={matchProgress} 
            currentStep={currentStep}
          />
        ) : matchStatus === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error en el proceso de matching
            </h3>
            <p className="text-red-700">
              Ocurrió un error al buscar cuidadores. Por favor, contacta a soporte.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Tus Mejores Matches
              </h2>
              <p className="text-gray-600 mt-1">
                {hasLiveMatches
                  ? `Encontramos ${matches.length} cuidadores altamente compatibles, ordenados por inteligencia artificial según tus necesidades.`
                  : 'Mientras recogemos tus datos reales, mostramos matches generados por IA para ilustrar el tipo de cuidadores que podrías recibir.'}
              </p>
            </div>

            {!hasLiveMatches && (
              <div className="mb-4 px-4 py-3 bg-white border border-dashed border-blue-200 text-sm text-blue-800 rounded-lg">
                Estos matches fueron creados con IA para que visualices el resultado mientras termina el procesamiento real.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matchesToDisplay.map((match) => (
                <MatchCard 
                  key={match.matchId} 
                  match={match}
                  seniorId={userId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


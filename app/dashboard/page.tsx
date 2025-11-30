'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthGuard } from '@/components/AuthGuard';
import type { CaregiverMatch } from '@/lib/types/matching';
import MatchingInProgress from './senior/components/MatchingInProgress';
import MatchCard from './senior/components/MatchCard';
import { processMatchingForSenior } from '@/lib/firebase/functions/processMatching';
import { logAPIKeyStatus } from '@/lib/utils/apiCheck';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState<'queued' | 'processing' | 'ready' | 'error'>('queued');
  const [matchProgress, setMatchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [matches, setMatches] = useState<CaregiverMatch[]>([]);
  const [seniorName, setSeniorName] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const matchingTriggeredRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Log API key status on mount
  useEffect(() => {
    console.log('🔍 Dashboard mounted');
    logAPIKeyStatus();
    setDebugInfo(prev => [...prev, 'Dashboard mounted']);
  }, []);

  // Timeout safety: if loading takes too long, show error
  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.error('⏱️ Loading timeout - dashboard stuck in loading state');
        setDebugInfo(prev => [...prev, 'Loading timeout reached']);
        setLoading(false);
        setErrorMessage('El dashboard está tardando demasiado en cargar. Verifica la consola para más detalles.');
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  // First useEffect: Load senior profile and set up auth listener
  useEffect(() => {
    console.log('🔍 Setting up auth listener');
    setDebugInfo(prev => [...prev, 'Setting up auth listener']);
    
    let statusUnsubscribe = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('👤 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      setDebugInfo(prev => [...prev, `Auth state: ${firebaseUser ? 'logged in' : 'not logged in'}`]);

      if (!firebaseUser) {
        console.log('❌ No user, redirecting to login');
        router.push('/login');
        return;
      }

      setUserId(firebaseUser.uid);
      console.log('✅ User ID set:', firebaseUser.uid);
      setDebugInfo(prev => [...prev, `User ID: ${firebaseUser.uid}`]);

      try {
        console.log('📄 Loading senior profile...');
        setDebugInfo(prev => [...prev, 'Loading senior profile']);
        
        const seniorDoc = await getDoc(doc(db, 'seniors', firebaseUser.uid));
        if (!seniorDoc.exists()) {
          console.log('❌ Senior profile not found, redirecting to onboarding');
          router.push('/onboarding/senior');
          return;
        }

        const seniorData = seniorDoc.data();
        console.log('✅ Senior profile loaded:', {
          name: seniorData.name,
          match_status: seniorData.match_status,
          match_progress: seniorData.match_progress,
        });
        setDebugInfo(prev => [...prev, `Profile loaded: ${seniorData.name || 'Unknown'}`]);

        setSeniorName(seniorData.name || 'Usuario');
        setMatchStatus(seniorData.match_status || 'queued');
        setMatchProgress(seniorData.match_progress || 0);
        setCurrentStep(seniorData.match_current_step || '');

        // ALWAYS trigger matching to ensure Claude API is used (but only once)
        const shouldTriggerMatching = 
          (seniorData.match_status === 'queued' || 
           seniorData.match_status === 'pending' || 
           !seniorData.match_status) &&
          !matchingTriggeredRef.current;

        if (shouldTriggerMatching) {
          matchingTriggeredRef.current = true;
          console.log('🚀 Triggering Claude API matching...');
          setDebugInfo(prev => [...prev, 'Triggering matching process']);
          
          try {
            // Don't await - let it run in background
            processMatchingForSenior(firebaseUser.uid).catch((error) => {
              console.error('❌ Error processing matching:', error);
              setDebugInfo(prev => [...prev, `Matching error: ${error.message}`]);
              setErrorMessage(`Error al procesar matching: ${error.message}`);
            });
          } catch (error: any) {
            console.error('❌ Error calling processMatchingForSenior:', error);
            setDebugInfo(prev => [...prev, `Error: ${error.message}`]);
            setErrorMessage(`Error al iniciar matching: ${error.message}`);
          }
        } else {
          console.log('⏭️ Skipping matching trigger:', {
            status: seniorData.match_status,
            alreadyTriggered: matchingTriggeredRef.current,
          });
        }

        console.log('👂 Setting up Firestore listener for senior status...');
        statusUnsubscribe = onSnapshot(
          doc(db, 'seniors', firebaseUser.uid), 
          (doc) => {
            const data = doc.data();
            if (data) {
              console.log('📊 Status update:', {
                match_status: data.match_status,
                match_progress: data.match_progress,
                current_step: data.match_current_step,
              });
              setMatchStatus(data.match_status || 'queued');
              setMatchProgress(data.match_progress || 0);
              setCurrentStep(data.match_current_step || '');
            }
          },
          (error) => {
            console.error('❌ Firestore listener error:', error);
            setDebugInfo(prev => [...prev, `Listener error: ${error.message}`]);
          }
        );
      } catch (error: any) {
        console.error('❌ Error loading senior dashboard:', error);
        setDebugInfo(prev => [...prev, `Load error: ${error.message}`]);
        setErrorMessage(`No se pudo cargar el perfil: ${error.message}`);
      } finally {
        console.log('✅ Loading complete');
        setLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
      statusUnsubscribe();
    };
  }, [router]);

  // Second useEffect: Subscribe to matches when status is ready
  useEffect(() => {
    console.log('🔍 Matches subscription effect:', { userId, matchStatus });
    
    if (!userId) {
      console.log('⏭️ No userId, skipping matches subscription');
      return;
    }
    
    if (matchStatus !== 'ready') {
      console.log('⏭️ Status not ready, clearing matches:', matchStatus);
      setMatches([]);
      return;
    }

    console.log('👂 Setting up matches listener...');
    setDebugInfo(prev => [...prev, 'Setting up matches listener']);

    const matchesQuery = query(
      collection(db, 'seniors', userId, 'matches'),
      orderBy('rank', 'asc')
    );

    const unsubscribeMatches = onSnapshot(
      matchesQuery, 
      (snapshot) => {
        console.log('📊 Matches snapshot received:', {
          size: snapshot.size,
          empty: snapshot.empty,
        });
        
        const matchesData = snapshot.docs
          .map(doc => ({
            ...doc.data(),
            matchId: doc.id,
            createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date(),
          }))
          .filter((match: any) => {
            const name = match.caregiver?.name;
            return name && name !== 'Nombre no disponible' && name !== 'Unknown Caregiver';
          }) as CaregiverMatch[]; // Filter out matches without caregiver name or with placeholder names

        console.log(`✅ Loaded ${matchesData.length} matches from Claude API`);
        setDebugInfo(prev => [...prev, `Loaded ${matchesData.length} matches`]);
        setMatches(matchesData);
      },
      (error) => {
        console.error('❌ Matches listener error:', error);
        setDebugInfo(prev => [...prev, `Matches listener error: ${error.message}`]);
        setErrorMessage(`Error cargando matches: ${error.message}`);
      }
    );

    return () => {
      console.log('🧹 Cleaning up matches listener');
      unsubscribeMatches();
    };
  }, [userId, matchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando matchmaking con Claude AI...</p>
        </div>
      </div>
    );
  }

  // Debug panel (only in development)
  const showDebug = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          {/* Debug Info Panel */}
          {showDebug && debugInfo.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 py-2">
              <details className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-xs">
                <summary className="cursor-pointer font-mono text-gray-700">
                  🐛 Debug Info ({debugInfo.length} events)
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, idx) => (
                    <div key={idx} className="font-mono text-gray-600">{info}</div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {errorMessage && (
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">{errorMessage}</p>
                <p className="text-red-600 text-sm mt-2">
                  Verifica que NEXT_PUBLIC_ANTHROPIC_API_KEY esté configurada en .env.local
                </p>
                {showDebug && (
                  <button
                    onClick={() => {
                      console.log('🔍 Current state:', {
                        loading,
                        matchStatus,
                        matchProgress,
                        matchesCount: matches.length,
                        userId,
                        seniorName,
                      });
                      setDebugInfo(prev => [...prev, 'Manual debug log triggered']);
                    }}
                    className="mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                  >
                    Log State to Console
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Matchmaking con Claude AI
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {seniorName || 'Usuario'} - Encuentra el cuidador perfecto con inteligencia artificial
              </p>
              {showDebug && (
                <div className="mt-2 text-xs text-gray-500">
                  Status: {matchStatus} | Progress: {matchProgress}% | Matches: {matches.length} | UserId: {userId || 'none'}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - ALWAYS render something */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {matchStatus === 'processing' || matchStatus === 'queued' ? (
              <MatchingInProgress 
                progress={matchProgress} 
                currentStep={currentStep || 'Iniciando...'}
              />
            ) : matchStatus === 'error' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error en el proceso de matching
                </h3>
                <p className="text-red-700 mb-4">
                  Ocurrió un error al buscar cuidadores con Claude API.
                </p>
                <div className="bg-white rounded p-4 border border-red-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Verifica:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>Que NEXT_PUBLIC_ANTHROPIC_API_KEY esté en .env.local</li>
                    <li>Que la API key sea válida y comience con "sk-ant-"</li>
                    <li>Que hayas reiniciado el servidor después de agregar la API key</li>
                    <li>Revisa la consola del navegador para más detalles</li>
                  </ul>
                </div>
                {showDebug && (
                  <button
                    onClick={() => {
                      matchingTriggeredRef.current = false;
                      if (userId) {
                        processMatchingForSenior(userId).catch(console.error);
                      }
                    }}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Reintentar Matching
                  </button>
                )}
              </div>
            ) : matchStatus === 'ready' && matches.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  No hay matches disponibles
                </h3>
                <p className="text-yellow-700 mb-4">
                  El proceso de matching con Claude API completó pero no generó resultados.
                  Verifica que haya cuidadores en la base de datos.
                </p>
                {showDebug && (
                  <div className="mt-4 text-left bg-white rounded p-4 border border-yellow-200">
                    <p className="text-xs font-mono text-gray-600">
                      Debug: Status={matchStatus}, Matches={matches.length}, UserId={userId}
                    </p>
                  </div>
                )}
              </div>
            ) : matches.length > 0 ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Matches Generados por Claude AI
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Encontramos {matches.length} cuidadores altamente compatibles, 
                        analizados y rankeados por Claude AI según tus necesidades específicas
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                      <p className="text-sm font-medium text-green-900">
                        ✅ Powered by Claude AI
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {matches.map((match) => (
                    <MatchCard 
                      key={match.matchId} 
                      match={match}
                      seniorId={userId}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Fallback: Show something even if state is unclear
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Esperando resultados del matching...
                </h3>
                <p className="text-blue-700">
                  El proceso está en curso. Los matches aparecerán aquí cuando estén listos.
                </p>
                {showDebug && (
                  <div className="mt-4 text-left bg-white rounded p-4 border border-blue-200">
                    <p className="text-xs font-mono text-gray-600">
                      Debug: Status={matchStatus}, Progress={matchProgress}%, Matches={matches.length}, Step={currentStep || 'none'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AuthGuard>
    </ErrorBoundary>
  );
}


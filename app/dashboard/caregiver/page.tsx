'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SeniorProfile } from '@/lib/types/firestore';

interface JobApplication {
  seniorId: string;
  caregiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: any;
}

const CARE_INTENSITY_LABELS: Record<string, string> = {
  light: 'Ligero',
  moderate: 'Moderado',
  intensive: 'Intensivo',
  '24_7': '24/7',
};

const COGNITIVE_STATUS_LABELS: Record<string, string> = {
  normal: 'Normal',
  mild_impairment: 'Deterioro Leve',
  moderate_impairment: 'Deterioro Moderado',
  severe_impairment: 'Deterioro Severo',
};

export default function CaregiverJobBoard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [jobs, setJobs] = useState<(SeniorProfile & { id: string })[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    // Query seniors with match_status 'ready' or 'pending'
    // Note: Firestore 'in' operator supports up to 10 values
    const jobsQuery = query(
      collection(db, 'seniors'),
      where('match_status', 'in', ['ready', 'pending']),
      where('onboardingCompleted', '==', true)
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (SeniorProfile & { id: string })[];
      setJobs(jobsData);
    });

    // Query existing applications for this caregiver
    const applicationsQuery = query(
      collection(db, 'job_applications'),
      where('caregiverId', '==', userId)
    );

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
      const appliedSet = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data() as JobApplication;
        if (data.status === 'pending' || data.status === 'accepted') {
          appliedSet.add(data.seniorId);
        }
      });
      setAppliedJobs(appliedSet);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
    };
  }, [userId]);

  const handleApply = async (seniorId: string) => {
    if (!userId || applying) return;

    setApplying(seniorId);
    try {
      // Check if application already exists
      const existingQuery = query(
        collection(db, 'job_applications'),
        where('seniorId', '==', seniorId),
        where('caregiverId', '==', userId)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        console.log('Application already exists');
        return;
      }

      // Create application
      const applicationId = `${seniorId}_${userId}`;
      await setDoc(doc(db, 'job_applications', applicationId), {
        seniorId,
        caregiverId: userId,
        status: 'pending',
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      } as JobApplication);

      console.log('Application submitted successfully');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Error al aplicar. Por favor, intenta de nuevo.');
    } finally {
      setApplying(null);
    }
  };

  const calculateMatchScore = (job: SeniorProfile & { id: string }): number => {
    // Simple match score calculation based on available data
    // In a real scenario, this would come from the matching system
    if (job.match_count && job.match_count > 0) {
      // If match_count exists, return a score based on it
      return Math.min(95, 70 + (job.match_count * 2));
    }
    // Default score for new jobs
    return 75;
  };

  const handleDownloadCSV = () => {
    const link = document.createElement('a');
    link.href = '/cuidador_processed_updated.csv';
    link.download = 'cuidador_processed_updated.csv';
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tablero de Trabajos
              </h1>
              <p className="text-gray-600 mt-1">
                Encuentra oportunidades de cuidado que se adapten a tu experiencia
              </p>
            </div>
            <Button 
              onClick={handleDownloadCSV} 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Descargar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {jobs.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 text-lg">
                No hay trabajos disponibles en este momento.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Los nuevos trabajos aparecerán aquí cuando los adultos mayores completen su perfil.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando <span className="font-semibold">{jobs.length}</span> trabajo{jobs.length !== 1 ? 's' : ''} disponible{jobs.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const matchScore = calculateMatchScore(job);
                const hasApplied = appliedJobs.has(job.id);
                const isApplying = applying === job.id;

                return (
                  <Card key={job.id} className="bg-white hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {job.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {job.age} años • {job.location}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`ml-2 ${
                            matchScore >= 85
                              ? 'bg-green-100 text-green-800'
                              : matchScore >= 70
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {matchScore}% Match
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Medical Conditions */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Condiciones Médicas
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {job.medical_comorbidities || 'No especificadas'}
                        </p>
                      </div>

                      {/* Care Needs */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Necesidades de Cuidado
                        </h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.routine_assistance_tasks?.slice(0, 3).map((task, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {task}
                            </Badge>
                          ))}
                          {job.routine_assistance_tasks?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.routine_assistance_tasks.length - 3} más
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>
                            Intensidad: <span className="font-medium">{CARE_INTENSITY_LABELS[job.care_intensity] || job.care_intensity}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>
                            Cognitivo: <span className="font-medium">{COGNITIVE_STATUS_LABELS[job.cognitive_status] || job.cognitive_status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {job.special_requirements && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">
                            Requisitos Especiales
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {job.special_requirements}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2 border-t">
                        {hasApplied ? (
                          <Button
                            disabled
                            className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                          >
                            Aplicación Enviada
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleApply(job.id)}
                            disabled={isApplying}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isApplying ? 'Aplicando...' : 'Aplicar Ahora'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


'use client';

import { useRouter } from 'next/navigation';

export default function CaregiverQuestionnaire() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Cuestionario de Cuidador</h1>
        <p className="text-gray-600 mb-6">Próximamente: Preguntas de evaluación</p>
        <button 
          onClick={() => router.push('/dashboard/caregiver')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Continuar al Dashboard
        </button>
      </div>
    </div>
  );
}


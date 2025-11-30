'use client';

import { useState } from 'react';
import { processMatchingForSenior } from '@/lib/firebase/functions/processMatching';
import { createMockCaregivers } from '@/lib/firebase/mockData';

interface Props {
  userId: string;
}

export default function NoMatches({ userId }: Props) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCreatingMocks, setIsCreatingMocks] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await processMatchingForSenior(userId);
    } catch (error) {
      console.error('Error retrying match:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCreateMockData = async () => {
    setIsCreatingMocks(true);
    try {
      await createMockCaregivers();
      // Retry matching after creating mocks
      await processMatchingForSenior(userId);
    } catch (error) {
      console.error('Error creating mock data:', error);
    } finally {
      setIsCreatingMocks(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No se encontraron matches en este momento
        </h2>
        <p className="text-gray-600">
          No pudimos encontrar cuidadores compatibles con tu perfil en este momento.
          Esto puede deberse a que no hay cuidadores disponibles que cumplan con tus
          requisitos específicos.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Sugerencias:</strong>
        </p>
        <ul className="text-sm text-yellow-700 mt-2 text-left list-disc list-inside space-y-1">
          <li>Intenta buscar nuevamente en unas horas</li>
          <li>Considera ajustar algunos requisitos si es posible</li>
          <li>Contacta a nuestro equipo de soporte para asistencia personalizada</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={handleRetry}
          disabled={isRetrying || isCreatingMocks}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Buscando nuevamente...
            </>
          ) : (
            'Intentar nuevamente'
          )}
        </button>
        <button
          onClick={handleCreateMockData}
          disabled={isRetrying || isCreatingMocks}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCreatingMocks ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Creando datos de demostración...
            </>
          ) : (
            'Crear Datos Demo'
          )}
        </button>
      </div>
    </div>
  );
}


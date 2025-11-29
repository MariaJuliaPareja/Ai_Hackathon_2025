'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import BasicInfoStep from './components/BasicInfoStep';
import MedicalProfileStep from './components/MedicalProfileStep';
import SeniorNeedsStep from './components/SeniorNeedsStep';
import FamilyContactStep from './components/FamilyContactStep';
import ReviewStep from './components/ReviewStep';

interface SeniorFormData {
  // Basic Info (Step 1)
  name: string;
  age: number;
  gender: 'M' | 'F' | 'other';
  location: string;
  
  // Medical Profile (Step 2)
  medical_comorbidities: string; // ML CRITICAL
  mobility_score: number; // ML CRITICAL (1-4)
  cognitive_status: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  
  // Care Needs & Routine (Step 3) - ML CRITICAL
  routine_medication_times: string; // e.g., "8:00 AM, 2:00 PM, 9:00 PM"
  routine_assistance_tasks: string[]; // e.g., ['Baño', 'Alimentación', 'Movilización']
  care_intensity: 'light' | 'moderate' | 'intensive' | '24_7';
  special_requirements: string;
  
  // Family Contact (Step 4)
  family_name: string;
  family_relationship: string;
  family_phone: string;
  family_email: string;
  
  // Profile Photo (optional across steps)
  profilePhoto?: {
    base64: string;
    thumbnail: string;
  };
}

const STEPS = [
  { id: 1, name: 'Información Básica', component: BasicInfoStep },
  { id: 2, name: 'Perfil Médico', component: MedicalProfileStep },
  { id: 3, name: 'Necesidades de Cuidado', component: SeniorNeedsStep },
  { id: 4, name: 'Contacto Familiar', component: FamilyContactStep },
  { id: 5, name: 'Revisar y Confirmar', component: ReviewStep },
];

export default function SeniorOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<SeniorFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  const handleStepComplete = (stepData: Partial<SeniorFormData>) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmit(updatedData);
    }
  };

  const handleFinalSubmit = async (finalData: Partial<SeniorFormData>) => {
    setIsSubmitting(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');

      // Save to Firestore
      await setDoc(doc(db, 'seniors', user.uid), {
        ...finalData,
        userId: user.uid,
        email: user.email,
        role: 'senior',
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Queue matching job
      await setDoc(doc(db, 'matching_queue', user.uid), {
        seniorId: user.uid,
        status: 'queued',
        createdAt: serverTimestamp(),
      });

      router.push('/dashboard/senior');
      
    } catch (err) {
      console.error('Error saving senior profile:', err);
      setError((err as Error).message || 'Error guardando perfil');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id === currentStep
                    ? 'text-blue-600 font-semibold'
                    : step.id < currentStep
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div className="text-xs mb-1">{step.name}</div>
                <div className="relative">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                      step.id === currentStep
                        ? 'bg-blue-600 text-white'
                        : step.id < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <CurrentStepComponent
            data={formData}
            onComplete={handleStepComplete}
            onBack={currentStep > 1 ? handleBack : undefined}
            isSubmitting={isSubmitting}
          />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


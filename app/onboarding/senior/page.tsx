'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import BasicInfoStep from './components/BasicInfoStep';
import MedicalProfileStep from './components/MedicalProfileStep';
import SeniorNeedsStep from './components/SeniorNeedsStep';
import FamilyContactStep from './components/FamilyContactStep';

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
  family_password?: string;
  family_userId?: string; // Created in FamilyContactStep
  
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
];

export default function SeniorOnboarding() {
  const router = useRouter();
  const { userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<SeniorFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Check if user is family (read-only mode)
  const isFamilyView = userData?.role === 'family';
  const CurrentStepComponent = STEPS[currentStep - 1].component;
  
  // Track if user has been to step 4 (Contacto Familiar)
  // If they have, they should be able to edit all steps
  const [hasVisitedStep4, setHasVisitedStep4] = useState(false);
  
  // Update hasVisitedStep4 when reaching step 4
  useEffect(() => {
    if (currentStep === 4) {
      setHasVisitedStep4(true);
    }
  }, [currentStep]);

  // Check if returning from family registration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectFlag = sessionStorage.getItem('seniorOnboarding_redirect');
      const step3Data = sessionStorage.getItem('seniorOnboarding_step3');
      const familyUserId = sessionStorage.getItem('family_userId');
      const familyEmail = sessionStorage.getItem('family_email');
      const familyName = sessionStorage.getItem('family_name');

      if (redirectFlag === 'true' && step3Data && familyUserId) {
        // Restore step 3 data
        const stepData = JSON.parse(step3Data);
        setFormData(prev => ({
          ...prev,
          ...stepData,
          // Add family contact info
          family_name: familyName || '',
          family_email: familyEmail || '',
          family_userId: familyUserId,
        }));

        // Clear sessionStorage
        sessionStorage.removeItem('seniorOnboarding_redirect');
        sessionStorage.removeItem('seniorOnboarding_step3');
        sessionStorage.removeItem('family_userId');
        sessionStorage.removeItem('family_email');
        sessionStorage.removeItem('family_name');

        // Move to step 4 (Family Contact)
        setCurrentStep(4);
      }
    }
  }, []);

  const handleStepComplete = (stepData: Partial<SeniorFormData>) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    
    // Always advance to next step (now we have 6 steps, so step 5 goes to step 6)
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
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
          {isFamilyView && currentStep !== 4 && !hasVisitedStep4 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Modo de solo lectura:</strong> Como familiar, puedes observar el proceso de onboarding pero no puedes editarlo.
              </p>
            </div>
          )}
          <CurrentStepComponent
            data={formData}
            onComplete={isFamilyView && currentStep !== 4 && !hasVisitedStep4 ? () => {} : handleStepComplete}
            onBack={isFamilyView && currentStep !== 4 && !hasVisitedStep4 ? undefined : (currentStep > 1 ? handleBack : undefined)}
            isSubmitting={isSubmitting}
            readOnly={isFamilyView && currentStep !== 4 && !hasVisitedStep4}
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


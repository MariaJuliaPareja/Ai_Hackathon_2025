"use client";

import { useFormContext } from "react-hook-form";
import { SeniorOnboardingFormData } from "@/lib/schemas/senior-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function ReviewStep() {
  const { watch } = useFormContext<SeniorOnboardingFormData>();

  const basicInfo = watch("basicInfo");
  const medicalProfile = watch("medicalProfile");
  const seniorNeeds = watch("seniorNeeds");
  const familyContact = watch("familyContact");

  const getAvailabilitySummary = () => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const periods = ["morning", "afternoon", "evening", "overnight"];
    const periodLabels: Record<string, string> = {
      morning: "Mañana",
      afternoon: "Tarde",
      evening: "Noche",
      overnight: "Nocturno",
    };

    const needed: string[] = [];
    days.forEach((day) => {
      periods.forEach((period) => {
        if (seniorNeeds?.availabilityNeeded?.[day as keyof typeof seniorNeeds.availabilityNeeded]?.[period as keyof typeof seniorNeeds.availabilityNeeded.monday]) {
          needed.push(`${DAY_LABELS[day]} ${periodLabels[period]}`);
        }
      });
    });

    return needed.length > 0 ? needed.join(", ") : "No especificado";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revisar Información
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Por favor revisa toda la información antes de enviar
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{basicInfo?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Edad:</span>
              <span className="font-medium">{basicInfo?.age} años</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ubicación:</span>
              <span className="font-medium">{basicInfo?.location}</span>
            </div>
            {basicInfo?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-medium">{basicInfo.phone}</span>
              </div>
            )}
            {basicInfo?.photo && (
              <div className="flex justify-between">
                <span className="text-gray-600">Foto:</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Condiciones:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {medicalProfile?.conditions?.map((condition, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Movilidad:</span>
              <span className="font-medium">
                {medicalProfile?.mobilityLevel?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cognitivo:</span>
              <span className="font-medium">
                {medicalProfile?.cognitiveLevel?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            {medicalProfile?.medications && medicalProfile.medications.length > 0 && (
              <div>
                <span className="text-gray-600">Medicamentos:</span>
                <div className="mt-1">
                  {medicalProfile.medications.map((med, index) => (
                    <div key={index} className="text-xs">
                      • {med.name} {med.dosage && `(${med.dosage})`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Senior Needs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Necesidades de Cuidado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Cuidado Personal:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {seniorNeeds?.careNeeds?.personalCare?.map((need, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {need}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Alimentación:</span>
              <span className="font-medium">
                {seniorNeeds?.careNeeds?.mealAssistance?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Medicamentos:</span>
              <span className="font-medium">
                {seniorNeeds?.careNeeds?.medicationManagement?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Disponibilidad Necesaria:</span>
              <p className="mt-1 text-xs text-gray-700">{getAvailabilitySummary()}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Presupuesto:</span>
              <span className="font-medium">
                ${seniorNeeds?.budgetRange?.min?.toLocaleString()} - ${seniorNeeds?.budgetRange?.max?.toLocaleString()} MXN/mes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Family Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto de Familia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {familyContact?.emergencyContact && (
              <div>
                <span className="text-gray-600">Contacto de Emergencia:</span>
                <div className="mt-1">
                  <p className="font-medium">{familyContact.emergencyContact.name}</p>
                  <p className="text-xs text-gray-600">{familyContact.emergencyContact.relationship}</p>
                  <p className="text-xs text-gray-600">{familyContact.emergencyContact.phone}</p>
                </div>
              </div>
            )}
            {familyContact?.familyContacts && familyContact.familyContacts.length > 0 && (
              <div>
                <span className="text-gray-600">Contactos Familiares:</span>
                <div className="mt-1 space-y-1">
                  {familyContact.familyContacts.map((contact, index) => (
                    <div key={index} className="text-xs">
                      • {contact.name} ({contact.relationship}) - {contact.phone}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


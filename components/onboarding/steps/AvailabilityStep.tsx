"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

const TIME_SLOTS = [
  { key: "morning", label: "Mañana", defaultStart: "09:00", defaultEnd: "12:00" },
  { key: "afternoon", label: "Tarde", defaultStart: "12:00", defaultEnd: "17:00" },
  { key: "evening", label: "Noche", defaultStart: "17:00", defaultEnd: "21:00" },
] as const;

export default function AvailabilityStep() {
  const {
    watch,
    setValue,
    register,
  } = useFormContext<CaregiverOnboardingFormData>();

  const availability = watch("availability");

  const toggleTimeSlot = (
    day: typeof DAYS[number]["key"],
    slot: typeof TIME_SLOTS[number]["key"]
  ) => {
    const current = availability[day][slot].available;
    setValue(`availability.${day}.${slot}.available`, !current);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Disponibilidad Semanal
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Establece tu disponibilidad semanal
        </p>
      </div>

      <div className="space-y-4">
        {DAYS.map((day) => (
          <Card key={day.key} className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{day.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TIME_SLOTS.map((slot) => {
                  const timeSlot = availability[day.key][slot.key];
                  return (
                    <div
                      key={slot.key}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        timeSlot.available
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">{slot.label}</Label>
                        <Checkbox
                          checked={timeSlot.available}
                          onCheckedChange={() => toggleTimeSlot(day.key, slot.key)}
                        />
                      </div>
                      {timeSlot.available && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="time"
                            {...register(`availability.${day.key}.${slot.key}.start`)}
                            className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                            defaultValue={slot.defaultStart}
                          />
                          <span className="self-center text-gray-500">a</span>
                          <input
                            type="time"
                            {...register(`availability.${day.key}.${slot.key}.end`)}
                            className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                            defaultValue={slot.defaultEnd}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


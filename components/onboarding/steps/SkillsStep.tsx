"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

const SKILLS = [
  {
    id: "mobilityAssistance",
    label: "Mobility Assistance",
    description: "Helping with walking, transfers, and mobility aids",
  },
  {
    id: "medicationManagement",
    label: "Medication Management",
    description: "Administering and managing medications",
  },
  {
    id: "dementiaCare",
    label: "Dementia Care",
    description: "Specialized care for dementia and Alzheimer's",
  },
  {
    id: "personalCare",
    label: "Personal Care",
    description: "Bathing, grooming, and hygiene assistance",
  },
  {
    id: "mealPreparation",
    label: "Meal Preparation",
    description: "Planning and preparing nutritious meals",
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    description: "Light housekeeping and home maintenance",
  },
  {
    id: "transportation",
    label: "Transportation",
    description: "Driving to appointments and errands",
  },
  {
    id: "companionship",
    label: "Companionship",
    description: "Social interaction and emotional support",
  },
  {
    id: "physicalTherapy",
    label: "Physical Therapy Support",
    description: "Assisting with prescribed exercises",
  },
  {
    id: "woundCare",
    label: "Wound Care",
    description: "Basic wound care and dressing changes",
  },
];

export default function SkillsStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CaregiverOnboardingFormData>();

  const skills = watch("skills");

  const toggleSkill = (skillId: keyof typeof skills) => {
    setValue(`skills.${skillId}`, !skills[skillId]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Skills & Expertise
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select all the skills you're comfortable providing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILLS.map((skill) => (
          <Card
            key={skill.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              skills[skill.id as keyof typeof skills]
                ? "border-blue-500 bg-blue-50"
                : "bg-white"
            }`}
            onClick={() => toggleSkill(skill.id as keyof typeof skills)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={skill.id}
                  checked={skills[skill.id as keyof typeof skills]}
                  onCheckedChange={() =>
                    toggleSkill(skill.id as keyof typeof skills)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={skill.id}
                    className="text-sm font-semibold cursor-pointer block mb-1"
                  >
                    {skill.label}
                  </Label>
                  <p className="text-xs text-gray-600">{skill.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


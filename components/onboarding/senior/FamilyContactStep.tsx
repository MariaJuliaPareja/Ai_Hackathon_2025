"use client";

import { useFormContext } from "react-hook-form";
import { SeniorOnboardingFormData } from "@/lib/schemas/senior-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function FamilyContactStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<SeniorOnboardingFormData>();

  const isFamilyMember = watch("familyContact.isFamilyMember") || false;
  const familyContacts = watch("familyContact.familyContacts") || [];
  const emergencyContact = watch("familyContact.emergencyContact");

  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    isEmergencyContact: false,
    isPrimaryContact: false,
  });

  const addFamilyContact = () => {
    if (newContact.name.trim() && newContact.phone.trim()) {
      setValue("familyContact.familyContacts", [
        ...familyContacts,
        {
          name: newContact.name,
          relationship: newContact.relationship,
          phone: newContact.phone,
          email: newContact.email || undefined,
          isEmergencyContact: newContact.isEmergencyContact,
          isPrimaryContact: newContact.isPrimaryContact,
        },
      ]);
      setNewContact({
        name: "",
        relationship: "",
        phone: "",
        email: "",
        isEmergencyContact: false,
        isPrimaryContact: false,
      });
    }
  };

  const removeFamilyContact = (index: number) => {
    setValue("familyContact.familyContacts", familyContacts.filter((_, i) => i !== index));
  };

  const setEmergencyContact = (contact: typeof newContact) => {
    setValue("familyContact.emergencyContact", {
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contacto de Familia
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Información de contacto de familiares y contacto de emergencia
        </p>
      </div>

      <div className="space-y-6">
        {/* Is Family Member */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFamilyMember"
              checked={isFamilyMember}
              onCheckedChange={(checked) => setValue("familyContact.isFamilyMember", checked as boolean)}
            />
            <Label htmlFor="isFamilyMember" className="cursor-pointer">
              Estoy registrando información para un familiar (no soy el adulto mayor)
            </Label>
          </div>
        </div>

        {/* Family Contacts */}
        <div className="space-y-4">
          <Label>Contactos Familiares (Opcional)</Label>
          <p className="text-xs text-gray-500">
            Agrega familiares que puedan ser contactados sobre el cuidado
          </p>

          {familyContacts.map((contact, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.relationship}</p>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                  {contact.email && (
                    <p className="text-sm text-gray-600">{contact.email}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {contact.isPrimaryContact && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Contacto Principal
                      </span>
                    )}
                    {contact.isEmergencyContact && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Emergencia
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFamilyContact(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nombre *</Label>
                <Input
                  id="contactName"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Juan Pérez"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactRelationship">Relación *</Label>
                <Input
                  id="contactRelationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  placeholder="Hijo/a, Esposo/a, etc."
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono *</Label>
                <Input
                  id="contactPhone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+52 555 123 4567"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email (Opcional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrimaryContact"
                  checked={newContact.isPrimaryContact}
                  onCheckedChange={(checked) =>
                    setNewContact({ ...newContact, isPrimaryContact: checked as boolean })
                  }
                />
                <Label htmlFor="isPrimaryContact" className="text-sm cursor-pointer">
                  Contacto Principal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEmergencyContact"
                  checked={newContact.isEmergencyContact}
                  onCheckedChange={(checked) => {
                    setNewContact({ ...newContact, isEmergencyContact: checked as boolean });
                    if (checked) {
                      setEmergencyContact({ ...newContact, isEmergencyContact: true });
                    }
                  }}
                />
                <Label htmlFor="isEmergencyContact" className="text-sm cursor-pointer">
                  Contacto de Emergencia
                </Label>
              </div>
            </div>
            <Button type="button" onClick={addFamilyContact} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Contacto
            </Button>
          </div>
        </div>

        {/* Emergency Contact (if not set from family contacts) */}
        {!emergencyContact && (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-gray-900">Contacto de Emergencia *</h4>
            <p className="text-xs text-gray-600 mb-3">
              Persona a contactar en caso de emergencia médica
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Nombre *</Label>
                <Input
                  id="emergencyName"
                  {...register("familyContact.emergencyContact.name")}
                  placeholder="María González"
                  className="bg-white"
                />
                {errors.familyContact?.emergencyContact?.name && (
                  <p className="text-sm text-destructive">
                    {errors.familyContact.emergencyContact.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relación *</Label>
                <Input
                  id="emergencyRelationship"
                  {...register("familyContact.emergencyContact.relationship")}
                  placeholder="Hijo/a"
                  className="bg-white"
                />
                {errors.familyContact?.emergencyContact?.relationship && (
                  <p className="text-sm text-destructive">
                    {errors.familyContact.emergencyContact.relationship.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergencyPhone">Teléfono *</Label>
                <Input
                  id="emergencyPhone"
                  {...register("familyContact.emergencyContact.phone")}
                  placeholder="+52 555 123 4567"
                  className="bg-white"
                />
                {errors.familyContact?.emergencyContact?.phone && (
                  <p className="text-sm text-destructive">
                    {errors.familyContact.emergencyContact.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show emergency contact if set */}
        {emergencyContact && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-red-900">Contacto de Emergencia</p>
                <p className="text-sm">{emergencyContact.name}</p>
                <p className="text-sm">{emergencyContact.relationship}</p>
                <p className="text-sm">{emergencyContact.phone}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("familyContact.emergencyContact", undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


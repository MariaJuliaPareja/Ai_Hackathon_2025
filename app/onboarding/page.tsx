"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserRole, UserRole } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CaregiverOnboardingForm from "@/components/onboarding/CaregiverOnboardingForm";

export default function OnboardingPage() {
  const [role, setRole] = useState<UserRole>("caregiver");
  const [loading, setLoading] = useState(false);
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && user && userData?.role) {
      // If caregiver, show the detailed onboarding form
      if (userData.role === "caregiver") {
        // Show the form - it will handle checking if profile exists
        return;
      } else if (userData.role === "senior" || userData.role === "family") {
        // Redirect to senior onboarding
        router.push("/onboarding/senior");
        return;
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, userData, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateUserRole(user.uid, role);
      // Redirect based on role
      if (role === "senior" || role === "family") {
        router.push("/onboarding/senior");
      } else if (role === "caregiver") {
        // Form will be shown (component will re-render)
        return;
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  // If user has caregiver role, show the detailed onboarding form
  if (userData?.role === "caregiver") {
    return <CaregiverOnboardingForm />;
  }

  // If user has senior or family role, redirect to senior onboarding
  if (userData?.role === "senior" || userData?.role === "family") {
    router.push("");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completa tu Perfil</CardTitle>
          <CardDescription>
            Por favor selecciona tu rol para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Soy un/a</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
              >
                <option value="caregiver">Cuidador</option>
                <option value="senior">Adulto Mayor</option>
                <option value="family">Familiar</option>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

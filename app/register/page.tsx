"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpWithEmail, signInWithGoogle, getUserData, UserRole } from "@/lib/firebase/auth";
import { getRedirectPath } from "@/lib/firebase/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import Link from "next/link";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("caregiver");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFromOnboarding, setIsFromOnboarding] = useState(false);
  const [isFromLanding, setIsFromLanding] = useState(false);

  // Check if coming from onboarding or landing page
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const fromParam = searchParams.get('from');
    
    if (roleParam === 'family' && fromParam === 'onboarding') {
      setRole('family');
      setIsFromOnboarding(true);
    } else if (roleParam === 'caregiver' || roleParam === 'senior') {
      // Pre-select role from landing page
      setRole(roleParam as UserRole);
      setIsFromLanding(true);
    } else if (roleParam) {
      setRole(roleParam as UserRole);
    }
  }, [searchParams]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await signUpWithEmail(email, password, role, displayName);
      
      // If coming from onboarding, save family info and redirect back
      if (isFromOnboarding && role === 'family') {
        // Save family user ID to sessionStorage for linking
        sessionStorage.setItem('family_userId', user.uid);
        sessionStorage.setItem('family_email', email);
        sessionStorage.setItem('family_name', displayName);
        
        // Redirect back to senior onboarding
        router.push("/onboarding/senior");
      } else {
        // Normal redirect based on role
        if (role === "senior" || role === "family") {
          router.push("/onboarding/senior");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      // Check if user needs onboarding
      const userData = await getUserData(user.uid);
      const redirectPath = getRedirectPath(userData?.role);
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isFromOnboarding && role === 'family' 
              ? 'Registrar Familiar' 
              : isFromLanding && role === 'senior'
              ? 'Registrarse como Adulto Mayor'
              : isFromLanding && role === 'caregiver'
              ? 'Registrarse como Cuidador'
              : 'Registrarse'}
          </CardTitle>
          <CardDescription>
            {isFromOnboarding && role === 'family' 
              ? 'Crea una cuenta para el familiar que observará el proceso de onboarding' 
              : isFromLanding && role === 'senior'
              ? 'Crea tu cuenta para encontrar el cuidador perfecto'
              : isFromLanding && role === 'caregiver'
              ? 'Crea tu perfil profesional y comienza a recibir oportunidades'
              : 'Crea una nueva cuenta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre Completo</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Juan Pérez"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Soy</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  setIsFromLanding(false);
                }}
                required
                disabled={isFromOnboarding || isFromLanding}
                className={isFromLanding ? "bg-gray-50" : ""}
              >
                <option value="caregiver">Cuidador</option>
                <option value="senior">Adulto Mayor</option>
                <option value="family">Familiar</option>
              </Select>
              {isFromOnboarding && role === 'family' && (
                <p className="text-xs text-blue-600 mt-1">
                  Estás registrando una cuenta para el familiar que observará el proceso de onboarding.
                </p>
              )}
              {isFromLanding && (
                <p className="text-xs text-blue-600 mt-1">
                  Rol preseleccionado desde la página principal. Puedes cambiarlo si es necesario.
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </form>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleRegister}
              disabled={loading}
            >
              Registrarse con Google
            </Button>
          </div>
          <p className="text-center text-sm mt-4">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


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

  // Check if coming from onboarding
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const fromParam = searchParams.get('from');
    
    if (roleParam === 'family' && fromParam === 'onboarding') {
      setRole('family');
      setIsFromOnboarding(true);
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
              : 'Register'}
          </CardTitle>
          <CardDescription>
            {isFromOnboarding && role === 'family' 
              ? 'Crea una cuenta para el familiar que observará el proceso de onboarding' 
              : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
                disabled={isFromOnboarding}
              >
                <option value="caregiver">Caregiver</option>
                <option value="senior">Senior</option>
                <option value="family">Family Member</option>
              </Select>
              {isFromOnboarding && role === 'family' && (
                <p className="text-xs text-gray-500 mt-1">
                  Estás registrando una cuenta para el familiar que observará el proceso de onboarding.
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
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
              Sign up with Google
            </Button>
          </div>
          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


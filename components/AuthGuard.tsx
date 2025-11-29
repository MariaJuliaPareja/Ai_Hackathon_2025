"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: "caregiver" | "senior" | "family";
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireRole 
}: AuthGuardProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push("/login");
      return;
    }

    if (user && !userData?.role) {
      router.push("/onboarding");
      return;
    }

    if (requireRole && userData?.role !== requireRole) {
      router.push("/dashboard");
      return;
    }
  }, [user, userData, loading, requireAuth, requireRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (user && !userData?.role) {
    return null;
  }

  if (requireRole && userData?.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}


import { UserRole } from "./auth";

export function getRedirectPath(role?: UserRole): string {
  if (!role) {
    return "/onboarding";
  }

  // All roles go to dashboard for now
  // IA MODEL OPTIMIZATION NEXT!!!!!
  return "/dashboard";
}


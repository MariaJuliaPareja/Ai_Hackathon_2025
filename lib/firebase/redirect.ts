import { UserRole } from "./auth";

export function getRedirectPath(role?: UserRole): string {
  if (!role) {
    return "/onboarding";
  }

  // All roles go to dashboard for now
  // You can customize this based on role if needed
  return "/dashboard";
}


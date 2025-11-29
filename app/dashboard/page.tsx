"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function DashboardContent() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "caregiver":
        return "Caregiver";
      case "senior":
        return "Senior";
      case "family":
        return "Family Member";
      default:
        return "User";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {userData?.displayName || user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            Role: {getRoleDisplayName(userData?.role)}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>Find and connect with others</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/matches">View Matches</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training</CardTitle>
            <CardDescription>Access training resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/training">View Training</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community</CardTitle>
            <CardDescription>Join the community</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/community">View Community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}


"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function TrainingContent() {
  const { userData } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Training</h1>
        <p className="text-muted-foreground">
          Access training resources and courses
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Caregiving Basics</CardTitle>
            <CardDescription>
              Essential skills for caregivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Learn the fundamentals of caregiving
            </p>
            <Button>Start Course</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Skills</CardTitle>
            <CardDescription>
              Effective communication strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Improve your communication with seniors and families
            </p>
            <Button>Start Course</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <AuthGuard>
      <TrainingContent />
    </AuthGuard>
  );
}


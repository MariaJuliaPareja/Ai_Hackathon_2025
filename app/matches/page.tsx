"use client";

import { AuthGuard } from "@/components/AuthGuard";
import MatchesScreen from "@/components/matches/MatchesScreen";

function MatchesContent() {
  return <MatchesScreen />;
}

export default function MatchesPage() {
  return (
    <AuthGuard requireAuth requireRole="senior">
      <MatchesContent />
    </AuthGuard>
  );
}

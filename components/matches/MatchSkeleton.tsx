"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function MatchSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="relative">
        {/* Photo skeleton */}
        <div className="h-96 bg-gray-200 animate-pulse" />

        {/* Score badge skeleton */}
        <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-2">
          <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <CardContent className="p-6">
        {/* Name skeleton */}
        <div className="mb-4">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Location skeleton */}
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4" />

        {/* Factors skeleton */}
        <div className="mb-4">
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Specializations skeleton */}
        <div className="mb-4">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


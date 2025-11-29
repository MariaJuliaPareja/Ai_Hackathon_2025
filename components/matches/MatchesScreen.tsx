"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { Heart, X, Star, MapPin, Clock, Award, Sparkles } from "lucide-react";
import MatchCard from "./MatchCard";
import MatchSkeleton from "./MatchSkeleton";
import CelebrationAnimation from "./CelebrationAnimation";
import { Match, CaregiverData } from "./types";

export default function MatchesScreen() {
  const { user, userData } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [caregiverData, setCaregiverData] = useState<Map<string, CaregiverData>>(new Map());
  const [matchStatus, setMatchStatus] = useState<"pending" | "ready" | "error">("pending");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

  const seniorId = userData?.role === "senior" ? user?.uid : null;

  useEffect(() => {
    if (!seniorId) return;

    // Check match status
    const seniorRef = doc(db, "seniors", seniorId);
    const unsubscribeStatus = onSnapshot(seniorRef, (snapshot) => {
      const data = snapshot.data();
      const status = data?.match_status || "pending";
      setMatchStatus(status);

      if (status === "ready") {
        setLoading(false);
        // Subscribe to matches
        subscribeToMatches();
      } else if (status === "pending") {
        setLoading(false);
        setMatches([]);
      }
    });

    return () => {
      unsubscribeStatus();
    };
  }, [seniorId]);

  const subscribeToMatches = () => {
    if (!seniorId) return;

    const matchesQuery = query(
      collection(db, "seniors", seniorId, "matches"),
      orderBy("rank", "asc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      setMatches(matchesData);

      // Load caregiver data for each match
      const caregiverPromises = matchesData.map(async (match) => {
        if (caregiverData.has(match.caregiver_id)) {
          return;
        }

        try {
          // Use select() to exclude full photo from initial fetch (lazy loading optimization)
          const caregiverRef = doc(db, "caregivers", match.caregiver_id);
          const caregiverSnap = await getDoc(caregiverRef);

          if (caregiverSnap.exists()) {
            const data = caregiverSnap.data();
            setCaregiverData((prev) => {
              const newMap = new Map(prev);
              newMap.set(match.caregiver_id, {
                name: data.personalInfo?.name || "Caregiver",
                // Use thumbnail for list view, full photo loaded on-demand
                profilePhotoThumbnailBase64: data.personalInfo?.profilePhotoThumbnailBase64,
                profilePhotoBase64: data.personalInfo?.profilePhotoBase64, // Will be loaded on-demand
                location: data.personalInfo?.location || "",
                specializations: data.professionalInfo?.specializations || [],
                yearsOfExperience: data.professionalInfo?.yearsOfExperience || 0,
                certifications: data.professionalInfo?.certifications || [],
              });
              return newMap;
            });
          }
        } catch (error) {
          console.error(`Error loading caregiver ${match.caregiver_id}:`, error);
        }
      });

      await Promise.all(caregiverPromises);
    });

    return unsubscribe;
  };

  const getTopMatchingFactors = (match: Match): string[] => {
    const factors: Array<{ label: string; score: number }> = [];

    if (match.features.specialization_score > 0.7) {
      factors.push({
        label: "Experiencia en condiciones similares",
        score: match.features.specialization_score,
      });
    }

    if (match.features.location_score > 0.8) {
      factors.push({
        label: "Cerca de tu ubicación",
        score: match.features.location_score,
      });
    }

    if (match.features.availability_score > 0.7) {
      factors.push({
        label: "Horario compatible",
        score: match.features.availability_score,
      });
    }

    if (match.features.price_score > 0.8) {
      factors.push({
        label: "Dentro de tu presupuesto",
        score: match.features.price_score,
      });
    }

    if (match.features.years_experience >= 5) {
      factors.push({
        label: `${match.features.years_experience} años de experiencia`,
        score: match.features.years_experience / 20,
      });
    }

    // Sort by score and return top 3
    return factors
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((f) => f.label);
  };

  const handleSwipe = async (direction: "left" | "right" | "up", match: Match) => {
    if (!seniorId) return;

    try {
      if (direction === "right") {
        // Create interest
        await setDoc(doc(db, "interests", `${seniorId}_${match.caregiver_id}`), {
          senior_id: seniorId,
          caregiver_id: match.caregiver_id,
          match_id: match.id,
          type: "interest",
          created_at: serverTimestamp(),
        });

        // Check for mutual interest
        const mutualInterestRef = doc(db, "interests", `${match.caregiver_id}_${seniorId}`);
        const mutualSnap = await getDoc(mutualInterestRef);

        if (mutualSnap.exists()) {
          // Mutual match!
          await createMatch(seniorId, match.caregiver_id, match.id);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } else if (direction === "left") {
        // Pass - mark as seen
        await updateDoc(doc(db, "seniors", seniorId, "matches", match.id), {
          seen: true,
          passed_at: serverTimestamp(),
        });
      } else if (direction === "up") {
        // Super like
        await setDoc(doc(db, "interests", `${seniorId}_${match.caregiver_id}`), {
          senior_id: seniorId,
          caregiver_id: match.caregiver_id,
          match_id: match.id,
          type: "super_like",
          created_at: serverTimestamp(),
        });

        // Trigger priority notification
        // This would call a Cloud Function in production
      }

      // Move to next match (if not at the end)
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next < matches.length ? next : prev;
      });
    } catch (error) {
      console.error("Error handling swipe:", error);
    }
  };

  const createMatch = async (seniorId: string, caregiverId: string, matchId: string) => {
    try {
      const newMatchRef = doc(collection(db, "matches"));
      await setDoc(newMatchRef, {
        senior_id: seniorId,
        caregiver_id: caregiverId,
        match_id: matchId,
        status: "matched",
        created_at: serverTimestamp(),
      });

      // Trigger push notifications (would call Cloud Function)
      console.log("Match created! Triggering notifications...");
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (matches[currentIndex]) {
        handleSwipe("left", matches[currentIndex]);
      }
    },
    onSwipedRight: () => {
      if (matches[currentIndex]) {
        handleSwipe("right", matches[currentIndex]);
      }
    },
    onSwipedUp: () => {
      if (matches[currentIndex]) {
        handleSwipe("up", matches[currentIndex]);
      }
    },
    trackMouse: true,
  });

  if (loading || matchStatus === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg text-gray-700 mt-4">
            Buscando cuidadores compatibles...
          </p>
        </motion.div>
      </div>
    );
  }

  if (matchStatus === "error" || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              {matchStatus === "error"
                ? "Error al cargar las coincidencias. Por favor, intenta de nuevo."
                : "No se encontraron coincidencias en este momento."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];
  const caregiver = currentMatch ? caregiverData.get(currentMatch.caregiver_id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <AnimatePresence>
        {showCelebration && <CelebrationAnimation />}
      </AnimatePresence>

      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Tus Coincidencias
        </h1>

        <div className="relative" {...handlers}>
          <AnimatePresence mode="wait">
            {currentMatch && caregiver ? (
              <motion.div
                key={currentMatch.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: -1000 }}
                transition={{ duration: 0.3 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  const threshold = 100;
                  if (info.offset.x > threshold) {
                    handleSwipe("right", currentMatch);
                  } else if (info.offset.x < -threshold) {
                    handleSwipe("left", currentMatch);
                  }
                }}
              >
                <MatchCard
                  match={currentMatch}
                  caregiver={caregiver}
                  matchingFactors={getTopMatchingFactors(currentMatch)}
                  onSwipe={handleSwipe}
                />
              </motion.div>
            ) : (
              <MatchSkeleton />
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-6 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => currentMatch && handleSwipe("left", currentMatch)}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
          >
            <X className="w-8 h-8" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => currentMatch && handleSwipe("up", currentMatch)}
            className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center shadow-lg"
          >
            <Star className="w-8 h-8" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => currentMatch && handleSwipe("right", currentMatch)}
            className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"
          >
            <Heart className="w-8 h-8" />
          </motion.button>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {currentIndex + 1} de {matches.length}
        </div>
      </div>
    </div>
  );
}


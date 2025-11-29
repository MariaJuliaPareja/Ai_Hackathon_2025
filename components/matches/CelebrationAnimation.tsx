"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

export default function CelebrationAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="mb-4"
        >
          <Heart className="w-20 h-20 text-red-500 mx-auto fill-red-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          ¡Es un Match!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-4"
        >
          Ambos están interesados. ¡Comienza la conversación!
        </motion.p>

        {/* Confetti effect */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              x: (Math.random() - 0.5) * 500,
              y: (Math.random() - 0.5) * 500,
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
            }}
            className="absolute"
          >
            <Sparkles
              className="w-4 h-4"
              style={{
                color: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"][
                  i % 4
                ],
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}


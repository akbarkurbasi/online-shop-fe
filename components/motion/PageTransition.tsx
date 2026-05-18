"use client";

import { motion, AnimatePresence, Transition } from "framer-motion";
import { useState, useEffect } from "react";

const pathTransition: Transition = {
  duration: 2.5,
  ease: "easeInOut",
};

const box: React.CSSProperties = {
  width: 40,
  height: 40,
  backgroundColor: "#8df0cc",
  borderRadius: 8,
  position: "absolute",
  top: 0,
  left: 0,
  offsetPath: `path("M 239 17 C 142 17 48.5 103 48.5 213.5 C 48.5 324 126 408 244 408 C 362 408 412 319 412 213.5 C 412 108 334 68.5 244 68.5 C 154 68.5 102.68 135.079 99 213.5 C 95.32 291.921 157 350 231 345.5 C 305 341 357.5 290 357.5 219.5 C 357.5 149 314 121 244 121 C 174 121 151.5 167 151.5 213.5 C 151.5 260 176 286.5 224.5 286.5 C 273 286.5 296.5 253 296.5 218.5 C 296.5 184 270 177 244 177 C 218 177 197 198 197 218.5 C 197 239 206 250.5 225.5 250.5 C 245 250.5 253 242 253 218.5")`,
};

/**
 * PageTransition
 * Uses the requested motion path animation as a premium entrance effect.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 2800); // Slightly longer than duration to ensure finish
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="transition-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.1,
              filter: "blur(20px)",
              transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } 
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "var(--background)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "all",
            }}
          >
            <div style={{ position: "relative", transform: "scale(0.8)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="451" height="437">
                <motion.path
                  d="M 239 17 C 142 17 48.5 103 48.5 213.5 C 48.5 324 126 408 244 408 C 362 408 412 319 412 213.5 C 412 108 334 68.5 244 68.5 C 154 68.5 102.68 135.079 99 213.5 C 95.32 291.921 157 350 231 345.5 C 305 341 357.5 290 357.5 219.5 C 357.5 149 314 121 244 121 C 174 121 151.5 167 151.5 213.5 C 151.5 260 176 286.5 224.5 286.5 C 273 286.5 296.5 253 296.5 218.5 C 296.5 184 270 177 244 177 C 218 177 197 198 197 218.5 C 197 239 206 250.5 225.5 250.5 C 245 250.5 253 242 253 218.5"
                  fill="transparent"
                  strokeWidth="8"
                  stroke="var(--accent)"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={pathTransition}
                />
              </svg>
              <motion.div
                style={box}
                initial={{ offsetDistance: "0%", scale: 2.5, opacity: 0 }}
                animate={{ offsetDistance: "100%", scale: 1, opacity: 1 }}
                transition={pathTransition}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isTransitioning ? 0 : 1, 
          y: isTransitioning ? 20 : 0 
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
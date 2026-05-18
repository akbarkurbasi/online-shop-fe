"use client";

import { MotionConfig, LazyMotion, domAnimation } from "framer-motion";

type Props = { children: React.ReactNode };

/**
 * MotionProvider
 * - MotionConfig: setelan global (reducedMotion, default transition).
 * - LazyMotion: memuat fitur animasi saat dibutuhkan (mengurangi JS awal).
 */
export default function MotionProvider({ children }: Props) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <LazyMotion features={domAnimation}>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
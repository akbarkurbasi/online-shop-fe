"use client";

import { m, HTMLMotionProps } from "framer-motion";

interface StaggerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  amount?: number;
  stagger?: number;
}

export function Stagger({
  children,
  amount = 0.4,
  stagger = 0.16,
  className,
  ...props
}: StaggerProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
      variants={{
        hidden: { opacity: 1 },
        show: { opacity: 1, transition: { staggerChildren: stagger } },
      }}
      {...props}
    >
      {children}
    </m.div>
  );
}

interface ItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function Item({ children, className, ...props }: ItemProps) {
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 50 },
        show: { opacity: 1, y: 0, transition: { duration: 1.6 } },
      }}
      style={{ willChange: "transform, opacity" }}
      {...props}
    >
      {children}
    </m.div>
  );
}
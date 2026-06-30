"use client";

import { motion, type Transition } from "framer-motion";

const transition: Transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

export function MorphMenuIcon({
  open,
  size = 18,
  color = "#374151",
}: {
  open: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      {/* top line → "\" diagonal */}
      <motion.line
        initial={false}
        animate={open ? { x1: 6, y1: 6, x2: 18, y2: 18 } : { x1: 4, y1: 8, x2: 20, y2: 8 }}
        transition={transition}
      />
      {/* middle line → collapses to center and fades */}
      <motion.line
        initial={false}
        animate={
          open
            ? { x1: 12, y1: 12, x2: 12, y2: 12, opacity: 0 }
            : { x1: 4, y1: 12, x2: 20, y2: 12, opacity: 1 }
        }
        transition={transition}
      />
      {/* bottom line → "/" diagonal */}
      <motion.line
        initial={false}
        animate={open ? { x1: 6, y1: 18, x2: 18, y2: 6 } : { x1: 4, y1: 16, x2: 20, y2: 16 }}
        transition={transition}
      />
    </svg>
  );
}

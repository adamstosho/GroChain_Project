import type { Transition, Variants } from "framer-motion"

/** GroChain motion design tokens — tuned for agricultural / trust brand feel */
export const motionEasing = {
  /** Primary entrance — confident deceleration */
  entrance: [0.22, 1, 0.36, 1] as const,
  /** Micro-interactions — snappy but not harsh */
  snap: [0.34, 1.56, 0.64, 1] as const,
  /** Continuous loops — smooth organic motion */
  loop: "linear" as const,
}

export const motionDuration = {
  fast: 0.2,
  base: 0.45,
  slow: 0.7,
  logoSpin: 8,
  logoFloat: 4,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
}

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0 },
}

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0 },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.base,
      ease: motionEasing.entrance,
    },
  },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

export const defaultTransition: Transition = {
  duration: motionDuration.base,
  ease: motionEasing.entrance,
}

/** Card hover lift — used on marketplace / feature cards */
export const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)" },
  hover: {
    y: -4,
    boxShadow: "0 12px 24px -8px rgb(22 101 52 / 0.15)",
    transition: { duration: motionDuration.fast, ease: motionEasing.entrance },
  },
}

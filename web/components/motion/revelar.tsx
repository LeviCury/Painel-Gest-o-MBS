"use client";

import { motion, useReducedMotion } from "framer-motion";

const SAIDA = [0.16, 1, 0.3, 1] as const;

export function Revelar({
  children,
  atraso = 0,
  className,
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
}) {
  const reduzido = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduzido ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduzido ? 0 : 0.36, delay: reduzido ? 0 : atraso, ease: SAIDA }}
    >
      {children}
    </motion.div>
  );
}

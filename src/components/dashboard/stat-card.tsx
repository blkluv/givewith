"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  index?: number;
}

export function StatCard({ title, value, subtitle, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-col overflow-hidden border border-border bg-card p-5"
    >
      <div className="type-caption text-muted-foreground">{title}</div>
      <div className="mt-3 truncate type-display-lg text-foreground">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-1 truncate type-body-sm text-muted-foreground">
          {subtitle}
        </div>
      ) : null}
    </motion.div>
  );
}

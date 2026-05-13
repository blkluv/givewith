"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LocusWordmark } from "@/components/ui/locus-wordmark";

export function LandingNav() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // Past threshold + scrolling down → hide. Scrolling up → show.
      if (y < 12) {
        setVisible(true);
      } else if (Math.abs(delta) > 6) {
        setVisible(delta < 0);
      }
      setScrolled(y > 12);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.nav
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          exit={{ y: -80 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-0 right-0 top-0 z-40"
        >
          <div
            className={`
              border-b transition-[background-color,border-color,backdrop-filter] duration-200
              ${scrolled
                ? "border-white/10 bg-background/40 backdrop-blur-xl backdrop-saturate-150"
                : "border-transparent bg-background/80 backdrop-blur-sm"}
            `}
          >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                aria-label="BLKLUV.ORG"
              >
                <span className="type-wordmark-lg text-foreground">
                  BLKLUV.ORG
                </span>
                <LocusWordmark className="text-foreground" height={22} />
              </Link>

              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-foreground"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start giving
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group fixed bottom-24 right-5 z-40 lg:bottom-5 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-orange text-white shadow-glow transition-transform hover:-translate-y-1"
          aria-label="Revenir en haut"
        >
          <ArrowUp size={20} className="transition-transform duration-500 group-hover:-translate-y-10" />
          <ArrowUp size={20} className="absolute translate-y-10 transition-transform duration-500 group-hover:translate-y-0" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

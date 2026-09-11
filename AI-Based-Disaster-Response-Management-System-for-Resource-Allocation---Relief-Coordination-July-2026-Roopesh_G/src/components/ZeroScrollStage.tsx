import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

export function ZeroScrollStage() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100, mass: 1 });

  // Map scroll progress to color eras:
  // 0% - 30%: Forest Green (Era 1)
  // 30% - 60%: Crimson Ruby (Era 2 - Critical)
  // 60% - 100%: Deep Charcoal (Era 3 - Intel)
  const backgroundColor = useTransform(
    smoothProgress,
    [0, 0.3, 0.4, 0.7, 0.8, 1],
    [
      'rgb(28, 72, 57)', // Forest Green
      'rgb(28, 72, 57)',
      'rgb(139, 0, 0)',  // Crimson
      'rgb(139, 0, 0)',
      'rgb(13, 17, 16)', // Charcoal
      'rgb(13, 17, 16)',
    ]
  );

  return (
    <motion.div
      className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-1000"
      style={{ backgroundColor }}
    >
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Floating Orbs for depth */}
      <div className="zero-ambient-orb w-[800px] h-[800px] bg-white/5 top-[-20%] left-[-10%]" />
      <div className="zero-ambient-orb w-[600px] h-[600px] bg-emerald-400/5 bottom-[-10%] right-[-10%]" style={{ animationDelay: '3s' }} />
      <div className="zero-ambient-orb w-[500px] h-[500px] bg-red-500/5 top-[40%] left-[60%]" style={{ animationDelay: '5s' }} />
    </motion.div>
  );
}

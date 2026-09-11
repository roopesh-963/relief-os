import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { cn } from '../lib/utils';

import { HTMLMotionProps } from 'motion/react';

interface ZeroTapButtonProps extends Omit<HTMLMotionProps<"button">, 'onAnimationStart'> {
  onHoldComplete: () => void;
  holdDuration?: number; // in milliseconds
  label: string;
}

export function ZeroTapButton({
  onHoldComplete,
  holdDuration = 1500,
  label,
  className,
  disabled,
  ...props
}: ZeroTapButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const controls = useAnimation();
  const timeoutRef = useRef<number | null>(null);

  const startHold = () => {
    if (disabled) return;
    setIsHolding(true);
    controls.start({
      scale: 1.1,
      boxShadow: '0 0 40px rgba(0, 255, 157, 0.6)',
      transition: { duration: holdDuration / 1000, ease: 'linear' }
    });

    timeoutRef.current = window.setTimeout(() => {
      onHoldComplete();
      resetHold();
    }, holdDuration);
  };

  const resetHold = () => {
    if (disabled) return;
    setIsHolding(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    controls.start({
      scale: 1,
      boxShadow: '0 0 0px rgba(0, 255, 157, 0)',
      transition: { duration: 0.3 }
    });
  };

  return (
    <motion.button
      onMouseDown={startHold}
      onMouseUp={resetHold}
      onMouseLeave={resetHold}
      onTouchStart={startHold}
      onTouchEnd={resetHold}
      animate={controls}
      disabled={disabled}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-8 py-4 font-[var(--font-mono)] text-sm tracking-[0.2em] text-white transition-colors hover:bg-black/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Progress ring background */}
      <span className="relative z-10">{label}</span>
      
      {/* The glowing progress overlay */}
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-r from-[var(--color-relief-accent)] to-[var(--color-crav-orange)] opacity-0 mix-blend-overlay"
        animate={{ opacity: isHolding ? 0.8 : 0 }}
        transition={{ duration: holdDuration / 1000, ease: 'linear' }}
      />
    </motion.button>
  );
}

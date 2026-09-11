import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'motion/react';

interface CravScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  scale?: boolean;
  /** Additional variants for custom animation */
  variants?: Variants;
  /** When true, enables light-mode specific animations */
  lightMode?: boolean;
}

export function CravScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 60,
  duration = 0.6,
  scale = false,
  variants,
  lightMode = false,
}: CravScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return {};
    }
  };

  const baseVariants: Variants = {
    hidden: {
      ...getInitialPosition(),
      opacity: 0,
      scale: scale ? 0.9 : 1,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: duration || 0.8,
        ease: [0.76, 0, 0.24, 1],
        delay: delay,
      },
    },
  };

  const finalVariants = variants ?? baseVariants;

  return (
    <motion.div
      ref={ref}
      variants={finalVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface CravTextAnimateProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  /** When true, applies the light-mode color gradient animation to each word. */
  colorShift?: boolean;
}

export function CravTextAnimate({
  text,
  className = '',
  delay = 0,
  stagger = 0.12,
  direction = 'up',
  distance = 40,
  colorShift = false,
}: CravTextAnimateProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const words = text.split(' ');

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return {};
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      scale: 0.8,
      rotate: direction === 'left' ? -8 : direction === 'right' ? 8 : 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      style={{ overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ marginRight: '0.25em', display: 'inline-block' }}
          className={
            colorShift
              ? 'relief-text-gradient relief-word-split'
              : 'relief-word-split'
          }
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
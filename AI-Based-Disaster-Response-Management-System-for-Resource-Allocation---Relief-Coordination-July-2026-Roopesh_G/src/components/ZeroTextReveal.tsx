import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '../lib/utils';

interface ZeroTextRevealProps {
  text: string;
  className?: string;
  shimmer?: boolean;
  shimmerVariant?: 'emerald' | 'silver' | 'default';
  staggerDelay?: number;
  as?: React.ElementType;
}

export function ZeroTextReveal({
  text,
  className,
  shimmer = false,
  shimmerVariant = 'default',
  staggerDelay = 0.05,
  as = 'div',
}: ZeroTextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const Component = as as any;
  const words = text.split(' ');

  const getShimmerClass = () => {
    if (!shimmer) return '';
    if (shimmerVariant === 'emerald') return 'zero-text-shimmer-emerald';
    if (shimmerVariant === 'silver') return 'zero-text-shimmer-silver';
    return 'zero-text-shimmer';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      }
    },
  };

  return (
    <Component
      ref={ref}
      className={cn('inline-block', className, getShimmerClass())}
    >
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="inline-block"
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={wordVariants}
            className="inline-block mr-2 lg:mr-3 last:mr-0"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}

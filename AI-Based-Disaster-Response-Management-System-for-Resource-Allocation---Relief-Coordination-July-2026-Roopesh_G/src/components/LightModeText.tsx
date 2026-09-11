import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
export {
  ZeroRollingCounter,
  ZeroShimmerText,
  ZeroTextReveal,
  ZeroScrollRuler,
  ZeroBottomStageCounter,
  ZeroPulseButton,
  ZeroHudPill,
  ZeroAudioWave,
} from './ZeroTextAnimations';

interface LightModeTextProps {
  children: React.ReactNode;
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Stagger between characters/words */
  stagger?: number;
  /** Animation variant */
  variant?: 'reveal' | 'float' | 'gradient' | 'shimmer';
  /** Duration of animation */
  duration?: number;
}

/**
 * LightModeText — renders text with light-mode color animations
 * matching the aesthetic of https://why.zero.university/
 *
 * - `reveal`: Words smoothly slide up with staggered blur-to-focus
 * - `shimmer`: Flowing highlight sheen passing across words infinitely
 * - `float`: Gentle organic floating oscillation
 * - `gradient`: Deep emerald to mint shifting text gradient
 */
export function LightModeText({
  children,
  className = '',
  delay = 0,
  stagger = 0.05,
  variant = 'reveal',
  duration = 0.8,
}: LightModeTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  if (variant === 'shimmer') {
    return (
      <span
        ref={ref}
        className={`inline-block zero-text-shimmer ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'gradient') {
    return (
      <motion.span
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`relief-text-gradient ${className}`}
      >
        {children}
      </motion.span>
    );
  }

  // Extract words safely while supporting linebreaks and nested elements
  const tokens: Array<{ text: string; isBreak?: boolean }> = [];

  const parseNode = (node: React.ReactNode) => {
    if (typeof node === 'string' || typeof node === 'number') {
      const parts = String(node).split(/\s+/).filter(Boolean);
      parts.forEach((p) => tokens.push({ text: p }));
    } else if (React.isValidElement(node)) {
      if (node.type === 'br') {
        tokens.push({ text: '', isBreak: true });
      } else if (node.props && (node.props as { children?: React.ReactNode }).children) {
        React.Children.forEach((node.props as { children?: React.ReactNode }).children, parseNode);
      }
    } else if (Array.isArray(node)) {
      node.forEach(parseNode);
    }
  };

  React.Children.forEach(children, parseNode);

  if (variant === 'float') {
    return (
      <motion.span
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`inline-flex flex-wrap ${className}`}
      >
        {tokens.map((token, i) => {
          if (token.isBreak) {
            return <span key={i} className="basis-full h-0" />;
          }
          return (
            <motion.span
              key={i}
              className="relief-letter-float mr-[0.25em] inline-block"
              transition={{
                duration: 3,
                delay: i * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {token.text}
            </motion.span>
          );
        })}
      </motion.span>
    );
  }

  // Default: stagger reveal with blur-to-focus unblurring
  return (
    <motion.span
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      className={`inline-flex flex-wrap items-baseline ${className}`}
    >
      {tokens.map((token, i) => {
        if (token.isBreak) {
          return <span key={i} className="basis-full h-0" />;
        }
        return (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  type: 'spring',
                  damping: 15,
                  stiffness: 180,
                  duration,
                },
              },
            }}
            className="relief-text-reveal mr-[0.25em] inline-block"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {token.text}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/**
 * ReliefHeroTitle — Large animated headline text with light-mode effects
 */
export function ReliefHeroTitle({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });

  const letters = text.split('');

  return (
    <motion.span
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.04, delayChildren: 0.2 },
        },
      }}
      className={`inline-block ${className}`}
      style={{ display: 'flex', flexWrap: 'wrap' }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 50, scale: 0.8, rotate: -6 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: 0,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 200,
                duration: 0.7,
              },
            },
          }}
          className="relief-text-reveal"
          style={{ display: 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

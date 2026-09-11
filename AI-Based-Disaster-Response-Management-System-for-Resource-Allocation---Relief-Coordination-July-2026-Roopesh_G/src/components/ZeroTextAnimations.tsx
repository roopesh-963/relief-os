import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

const cinematicEase = [0.16, 1, 0.3, 1] as const;

/**
 * ZeroShimmerText
 * Continuous luminous gradient sweep across text, inspired by why.zero.university hud-status-label
 */
export function ZeroShimmerText({
  children,
  className = '',
  mode = 'light',
}: {
  children: React.ReactNode;
  className?: string;
  mode?: 'light' | 'emerald' | 'silver';
}) {
  const modeClass =
    mode === 'emerald'
      ? 'zero-text-shimmer-emerald'
      : mode === 'silver'
      ? 'zero-text-shimmer-silver'
      : 'zero-text-shimmer';

  return (
    <span className={`inline-block ${modeClass} ${className}`}>
      {children}
    </span>
  );
}

/**
 * SingleRollingDigit
 * Single digit that smoothly scrolls vertically through [0..9] inside an overflow mask
 */
function SingleRollingDigit({
  digit,
  duration = 1.6,
  delay = 0,
}: {
  digit: string;
  duration?: number;
  delay?: number;
}) {
  const isNumber = /^[0-9]$/.test(digit);
  const targetNum = isNumber ? parseInt(digit, 10) : 0;

  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasRendered(true), 50 + delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  if (!isNumber) {
    return <span className="inline-block">{digit}</span>;
  }

  // 10 digits stacked vertically, height of each is 1em
  return (
    <span
      className="inline-block relative overflow-hidden align-baseline"
      style={{
        height: '1em',
        lineHeight: 1,
        WebkitMaskImage: 'linear-gradient(#0000 0%, #000 20% 80%, #0000 100%)',
        maskImage: 'linear-gradient(#0000 0%, #000 20% 80%, #0000 100%)',
      }}
    >
      <motion.span
        className="flex flex-col select-none"
        initial={{ y: '0%' }}
        animate={{ y: hasRendered ? `-${targetNum * 10}%` : '0%' }}
        transition={{
          duration,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ willChange: 'transform' }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="flex items-center justify-center text-center"
            style={{ height: '1em', lineHeight: 1 }}
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * ZeroRollingCounter
 * Accepts any string/number (e.g. "99", "1.2k/min", "184", "97.4%")
 * and rolls each number like the why.zero.university loader/metric ticker
 */
export function ZeroRollingCounter({
  value,
  className = '',
  stagger = 0.08,
  duration = 1.6,
}: {
  value: string | number;
  className?: string;
  stagger?: number;
  duration?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const chars = String(value).split('');

  return (
    <span
      ref={ref}
      className={`inline-flex items-baseline font-mono tabular-nums ${className}`}
    >
      {chars.map((char, idx) => (
        <SingleRollingDigit
          key={idx}
          digit={isInView ? char : '0'}
          delay={idx * stagger}
          duration={duration}
        />
      ))}
    </span>
  );
}

/**
 * ZeroTextReveal
 * Word-by-word blur-to-focus reveal that safely parses nested text, strings, and linebreaks
 */
export function ZeroTextReveal({
  children,
  className = '',
  delay = 0.1,
  stagger = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  // Flatten children to extract words while preserving line breaks
  const renderItems: Array<{ text: string; isBreak?: boolean }> = [];

  const extract = (node: React.ReactNode) => {
    if (typeof node === 'string') {
      const parts = node.split(/\s+/).filter(Boolean);
      parts.forEach((p) => renderItems.push({ text: p }));
    } else if (React.isValidElement(node)) {
      if (node.type === 'br') {
        renderItems.push({ text: '', isBreak: true });
      } else if (node.props && (node.props as { children?: React.ReactNode }).children) {
        React.Children.forEach((node.props as { children?: React.ReactNode }).children, extract);
      }
    } else if (Array.isArray(node)) {
      node.forEach(extract);
    }
  };

  React.Children.forEach(children, extract);

  return (
    <span
      ref={ref}
      className={`inline-flex flex-wrap items-baseline ${className}`}
    >
      {renderItems.map((item, idx) => {
        if (item.isBreak) {
          return <span key={idx} className="basis-full h-0" />;
        }
        return (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={
              isInView
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 28, filter: 'blur(8px)' }
            }
            transition={{
              duration: 0.8,
              delay: delay + idx * stagger,
              ease: cinematicEase,
            }}
            className="inline-block mr-[0.25em]"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {item.text}
          </motion.span>
        );
      })}
    </span>
  );
}

/**
 * ZeroHudPill
 * Frosted glass HUD capsule with hairline gradient outline matching why.zero.university
 */
export function ZeroHudPill({
  children,
  className = '',
  glow = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`zero-hud-pill ${glow ? 'zero-hud-pill-glow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * ZeroAudioWave
 * Audio / telemetry wave bars with continuous lively micro-animation
 */
export function ZeroAudioWave({
  active = true,
  className = '',
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[2.5px] h-3.5 ${className}`}>
      {[0.4, 0.9, 0.6, 1, 0.5, 0.8].map((initialScale, i) => (
        <motion.span
          key={i}
          className="w-[2px] bg-current rounded-full"
          animate={
            active
              ? {
                  scaleY: [initialScale, 1.2, 0.3, 0.9, initialScale],
                }
              : { scaleY: 0.2 }
          }
          transition={{
            duration: 1.2 + i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
          style={{ height: '100%', transformOrigin: 'center' }}
        />
      ))}
    </div>
  );
}

/**
 * ZeroScrollRuler
 * Dynamic top timeline navigation scrubber with live scroll millimeter ticks and stage indicator
 * mirroring the exact why.zero.university scroll-ruler
 */
export function ZeroScrollRuler({
  labels = ['01 ORBIT', '02 SCOPE', '03 CAPABILITIES', '04 ROLES', '05 INTEL'],
  onSelect,
}: {
  labels?: string[];
  onSelect?: (stageIndex: number) => void;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);

      const stage = Math.min(Math.floor(progress * labels.length) + 1, labels.length);
      setCurrentStage(stage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [labels.length]);

  const offsetTicks = -scrollProgress * 240;
  const coordReadout = (scrollProgress * 1000).toFixed(2).padStart(7, '0');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="scroll-ruler relative select-none flex items-center justify-center overflow-hidden"
    >
      {/* Centered ruler indicator needle */}
      <div className="scroll-ruler-indicator" />

      {/* Dynamic Millimeter Ruler Track that scrolls with page scroll */}
      <div
        className={`absolute inset-0 flex items-center transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `translateX(calc(50% + ${offsetTicks}px))`,
          willChange: 'transform',
        }}
      >
        <div className="flex items-center gap-[6px]">
          {Array.from({ length: 60 }).map((_, i) => {
            const isMajor = i % 10 === 0;
            const isMedium = i % 5 === 0 && !isMajor;
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-start h-8"
              >
                <div
                  className={`w-[1px] ${
                    isMajor
                      ? 'h-4 bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                      : isMedium
                      ? 'h-2.5 bg-white/60'
                      : 'h-1.5 bg-white/25'
                  }`}
                />
                {isMajor && (
                  <span className="font-mono text-[8px] text-white/70 tracking-widest mt-0.5">
                    {String(i * 10).padStart(3, '0')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover / Direct Stage Navigation Overlay */}
      <div
        className={`flex items-center justify-between w-full px-5 transition-opacity duration-300 ${
          isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {labels.map((lbl, idx) => {
          const isActive = currentStage === idx + 1;
          return (
            <button
              key={lbl}
              type="button"
              onClick={() => onSelect?.(idx + 1)}
              className={`group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none py-1 transition-all ${
                isActive ? 'text-white scale-105' : 'text-white/40 hover:text-white/90'
              }`}
            >
              <span className="font-mono text-[9px] tracking-widest uppercase font-bold">
                {lbl}
              </span>
              <div
                className={`w-6 transition-all ${
                  isActive ? 'h-[2px] bg-white shadow-[0_0_8px_#fff]' : 'h-[1px] bg-white/30 group-hover:bg-white/70'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Coordinate Ticker on top right of ruler */}
      <div className="absolute right-3 top-1 pointer-events-none">
        <span className="font-mono text-[8px] text-white/50 tracking-wider">
          {coordReadout}
        </span>
      </div>
    </div>
  );
}

/**
 * ZeroBottomStageCounter
 * Pinned bottom-left counter widget from why.zero.university showing current stage & rolling numbers
 */
export function ZeroBottomStageCounter({
  labels = ['EARTH RADAR MATRIX', 'CRISIS DOMAIN SCOPE', 'TACTICAL CAPABILITIES', 'ROLE CLEARANCE', 'INTELLIGENCE CORE'],
}: {
  labels?: string[];
}) {
  const [currentStage, setCurrentStage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);
      const stage = Math.min(Math.floor(progress * labels.length) + 1, labels.length);
      setCurrentStage(stage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [labels.length]);

  const stageNumber = String(currentStage).padStart(2, '0');
  const stageDegree = (currentStage * 18 + 10).toFixed(0);

  return (
    <div className="fixed bottom-8 left-6 sm:left-12 z-30 pointer-events-none hidden sm:flex items-end gap-3 select-none">
      <div className="flex flex-col">
        <div className="flex items-baseline font-mono font-bold leading-none text-white/80 text-6xl lg:text-7xl drop-shadow-md">
          <ZeroRollingCounter value={stageNumber} duration={0.8} />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1 font-semibold">
          <span>STAGE {stageNumber}</span>
          <span className="text-emerald-400">/</span>
          <span>{labels[currentStage - 1] || 'GLOBAL CRISIS RADAR'}</span>
        </div>
      </div>
      <div className="pb-1 font-mono text-xs text-white/40 tracking-wider">
        {stageDegree}°N
      </div>
    </div>
  );
}

/**
 * ZeroPulseButton
 * Circular pulsating trigger button matching why.zero.university's `next-stage-btn`
 */
export function ZeroPulseButton({
  label = 'EXPLORE\nMISSION',
  onClick,
  className = '',
}: {
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="next-stage-btn group flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full cursor-pointer relative"
        aria-label={label.replace('\n', ' ')}
      >
        <div className="next-stage-btn-stroke" />

        {/* Circular SVG Progress Ring */}
        <svg className="next-stage-btn-progress" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-white/30"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-white transition-all duration-300 group-hover:stroke-[3.5px]"
            strokeWidth="2"
            strokeDasharray="276.4"
            strokeDashoffset="70"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Inner center dot */}
        <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-transform duration-300 group-hover:scale-125" />
      </button>

      {/* Label next to button */}
      <span className="font-mono text-xs sm:text-sm uppercase font-bold tracking-widest text-white/90 leading-tight whitespace-pre-line select-none">
        {label}
      </span>
    </div>
  );
}

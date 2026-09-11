/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  Shield,
  Map as MapIcon,
  Users,
  Truck,
  BarChart3,
  Cpu,
  X,
  Menu,
  ChevronRight,
  Radio,
  Zap,
  Lock,
  Mail,
  Globe,
  Sun,
  Moon,
  Compass,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { GoogleEarthCrisisGlobe } from '../components/GoogleEarthCrisisGlobe';
import { TraveloEarthHeroGlobe } from '../components/TraveloEarthHeroGlobe';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { CravScrollReveal } from '../components/CravScrollReveal';
import {
  LightModeText,
  ReliefHeroTitle,
  ZeroRollingCounter,
  ZeroShimmerText,
  ZeroTextReveal,
  ZeroScrollRuler,
  ZeroPulseButton,
  ZeroHudPill,
  ZeroAudioWave,
} from '../components/LightModeText';

type AuthMode = 'signin' | 'signup' | null;
type RoleOption = 'citizen' | 'rescue_team' | 'admin';
const cinematicEase = [0.16, 1, 0.3, 1] as const;
const authContainerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: cinematicEase,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.4 },
  },
} as const;
const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: cinematicEase },
  },
} as const;
const modalItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
} as const;
const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
} as const;
const heroHeadlineVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.2, ease: cinematicEase },
  },
} as const;

const scrollSectionVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: cinematicEase },
  },
} as const;

const scrollCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: cinematicEase },
  },
} as const;

const heroSignalCards = [
  { label: 'SOS Ingest', value: '1.2k/min', accent: 'text-[var(--color-relief-orange)]' },
  { label: 'Convoys Routed', value: '184', accent: 'text-white' },
  { label: 'AI Confidence', value: '97.4%', accent: 'text-[var(--color-relief-orange)]' },
] as const;

const capabilityItems = [
  {
    title: 'Live awareness',
    icon: Radio,
    desc: 'Real-time streaming telemetry from global hotspots and sensors.',
  },
  {
    title: 'Dispatch orchestration',
    icon: MapIcon,
    desc: 'AI-optimized routing for personnel and specialized response units.',
  },
  {
    title: 'Citizen workflows',
    icon: Users,
    desc: 'Direct decentralized coordination with civilian networks on the ground.',
  },
  {
    title: 'Supply operations',
    icon: Truck,
    desc: 'End-to-end logistics tracking from procurement to extraction.',
  },
  {
    title: 'Predictive analytics',
    icon: BarChart3,
    desc: 'Anticipate crisis evolution before it reaches the boiling point.',
  },
  {
    title: 'AI-Guidance Layer',
    icon: Cpu,
    desc: 'LLM-powered decision support for high-stakes environments.',
  },
] as const;

const accessProfiles = [
  {
    label: 'Citizen',
    icon: Users,
    description: 'For public users who need crisis visibility, alerts, and emergency support access.',
    pages: ['Dashboard', 'Crisis Map', 'SOS Citizen App', 'Global Crisis', 'Profile', 'Notifications'],
  },
  {
    label: 'Operator',
    icon: Truck,
    description: 'Mapped to the rescue_team role for field teams managing operations, logistics, and response execution.',
    pages: ['Dashboard', 'Crisis Map', 'Resources', 'Analytics', 'Supply Chain', 'AI Assistant', 'Global Crisis', 'Profile', 'Notifications', 'SOS Citizen App'],
  },
  {
    label: 'Admin',
    icon: Shield,
    description: 'For command users who need full platform visibility across intelligence, supply, analytics, and AI coordination.',
    pages: ['Dashboard', 'Crisis Map', 'Resources', 'Analytics', 'Supply Chain', 'AI Assistant', 'Global Crisis', 'Profile', 'Notifications', 'SOS Citizen App'],
  },
] as const;

const projectHighlights = [
  'Natural disaster monitoring with live crisis map and seismic intelligence',
  'Universal crisis intelligence for financial, war/conflict, food, health, and energy-water risks',
  'AI copilots for summaries, recommendations, and response planning',
  'Supply chain and warehouse visibility for real logistics coordination',
] as const;

const faqItems = [
  {
    question: 'What is ReliefOS AI?',
    answer:
      'ReliefOS AI is a universal crisis intelligence platform that combines live crisis monitoring, AI summaries, citizen support tools, logistics tracking, and operational dashboards in one system.',
  },
  {
    question: 'Which crisis types does the platform monitor?',
    answer:
      'The platform covers natural disasters, financial crises, war and conflict, food shortages, health outbreaks, and energy or water disruption, while also keeping the original disaster-response modules active.',
  },
  {
    question: 'Who can use ReliefOS AI?',
    answer:
      'The platform supports citizen users, operator teams, and admin users. Operator access is powered by the rescue_team role in this project.',
  },
  {
    question: 'What pages can a citizen access?',
    answer:
      'Citizen users can access the Dashboard, Crisis Map, SOS Citizen App, Global Crisis, Profile, and Notifications pages.',
  },
  {
    question: 'What pages can an operator access?',
    answer:
      'Operators can access Dashboard, Crisis Map, Resources, Analytics, Supply Chain, AI Assistant, Global Crisis, Profile, Notifications, and SOS Citizen App.',
  },
  {
    question: 'What pages can an admin access?',
    answer:
      'Admin users have full platform visibility across Dashboard, Crisis Map, Resources, Analytics, Supply Chain, AI Assistant, Global Crisis, Profile, Notifications, and SOS Citizen App.',
  },
  {
    question: 'Does ReliefOS AI use real data?',
    answer:
      'Yes. The platform is designed to pull live operational and public intelligence data for crisis feeds, logistics, analytics, and AI-assisted decision support.',
  },
  {
    question: 'How can I contact the project team?',
    answer:
      'You can reach the team through the Contact Us section on the landing page at roopeshg91488@gmail.com and pawanshimha.pc@gmail.com.',
  },
] as const;


function AuthModal({
  mode,
  onClose,
}: {
  mode: Exclude<AuthMode, null>;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { loading, error, doLogin, doRegister, doForgotPassword } = useAuth();
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '', newPassword: '' });
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen' as RoleOption,
  });

  useEffect(() => {
    setFormError(null);
    setFocusedInput(null);
    setForgotPasswordSuccess(null);
    setShowForgotPassword(false);
  }, [mode]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    try {
      await doLogin(signInForm.email, signInForm.password);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    try {
      await doRegister(signUpForm.name, signUpForm.email, signUpForm.password, signUpForm.role);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setForgotPasswordSuccess(null);

    try {
      const response = await doForgotPassword(
        forgotPasswordForm.email,
        forgotPasswordForm.newPassword
      );
      setForgotPasswordSuccess(response.message);
      setShowForgotPassword(false);
      setSignInForm((current) => ({
        ...current,
        email: forgotPasswordForm.email,
        password: '',
      }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Password reset failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
    >
      <motion.div
        variants={authContainerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(event) => event.stopPropagation()}
        className="glass relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl p-6 text-white sm:p-8"
      >
        <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-40 w-40 rounded-full bg-[var(--color-crav-red)]/10 blur-[60px]" />

        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 text-white/40 transition-colors hover:text-white"
          type="button"
        >
          <X className="h-5 w-5" />
        </motion.button>

        <motion.div variants={modalItemVariants} className="relative mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-crav-red)]/20 bg-[var(--color-crav-red)]/10"
          >
            <Shield className="h-6 w-6 text-[var(--color-crav-mustard)]" />
          </motion.div>
          <h3 className="font-serif text-2xl font-bold mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Join ReliefOS AI'}
          </h3>
          <p className="text-sm font-light text-white/60">
            {mode === 'signin'
              ? 'Access your mission control layer'
              : 'Deploy the intelligence layer for your organization'}
          </p>
        </motion.div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
            {(formError || error) && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {formError || error}
              </div>
            )}

            {forgotPasswordSuccess && (
              <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {forgotPasswordSuccess}
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={showForgotPassword ? handleForgotPassword : handleSignIn} className="space-y-4">
                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Email Address
                  </label>
                  <div
                    className={`group relative transition-all duration-300 ${
                      focusedInput === 'email' ? 'scale-[1.02]' : ''
                    }`}
                  >
                    <motion.div
                      animate={{
                        color:
                          focusedInput === 'email'
                            ? 'rgba(139, 0, 0, 1)'
                            : 'rgba(255, 255, 255, 0.2)',
                        scale: focusedInput === 'email' ? 1.2 : 1,
                      }}
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
                    >
                      <Mail className="h-4 w-4" />
                    </motion.div>
                    <input
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      type="email"
                      required
                      value={showForgotPassword ? forgotPasswordForm.email : signInForm.email}
                      onChange={(event) =>
                        showForgotPassword
                          ? setForgotPasswordForm((current) => ({ ...current, email: event.target.value }))
                          : setSignInForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="name@organization.gov"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/35 transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none"
                    />
                  </div>
                </motion.div>

                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    {showForgotPassword ? 'New Password' : 'Password'}
                  </label>
                  <div
                    className={`group relative transition-all duration-300 ${
                      focusedInput === 'password' ? 'scale-[1.02]' : ''
                    }`}
                  >
                    <motion.div
                      animate={{
                        color:
                          focusedInput === 'password'
                            ? 'rgba(139, 0, 0, 1)'
                            : 'rgba(255, 255, 255, 0.2)',
                        scale: focusedInput === 'password' ? 1.2 : 1,
                      }}
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
                    >
                      <Lock className="h-4 w-4" />
                    </motion.div>
                    <input
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      type="password"
                      required
                      minLength={6}
                      value={showForgotPassword ? forgotPasswordForm.newPassword : signInForm.password}
                      onChange={(event) =>
                        showForgotPassword
                          ? setForgotPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                          : setSignInForm((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/35 transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none"
                    />
                  </div>
                </motion.div>

                <motion.div variants={modalItemVariants} className="flex items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setForgotPasswordSuccess(null);
                      setShowForgotPassword((current) => !current);
                    }}
                    className="text-white/55 transition-colors hover:text-white"
                  >
                    {showForgotPassword ? 'Back to sign in' : 'Forgot password?'}
                  </button>
                  {showForgotPassword ? (
                    <span className="text-right text-white/36">Enter your email and set a new password.</span>
                  ) : null}
                </motion.div>

                <motion.button
                  variants={modalItemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-crav-red)] py-4 font-bold text-white shadow-xl shadow-[var(--color-crav-red)]/20 transition-all hover:bg-[var(--color-crav-red)]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? showForgotPassword
                      ? 'Resetting...'
                      : 'Accessing...'
                    : showForgotPassword
                      ? 'Reset Password'
                      : 'Access Mission Control'}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpForm.name}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="ReliefOS Operator"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-white/35 transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none"
                  />
                </motion.div>

                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signUpForm.email}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="name@organization.gov"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-white/35 transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none"
                  />
                </motion.div>

                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpForm.password}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Create a secure password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-white/35 transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none"
                  />
                </motion.div>

                <motion.div variants={modalItemVariants} className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Role
                  </label>
                  <select
                    value={signUpForm.role}
                    onChange={(event) =>
                      setSignUpForm((current) => ({
                        ...current,
                        role: event.target.value as RoleOption,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white transition-all focus:border-[var(--color-crav-red)]/50 focus:bg-white/[0.08] focus:outline-none [&>option]:bg-[var(--color-crav-black)] [&>option]:text-white"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="rescue_team">Rescue Team</option>
                    <option value="admin">Admin</option>
                  </select>
                </motion.div>

                <motion.button
                  variants={modalItemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-crav-red)] py-4 font-bold text-white shadow-xl shadow-[var(--color-crav-red)]/20 transition-all hover:bg-[var(--color-crav-red)]/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Deploying...' : 'Deploy Intelligence'}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </form>
            )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeCapability, setActiveCapability] = useState<string>(capabilityItems[0].title);

  // ── SCENE STATE ──
  // 0: Hero
  // 1: About (Left)
  // 2: Capabilities (Right)
  // 3: Roles (Left)
  // 4: Intelligence (Right)
  const [scene, setScene] = useState(0);
  const sceneRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow native scroll if we are scrolled down into the FAQ/Footer
      if (window.scrollY > 10 && e.deltaY > 0) return;
      if (window.scrollY > 10 && e.deltaY < 0 && sceneRef.current === 4) return;

      if (isAnimatingRef.current) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 30) {
        if (sceneRef.current < 4) {
          e.preventDefault();
          sceneRef.current += 1;
          setScene(sceneRef.current);
          isAnimatingRef.current = true;
          setTimeout(() => { isAnimatingRef.current = false; }, 1000);
        }
      } else if (e.deltaY < -30) {
        if (sceneRef.current > 0 && window.scrollY <= 10) {
          e.preventDefault();
          sceneRef.current -= 1;
          setScene(sceneRef.current);
          isAnimatingRef.current = true;
          setTimeout(() => { isAnimatingRef.current = false; }, 1000);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };

    window.addEventListener('mousemove', handlePointerMove);
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-clip bg-[#ebe6e0] text-black selection:bg-black selection:text-[#ebe6e0] focus-within:outline-none transition-colors duration-700 noise">
      
      {/* ── Liquid Ambient Background ── */}
      <div className="liquid-bg-container pointer-events-none">
        <div className="liquid-blob b1"></div>
        <div className="liquid-blob b2"></div>
        <div className="liquid-blob b3"></div>
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-8 flex items-center justify-between pointer-events-auto mix-blend-multiply">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 flex items-center justify-center transition-transform duration-500 group-hover:rotate-180">
            <Shield className="w-8 h-8 text-black stroke-[1.2]" />
          </div>
          <span className="font-serif italic text-2xl sm:text-3xl tracking-wide text-black">
            ReliefOS
          </span>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 text-black font-sans text-xs tracking-[0.25em] uppercase">
          <button onClick={() => setAuthMode('signin')} className="hover:opacity-60 transition-opacity cursor-pointer">
            Login
          </button>
          <button onClick={() => setAuthMode('signup')} className="hover:opacity-60 transition-opacity cursor-pointer">
            Deploy
          </button>
          <button onClick={() => navigate('/crisis-map')} className="hover:opacity-60 transition-opacity cursor-pointer">
            <Search className="w-5 h-5 stroke-[1.2]" />
          </button>
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center hover:bg-black hover:text-[#ebe6e0] transition-all duration-500 cursor-pointer">
            <Menu className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}
      </AnimatePresence>

      {/* ── STICKY TIMELINE CONTAINER ── */}
      <div className="h-[100vh] relative z-10 w-full">
        <div className="sticky top-0 h-[100vh] w-full overflow-hidden flex items-center justify-center">
          
          {/* Persistent Sticky Globe */}
          <motion.div
            animate={{
              x: scene === 1 ? '25vw' : scene === 2 ? '-25vw' : scene === 3 ? '25vw' : scene === 4 ? '-25vw' : '0vw',
              scale: scene === 0 ? 1 : 0.85
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 60, mass: 1 }}
            className="absolute z-10 flex h-full w-full items-center justify-center pointer-events-none"
          >
            <div className="h-[80vh] w-[80vh] min-h-[600px] min-w-[600px] pointer-events-auto">
              <TraveloEarthHeroGlobe />
            </div>
          </motion.div>

          {/* ── SCENE 1: Hero (Center) ── */}
          <motion.div
            initial={false}
            animate={{ opacity: scene === 0 ? 1 : 0, y: scene === 0 ? '0%' : '-20%' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-0 flex h-full w-full items-center justify-center z-20 ${scene === 0 ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <div className="relative flex flex-row items-center justify-center select-none w-full max-w-[94rem] px-4">
              <div className="relative flex flex-1 items-center justify-end z-20 pointer-events-none mix-blend-multiply">
                <span className="font-serif italic tracking-tighter text-[clamp(6rem,18vw,24rem)] leading-none text-black/90">
                  W
                </span>
              </div>
              <div className="relative flex items-center justify-center z-30 shrink-0" style={{ width: 'clamp(280px, 45vw, 650px)' }}></div>
              <div className="relative flex flex-1 items-center justify-start z-20 pointer-events-none mix-blend-multiply">
                <span className="font-serif tracking-tighter text-[clamp(6rem,18vw,24rem)] leading-none text-black/90" style={{ marginLeft: '-2vw' }}>
                  RLD
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── SCENE 2: About (Left) ── */}
          <div className="absolute left-4 sm:left-12 lg:left-24 top-1/2 -translate-y-1/2 w-full max-w-md lg:max-w-xl z-20 pointer-events-none">
            <motion.div
              initial={false}
              animate={{
                opacity: scene === 1 ? 1 : 0,
                x: scene === 1 ? '0vw' : scene < 1 ? '-10vw' : '10vw',
                y: scene === 1 ? '0%' : scene < 1 ? '20%' : '-20%'
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto"
            >
            <div className="bg-[#f2efe9]/40 backdrop-blur-2xl border border-black/5 rounded-[2rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/60">02. About</span>
                <div className="h-[1px] flex-1 bg-black/10"></div>
              </div>
              <ZeroTextReveal className="mt-8 font-serif italic text-4xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-black/90">
                One unified platform for global intelligence.
              </ZeroTextReveal>
              <p className="mt-8 font-sans text-base sm:text-lg leading-relaxed text-black/60 font-light max-w-md">
                ReliefOS AI bridges civilian tools, command operations, and autonomous dispatch into an integrated planetary interface.
              </p>
              <div className="mt-10 space-y-4">
                {projectHighlights.slice(0, 3).map((item, idx) => (
                  <div key={item} className="group font-sans text-xs sm:text-sm tracking-wide text-black/50 flex items-start gap-4 transition-all hover:text-black/80">
                    <span className="font-serif italic text-black/40 group-hover:text-black/80 transition-colors">0{idx + 1}</span>
                    <span className="font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </div>

          {/* ── SCENE 3: Capabilities (Right) ── */}
          <div className={`absolute right-4 sm:right-12 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md lg:max-w-xl z-20 ${scene === 2 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <motion.div
              initial={false}
              animate={{
                opacity: scene === 2 ? 1 : 0,
                x: scene === 2 ? '0vw' : scene < 2 ? '10vw' : '-10vw',
                y: scene === 2 ? '0%' : scene < 2 ? '20%' : '-20%'
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="flex flex-col gap-4">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40 pl-4">03. Capabilities</span>
              {capabilityItems.map((item) => (
                <div
                  key={item.title}
                  onClick={() => setActiveCapability(item.title)}
                  className={`group cursor-pointer rounded-[2rem] p-6 transition-all duration-500 border ${
                    activeCapability === item.title 
                    ? 'bg-[#f2efe9] border-black/10 shadow-[0_20px_40px_rgba(0,0,0,0.05)]' 
                    : 'bg-[#f2efe9]/20 border-transparent hover:bg-[#f2efe9]/40 backdrop-blur-sm'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                      activeCapability === item.title ? 'bg-black text-[#ebe6e0]' : 'bg-black/5 text-black/40 group-hover:text-black/60'
                    }`}>
                      <item.icon className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className={`font-serif italic text-2xl transition-colors ${
                        activeCapability === item.title ? 'text-black' : 'text-black/60 group-hover:text-black/80'
                      }`}>
                        {item.title}
                      </h3>
                      <AnimatePresence>
                        {activeCapability === item.title && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 overflow-hidden font-sans text-sm font-light leading-relaxed text-black/60"
                          >
                            {item.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          </div>

          {/* ── SCENE 4: Roles (Left) ── */}
          <div className={`absolute left-4 sm:left-12 lg:left-24 top-1/2 -translate-y-1/2 w-full max-w-md lg:max-w-xl z-20 ${scene === 3 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <motion.div
              initial={false}
              animate={{
                opacity: scene === 3 ? 1 : 0,
                x: scene === 3 ? '0vw' : scene < 3 ? '-10vw' : '10vw',
                y: scene === 3 ? '0%' : scene < 3 ? '20%' : '-20%'
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="flex flex-col gap-6">
              {accessProfiles.map((profile, idx) => (
                <div key={profile.label} className="bg-[#f2efe9]/40 backdrop-blur-2xl border border-black/5 rounded-[2rem] p-8 flex flex-col sm:flex-row gap-6 items-start transition-all hover:bg-[#f2efe9]/60 shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-black/60">
                    <profile.icon className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <div>
                    <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-black/40 mb-2">TIER 0{idx + 1}</div>
                    <div className="font-serif italic text-3xl sm:text-4xl text-black/90">{profile.label}</div>
                    <p className="mt-3 font-sans text-sm font-light leading-relaxed text-black/50">{profile.description}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {profile.pages.slice(0, 4).map((page) => (
                        <div key={`${profile.label}-${page}`} className="px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-sans font-light bg-black/5 rounded-full text-black/60 border border-black/10">{page}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </motion.div>
          </div>

          {/* ── SCENE 5: Intelligence (Right) ── */}
          <div className={`absolute right-4 sm:right-12 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md lg:max-w-xl z-20 ${scene === 4 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <motion.div
              initial={false}
              animate={{
                opacity: scene === 4 ? 1 : 0,
                x: scene === 4 ? '0vw' : '10vw',
                y: scene === 4 ? '0%' : '20%'
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="bg-[#f2efe9]/40 backdrop-blur-2xl border border-black/5 rounded-[2rem] p-8 sm:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.1)]">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40 mb-6 block">05. Deployment</span>
              <ZeroTextReveal className="font-serif italic text-5xl sm:text-7xl lg:text-8xl leading-[1] tracking-tight text-black/90">
                The next era of intelligence.
              </ZeroTextReveal>
              <p className="font-sans text-lg sm:text-xl font-light leading-relaxed text-black/50 mt-8 max-w-md">
                ReliefOS AI is available for governmental agencies and certified relief coalitions. Deploy your secure layer today.
              </p>
              <div className="flex flex-col items-start gap-6 pt-12 sm:flex-row">
                <button onClick={() => setAuthMode('signup')} className="flex items-center justify-center gap-4 rounded-full bg-black px-8 py-5 font-sans text-xs uppercase tracking-[0.2em] text-[#ebe6e0] transition-transform duration-500 hover:scale-105">
                  <Zap className="h-4 w-4" />
                  <span>Deploy Now</span>
                </button>
                {isLoggedIn ? (
                  <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center gap-4 rounded-full border border-black/20 px-8 py-5 font-sans text-xs uppercase tracking-[0.2em] text-black/80 transition-all duration-500 hover:bg-black/5 hover:text-black">
                    <span>Dashboard</span> <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <a href="#footer" className="flex items-center justify-center gap-4 rounded-full border border-black/20 px-8 py-5 font-sans text-xs uppercase tracking-[0.2em] text-black/80 transition-all duration-500 hover:bg-black/5 hover:text-black">
                    <span>Explore</span> <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
          </div>

        </div>
      </div>

      {/* ── Normal Flowing Content (FAQ & Footer) ── */}
      <div className="relative z-20 bg-transparent">
        <section id="faq" className="px-4 py-32 sm:px-6 sm:py-48">
          <div className="mx-auto max-w-5xl">
            <div className="mb-24 text-center">
              <h2 className="font-serif italic text-5xl sm:text-8xl text-black/90 block text-center tracking-tight">
                System Knowledge
              </h2>
              <p className="mx-auto mt-8 max-w-xl font-sans font-light text-lg sm:text-xl leading-relaxed text-black/50">
                Key architecture details about the platform, role permissions, and how telemetry and dispatch sync in real time.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {faqItems.map((item, index) => (
                <div key={item.question} className="bg-[#f2efe9]/40 backdrop-blur-2xl border border-black/5 rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:bg-[#f2efe9]/60 text-left shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
                  <div className="font-serif italic text-3xl text-black/90">{item.question}</div>
                  <div className="mt-6 font-sans font-light text-sm leading-relaxed text-black/50">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer id="footer" className="bg-[#e0d9cf] text-black px-4 py-20 sm:px-6 sm:py-32 border-t border-black/10 relative z-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-16 sm:gap-24 md:flex-row">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 stroke-[1]" />
                <span className="font-serif italic text-4xl tracking-tight text-black/90">ReliefOS</span>
              </div>
              <p className="max-w-xs font-sans font-light text-sm text-black/60 leading-relaxed">
                Planetary crisis coordination and autonomous intelligence layer. Built for the unknown.
              </p>
              <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-black/40">
                SYSTEM 2026.4 ONLINE
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(280px,1.2fr)] sm:gap-20">
              <div className="space-y-6">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40">Protocol</h4>
                <ul className="space-y-4 font-sans font-light text-sm text-black/70">
                  <li><a href="#platform" className="hover:text-black transition-colors">Security</a></li>
                  <li><a href="#capabilities" className="hover:text-black transition-colors">Compliance</a></li>
                  <li><a href="#intelligence" className="hover:text-black transition-colors">Edge Nodes</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40">Intelligence</h4>
                <ul className="space-y-4 font-sans font-light text-sm text-black/70">
                  <li><a href="#platform" className="hover:text-black transition-colors">Models</a></li>
                  <li><a href="#capabilities" className="hover:text-black transition-colors">Training</a></li>
                  <li><a href="#intelligence" className="hover:text-black transition-colors">Ground Truth</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40">Agency</h4>
                <ul className="space-y-4 font-sans font-light text-sm text-black/70">
                  <li><button type="button" onClick={() => setAuthMode('signup')} className="hover:text-black transition-colors">Apply</button></li>
                  <li><a href="#capabilities" className="hover:text-black transition-colors">NGO Tier</a></li>
                  <li><a href="#intelligence" className="hover:text-black transition-colors">Government</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.25em] text-black/40">Contact</h4>
                <div className="space-y-4 font-sans font-light text-sm text-black/70">
                  <div>
                    <a href="mailto:roopeshg91488@gmail.com" className="hover:text-black transition-colors block mb-1">roopeshg91488@gmail.com</a>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-black/40">Lead Architect</span>
                  </div>
                  <div>
                    <a href="mailto:pawanshimha.pc@gmail.com" className="hover:text-black transition-colors block mb-1">pawanshimha.pc@gmail.com</a>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-black/40">Operations Director</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 pt-24 font-sans text-[10px] font-light tracking-[0.2em] text-black/40 sm:pt-32 sm:flex-row">
            <span>© 2026 RELIEFOS GLOBAL. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-12">
              <a href="#footer" className="hover:text-black transition-colors">Terms</a>
              <a href="#footer" className="hover:text-black transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, X, Menu, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navLinks = [
  { path: '/operations-dashboard', label: 'Operations & Logistics' },
  { path: '/crisis-map',   label: 'Crisis Map' },
  { path: '/global-crisis',label: 'Global Intel' },
  { path: '/resources',    label: 'Resources' },
  { path: '/sos-citizen',  label: 'SOS Citizen' },
  { path: '/analytics',    label: 'Analytics' },
  { path: '/supply-chain', label: 'Supply Chain' },
  { path: '/ai-assistant', label: 'AI Copilot' },
];

import { Variants } from 'motion/react';

const menuVariants: Variants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: { 
    opacity: 1, 
    y: '0%',
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1], // Lacoste-like smooth bezier
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: '-100%',
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1],
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const linkVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.3 }
  }
};

export function AppNavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, doLogout } = useAuth();
  
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  const isDarkPage = ['/resources', '/supply-chain'].includes(location.pathname);
  const textColor = isDarkPage ? 'text-white' : 'text-black';

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Transparent Header */}
      <header className={`fixed top-0 left-0 right-0 z-[9999] px-6 py-5 flex items-center justify-between pointer-events-auto bg-transparent ${textColor}`}>
        
        {/* Left: Logo & Back */}
        <div className="flex items-center gap-6">
          {!isLanding && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 group transition-opacity hover:opacity-70 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-semibold hidden sm:block">Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group transition-transform hover:scale-105 origin-left cursor-pointer"
          >
            <Shield className="w-6 h-6 stroke-[1.5]" />
            <span className="font-display text-lg font-bold tracking-[0.25em] uppercase">
              Relief<span className="opacity-70">OS</span>
            </span>
          </button>
        </div>

        {/* Right: Menu Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 group transition-opacity hover:opacity-70 cursor-pointer"
          >
            <span className="font-sans text-xs uppercase tracking-[0.2em] font-semibold hidden sm:block">Menu</span>
            <Menu className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>
      </header>

      {/* Full Screen Animated Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[10000] bg-[#ebe6e0]/95 backdrop-blur-2xl flex flex-col px-6 md:px-20 py-10 overflow-y-auto text-black"
          >
            {/* Header inside menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 stroke-[1.5]" />
                <span className="font-display text-lg font-bold tracking-[0.25em] uppercase">
                  Relief<span className="opacity-70">OS</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 group transition-transform hover:rotate-90 origin-center cursor-pointer"
              >
                <span className="font-sans text-xs uppercase tracking-[0.2em] font-semibold hidden sm:block">Close</span>
                <X className="w-8 h-8 stroke-[1.5]" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 flex flex-col justify-start gap-6 md:gap-8 mt-12 mb-8">
              {navLinks.map((item, index) => {
                const active = location.pathname === item.path;
                return (
                  <motion.div key={item.path} variants={linkVariants} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => goTo(item.path)}
                      className="group flex items-center gap-6 cursor-pointer"
                    >
                      <span className="font-mono text-sm opacity-40 font-light tracking-widest w-8 text-left">
                        0{index + 1}
                      </span>
                      <span className={`font-display text-4xl md:text-6xl font-medium tracking-wide uppercase transition-all duration-500 ease-out 
                        ${active ? 'text-black' : 'text-black/50 group-hover:text-black group-hover:translate-x-4'}`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer inside menu */}
            <motion.div 
              variants={linkVariants}
              className="mt-auto border-t border-black/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 font-sans text-xs uppercase tracking-[0.2em] font-semibold text-black/50"
            >
              <div>
                {user ? `Logged in as ${user.email}` : 'Not logged in'}
              </div>
              
              {user && (
                <button
                  type="button"
                  onClick={() => { doLogout(); setOpen(false); }}
                  className="hover:text-black transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

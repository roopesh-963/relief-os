import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Map as MapIcon,
  Globe2,
  Package,
  Radio,
  BarChart3,
  Truck,
  Cpu,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { TraveloStyleWorldGlobe } from '../components/TraveloStyleWorldGlobe';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/api';
import { CravTextAnimate } from '../components/CravTextAnimate';

const navItems = [
  { title: 'Operations & Logistics',  path: '/operations-dashboard', icon: Shield,   bg: 'bg-cyan-500' },
  { title: 'Tactical Crisis Map',     path: '/crisis-map',    icon: MapIcon,  bg: 'bg-[var(--color-crav-mustard)]' },
  { title: 'Global Crisis Intel',     path: '/global-crisis', icon: Globe2,   bg: 'bg-[var(--color-crav-orange)]' },
  { title: 'Resource Allocation',     path: '/resources',     icon: Package,  bg: 'bg-[var(--color-crav-green)]' },
  { title: 'Citizen SOS Hub',         path: '/sos-citizen',   icon: Radio,    bg: 'bg-[var(--color-crav-red)]' },
  { title: 'Predictive Analytics',    path: '/analytics',     icon: BarChart3,bg: 'bg-purple-500' },
  { title: 'Supply Chain & Convoys',  path: '/supply-chain',  icon: Truck,    bg: 'bg-[var(--color-crav-orange)]' },
  { title: 'AI Operations Copilot',   path: '/ai-assistant',  icon: Cpu,      bg: 'bg-blue-500' },
  { title: 'Notifications & Feeds',   path: '/notifications', icon: Bell,     bg: 'bg-[var(--color-crav-mustard)]' },
];

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/'); }
  };

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-[var(--color-crav-beige)]">

      {/* ── Background Elements ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-10 left-10 text-[var(--color-crav-red)] opacity-20 transform -rotate-12">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="currentColor">
              <path d="M100 0L130 70L200 100L130 130L100 200L70 130L0 100L70 70Z" />
            </svg>
         </div>
      </div>

      {/* ── Giant Typographic Text ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <CravTextAnimate 
          text="RELIEF OS" 
          className="font-[var(--font-modak)] text-[18vw] leading-[0.8] text-[var(--color-crav-red)] text-stroke-large tracking-wide"
        />
        <CravTextAnimate 
          text="DISASTER RESPONSE" 
          delay={0.2}
          className="font-[var(--font-mouse)] text-[5vw] text-[var(--color-crav-mustard)] text-stroke-medium mt-4 -rotate-2"
        />
      </div>

      {/* ── Globe Container ── */}
      <div className="absolute right-[-10vw] bottom-[-20vh] w-[60vw] h-[60vw] z-20 pointer-events-auto rounded-full overflow-hidden border-[8px] border-[var(--color-crav-black)] shadow-[12px_12px_0px_var(--color-crav-black)] bg-[var(--color-crav-darkred)]">
        <div className="relative w-full h-full scale-[1.5]">
          <TraveloStyleWorldGlobe />
        </div>
      </div>

      {/* ── Floating Menu Button (top-right) ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-full border-4 border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] px-6 py-3 font-[var(--font-mouse)] text-3xl uppercase tracking-widest text-[var(--color-crav-black)] shadow-[4px_4px_0px_var(--color-crav-black)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-crav-black)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-crav-black)] cursor-pointer"
      >
        <Menu className="h-6 w-6 stroke-[3]" />
        MENU
      </button>

      {/* ── Slide-Over Drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: '100%', rotate: 5 }}
              animate={{ x: 0, rotate: 0 }}
              exit={{ x: '100%', rotate: 5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-md flex-col border-l-8 border-[var(--color-crav-black)] bg-[var(--color-crav-red)] overflow-y-auto shadow-[-20px_0_40px_rgba(0,0,0,0.3)]"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-8 py-6 border-b-4 border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)]">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-[var(--color-crav-black)]" />
                  <span className="font-[var(--font-modak)] text-4xl text-[var(--color-crav-black)] text-stroke-small tracking-wider mt-2">RELIEF OS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border-4 border-[var(--color-crav-black)] bg-[var(--color-crav-beige)] p-2 text-[var(--color-crav-black)] hover:bg-white cursor-pointer transition shadow-[4px_4px_0px_var(--color-crav-black)] hover:shadow-[2px_2px_0px_var(--color-crav-black)] hover:translate-y-0.5"
                >
                  <X className="h-6 w-6 stroke-[4]" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-6 py-6 space-y-4">
                {navItems.map((item, idx) => (
                  <motion.button
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.path}
                    type="button"
                    onClick={() => { setOpen(false); navigate(item.path); }}
                    className="w-full text-left group flex items-center justify-between rounded-2xl border-4 border-[var(--color-crav-black)] bg-white px-4 py-3 transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-crav-black)] shadow-[4px_4px_0px_var(--color-crav-black)] cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-4 border-[var(--color-crav-black)] ${item.bg}`}>
                        <item.icon className="h-6 w-6 text-[var(--color-crav-black)] stroke-[3]" />
                      </div>
                      <span className="font-[var(--font-mouse)] text-2xl text-[var(--color-crav-black)] mt-1 group-hover:text-[var(--color-crav-red)] transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight className="h-6 w-6 text-[var(--color-crav-black)] group-hover:translate-x-1 transition-transform stroke-[4]" />
                  </motion.button>
                ))}
              </nav>

              {/* Footer */}
              <div className="px-6 py-6 border-t-4 border-[var(--color-crav-black)] bg-[var(--color-crav-beige)] space-y-4">
                <p className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)] text-center">
                  Signed in as <strong className="text-[var(--color-crav-red)]">{user?.name || 'Commander'}</strong>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); navigate('/profile'); }}
                    className="flex items-center justify-center gap-2 rounded-xl border-4 border-[var(--color-crav-black)] bg-white py-3 font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)] hover:bg-[var(--color-crav-mustard)] transition shadow-[4px_4px_0px_var(--color-crav-black)] active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <User className="h-5 w-5 stroke-[3]" />
                    PROFILE
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl border-4 border-[var(--color-crav-black)] bg-[var(--color-crav-black)] py-3 font-[var(--font-mouse)] text-xl text-white hover:bg-[var(--color-crav-red)] transition shadow-[4px_4px_0px_var(--color-crav-black)] active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <LogOut className="h-5 w-5 stroke-[3]" />
                    SIGN OUT
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
import OperationsCopilot from '../components/assistant/OperationsCopilot';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const SUGGESTED_PROMPTS = [
  "What is the current status of Relief|OS networks?",
  "Analyze the telemetry from the last 24 hours.",
  "Which regions are currently facing critical shortages?",
  "Suggest optimal routing for the next supply drop."
];

export default function AIAssistant() {
  return (
    <div className="relative min-h-screen bg-[#ebe6e0] text-black overflow-hidden selection:bg-black selection:text-[#ebe6e0] transition-colors duration-700 noise">
      
      {/* ── Liquid Ambient Background ── */}
      <div className="liquid-bg-container pointer-events-none">
        <div className="liquid-blob b1"></div>
        <div className="liquid-blob b2"></div>
        <div className="liquid-blob b3"></div>
      </div>

      <AppNavBar />

      <main className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto gap-12">
        
        {/* Left Side: Prompts & Context */}
        <div className="w-full md:w-1/2 flex flex-col justify-center mb-12 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 border border-black/10 text-xs font-mono tracking-[0.2em] uppercase text-black/70 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Mira AI Copilot</span>
            </div>
            
            <h1 className="font-serif italic text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-black mb-6">
              Operational Intelligence
            </h1>
            
            <p className="font-sans text-lg text-black/60 font-normal leading-relaxed max-w-lg mb-10">
              Connect directly with our advanced generative model to analyze telemetry, predict supply shortages, and orchestrate relief efforts autonomously.
            </p>

            <div className="space-y-4">
              <h3 className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-black/50 mb-4">
                Suggested Directives
              </h3>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="w-full text-left p-4 rounded-2xl bg-white/40 hover:bg-white/80 border border-black/5 hover:border-black/20 transition-all cursor-pointer flex items-center justify-between group"
                  onClick={() => {
                    // We can pass this prompt to the copilot component via custom event or state
                    const event = new CustomEvent('ai-assistant-prompt', { detail: prompt });
                    window.dispatchEvent(event);
                  }}
                >
                  <span className="font-sans text-black/80">{prompt}</span>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-black/80 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: The Copilot Device */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <OperationsCopilot embedded={true} />
          </motion.div>
        </div>

      </main>
    </div>
  );
}

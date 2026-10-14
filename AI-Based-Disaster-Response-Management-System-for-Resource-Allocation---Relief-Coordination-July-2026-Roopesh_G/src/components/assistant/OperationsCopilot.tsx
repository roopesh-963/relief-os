import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageSquare, User, Folder, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  ChatMessage,
} from '../../services/api';
import { GoogleGenAI } from '@google/genai';

interface OperationsCopilotProps {
  embedded?: boolean;
}

export default function OperationsCopilot({ embedded }: OperationsCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "welcome guest. you're officially the most interesting thing on this screen. what do you want to know?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handlePromptEvent = (e: any) => {
      setInputValue(e.detail);
    };
    window.addEventListener('ai-assistant-prompt', handlePromptEvent);
    return () => window.removeEventListener('ai-assistant-prompt', handlePromptEvent);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('MISSING_API_KEY');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Combine history into a single prompt for simple context (since role formatting varies by SDK version)
      const promptContext = messages
        .filter(m => m.text)
        .map(m => `${m.role === 'assistant' ? 'Mira' : 'Guest'}: ${m.text}`)
        .join('\n');
        
      const fullPrompt = `${promptContext}\nGuest: ${userMsg.text}\nMira: `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      const text = response.text || "No response generated.";
      const aiMsg: ChatMessage = { role: 'assistant', text };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      let errMsg = `Connection failed. Error: ${err.message || String(err)}`;
      if (err.message === 'MISSING_API_KEY') {
        errMsg = 'Error: Please set VITE_GEMINI_API_KEY in your .env file to connect to Gemini.';
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: errMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center overflow-hidden selection:bg-[#e45b36] selection:text-white font-mono",
      embedded ? "h-full w-full bg-transparent" : "h-screen w-screen bg-[#c8cfd5]"
    )}>
      


      {/* The Hardware Device */}
      <div className="relative w-[380px] h-[780px] bg-[#eef0f3] rounded-[48px] shadow-[0_30px_60px_rgba(0,0,0,0.15),inset_0_2px_10px_rgba(255,255,255,0.8),inset_0_-5px_15px_rgba(0,0,0,0.05)] border border-white/50 flex flex-col items-center pt-8 pb-12 px-6 z-10">
        
        {/* Top Bezel */}
        <div className="w-full flex items-center justify-between px-2 mb-6 text-[#9da5ab]">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-lg text-[#5a6065] tracking-tighter">Relief|OS</span>
            <span className="text-[9px] uppercase tracking-widest">v2.1.1</span>
          </div>
          
          {/* Speaker Holes */}
          <div className="flex gap-1.5 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#5a6065] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
            ))}
          </div>

          {/* LED */}
          <div className="w-2 h-2 rounded-full bg-[#ff4a3d] shadow-[0_0_8px_#ff4a3d]" />
        </div>

        {/* The Screen */}
        <div className="w-full flex-1 bg-[#151515] rounded-[32px] shadow-[inset_0_5px_15px_rgba(0,0,0,0.8),0_2px_0_rgba(255,255,255,0.5)] border-4 border-[#222] overflow-hidden flex flex-col relative">
          
          {/* Screen Header */}
          <div className="flex items-center justify-between px-6 py-4 text-[#777] text-[10px] tracking-widest uppercase border-b border-[#222]">
            <div>/CHAT</div>
            <div className="flex items-center gap-3">
              <span>🔇 MUTED</span>
              <span>◉ 4 ONLINE</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar flex flex-col gap-6 text-xs leading-relaxed">
            <div className="text-[#555] italic text-center w-full tracking-widest text-[10px]">
              *** guest has joined /chat ***
            </div>

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className="flex gap-2">
                  <span className={cn(
                    "font-bold shrink-0",
                    isUser ? "text-[#888]" : "text-[#d1b066]"
                  )}>
                    {isUser ? "Guest:" : "Mira:"}
                  </span>
                  <span className={cn(
                    isUser ? "text-[#999]" : "text-[#e0e0e0]"
                  )}>
                    {msg.text}
                  </span>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-2">
                <span className="font-bold shrink-0 text-[#d1b066]">Mira:</span>
                <span className="text-[#666] animate-pulse">typing...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-[#222] bg-[#111]">
            <form onSubmit={handleSend} className="relative flex items-center">
              <span className="text-[#ff4a3d] mr-2">{'>'}</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="say something..."
                className="bg-transparent border-none outline-none text-[#e0e0e0] placeholder:text-[#555] text-xs w-full pr-10"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-0 w-6 h-6 rounded-full bg-[#ff4a3d] flex items-center justify-center text-white disabled:opacity-50 transition-opacity shadow-[0_2px_5px_rgba(255,74,61,0.4)]"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Physical Controls */}
        <div className="w-full flex justify-between items-end mt-8 px-4 h-32 relative">
          
          {/* Power Button */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-2.5 h-10 rounded-full bg-[#ff4a3d] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),inset_-1px_-1px_3px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.1)] border border-[#e43a2d]" />
            <span className="text-[8px] uppercase tracking-widest text-[#9da5ab]">Power</span>
          </div>

          {/* D-Pad */}
          <div className="relative w-32 h-32 rounded-full bg-[#eef0f3] shadow-[0_10px_20px_rgba(0,0,0,0.08),inset_0_2px_5px_rgba(255,255,255,1),inset_0_-2px_10px_rgba(0,0,0,0.05)] border border-white/60 flex items-center justify-center">
            {/* Center Button */}
            <div className="w-16 h-16 rounded-full bg-[#f8f9fa] shadow-[inset_0_2px_5px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(0,0,0,0.05),0_5px_10px_rgba(0,0,0,0.1)] border border-white flex items-center justify-center z-10" />
            
            {/* Icons */}
            <MessageSquare className="w-3.5 h-3.5 text-[#ff4a3d] absolute left-3" />
            <User className="w-3.5 h-3.5 text-[#9da5ab] absolute right-3" />
            <Folder className="w-3.5 h-3.5 text-[#9da5ab] absolute top-3" />
            <Mail className="w-3.5 h-3.5 text-[#9da5ab] absolute bottom-3" />
          </div>

          {/* Back Button */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-2.5 h-8 rounded-full bg-[#d0d6dc] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)] border border-white/50" />
            <span className="text-[8px] uppercase tracking-widest text-[#9da5ab]">Back</span>
          </div>
          
        </div>
      </div>

    </div>
  );
}

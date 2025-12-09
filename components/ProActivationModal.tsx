import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, ArrowRight, Lock, Unlock } from 'lucide-react';

interface ProActivationModalProps {
  onClose: () => void;
}

export const ProActivationModal: React.FC<ProActivationModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Animation sequence
    const t1 = setTimeout(() => setStep(1), 500); // Unlock
    const t2 = setTimeout(() => setStep(2), 1500); // List items
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm" />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-black border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Decor */}
        <div className="absolute top-0 right-0 p-4 opacity-20">
           <ShieldCheck className="w-32 h-32 text-red-600" />
        </div>

        <div className="p-10 relative z-10 flex flex-col items-center text-center">
            
            {/* Animated Icon */}
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-700">
                {step === 0 ? (
                    <Lock className="w-8 h-8 text-zinc-500" />
                ) : (
                    <Unlock className="w-8 h-8 text-red-600 animate-in spin-in-180 fade-in duration-500" />
                )}
            </div>

            <div className="space-y-2 mb-8">
                <div className="inline-block px-3 py-1 bg-red-900/30 border border-red-900 rounded-full mb-2">
                    <span className="text-red-500 text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">
                        Transaction Verified
                    </span>
                </div>
                <h2 className="text-4xl font-oswald font-bold uppercase text-white">
                    Access <span className="text-red-600">Granted</span>
                </h2>
                <p className="text-zinc-300 text-sm">Welcome to the professional tier.</p>
            </div>

            {/* Unlocked Features List */}
            <div className={`space-y-3 w-full text-left mb-8 transition-all duration-700 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {[
                    "Unlimited Estimates",
                    "AI-Powered Rate Analysis",
                    "Studio Portal Branding",
                    "Remove Watermarks"
                ].map((item, i) => (
                    <div key={i} className="flex items-center text-sm text-zinc-200 border-b border-zinc-800 pb-2">
                        <Check className="w-4 h-4 text-red-600 mr-3" />
                        <span className="font-mono uppercase text-xs tracking-wider">{item}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-white hover:bg-red-600 text-black hover:text-white font-oswald font-bold uppercase tracking-widest py-4 transition-all duration-300 flex items-center justify-center group"
            >
                Initialize Workspace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
        
        {/* Footer Code */}
        <div className="bg-zinc-900 p-2 text-center border-t border-zinc-800">
            <code className="text-[9px] text-zinc-400 font-mono">AUTH_KEY_PRO_VERIFIED_{new Date().getFullYear()}</code>
        </div>
      </div>
    </div>
  );
};
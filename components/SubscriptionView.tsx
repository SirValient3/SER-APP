import React from 'react';
import { Check, Star, Zap, Shield, RotateCw, FlaskConical } from 'lucide-react';

interface SubscriptionViewProps {
    onSubscribe: () => void;
    onSimulateSuccess?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onSubscribe, onSimulateSuccess }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
      
      <div className="text-center mb-16">
        <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-[0.2em] mb-4 inline-block">
          Unlock Full Potential
        </span>
        <h1 className="text-6xl md:text-8xl font-oswald font-bold uppercase text-white mb-6">
          Pro <span className="text-red-600">Access</span>
        </h1>
        <p className="text-zinc-300 max-w-xl mx-auto">
          Scale your production business with unlimited estimates, advanced AI insights, and professional tools.
        </p>
      </div>

      <div className="w-full max-w-md bg-zinc-900 text-white p-1 relative overflow-hidden shadow-2xl border border-zinc-800">
        <div className="absolute top-0 right-0 w-20 h-20 bg-red-600 transform rotate-45 translate-x-10 -translate-y-10"></div>
        
        <div className="bg-black p-10 h-full relative z-10 border border-zinc-800">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-oswald text-2xl uppercase">Monthly</h3>
              <p className="text-zinc-300 text-xs font-mono uppercase mt-1">Cancel Anytime</p>
            </div>
            <Star className="w-6 h-6 text-red-600 fill-current" />
          </div>

          <div className="mb-10 flex items-baseline">
            <span className="text-5xl font-oswald font-bold text-white">$9.99</span>
            <span className="text-zinc-300 ml-2">/ month</span>
          </div>

          <ul className="space-y-4 mb-10">
            {[
              "Unlimited Estimates",
              "AI Auto-Fill (Gemini 2.5)",
              "Local Rate Intelligence",
              "PDF Invoice Generation",
              "Member Portal with Business Profile",
              "Access to 'The Manual' Best Practices"
            ].map((item, i) => (
              <li key={i} className="flex items-center text-sm text-zinc-200">
                <Check className="w-4 h-4 text-red-600 mr-3 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <a 
            href="https://square.link/u/FEiU849H"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white text-black font-oswald font-bold uppercase tracking-widest py-4 hover:bg-red-600 hover:text-white transition-all duration-300 block text-center cursor-pointer"
          >
            Subscribe Now
          </a>
          
          <div className="mt-4 flex flex-col items-center space-y-2">
            <p className="text-center text-[10px] text-zinc-400 uppercase tracking-wider">
                Secure processing via Square
            </p>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center">
                 <RotateCw className="w-3 h-3 mr-1" /> You will be redirected after payment
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full max-w-4xl">
        <div className="text-center p-6 border border-zinc-800 bg-zinc-900">
          <Zap className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <h4 className="font-oswald uppercase mb-2 text-white">Faster Workflow</h4>
          <p className="text-xs text-zinc-300">Stop guessing rates. Get accurate estimates out in minutes, not hours.</p>
        </div>
        <div className="text-center p-6 border border-zinc-800 bg-zinc-900">
          <Shield className="w-8 h-8 mx-auto mb-4 text-white" />
          <h4 className="font-oswald uppercase mb-2 text-white">Professionalism</h4>
          <p className="text-xs text-zinc-300">Send invoices that look like they came from a studio, not a spreadsheet.</p>
        </div>
        <div className="text-center p-6 border border-zinc-800 bg-zinc-900">
          <Star className="w-8 h-8 mx-auto mb-4 text-white" />
          <h4 className="font-oswald uppercase mb-2 text-white">Education</h4>
          <p className="text-xs text-zinc-300">Continuous learning resources to help you level up your production game.</p>
        </div>
      </div>

      {/* Developer Testing Controls */}
      <div className="mt-12 border-t border-dashed border-zinc-800 pt-8 text-center w-full max-w-xl">
         <h5 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-center mb-4">
            <FlaskConical className="w-3 h-3 mr-2" /> Developer / Testing Mode
         </h5>
         
         <div className="flex flex-col gap-3 items-center">
             {/* Instant Unlock (No Reload) */}
            <button 
              onClick={() => onSimulateSuccess && onSimulateSuccess()}
              className="w-full bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white text-[10px] font-mono py-2 px-4 rounded border border-transparent hover:border-zinc-800 transition-colors"
            >
              Debug: Instant State Unlock
            </button>
         </div>
      </div>

    </div>
  );
};
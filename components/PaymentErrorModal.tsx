import React from 'react';
import { AlertTriangle, ArrowRight, XCircle, HelpCircle } from 'lucide-react';

interface PaymentErrorModalProps {
  onClose: () => void;
  isPro: boolean;
}

export const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({ onClose, isPro }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm" />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-black border-2 border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Decor */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <AlertTriangle className="w-32 h-32 text-zinc-500" />
        </div>

        <div className="p-10 relative z-10 flex flex-col items-center text-center">
            
            {/* Icon */}
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-700 group">
                <XCircle className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />
            </div>

            <div className="space-y-4 mb-8">
                <h2 className="text-3xl font-oswald font-bold uppercase text-white">
                    Transaction <span className="text-red-600">Interrupted</span>
                </h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  The payment process was cancelled or could not be completed at this time. No charges were applied.
                </p>
                
                {isPro && (
                    <div className="mt-4 bg-zinc-900/50 border border-zinc-700 p-3 rounded flex items-start text-left">
                        <HelpCircle className="w-4 h-4 text-zinc-400 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-zinc-300">
                            <span className="font-bold text-white uppercase">Note:</span> Your existing Pro membership is still active. You maintain full access to the studio tools.
                        </p>
                    </div>
                )}
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-white hover:bg-zinc-200 text-black font-oswald font-bold uppercase tracking-widest py-4 transition-all duration-300 flex items-center justify-center group"
            >
                Return to Studio <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
        
        {/* Footer Code */}
        <div className="bg-zinc-900 p-2 text-center border-t border-zinc-800">
            <code className="text-[9px] text-zinc-500 font-mono">ERR_PAYMENT_ABORTED</code>
        </div>
      </div>
    </div>
  );
};
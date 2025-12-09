import React, { useState } from 'react';
import { DollarSign, Users, Copy, Check, ShieldCheck } from 'lucide-react';

export const AffiliateView: React.FC = () => {
  const [viewState, setViewState] = useState<'intro' | 'signup' | 'dashboard'>('intro');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    socials: ''
  });

  // TODO: Replace with your Google Apps Script Web App URL
  // Setup Guide: Create a Google Sheet > Extensions > Apps Script > Deploy as Web App > set access to "Anyone"
  const GOOGLE_SCRIPT_URL = ''; 

  const referralLink = "https://shooteditrelease.com/?ref=VID-8829";

  const handleStart = () => {
    setViewState('signup');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        if (GOOGLE_SCRIPT_URL) {
            const formBody = new FormData();
            formBody.append('name', formData.name);
            formBody.append('email', formData.email);
            formBody.append('phone', formData.phone);
            formBody.append('website', formData.website);
            formBody.append('socials', formData.socials);
            formBody.append('timestamp', new Date().toISOString());

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formBody,
                mode: 'no-cors' // Required for Google Apps Script Web App
            });
        } else {
            console.log("Google Sheet URL not configured. Simulating submission:", formData);
        }
    } catch (error) {
        console.error("Error submitting to sheet:", error);
    } finally {
        setTimeout(() => {
            setIsSubmitting(false);
            setViewState('dashboard');
        }, 1000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="bg-black text-white border border-zinc-800 text-[10px] font-bold uppercase px-3 py-1 tracking-[0.2em] mb-4 inline-block">
          Partner Program
        </span>
        <h1 className="text-6xl md:text-8xl font-oswald font-bold uppercase text-white mb-6">
          The <span className="text-red-600">Alliance</span>
        </h1>
        <p className="text-zinc-300 max-w-xl mx-auto text-lg">
          Empower your fellow filmmakers. Earn recurring revenue for every creator you bring into the ecosystem.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-900/30">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="font-oswald text-2xl uppercase mb-2 text-white">20% Commission</h3>
          <p className="text-sm text-zinc-300">Earn on every subscription payment for the lifetime of the customer.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-oswald text-2xl uppercase mb-2 text-white">Grow the Community</h3>
          <p className="text-sm text-zinc-300">Help standardize professional rates and practices across the industry.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-oswald text-2xl uppercase mb-2 text-white">Monthly Payouts</h3>
          <p className="text-sm text-zinc-300">Reliable transfers via Stripe or PayPal on the 1st of every month.</p>
        </div>
      </div>

      {/* Generator Section */}
      <div className="max-w-3xl mx-auto bg-black text-white p-1 relative overflow-hidden shadow-2xl border border-zinc-800">
         <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 transform rotate-45 translate-x-16 -translate-y-16"></div>
         
         <div className="bg-zinc-950 p-10 relative z-10">
            {viewState === 'intro' && (
              <div className="text-center py-8">
                 <h2 className="text-3xl font-oswald uppercase mb-4 text-white">Activate Your Link</h2>
                 <p className="text-zinc-300 mb-8 max-w-md mx-auto">Join 1,200+ videographers earning side income. It takes less than 30 seconds to start.</p>
                 <button 
                  onClick={handleStart}
                  className="bg-white text-black hover:bg-red-600 hover:text-white px-8 py-4 font-oswald font-bold uppercase tracking-widest text-sm transition-all duration-300"
                 >
                   Join The Alliance
                 </button>
              </div>
            )}

            {viewState === 'signup' && (
               <div className="max-w-md mx-auto">
                   <div className="mb-6 text-center">
                       <h2 className="text-2xl font-oswald uppercase mb-2 text-white">Partner Application</h2>
                       <p className="text-xs text-zinc-400 font-mono">Verify your identity to generate your tracking ID.</p>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Full Name</label>
                               <input 
                                   required
                                   type="text" 
                                   value={formData.name}
                                   onChange={e => setFormData({...formData, name: e.target.value})}
                                   className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none transition-colors placeholder-zinc-500"
                                   placeholder="Jane Doe"
                                   disabled={isSubmitting}
                               />
                           </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Phone</label>
                               <input 
                                   required
                                   type="tel" 
                                   value={formData.phone}
                                   onChange={e => setFormData({...formData, phone: e.target.value})}
                                   className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none transition-colors placeholder-zinc-500"
                                   placeholder="+1 (555) 000-0000"
                                   disabled={isSubmitting}
                               />
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Email Address</label>
                           <input 
                               required
                               type="email" 
                               value={formData.email}
                               onChange={e => setFormData({...formData, email: e.target.value})}
                               className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none transition-colors placeholder-zinc-500"
                               placeholder="jane@production.com"
                               disabled={isSubmitting}
                           />
                       </div>

                       <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Website / Portfolio</label>
                           <input 
                               required
                               type="url" 
                               value={formData.website}
                               onChange={e => setFormData({...formData, website: e.target.value})}
                               className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none transition-colors placeholder-zinc-500"
                               placeholder="https://..."
                               disabled={isSubmitting}
                           />
                       </div>

                       <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Social Media Links</label>
                           <textarea 
                               required
                               value={formData.socials}
                               onChange={e => setFormData({...formData, socials: e.target.value})}
                               className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none transition-colors h-20 resize-none placeholder-zinc-500"
                               placeholder="Instagram, YouTube, LinkedIn..."
                               disabled={isSubmitting}
                           />
                       </div>

                       <button 
                           type="submit"
                           disabled={isSubmitting}
                           className="w-full bg-white text-black hover:bg-red-600 hover:text-white px-8 py-4 font-oswald font-bold uppercase tracking-widest text-sm transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           {isSubmitting ? 'Processing...' : 'Complete Application'}
                       </button>
                   </form>
               </div>
            )}

            {viewState === 'dashboard' && (
              <div className="py-4 animate-in fade-in duration-500">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-oswald uppercase text-white">Your Unique URL</h2>
                    <span className="text-green-500 text-xs font-mono uppercase tracking-widest flex items-center">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                       Active
                    </span>
                 </div>
                 
                 <div className="bg-black border border-zinc-800 p-4 flex items-center justify-between mb-8 group hover:border-red-600 transition-colors cursor-pointer" onClick={handleCopy}>
                    <code className="text-zinc-200 font-mono text-lg truncate flex-grow mr-4 select-all">{referralLink}</code>
                    <button 
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                 </div>

                 <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-8">
                    <div className="text-center">
                       <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Clicks</div>
                       <div className="text-2xl font-oswald text-white">0</div>
                    </div>
                    <div className="text-center border-l border-zinc-800">
                       <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Signups</div>
                       <div className="text-2xl font-oswald text-white">0</div>
                    </div>
                     <div className="text-center border-l border-zinc-800">
                       <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Pending</div>
                       <div className="text-2xl font-oswald text-red-600">$0.00</div>
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
                    <p className="text-zinc-400 text-xs font-mono uppercase">Registered to: {formData.name}</p>
                 </div>
              </div>
            )}
         </div>
      </div>
      
      {/* Terms */}
      <div className="text-center mt-12">
        <p className="text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed">
           By participating in the Affiliate Program, you agree to our Terms of Service. 
           Payouts are processed on the 1st of every month via PayPal or Stripe. 
           Minimum payout threshold is $50.00.
        </p>
      </div>
    </div>
  );
};
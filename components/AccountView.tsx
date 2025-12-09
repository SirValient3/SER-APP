import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Save, Building2, CreditCard, Mail, Phone, MapPin, CheckCircle2, LogOut, ShieldAlert } from 'lucide-react';

interface AccountViewProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onLogout?: () => void;
  onDowngrade?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ userProfile, onSave, onLogout, onDowngrade }) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-6">
        <div>
           <span className="bg-black text-white border border-zinc-800 text-[10px] font-bold uppercase px-3 py-1 tracking-[0.2em] mb-4 inline-block">
             Pro Member
           </span>
           <h1 className="text-4xl font-oswald font-bold uppercase text-white">
             Studio <span className="text-red-600">Portal</span>
           </h1>
           <p className="text-zinc-300 mt-2 text-sm font-mono">
             Manage your business identity. These details will auto-fill on all new estimates.
           </p>
        </div>
        
        {onLogout && (
            <button 
                onClick={onLogout}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-red-600 transition-colors"
            >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
         {/* Identity Column */}
         <div className="space-y-8">
            <div className="bg-zinc-900 p-6 border-l-2 border-red-600 border-t border-r border-b border-zinc-800">
               <h3 className="text-lg font-oswald uppercase mb-6 flex items-center text-white">
                  <Building2 className="w-5 h-5 mr-3 text-red-600" /> Business Identity
               </h3>
               
               <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1">Business Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                    />
                  </div>
                   <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1">Logo URL</label>
                    <input 
                      type="url" 
                      value={formData.businessLogo}
                      onChange={(e) => setFormData({...formData, businessLogo: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1">Checks Payable To</label>
                    <input 
                      type="text" 
                      value={formData.payableTo}
                      onChange={(e) => setFormData({...formData, payableTo: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                    />
                  </div>
               </div>
            </div>

            <div className="bg-zinc-900 p-6 border-l-2 border-zinc-500 border-t border-r border-b border-zinc-800">
               <h3 className="text-lg font-oswald uppercase mb-6 flex items-center text-white">
                  <CreditCard className="w-5 h-5 mr-3 text-zinc-300" /> Payments
               </h3>
               <div className="group">
                  <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1">Default Payment Link (Stripe/PayPal)</label>
                  <input 
                    type="url" 
                    value={formData.paymentLink}
                    onChange={(e) => setFormData({...formData, paymentLink: e.target.value})}
                    className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                    placeholder="https://stripe.com/..."
                  />
               </div>
            </div>
         </div>

         {/* Contact Column */}
         <div className="space-y-8">
            <div className="bg-zinc-900 p-6 border-l-2 border-white border-t border-r border-b border-zinc-800">
               <h3 className="text-lg font-oswald uppercase mb-6 flex items-center text-white">
                  <Mail className="w-5 h-5 mr-3 text-white" /> Contact Details
               </h3>
               
               <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Mailing Address
                    </label>
                    <textarea 
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors h-24 resize-none placeholder-zinc-500"
                      placeholder="123 Studio Blvd&#10;Los Angeles, CA 90028"
                    />
                  </div>
                   <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                         <Mail className="w-3 h-3 mr-1" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                        <Phone className="w-3 h-3 mr-1" /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={formData.businessPhone}
                      onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
                      className="w-full bg-zinc-800 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                    />
                  </div>
               </div>
            </div>
            
            <div className="bg-red-950/20 p-6 border border-red-900/50">
               <h3 className="text-lg font-oswald uppercase mb-4 flex items-center text-red-500">
                  <ShieldAlert className="w-5 h-5 mr-3 text-red-600" /> Plan Management
               </h3>
               <div className="flex justify-between items-center">
                   <div className="text-xs text-red-400">
                       Current Status: <span className="font-bold uppercase">Pro Active</span>
                   </div>
                   {onDowngrade && (
                       <button 
                         type="button"
                         onClick={onDowngrade}
                         className="text-red-600 hover:text-red-500 text-[10px] uppercase font-bold tracking-widest border-b border-red-600 hover:border-red-500"
                       >
                           Cancel Subscription
                       </button>
                   )}
               </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-oswald font-bold uppercase tracking-widest py-4 text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
            >
                {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                <span>{saved ? 'Settings Saved' : 'Save Studio Profile'}</span>
            </button>
         </div>
      </form>
    </div>
  );
};
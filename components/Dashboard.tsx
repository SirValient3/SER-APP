import React from 'react';
import { Plus, ArrowRight, Activity, Zap, FileText, Lock, Infinity } from 'lucide-react';

interface DashboardProps {
  onNewProject: () => void;
  projectCount: number;
  maxProjects: number;
  isPro: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewProject, projectCount, maxProjects, isPro }) => {
  const isLimitReached = !isPro && projectCount >= maxProjects;
  const remaining = Math.max(0, maxProjects - projectCount);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col items-center justify-center text-center mb-24">
        <div className="inline-block px-4 py-1 border border-zinc-800 rounded-full mb-6 bg-zinc-900">
           <span className="text-red-600 text-xs font-mono font-bold tracking-[0.2em] uppercase">The Modern Production Suite</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-oswald font-bold tracking-tighter uppercase mb-6 text-white">
          Shoot<span className="text-red-600">.</span>Edit<span className="text-red-600">.</span><br/>Release<span className="text-red-600">.</span>
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl font-light tracking-wide">
          AI-fueled estimation for the relentless creator. <br/>
          Calculate costs. Generate invoices. Get paid.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* New Project Card */}
        <button 
          onClick={onNewProject}
          className={`group relative h-80 w-full overflow-hidden bg-zinc-900 border transition-all duration-500 text-left ${
            isLimitReached 
              ? 'border-zinc-800 hover:border-zinc-700' 
              : 'border-zinc-800 hover:border-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
             isLimitReached ? 'from-zinc-800 to-transparent' : 'from-red-900/20 to-transparent'
          }`}></div>
          
          <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
             {isLimitReached ? (
                <Lock className="w-48 h-48 text-white" />
             ) : (
                <Plus className="w-48 h-48 text-white transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />
             )}
          </div>

          <div className="relative h-full p-10 flex flex-col justify-between z-10">
            <div>
               <div className={`w-12 h-12 text-white flex items-center justify-center mb-6 shadow-md ${isLimitReached ? 'bg-zinc-800' : 'bg-red-600'}`}>
                 {isLimitReached ? <Lock className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
               </div>
               <h2 className="text-4xl font-oswald font-bold uppercase mb-2 text-white">New Estimate</h2>
               <div className="flex items-center space-x-2">
                 <p className="text-zinc-300 font-mono text-sm">
                   {isLimitReached 
                     ? 'Free plan limit reached.' 
                     : isPro 
                        ? 'Create unlimited professional estimates.'
                        : 'Initiate new budget sequence.'}
                 </p>
               </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div className={`flex items-center font-bold uppercase tracking-widest text-sm transition-colors ${
                isLimitReached ? 'text-zinc-400' : 'text-red-600 group-hover:text-white'
              }`}>
                {isLimitReached ? 'Unlock Pro' : 'Start'} 
                <ArrowRight className="w-4 h-4 ml-4 transform group-hover:translate-x-2 transition-transform" />
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
                    {isPro ? 'Access Level' : 'Free Credits'}
                </span>
                <span className={`font-mono text-lg font-bold flex items-center justify-end ${remaining === 0 && !isPro ? 'text-red-600' : 'text-white'}`}>
                  {isPro ? (
                      <>
                        <Infinity className="w-5 h-5 mr-2 text-red-600" />
                        <span className="text-red-600">UNLIMITED</span>
                      </>
                  ) : (
                      `${remaining} / ${maxProjects}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Coming Soon Card */}
        <div className="relative h-80 w-full bg-black border border-zinc-900 p-10 flex flex-col justify-between opacity-70 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0">
           <div className="absolute top-0 right-0 bg-zinc-900 px-4 py-2 border-l border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-400 uppercase">Offline</span>
           </div>
           
           <div>
              <div className="w-12 h-12 border border-zinc-800 text-zinc-500 flex items-center justify-center mb-6 bg-zinc-900">
                 <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-oswald font-bold uppercase text-zinc-600 mb-2">Archive</h2>
              <p className="text-zinc-400 font-mono text-sm">Past operations database.</p>
           </div>
           
           <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest border-t border-zinc-900 pt-4">
              Module Locked
           </div>
        </div>
      </div>

      <div className="mt-24 border-t border-zinc-900 pt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
         <div className="space-y-4">
            <Zap className="w-8 h-8 text-red-600" />
            <h3 className="text-xl font-oswald uppercase text-white">Local Rate Intelligence</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Real-time market analysis for crew and gear rates in your specific geolocation.
            </p>
         </div>
         <div className="space-y-4">
            <Activity className="w-8 h-8 text-white" />
            <h3 className="text-xl font-oswald uppercase text-white">Contextual Analysis</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Describe the vision. Our system breaks it down into actionable line items instantly.
            </p>
         </div>
         <div className="space-y-4">
            <div className="w-8 h-8 border-2 border-white rounded-full"></div>
            <h3 className="text-xl font-oswald uppercase text-white">Rapid Invoicing</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              From estimate to PDF invoice in a single click. Clean, professional, paid.
            </p>
         </div>
      </div>
    </div>
  );
};
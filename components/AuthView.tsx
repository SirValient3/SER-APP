import React, { useState } from 'react';
import { Camera, ArrowRight, Lock, Mail, User, Check } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, name: string | undefined, rememberMe: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin(formData.email, formData.name, rememberMe);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-black font-sans selection:bg-red-600 selection:text-white">
      {/* Left / Top Branding Side */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden items-center justify-center p-12 border-r border-zinc-900">
         {/* Background pattern or image */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 blur-[150px] opacity-10 rounded-full pointer-events-none"></div>
         
         <div className="relative z-10 max-w-lg">
             <div className="mb-8 flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-600 flex items-center justify-center transform hover:rotate-3 transition-transform duration-500">
                   <Camera className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl font-oswald font-bold text-white uppercase tracking-tighter">
                  Shoot<span className="text-red-600">.</span>Edit<span className="text-red-600">.</span><br/>Release<span className="text-red-600">.</span>
                </h1>
             </div>
             <p className="text-xl text-zinc-300 font-light leading-relaxed mb-8">
               The definitive operating system for modern videographers. Estimate accurately. Invoice instantly. Get paid faster.
             </p>
             <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <span>// Ai-Powered</span>
                <span>// Cloud Sync</span>
                <span>// Rate Intelligence</span>
             </div>
         </div>
      </div>

      {/* Right / Bottom Form Side */}
      <div className="w-full lg:w-1/2 bg-black flex flex-col items-center justify-center p-8 md:p-12 relative">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Mobile Header */}
             <div className="lg:hidden mb-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 mb-4">
                   <Camera className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-oswald font-bold text-white uppercase">
                  S<span className="text-red-600">.</span>E<span className="text-red-600">.</span>R<span className="text-red-600">.</span>
                </h1>
             </div>

             <div className="mb-8">
                <h2 className="text-3xl font-oswald font-bold text-white uppercase mb-2">
                   {isLogin ? 'Welcome Back' : 'Join the Studio'}
                </h2>
                <p className="text-zinc-300 text-sm">
                   {isLogin ? 'Enter your credentials to access your workspace.' : 'Create your professional profile today.'}
                </p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Full Name</label>
                      <div className="relative group">
                         <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                         <input 
                           type="text" 
                           required
                           className="w-full pl-10 pr-4 py-3 bg-zinc-900 border-b-2 border-zinc-800 focus:border-red-600 outline-none text-sm font-medium transition-colors placeholder-zinc-500 text-white"
                           placeholder="Director Name"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                   </div>
                )}

                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Email Address</label>
                   <div className="relative group">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border-b-2 border-zinc-800 focus:border-red-600 outline-none text-sm font-medium transition-colors placeholder-zinc-500 text-white"
                        placeholder="studio@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <div className="flex justify-between">
                      <label className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">Password</label>
                      {isLogin && <button type="button" className="text-[10px] text-red-600 hover:text-white font-bold uppercase tracking-wider transition-colors">Forgot?</button>}
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                      <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border-b-2 border-zinc-800 focus:border-red-600 outline-none text-sm font-medium transition-colors placeholder-zinc-500 text-white"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                   </div>
                </div>

                {isLogin && (
                   <div className="flex items-center space-x-2">
                       <button
                         type="button"
                         onClick={() => setRememberMe(!rememberMe)}
                         className={`w-4 h-4 flex items-center justify-center border rounded-sm transition-colors ${rememberMe ? 'bg-red-600 border-red-600' : 'bg-transparent border-zinc-700 hover:border-zinc-500'}`}
                       >
                           {rememberMe && <Check className="w-3 h-3 text-white" />}
                       </button>
                       <label 
                         onClick={() => setRememberMe(!rememberMe)}
                         className="text-xs text-zinc-300 cursor-pointer select-none hover:text-zinc-200"
                       >
                         Remember me for 7 days
                       </label>
                   </div>
                )}

                <button 
                   type="submit" 
                   disabled={isLoading}
                   className="w-full bg-white text-black hover:bg-red-600 hover:text-white py-4 font-oswald font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                   {isLoading ? (
                      <span className="animate-pulse">Processing...</span>
                   ) : (
                      <>
                         {isLogin ? 'Enter Studio' : 'Create Account'}
                         <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                   )}
                </button>
             </form>

             <div className="mt-8 pt-8 border-t border-zinc-900 text-center">
                <p className="text-xs text-zinc-300">
                   {isLogin ? "Don't have an account?" : "Already have a workspace?"}
                   <button 
                      onClick={() => { setIsLogin(!isLogin); setFormData({name: '', email: '', password: ''}); }}
                      className="ml-2 font-bold text-white hover:text-red-600 uppercase tracking-wider underline decoration-zinc-700 hover:decoration-red-600 underline-offset-4 transition-all"
                   >
                      {isLogin ? 'Sign Up' : 'Log In'}
                   </button>
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};
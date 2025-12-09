import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Camera, BookOpen, Crown, Users, Settings, Bot, X, Menu, Home, PenTool } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeView: 'dashboard' | 'editor' | 'invoice' | 'guide' | 'subscription' | 'affiliate' | 'account';
  onChangeView: (view: 'dashboard' | 'editor' | 'invoice' | 'guide' | 'subscription' | 'affiliate' | 'account') => void;
  isPro: boolean;
}

const MOTIVATIONAL_QUOTES = [
  "Organization is the blueprint of wealth.",
  "Every line item is a promise kept. We are building trust.",
  "The community grows when we all value our time correctly.",
  "Don't leave money on the table. Capture every expense.",
  "A detailed estimate protects you and the client.",
  "Profit is not a dirty word. It's sustainability.",
  "Your creativity deserves a professional foundation.",
  "Shoot with passion. Edit with precision. Release for profit.",
  "Standardize your rates. Elevate the industry.",
  "Clear communication equals faster payment."
];

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView, isPro }) => {
  const [quote, setQuote] = useState('');
  const [showQuote, setShowQuote] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pro Motivator Logic (Global)
  useEffect(() => {
    if (!isPro) return;

    const showNewQuote = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
        setShowQuote(true);
        hideTimerRef.current = setTimeout(() => {
            setShowQuote(false);
        }, 8000);
    };

    const initialTimer = setTimeout(showNewQuote, 5000);
    const interval = setInterval(showNewQuote, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPro]);

  const handleNavClick = (view: any) => {
      onChangeView(view);
      setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-red-600 selection:text-white relative">
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="font-oswald font-bold text-2xl tracking-wider uppercase text-white hidden md:inline">
              Shoot<span className="text-red-600">.Edit</span>.Release<span className="text-red-600">.</span>
            </span>
             <span className="font-oswald font-bold text-xl tracking-wider uppercase text-white md:hidden">
              S<span className="text-red-600">.E</span>.R<span className="text-red-600">.</span>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
                onClick={() => onChangeView('dashboard')}
                className={`font-oswald text-sm font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                  activeView === 'dashboard' ? 'text-red-600 border-red-600' : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-700'
                }`}
            >
                Dashboard
            </button>
            <button 
                onClick={() => onChangeView('editor')}
                className={`font-oswald text-sm font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                  activeView === 'editor' ? 'text-red-600 border-red-600' : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-700'
                }`}
            >
                Editor
            </button>

            <button 
               onClick={() => onChangeView('guide')}
               className={`flex items-center font-oswald text-sm font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                  activeView === 'guide' ? 'text-red-600 border-red-600' : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-700'
                }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              The Manual
            </button>

            {!isPro && (
               <button 
                 onClick={() => onChangeView('affiliate')}
                 className={`flex items-center font-oswald text-sm font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                    activeView === 'affiliate' ? 'text-red-600 border-red-600' : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-700'
                  }`}
               >
                <Users className="w-4 h-4 mr-2" />
                Partners
               </button>
            )}
            
            {isPro ? (
               <button 
                onClick={() => onChangeView('account')}
                className={`flex items-center font-oswald text-sm font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                    activeView === 'account' ? 'text-red-600 border-red-600' : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-700'
                  }`}
               >
                 <Settings className="w-4 h-4 mr-2" />
                 Portal
               </button>
            ) : (
              <button 
                onClick={() => onChangeView('subscription')}
                className="flex items-center bg-white text-black hover:bg-red-600 hover:text-white px-4 py-2 font-oswald uppercase text-xs font-bold tracking-widest transition-colors duration-300"
              >
                <Crown className="w-3 h-3 mr-2" />
                Go Pro
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-red-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
             {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-md md:hidden pt-24 px-6 animate-in slide-in-from-top-10 duration-300">
              <nav className="flex flex-col space-y-6">
                  <button onClick={() => handleNavClick('dashboard')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-white hover:text-red-600">
                      <Home className="w-6 h-6" /> <span>Dashboard</span>
                  </button>
                  <button onClick={() => handleNavClick('editor')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-white hover:text-red-600">
                      <PenTool className="w-6 h-6" /> <span>Editor</span>
                  </button>
                  <button onClick={() => handleNavClick('guide')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-white hover:text-red-600">
                      <BookOpen className="w-6 h-6" /> <span>The Manual</span>
                  </button>
                  <hr className="border-zinc-800" />
                  {!isPro ? (
                      <>
                        <button onClick={() => handleNavClick('affiliate')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-white hover:text-red-600">
                            <Users className="w-6 h-6" /> <span>Partners</span>
                        </button>
                        <button onClick={() => handleNavClick('subscription')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-black bg-white p-4 justify-center">
                            <Crown className="w-6 h-6 mr-2" /> <span>Upgrade to Pro</span>
                        </button>
                      </>
                  ) : (
                      <button onClick={() => handleNavClick('account')} className="flex items-center space-x-4 text-xl font-oswald uppercase tracking-widest text-white hover:text-red-600">
                          <Settings className="w-6 h-6" /> <span>Account Portal</span>
                      </button>
                  )}
              </nav>
          </div>
      )}

      <main className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {children}
      </main>

      <footer className="bg-black border-t border-zinc-900 py-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-4">
            © {new Date().getFullYear()} Shoot.Edit.Release // System V.2.1
          </p>
          <div className="flex justify-center space-x-6 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
             <button onClick={() => onChangeView('affiliate')} className="hover:text-red-600">Affiliate Program</button>
             <button className="hover:text-white">Terms of Service</button>
             <button className="hover:text-white">Privacy Policy</button>
          </div>
        </div>
      </footer>

      {/* Global SER.0 Motivator Bubble (Pro Only) */}
      <div className={`fixed bottom-12 right-12 z-[90] max-w-xs transition-all duration-700 transform ${showQuote ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-zinc-900 border-l-4 border-red-600 p-4 shadow-2xl shadow-red-900/20 relative rounded-sm">
            <div className="absolute -top-2 right-4 w-4 h-4 bg-zinc-900 border-t border-l border-zinc-800 transform rotate-45"></div>
            <div className="flex items-start space-x-3">
                <div className="bg-red-600 p-1.5 rounded-sm shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">SER.0 says:</h4>
                    <p className="text-sm text-white font-medium italic leading-relaxed">"{quote}"</p>
                </div>
            </div>
             <button onClick={() => setShowQuote(false)} className="absolute top-2 right-2 text-zinc-400 hover:text-white transition-colors">
                <X className="w-3 h-3" />
            </button>
        </div>
      </div>
    </div>
  );
};
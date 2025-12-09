import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Estimator } from './components/Estimator';
import { InvoiceView } from './components/InvoiceView';
import { BestPractices } from './components/BestPractices';
import { SubscriptionView } from './components/SubscriptionView';
import { AffiliateView } from './components/AffiliateView';
import { AccountView } from './components/AccountView';
import { AuthView } from './components/AuthView';
import { ProActivationModal } from './components/ProActivationModal';
import { PaymentErrorModal } from './components/PaymentErrorModal';
import { Estimate, UserProfile } from './types';

const INITIAL_ESTIMATE: Estimate = {
  id: 'EST-001',
  details: {
    clientName: '',
    projectName: '',
    projectDate: new Date().toISOString().split('T')[0],
    location: '',
    email: '',
    phone: '',
    notes: '',
    paymentLink: '',
    businessName: 'Shoot.Edit.Release',
    businessLogo: '',
    payableTo: '',
    businessAddress: '',
    businessEmail: '',
    businessPhone: ''
  },
  items: [],
  markupPercent: 10,
  taxPercent: 0,
  currency: 'USD',
  createdAt: Date.now()
};

const MAX_FREE_PROJECTS = 2;

type ViewState = 'dashboard' | 'editor' | 'invoice' | 'guide' | 'subscription' | 'affiliate' | 'account';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
      // 1. Check Session Storage (Short term - expires when tab closes)
      if (sessionStorage.getItem('ser_is_authenticated') === 'true') {
          return true;
      }

      // 2. Check Local Storage (Long term)
      const localAuth = localStorage.getItem('ser_is_authenticated');
      const expiry = localStorage.getItem('ser_auth_expiry');

      if (localAuth === 'true') {
          // If we have an expiry date, check it
          if (expiry) {
              const expiryTime = parseInt(expiry, 10);
              if (Date.now() > expiryTime) {
                  // Expired: Clear credentials
                  localStorage.removeItem('ser_is_authenticated');
                  localStorage.removeItem('ser_auth_expiry');
                  return false;
              }
              // Valid
              return true;
          }
          // Legacy or permanent support: if no expiry set but auth is true, allow it.
          return true;
      }
      return false;
  });

  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [estimate, setEstimate] = useState<Estimate>(INITIAL_ESTIMATE);
  
  // Persist Pro Status
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('ser_is_pro') === 'true';
  });
  
  // Track project count for free tier limit
  const [projectCount, setProjectCount] = useState<number>(() => {
    const saved = localStorage.getItem('ser_project_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  // User Profile persistence for Pro members
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ser_user_profile');
    return saved ? JSON.parse(saved) : {
        businessName: '',
        businessLogo: '',
        payableTo: '',
        businessAddress: '',
        businessEmail: '',
        businessPhone: '',
        paymentLink: ''
    };
  });
  
  // Modal States
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Define Success Handler
  const handlePaymentSuccess = useCallback(() => {
    // 1. Unlock Pro Features
    setIsPro(true);
    localStorage.setItem('ser_is_pro', 'true');
    
    // 2. Ensure User is Authenticated (Bypass login if they just paid)
    // For payments, we'll default to persistent storage so they don't lose access immediately
    setIsAuthenticated(true);
    localStorage.setItem('ser_is_authenticated', 'true');
    localStorage.removeItem('ser_auth_expiry'); // Permanent for pro activation momentarily

    // 3. Show Success UI
    setShowActivationModal(true);
    setActiveView('account');
    
    // 4. Clean up URL cleanly without reload
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'success') {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);
    }
  }, []);

  // Webhook / Payment URL Listener
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');

    if (paymentStatus === 'success') {
        handlePaymentSuccess();
    } 
    else if (paymentStatus === 'error' || paymentStatus === 'cancel') {
        setShowErrorModal(true);
        // Clean up URL
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);
    }
  }, [handlePaymentSuccess]);

  const handleUpdateProfile = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('ser_user_profile', JSON.stringify(profile));
  };

  const handleLogin = (email: string, name: string | undefined, rememberMe: boolean) => {
      setIsAuthenticated(true);
      
      if (rememberMe) {
          // Store in LocalStorage with 7 day expiry
          localStorage.setItem('ser_is_authenticated', 'true');
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem('ser_auth_expiry', (Date.now() + sevenDaysMs).toString());
          
          // Clear session to avoid conflicts
          sessionStorage.removeItem('ser_is_authenticated');
      } else {
          // Store in SessionStorage (clears when tab closes)
          sessionStorage.setItem('ser_is_authenticated', 'true');
          
          // Clear local storage
          localStorage.removeItem('ser_is_authenticated');
          localStorage.removeItem('ser_auth_expiry');
      }

      // Auto-fill business name on signup if empty
      if (name && !userProfile.businessName) {
          const updated = { ...userProfile, businessName: name };
          setUserProfile(updated);
          localStorage.setItem('ser_user_profile', JSON.stringify(updated));
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('ser_is_authenticated');
      localStorage.removeItem('ser_auth_expiry');
      sessionStorage.removeItem('ser_is_authenticated');
      setActiveView('dashboard');
  };

  // Simulates cancelling the subscription
  const handleDowngrade = () => {
    if (window.confirm("Are you sure you want to cancel your Pro membership? You will lose access to premium features.")) {
        setIsPro(false);
        localStorage.removeItem('ser_is_pro');
        setActiveView('dashboard');
    }
  };

  const handleNewProject = () => {
    // Check limit
    if (projectCount >= MAX_FREE_PROJECTS && !isPro) {
      setActiveView('subscription');
      return;
    }

    // Increment and save
    const newCount = projectCount + 1;
    setProjectCount(newCount);
    localStorage.setItem('ser_project_count', newCount.toString());

    // Create new estimate, auto-filling details if Pro
    const defaults = isPro ? {
        businessName: userProfile.businessName || 'Shoot.Edit.Release',
        businessLogo: userProfile.businessLogo,
        payableTo: userProfile.payableTo,
        businessAddress: userProfile.businessAddress,
        businessEmail: userProfile.businessEmail,
        businessPhone: userProfile.businessPhone,
        paymentLink: userProfile.paymentLink
    } : {
        businessName: 'Shoot.Edit.Release',
        businessLogo: '',
        payableTo: '',
        businessAddress: '',
        businessEmail: '',
        businessPhone: '',
        paymentLink: ''
    };

    setEstimate({
      ...INITIAL_ESTIMATE,
      id: `EST-${Math.floor(Math.random() * 10000)}`,
      details: {
          ...INITIAL_ESTIMATE.details,
          ...defaults
      },
      createdAt: Date.now()
    });
    setActiveView('editor');
  };

  const handleSubscribe = () => {
      // In a real flow, this is handled by the redirect listener above.
      console.log("Redirecting to payment provider...");
  };

  // If not authenticated, we normally show AuthView.
  if (!isAuthenticated) {
      return <AuthView onLogin={handleLogin} />;
  }

  return (
    <>
      {showActivationModal && (
        <ProActivationModal onClose={() => setShowActivationModal(false)} />
      )}
      
      {showErrorModal && (
        <PaymentErrorModal 
            onClose={() => {
                setShowErrorModal(false);
                // Return to dashboard or account depending on status
                setActiveView(isPro ? 'account' : 'dashboard');
            }} 
            isPro={isPro}
        />
      )}

      {activeView === 'invoice' ? (
        <InvoiceView 
          estimate={estimate} 
          onBack={() => setActiveView('editor')} 
        />
      ) : (
        <Layout activeView={activeView} onChangeView={setActiveView} isPro={isPro}>
          {activeView === 'dashboard' && (
            <Dashboard 
              onNewProject={handleNewProject} 
              projectCount={projectCount}
              maxProjects={MAX_FREE_PROJECTS}
              isPro={isPro}
            />
          )}
          {activeView === 'editor' && (
            <Estimator 
              estimate={estimate} 
              setEstimate={setEstimate} 
              onViewInvoice={() => setActiveView('invoice')}
              isPro={isPro}
              onUpgrade={() => setActiveView('subscription')}
            />
          )}
          {activeView === 'guide' && (
            <BestPractices isPro={isPro} />
          )}
          {activeView === 'subscription' && (
            <SubscriptionView 
                onSubscribe={handleSubscribe} 
                onSimulateSuccess={handlePaymentSuccess} 
            />
          )}
          {activeView === 'affiliate' && (
            <AffiliateView />
          )}
          {activeView === 'account' && (
            <AccountView 
                userProfile={userProfile} 
                onSave={handleUpdateProfile} 
                onLogout={handleLogout}
                onDowngrade={handleDowngrade}
            />
          )}
        </Layout>
      )}
    </>
  );
};

export default App;
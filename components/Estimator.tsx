import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Wand2, FileText, Settings, X, CreditCard, Send, Bot, User, Sparkles, Building2, Crown, Mail, Phone, MapPin, ArrowRight, Clock, Users, AlignLeft } from 'lucide-react';
import { Estimate, LineItem, LineItemCategory } from '../types';
import { createEstimatorChat, parseEstimateResponse, generateSingleLineItem } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Chat } from '@google/genai';

interface EstimatorProps {
  estimate: Estimate;
  setEstimate: (est: Estimate) => void;
  onViewInvoice: () => void;
  isPro: boolean;
  onUpgrade: () => void;
}

// Red/Monochrome palette for charts
const CATEGORY_COLORS: Record<string, string> = {
  [LineItemCategory.PRE_PRODUCTION]: '#27272a', // Zinc 800
  [LineItemCategory.PRODUCTION]: '#DC2626', // Red 600
  [LineItemCategory.POST_PRODUCTION]: '#991B1B', // Red 800
  [LineItemCategory.EQUIPMENT]: '#525252', // Zinc 600
  [LineItemCategory.EXPENSES]: '#a1a1aa', // Zinc 400
  [LineItemCategory.OTHER]: '#d4d4d8', // Zinc 300
};

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const COMMON_ITEMS = [
  { desc: 'Director of Photography (A-Cam)', cat: LineItemCategory.PRODUCTION, rate: 1200, unit: 'day' },
  { desc: 'Camera Operator (B-Cam)', cat: LineItemCategory.PRODUCTION, rate: 800, unit: 'day' },
  { desc: 'Video Editor', cat: LineItemCategory.POST_PRODUCTION, rate: 350, unit: 'day' },
  { desc: 'Sound Mixer', cat: LineItemCategory.PRODUCTION, rate: 750, unit: 'day' },
  { desc: 'Gaffer', cat: LineItemCategory.PRODUCTION, rate: 650, unit: 'day' },
  { desc: 'Lighting Package', cat: LineItemCategory.EQUIPMENT, rate: 500, unit: 'day' },
  { desc: 'Camera Package (Cinema)', cat: LineItemCategory.EQUIPMENT, rate: 800, unit: 'day' },
  { desc: 'Producer', cat: LineItemCategory.PRE_PRODUCTION, rate: 1000, unit: 'day' },
  { desc: 'Production Assistant', cat: LineItemCategory.PRODUCTION, rate: 300, unit: 'day' },
  { desc: 'Music Licensing', cat: LineItemCategory.EXPENSES, rate: 250, unit: 'flat' },
];

export const Estimator: React.FC<EstimatorProps> = ({ estimate, setEstimate, onViewInvoice, isPro, onUpgrade }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isItemAiLoading, setIsItemAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiItemInput, setAiItemInput] = useState('');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState<'form' | 'chat'>('form');
  const [wizardData, setWizardData] = useState({
      projectType: '',
      duration: 'Full Day (10 hours)',
      scale: 'Small Crew (Standard)',
      notes: ''
  });

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showAiModal, wizardStep]);

  // Check if project is a wedding
  const isWeddingProject = estimate.details.projectName.toLowerCase().includes('wedding') || 
                           estimate.details.clientName.toLowerCase().includes('wedding');

  // Open Modal Handler
  const openAiAutoBuild = () => {
      setShowAiModal(true);
      setWizardStep('form');
      setWizardData({
          projectType: '',
          duration: 'Full Day (10 hours)',
          scale: 'Small Crew (Standard)',
          notes: ''
      });
      setMessages([]);
      chatSessionRef.current = null;
  };

  const skipWizard = () => {
      setWizardStep('chat');
      if (!chatSessionRef.current) {
          chatSessionRef.current = createEstimatorChat(estimate.details.location || 'United States');
      }
      setMessages([{
          role: 'model',
          text: "Ready. Tell me what we're shooting, and I'll generate a budget."
      }]);
  };

  const submitWizard = async () => {
      if (!wizardData.projectType.trim()) return;

      setWizardStep('chat');
      setIsAiLoading(true);

      if (!chatSessionRef.current) {
          chatSessionRef.current = createEstimatorChat(estimate.details.location || 'United States');
      }

      const prompt = `I need a budget estimate for a ${wizardData.projectType}. 
      Duration: ${wizardData.duration}. 
      Production Scale: ${wizardData.scale}.
      ${wizardData.notes ? `Additional Context/Notes: ${wizardData.notes}` : ''}
      
      Constraint: Ensure the crew size and equipment list matches the "${wizardData.scale}" scope exactly. Do not over-resource.`;

      setMessages([{ role: 'user', text: prompt }]);

      try {
          await processAiMessage(prompt);
      } catch (e) {
          console.error(e);
          setIsAiLoading(false);
      }
  };

  // Update Line Item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    const newItems = estimate.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setEstimate({ ...estimate, items: newItems });
  };

  // Add Specific Item
  const addSpecificItem = (item: Partial<LineItem>) => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: item.description || 'New Item',
      category: item.category || LineItemCategory.PRODUCTION,
      quantity: item.quantity || 1,
      rate: item.rate || 0,
      unit: (item.unit as any) || 'day',
      taxable: true
    };
    setEstimate({ ...estimate, items: [...estimate.items, newItem] });
    setShowAddItemModal(false);
    setAiItemInput('');
  };

  // AI Add Item
  const handleAiAddItem = async () => {
    if (!aiItemInput.trim()) return;
    setIsItemAiLoading(true);
    try {
        const item = await generateSingleLineItem(aiItemInput, estimate.details.location || 'United States');
        addSpecificItem(item);
    } catch (e) {
        console.error(e);
    } finally {
        setIsItemAiLoading(false);
    }
  };

  // Remove Item
  const removeLineItem = (id: string) => {
    setEstimate({ ...estimate, items: estimate.items.filter(i => i.id !== id) });
  };

  // Clear All
  const clearAllItems = () => {
    setEstimate({ ...estimate, items: [] });
  };

  // Calculate Totals
  const calculateTotals = useCallback(() => {
    const subtotal = estimate.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const markupAmount = subtotal * (estimate.markupPercent / 100);
    const taxableSubtotal = estimate.items.reduce((acc, item) => item.taxable ? acc + (item.quantity * item.rate) : acc, 0);
    const taxableAmount = taxableSubtotal + (taxableSubtotal * (estimate.markupPercent / 100));
    const taxAmount = taxableAmount * (estimate.taxPercent / 100);
    const total = subtotal + markupAmount + taxAmount;

    return { subtotal, markupAmount, taxAmount, total };
  }, [estimate]);

  const totals = calculateTotals();

  // Core AI Logic
  const processAiMessage = async (text: string) => {
      if (!chatSessionRef.current) return;

      try {
          const response = await chatSessionRef.current.sendMessage({ message: text });
          const responseText = response.text || "I'm having trouble connecting.";
          
          // Check if response contains the estimate JSON
          const result = parseEstimateResponse(responseText);

          if (result.isEstimate && result.items) {
              // Populate estimate
              const newItems = result.items as LineItem[];
               if (estimate.items.length === 0) {
                    setEstimate({ ...estimate, items: newItems });
                } else {
                    setEstimate({ ...estimate, items: [...estimate.items, ...newItems] });
                }
                setAiReasoning(result.reasoning || null);
                
                // Close modal and reset chat
                setShowAiModal(false);
                setMessages([]);
                chatSessionRef.current = null;
          } else {
              // Regular conversation
              setMessages(prev => [...prev, { role: 'model', text: responseText }]);
          }

      } catch (error) {
          console.error("Chat error", error);
          setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
      } finally {
          setIsAiLoading(false);
      }
  };

  // Chat Handler
  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      
      const userText = chatInput;
      setChatInput('');
      setMessages(prev => [...prev, { role: 'user', text: userText }]);
      setIsAiLoading(true);
      
      if (!chatSessionRef.current) {
         chatSessionRef.current = createEstimatorChat(estimate.details.location || 'United States');
      }

      await processAiMessage(userText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  }

  const chartData = Object.values(LineItemCategory).map(cat => {
    const value = estimate.items
      .filter(i => i.category === cat)
      .reduce((acc, i) => acc + (i.quantity * i.rate), 0);
    return { name: cat, value };
  }).filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-oswald font-bold uppercase mb-2 text-white">Estimate <span className="text-red-600">Editor</span></h1>
          <p className="text-zinc-300 font-mono text-sm uppercase tracking-wider">Project ID: {estimate.id}</p>
        </div>
        <div className="flex space-x-4 mt-6 md:mt-0">
           <button 
            onClick={openAiAutoBuild}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-md"
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Auto-Build</span>
          </button>
          <button 
            onClick={onViewInvoice}
            className="flex items-center space-x-2 border border-zinc-700 hover:border-white text-zinc-300 hover:text-white px-6 py-3 font-bold uppercase tracking-wider text-xs transition-all duration-300 bg-black"
          >
            <FileText className="w-4 h-4" />
            <span>Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Config */}
        <div className="space-y-8">
          <div className="bg-zinc-900 p-6 border-l-2 border-red-600 shadow-sm border-t border-r border-b border-zinc-800">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-oswald uppercase flex items-center text-white">
                    <Settings className="w-4 h-4 mr-3 text-red-600" />
                    Project Data
                </h3>
            </div>
            
            <div className="space-y-5">
              
              {/* Branding Section */}
              <div className="pb-4 border-b border-zinc-800 mb-4">
                 <h4 className="text-[10px] font-bold uppercase text-red-600 tracking-widest mb-3 flex items-center justify-between">
                    <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> Your Business</span>
                    {isPro && <span className="text-[9px] text-zinc-300">Portal Synced</span>}
                 </h4>
                 
                 <div className="group mb-3">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-white transition-colors">Business Name</label>
                    <input 
                      type="text" 
                      value={estimate.details.businessName}
                      onChange={(e) => setEstimate({...estimate, details: {...estimate.details, businessName: e.target.value}})}
                      className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                      placeholder="Shoot.Edit.Release"
                    />
                 </div>

                 {/* Contact Details */}
                 <div className="grid grid-cols-2 gap-3 mb-3">
                     <div className="group">
                        <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                            <Mail className="w-3 h-3 mr-1" /> Email
                        </label>
                        <input 
                          type="text" 
                          value={estimate.details.businessEmail || ''}
                          onChange={(e) => setEstimate({...estimate, details: {...estimate.details, businessEmail: e.target.value}})}
                          className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-xs outline-none font-medium transition-colors placeholder-zinc-500"
                          placeholder="contact@studio.com"
                        />
                     </div>
                     <div className="group">
                        <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                            <Phone className="w-3 h-3 mr-1" /> Phone
                        </label>
                        <input 
                          type="text" 
                          value={estimate.details.businessPhone || ''}
                          onChange={(e) => setEstimate({...estimate, details: {...estimate.details, businessPhone: e.target.value}})}
                          className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-xs outline-none font-medium transition-colors placeholder-zinc-500"
                          placeholder="(555) 000-0000"
                        />
                     </div>
                 </div>

                 <div className="group mb-3">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Address
                    </label>
                    <textarea
                      value={estimate.details.businessAddress || ''}
                      onChange={(e) => setEstimate({...estimate, details: {...estimate.details, businessAddress: e.target.value}})}
                      className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-xs outline-none font-medium transition-colors resize-none h-16 placeholder-zinc-500"
                      placeholder="123 Creative Blvd, Suite 100&#10;Los Angeles, CA 90000"
                    />
                 </div>
                 
                 {/* Logo Field - Pro Only */}
                 <div className="group mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-mono uppercase text-zinc-300 group-focus-within:text-white transition-colors">Business Logo (Optional)</label>
                        {!isPro && (
                             <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest flex items-center">
                                <Crown className="w-3 h-3 mr-1" /> Pro
                             </span>
                        )}
                    </div>
                    <div className="relative">
                        <input 
                          type="text" 
                          disabled={!isPro}
                          value={!isPro ? '' : estimate.details.businessLogo}
                          onChange={(e) => setEstimate({...estimate, details: {...estimate.details, businessLogo: e.target.value}})}
                          className={`w-full bg-zinc-900 border-b border-zinc-700 p-2 text-xs outline-none font-medium transition-colors placeholder-zinc-500 ${!isPro ? 'opacity-50 cursor-not-allowed text-zinc-600' : 'focus:border-red-600 text-white'}`}
                          placeholder={!isPro ? "Unlock custom branding..." : "https://..."}
                        />
                        {!isPro && (
                            <button
                                onClick={onUpgrade}
                                className="absolute right-0 bottom-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider"
                            >
                                Go Pro
                            </button>
                        )}
                    </div>
                 </div>

                 <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-white transition-colors">Checks Payable To</label>
                    <input 
                      type="text" 
                      value={estimate.details.payableTo}
                      onChange={(e) => setEstimate({...estimate, details: {...estimate.details, payableTo: e.target.value}})}
                      className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                      placeholder={estimate.details.businessName || "Name on Check"}
                    />
                 </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-red-600 transition-colors">Client</label>
                <input 
                  type="text" 
                  value={estimate.details.clientName}
                  onChange={(e) => setEstimate({...estimate, details: {...estimate.details, clientName: e.target.value}})}
                  className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                  placeholder="CLIENT NAME"
                />
              </div>
              <div className="group">
                <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-red-600 transition-colors">Project</label>
                <input 
                  type="text" 
                  value={estimate.details.projectName}
                  onChange={(e) => setEstimate({...estimate, details: {...estimate.details, projectName: e.target.value}})}
                  className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                  placeholder="PROJECT TITLE"
                />
              </div>
              <div className="group">
                <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-red-600 transition-colors">Location</label>
                <input 
                  type="text" 
                  value={estimate.details.location}
                  onChange={(e) => setEstimate({...estimate, details: {...estimate.details, location: e.target.value}})}
                  className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500"
                  placeholder="CITY, STATE"
                />
              </div>
               <div className="group">
                <label className="block text-[10px] font-mono uppercase text-zinc-300 mb-1 group-focus-within:text-red-600 transition-colors">Date</label>
                <input 
                  type="date" 
                  value={estimate.details.projectDate}
                  onChange={(e) => setEstimate({...estimate, details: {...estimate.details, projectDate: e.target.value}})}
                  className="w-full bg-zinc-900 border-b border-zinc-700 focus:border-red-600 text-white p-2 text-sm outline-none font-medium transition-colors uppercase"
                />
              </div>

              {/* Payment Link - Pro Only */}
              <div className="group">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-mono uppercase text-zinc-300 group-focus-within:text-red-600 transition-colors flex items-center">
                       <CreditCard className="w-3 h-3 mr-1" /> Payment Link
                    </label>
                    {!isPro && (
                         <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest flex items-center">
                            <Crown className="w-3 h-3 mr-1" /> Pro
                         </span>
                    )}
                </div>
                <div className="relative">
                    <input 
                      type="text" 
                      disabled={!isPro}
                      value={!isPro ? '' : estimate.details.paymentLink || ''}
                      onChange={(e) => setEstimate({...estimate, details: {...estimate.details, paymentLink: e.target.value}})}
                      className={`w-full bg-zinc-900 border-b border-zinc-700 p-2 text-sm outline-none font-medium transition-colors placeholder-zinc-500 ${!isPro ? 'opacity-50 cursor-not-allowed text-zinc-600' : 'focus:border-red-600 text-white'}`}
                      placeholder={!isPro ? "Unlock digital payments..." : "HTTPS://STRIPE.COM/..."}
                    />
                    {!isPro && (
                        <button
                            onClick={onUpgrade}
                            className="absolute right-0 bottom-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider"
                        >
                            Go Pro
                        </button>
                    )}
                </div>
              </div>

            </div>
          </div>

          {/* Breakdown Chart */}
          {chartData.length > 0 && (
            <div className="bg-zinc-900 p-6 shadow-sm border border-zinc-800">
               <h3 className="text-xs font-mono uppercase mb-4 text-zinc-300 tracking-widest">Allocation</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={chartData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={2}
                       dataKey="value"
                       stroke="none"
                     >
                       {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} />
                       ))}
                     </Pie>
                     <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}

           {/* AI Reasoning Panel */}
           {aiReasoning && (
            <div className="bg-red-950/20 border border-red-900/50 p-6">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center">
                <Wand2 className="w-3 h-3 mr-2" />
                AI Analysis
              </h3>
              <p className="text-xs text-red-200/70 leading-relaxed font-mono">{aiReasoning}</p>
            </div>
          )}
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-2">
          <div className="bg-black border border-zinc-800 shadow-sm min-h-[600px] flex flex-col">
            <div className="p-4 bg-zinc-900 flex justify-between items-center border-b border-zinc-800">
              <div>
                <h3 className="font-oswald uppercase tracking-wide text-white">Manifest</h3>
                <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mt-1">* All rates and quantities are editable</p>
              </div>
              <div className="flex space-x-4">
                  <button onClick={clearAllItems} className="text-xs flex items-center text-zinc-400 hover:text-red-600 font-bold uppercase tracking-wider transition-colors">
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </button>
                  <button onClick={() => setShowAddItemModal(true)} className="text-xs flex items-center text-red-600 hover:text-white font-bold uppercase tracking-wider transition-colors">
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </button>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left text-sm">
                <thead className="bg-black text-zinc-300 font-mono uppercase text-[10px] tracking-widest border-b border-zinc-800">
                  <tr>
                    <th className="p-4 font-normal">Item</th>
                    <th className="p-4 font-normal w-32">Cat.</th>
                    <th className="p-4 font-normal w-16 text-center">Qty</th>
                    <th className="p-4 font-normal w-24 text-right">Rate</th>
                    <th className="p-4 font-normal w-20">Unit</th>
                    <th className="p-4 font-normal w-24 text-right">Sum</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {estimate.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-zinc-400 font-mono text-xs uppercase tracking-wider h-64 align-middle">
                        <div className="flex flex-col items-center">
                            <Sparkles className="w-8 h-8 mb-4 text-zinc-500" />
                            <span>No items initialized.</span>
                            <span className="text-[10px] mt-2 text-zinc-500">Use "Add Item" or "AI Auto-Build" to begin.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {estimate.items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900 transition-colors group">
                      <td className="p-3">
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-white placeholder-zinc-500 font-medium"
                          placeholder="DESCRIPTION"
                        />
                      </td>
                      <td className="p-3">
                        <select 
                          value={item.category}
                          onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] uppercase font-mono text-zinc-300 focus:ring-0 cursor-pointer"
                        >
                          {Object.values(LineItemCategory).map(cat => (
                            <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-900 border-none text-center p-1 text-white focus:ring-1 focus:ring-red-600 rounded"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-900 border-none text-right p-1 text-white focus:ring-1 focus:ring-red-600 rounded"
                        />
                      </td>
                      <td className="p-3">
                        <select 
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] uppercase font-mono text-zinc-300 focus:ring-0"
                        >
                          <option value="day" className="bg-zinc-900">Day</option>
                          <option value="hour" className="bg-zinc-900">Hour</option>
                          <option value="flat" className="bg-zinc-900">Flat</option>
                          <option value="item" className="bg-zinc-900">Item</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-mono text-white font-medium">
                        ${(item.quantity * item.rate).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => removeLineItem(item.id)}
                          className="text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals Panel */}
            <div className="bg-zinc-900 p-8 border-t border-zinc-800">
              <div className="flex flex-col md:flex-row justify-end space-y-8 md:space-y-0 md:space-x-16">
                
                {/* Sliders */}
                <div className="w-full md:w-56 space-y-6">
                  <div>
                    <label className="flex justify-between text-[10px] font-mono uppercase text-zinc-300 mb-2">
                      <span>Production Fee ({estimate.markupPercent}%)</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="50" 
                      value={estimate.markupPercent}
                      onChange={(e) => setEstimate({...estimate, markupPercent: parseInt(e.target.value)})}
                      className="w-full h-1 bg-zinc-700 rounded-none appearance-none cursor-pointer accent-red-600"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-[10px] font-mono uppercase text-zinc-300 mb-2">
                      <span>Tax ({estimate.taxPercent}%)</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="20" step="0.5"
                      value={estimate.taxPercent}
                      onChange={(e) => setEstimate({...estimate, taxPercent: parseFloat(e.target.value)})}
                      className="w-full h-1 bg-zinc-700 rounded-none appearance-none cursor-pointer accent-red-600"
                    />
                  </div>
                </div>

                {/* Final Numbers */}
                <div className="w-full md:w-72 space-y-3 font-mono text-sm">
                   <div className="flex justify-between text-zinc-300">
                    <span className="uppercase text-xs">Subtotal</span>
                    <span>${totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="uppercase text-xs">Production Fee</span>
                    <span>${totals.markupAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="uppercase text-xs">Tax</span>
                    <span>${totals.taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-zinc-700 flex justify-between text-2xl font-bold text-white font-oswald tracking-wide">
                    <span>TOTAL</span>
                    <span className="text-red-600">${totals.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-zinc-900 w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-800">
                  <div className="bg-black p-4 flex justify-between items-center text-white border-b border-zinc-800">
                      <h3 className="font-oswald uppercase tracking-wider">Add Line Item</h3>
                      <button onClick={() => setShowAddItemModal(false)}><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-6 space-y-8">
                       {/* AI Generator */}
                       <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-2 block flex items-center">
                               <Sparkles className="w-3 h-3 mr-1 text-red-600" /> AI Generator
                           </label>
                           <div className="flex gap-2">
                               <input 
                                   type="text" 
                                   placeholder="Describe item (e.g. '3 day drone rental in Miami')"
                                   className="flex-grow bg-zinc-800 border-b border-zinc-700 p-2 text-sm outline-none focus:border-red-600 text-white placeholder-zinc-500"
                                   value={aiItemInput}
                                   onChange={(e) => setAiItemInput(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleAiAddItem()}
                               />
                               <button 
                                  onClick={handleAiAddItem}
                                  disabled={isItemAiLoading || !aiItemInput.trim()}
                                  className="bg-red-600 text-white px-4 py-2 font-bold uppercase text-xs hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                               >
                                   {isItemAiLoading ? '...' : 'Create'}
                               </button>
                           </div>
                       </div>

                       {/* Presets */}
                       <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-4 block flex justify-between">
                               <span>Quick Add</span>
                               {isWeddingProject && <span className="text-red-600 font-bold">Wedding Rates (2x) Active</span>}
                           </label>
                           <div className="grid grid-cols-2 gap-3">
                               {COMMON_ITEMS.map((item, idx) => {
                                   const adjustedRate = isWeddingProject ? item.rate * 2 : item.rate;
                                   return (
                                     <button 
                                        key={idx}
                                        onClick={() => addSpecificItem({ description: item.desc, category: item.cat, rate: adjustedRate, unit: item.unit as any })}
                                        className="text-left p-3 border border-zinc-800 bg-zinc-800/50 hover:border-red-600 hover:bg-zinc-800 transition-all text-xs group"
                                     >
                                         <div className="font-bold text-white group-hover:text-red-500 transition-colors">{item.desc}</div>
                                         <div className="text-zinc-400 font-mono text-[10px]">${adjustedRate}/{item.unit}</div>
                                     </button>
                                   );
                               })}
                           </div>
                       </div>

                       {/* Manual Fallback */}
                       <div className="pt-4 border-t border-zinc-800 text-center">
                           <button 
                              onClick={() => addSpecificItem({})} 
                              className="text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-widest underline decoration-dotted"
                           >
                               Add Blank Row
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg shadow-2xl shadow-red-900/10 flex flex-col h-[650px]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <div>
                   <h2 className="text-2xl font-oswald font-bold uppercase text-white">SER<span className="text-red-600">.0</span></h2>
                   <p className="text-xs font-mono text-zinc-300 uppercase tracking-widest mt-1">
                      {wizardStep === 'form' ? 'Scope Calculator' : 'Budget Generator'}
                   </p>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-zinc-400 hover:text-red-600">
                   <X className="w-6 h-6" />
                </button>
            </div>
            
            {/* WIZARD MODE */}
            {wizardStep === 'form' && (
              <div className="p-8 flex-grow flex flex-col justify-between">
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 block flex items-center">
                          <FileText className="w-4 h-4 mr-2" /> What are we filming?
                       </label>
                       <input 
                          type="text"
                          value={wizardData.projectType}
                          onChange={(e) => setWizardData({...wizardData, projectType: e.target.value})}
                          placeholder="e.g. 'Real Estate Walkthrough', 'Music Video', 'Wedding'"
                          className="w-full bg-transparent border-b-2 border-zinc-700 text-xl py-2 focus:border-red-600 outline-none font-oswald text-white placeholder-zinc-500 transition-colors"
                          autoFocus
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 block flex items-center">
                          <Clock className="w-4 h-4 mr-2" /> How long is the shoot?
                       </label>
                       <select
                          value={wizardData.duration}
                          onChange={(e) => setWizardData({...wizardData, duration: e.target.value})}
                          className="w-full bg-transparent border-b-2 border-zinc-700 text-xl py-2 focus:border-red-600 outline-none font-oswald text-white cursor-pointer [&>option]:bg-zinc-900"
                       >
                          <option value="Half Day (4-5 hours)">Half Day (4-5 hours)</option>
                          <option value="Full Day (10 hours)">Full Day (10 hours)</option>
                          <option value="2 Days">2 Days</option>
                          <option value="3 Days">3 Days</option>
                          <option value="1 Week">1 Week</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 block flex items-center">
                          <Users className="w-4 h-4 mr-2" /> Production Scale
                       </label>
                       <select
                          value={wizardData.scale}
                          onChange={(e) => setWizardData({...wizardData, scale: e.target.value})}
                          className="w-full bg-transparent border-b-2 border-zinc-700 text-xl py-2 focus:border-red-600 outline-none font-oswald text-white cursor-pointer [&>option]:bg-zinc-900"
                       >
                          <option value="Solo Shooter (Budget Friendly)">Solo Shooter (Budget Friendly)</option>
                          <option value="Small Crew (Standard)">Small Crew (Standard)</option>
                          <option value="Full Production (High End)">Full Production (High End)</option>
                       </select>
                       <p className="text-xs text-zinc-400 font-mono mt-1">
                          {wizardData.scale.includes('Solo') && "1 Person. Minimal Gear. Lower Cost."}
                          {wizardData.scale.includes('Small') && "2-3 People. Good Quality. Standard Rate."}
                          {wizardData.scale.includes('Full') && "Agency Style. Best Quality. Premium Rate."}
                       </p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 block flex items-center">
                          <AlignLeft className="w-4 h-4 mr-2" /> Additional Details (Optional)
                       </label>
                       <textarea 
                          value={wizardData.notes}
                          onChange={(e) => setWizardData({...wizardData, notes: e.target.value})}
                          placeholder="Specific gear needs, deliverables, or budget constraints..."
                          className="w-full bg-transparent border-b-2 border-zinc-700 text-sm py-2 focus:border-red-600 outline-none text-white placeholder-zinc-500 transition-colors resize-none h-16 font-medium"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <button 
                       onClick={submitWizard}
                       disabled={!wizardData.projectType}
                       className="w-full bg-white text-black hover:bg-red-600 hover:text-white py-4 font-oswald font-bold uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500"
                    >
                       Generate Budget <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                    <button 
                       onClick={skipWizard}
                       className="w-full text-zinc-300 hover:text-white text-[10px] uppercase tracking-widest font-bold"
                    >
                       Skip Wizard & Open Chat
                    </button>
                 </div>
              </div>
            )}

            {/* CHAT MODE */}
            {wizardStep === 'chat' && (
              <>
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-sm text-sm ${
                                msg.role === 'user' 
                                    ? 'bg-red-900/50 text-white border border-red-900' 
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                            }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-widest">
                                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                    {msg.role === 'user' ? 'You' : 'SER.0'}
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-sm text-xs font-mono text-zinc-400 animate-pulse">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-zinc-800 bg-black">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Refine estimate (e.g. 'Add a drone', 'Too expensive')..."
                            className="flex-grow bg-zinc-900 border border-zinc-700 p-3 text-sm focus:border-red-600 outline-none text-white placeholder-zinc-500 font-medium"
                            disabled={isAiLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isAiLoading || !chatInput.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-zinc-800"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
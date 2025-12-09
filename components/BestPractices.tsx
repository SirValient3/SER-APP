import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, Users, Briefcase, HeartHandshake, CheckCircle2, FileSpreadsheet, Lock, Crown, Copy, Check, Wand2, X, Send, Bot, User, Download, Printer, Image as ImageIcon, Loader2, ClipboardList, Share2, Star } from 'lucide-react';
import { createShotListChat, parseShotListResponse, generateStoryboardSketch, createCallSheetChat, parseCallSheetResponse } from '../services/geminiService';
import { Chat } from '@google/genai';

interface BestPracticesProps {
  isPro: boolean;
}

const SHOT_LIST_TEMPLATE = {
  "pageId": "shot_list_template",
  "pageTitle": "Shot List Template",
  "pageDescription": "Structured shot list for producers, directors, and videographers to plan and organize a shoot.",
  "sections": [
    {
      "id": "project_info",
      "label": "Project Information",
      "type": "group",
      "fields": [
        { "id": "project_title", "label": "Project Title", "type": "text" },
        { "id": "client", "label": "Client", "type": "text" },
        { "id": "date", "label": "Date", "type": "text" },
        { "id": "director_dp", "label": "Director / DP", "type": "text" },
        { "id": "location", "label": "Location", "type": "text" }
      ]
    },
    // ... (rest of template structure preserved)
  ]
};

const CALL_SHEET_TEMPLATE = {
  "pageId": "call_sheet_template",
  "pageTitle": "Call Sheet Template",
  "pageDescription": "Professional call sheet for producers, directors, and videographers to organize shoot logistics, crew details, timing, and contact information.",
  "sections": [
    {
      "id": "project_info",
      "label": "Project Information",
      "type": "group",
      "fields": [
        { "id": "project_title", "label": "Project Title", "type": "text" },
        { "id": "client", "label": "Client", "type": "text" },
        { "id": "shoot_date", "label": "Shoot Date", "type": "text" },
        { "id": "location", "label": "Primary Location", "type": "text" },
        { "id": "weather", "label": "Weather Forecast", "type": "text" }
      ]
    },
    {
      "id": "schedule",
      "label": "Daily Schedule",
      "type": "table",
      "columns": [
        { "id": "time", "label": "Time", "type": "text" },
        { "id": "activity", "label": "Activity / Segment", "type": "textarea" },
        { "id": "location", "label": "Location", "type": "text" },
        { "id": "notes", "label": "Notes", "type": "textarea" }
      ],
      "minRows": 6
    },
    {
      "id": "crew_contacts",
      "label": "Crew Contacts",
      "type": "table",
      "columns": [
        { "id": "role", "label": "Role", "type": "text" },
        { "id": "name", "label": "Name", "type": "text" },
        { "id": "phone", "label": "Phone #", "type": "text" },
        { "id": "email", "label": "Email", "type": "text" },
        { "id": "call_time", "label": "Call Time", "type": "text" }
      ],
      "minRows": 8
    },
    {
      "id": "talent",
      "label": "Talent Information",
      "type": "table",
      "columns": [
        { "id": "talent_name", "label": "Talent Name", "type": "text" },
        { "id": "role", "label": "Role / Character", "type": "text" },
        { "id": "call_time", "label": "Call Time", "type": "text" },
        { "id": "wardrobe", "label": "Wardrobe Notes", "type": "textarea" },
        { "id": "special_notes", "label": "Special Notes", "type": "textarea" }
      ],
      "minRows": 5
    },
    {
      "id": "location_details",
      "label": "Location Details",
      "type": "group",
      "fields": [
        {
          "id": "address",
          "label": "Address",
          "type": "textarea",
          "placeholder": "Full address including building numbers, suite numbers, GPS pin, etc."
        },
        {
          "id": "parking",
          "label": "Parking Instructions",
          "type": "textarea",
          "placeholder": "Crew / talent parking info, loading zones, street parking restrictions, etc."
        },
        {
          "id": "arrival_instructions",
          "label": "Arrival Instructions",
          "type": "textarea",
          "placeholder": "Where to check in, who to contact, gate codes, security instructions."
        },
        {
          "id": "nearest_hospital",
          "label": "Nearest Hospital",
          "type": "textarea",
          "placeholder": "Name, address, phone number."
        }
      ]
    },
    {
      "id": "equipment_notes",
      "label": "Equipment & Department Notes",
      "type": "group",
      "fields": [
        {
          "id": "camera_notes",
          "label": "Camera Department Notes",
          "type": "textarea",
          "placeholder": "Camera body, lenses, rigs, specs, special gear requests."
        },
        {
          "id": "lighting_notes",
          "label": "Lighting Notes",
          "type": "textarea",
          "placeholder": "Lighting plan, required fixtures, rigging notes, power needs."
        },
        {
          "id": "audio_notes",
          "label": "Audio Notes",
          "type": "textarea",
          "placeholder": "Mics, recorders, timecode, boom ops, room tone notes."
        },
        {
          "id": "other_notes",
          "label": "Other Department Notes",
          "type": "textarea",
          "placeholder": "Grip, art department, HMU, props, safety, stunts, etc."
        }
      ]
    },
    {
      "id": "meal_breaks",
      "label": "Meal & Break Schedule",
      "type": "table",
      "columns": [
        { "id": "meal_type", "label": "Meal Type", "type": "text" },
        { "id": "time", "label": "Time", "type": "text" },
        { "id": "notes", "label": "Notes", "type": "textarea" }
      ],
      "minRows": 2
    },
    {
      "id": "safety_notes",
      "label": "Safety Notes",
      "type": "textarea",
      "placeholder": "Essential reminders, hazards, emergency contacts, weather preparation, special precautions."
    },
    {
      "id": "final_notes",
      "label": "Final Notes / Announcements",
      "type": "textarea",
      "placeholder": "Wrap notes, timing reminders, equipment returns, next-day instructions, or general announcements."
    }
  ]
};

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const BestPractices: React.FC<BestPracticesProps> = ({ isPro }) => {
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // AI Modal State
  const [activeAiMode, setActiveAiMode] = useState<'shot_list' | 'call_sheet' | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Generated Content States
  const [generatedShotList, setGeneratedShotList] = useState<any | null>(null);
  const [generatedCallSheet, setGeneratedCallSheet] = useState<any | null>(null);
  
  const [shotImages, setShotImages] = useState<Record<string, string>>({}); // Key: "sceneIdx-shotIdx"
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyTemplate = (template: any, sectionId: string) => {
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    setCopiedSectionId(sectionId);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showAiModal]);

  const openAiAssistant = (mode: 'shot_list' | 'call_sheet') => {
      if (!isPro) return;
      setActiveAiMode(mode);
      setShowAiModal(true);
      
      const initialMsg = mode === 'shot_list' 
        ? "I'm SER.0, your virtual Director of Photography. Tell me about the scene we're planning. What's the location and the emotional tone?"
        : "I'm SER.0, your virtual Assistant Director. Let's build a Call Sheet. What's the project title, date, and general call time?";

      setMessages([{
          role: 'model',
          text: initialMsg
      }]);
      
      chatSessionRef.current = mode === 'shot_list' ? createShotListChat() : createCallSheetChat();
  };

  const handleSendMessage = async () => {
      if (!chatInput.trim() || !chatSessionRef.current) return;
      
      const userText = chatInput;
      setChatInput('');
      setMessages(prev => [...prev, { role: 'user', text: userText }]);
      setIsAiLoading(true);

      try {
          const response = await chatSessionRef.current.sendMessage({ message: userText });
          const responseText = response.text || "I'm thinking...";
          
          if (activeAiMode === 'shot_list') {
             const { data, isShotList } = parseShotListResponse(responseText);
             if (isShotList) {
                 setGeneratedShotList(data);
                 setMessages(prev => [...prev, { role: 'model', text: "I've generated the shot list. You can see it on the right." }]);
             } else {
                 setMessages(prev => [...prev, { role: 'model', text: responseText }]);
             }
          } else if (activeAiMode === 'call_sheet') {
             const { data, isCallSheet } = parseCallSheetResponse(responseText);
             if (isCallSheet) {
                 setGeneratedCallSheet(data);
                 setMessages(prev => [...prev, { role: 'model', text: "Call sheet generated. Preview available on the right." }]);
             } else {
                 setMessages(prev => [...prev, { role: 'model', text: responseText }]);
             }
          }

      } catch (error) {
          console.error("Chat error", error);
          setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleGenerateSketch = async (sceneIdx: number, shotIdx: number, description: string, size: string) => {
      const key = `${sceneIdx}-${shotIdx}`;
      setLoadingImages(prev => ({ ...prev, [key]: true }));
      
      try {
          const imageBase64 = await generateStoryboardSketch(description, size);
          if (imageBase64) {
              setShotImages(prev => ({ ...prev, [key]: imageBase64 }));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingImages(prev => ({ ...prev, [key]: false }));
      }
  };

  const handleGenerateAllSketchesForScene = async (sceneIdx: number, shots: any[]) => {
      for (let i = 0; i < shots.length; i++) {
          const shot = shots[i];
          const key = `${sceneIdx}-${i}`;
          if (!shotImages[key]) {
              await handleGenerateSketch(sceneIdx, i, shot.description, shot.size);
          }
      }
  };

  const handlePrint = () => {
      // Create a temporary printable area
      const printContent = document.getElementById(activeAiMode === 'shot_list' ? 'shot-list-print-area' : 'call-sheet-print-area');
      if (printContent) {
          const win = window.open('', '', 'height=700,width=1100');
          if (win) {
              win.document.write('<html><head><title>SER.0 Document</title>');
              win.document.write('<script src="https://cdn.tailwindcss.com"></script>'); // Re-inject tailwind for style
              win.document.write('<style>@media print { @page { size: landscape; margin: 1cm; } body { -webkit-print-color-adjust: exact; } }</style>');
              win.document.write('</head><body class="p-8 bg-white text-black">');
              win.document.write(printContent.innerHTML);
              win.document.write('</body></html>');
              win.document.close();
              setTimeout(() => {
                  win.print();
              }, 1000);
          }
      }
  };

  const handleShare = async () => {
    const isShotList = activeAiMode === 'shot_list';
    const elementId = isShotList ? 'shot-list-pdf-content' : 'call-sheet-pdf-content';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsSharing(true);
    
    const data = isShotList ? generatedShotList : generatedCallSheet;
    const title = data?.projectTitle || (isShotList ? 'Shot List' : 'Call Sheet');
    const fileName = `${title.replace(/\s+/g, '_')}_${isShotList ? 'ShotList' : 'CallSheet'}.pdf`;
    const shareText = `Here is the ${isShotList ? 'Shot List' : 'Call Sheet'} for ${title}.`;

    try {
        if (!(window as any).html2pdf) {
           alert("PDF generation is not available.");
           return;
        }

        const opt = {
          margin: 5,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        const pdfBlob = await (window as any).html2pdf().set(opt).from(element).output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
                files: [pdfFile],
                title: title,
                text: shareText
            });
        } else {
            // Fallback: Download
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }

    } catch (err) {
        console.error('Share failed', err);
    } finally {
        setIsSharing(false);
    }
  };

  const sections = [
    {
      title: "The Craft: Quality Content",
      icon: <Lightbulb className="w-6 h-6 text-white" />,
      content: [
        {
          head: "Story > Gear",
          text: "A generic story shot on an ARRI looks worse than a great story shot on an iPhone. Focus on the narrative arc before selecting the lens."
        },
        {
          head: "Lighting is Language",
          text: "Don't just light for exposure; light for emotion. Use negative fill to create depth. Shadows tell as much story as the light."
        },
        {
          head: "Audio is 51% of Video",
          text: "Bad visuals can be stylistic; bad audio is amateur. Always capture room tone and hire a dedicated sound mixer for dialogue."
        }
      ]
    },
    {
      title: "The Crew: Hiring",
      icon: <Users className="w-6 h-6 text-white" />,
      content: [
        {
          head: "Define Rates Upfront",
          text: "Use the Estimator to calculate fair market rates. Never ask someone to work for 'exposure'. Clear rates create clear expectations."
        },
        {
          head: "Feed Your Crew",
          text: "A well-fed crew is a happy crew. Pizza every day isn't enough. Good catering keeps morale high during 12-hour days."
        },
        {
          head: "Hire for Attitude",
          text: "Skills can be taught; attitude cannot. On a high-pressure set, a calm demeanor is more valuable than a slightly better reel."
        }
      ]
    },
    {
      title: "The Client: Relations",
      icon: <HeartHandshake className="w-6 h-6 text-white" />,
      content: [
        {
          head: "Under-promise, Over-deliver",
          text: "Set a delivery date you can beat. Surprising a client with an early delivery builds immense trust."
        },
        {
          head: "The Power of 'No'",
          text: "If a request is out of scope, refer to the original estimate. Scope creep kills profit. Charge for the extra work or politely decline."
        },
        {
          head: "Communication Cadence",
          text: "Update the client before they ask. Weekly status reports during post-production prevent anxiety."
        }
      ]
    },
    {
      title: "The Code: Professionalism",
      icon: <Briefcase className="w-6 h-6 text-white" />,
      content: [
        {
          head: "Early is On Time",
          text: "Call time is 8:00 AM? Be there at 7:45 AM. If you're on time, you're late. Punctuality is the first sign of respect."
        },
        {
          head: "File Management",
          text: "Your data is your lifeblood. Follow the 3-2-1 rule: 3 copies, 2 different media types, 1 offsite. Naming conventions matter."
        },
        {
          head: "The Exit",
          text: "Leave the location cleaner than you found it. The impression you leave during wrap is the one they remember."
        }
      ]
    },
    // PRO SECTIONS
    {
      title: "The Template: Shot List",
      id: "shot_list",
      icon: isPro ? <FileSpreadsheet className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-zinc-400" />,
      isProSection: true,
      content: [
        {
          head: "Scene Breakdown",
          text: "Organize by Scene/Segment. Define Description, Location, and Notes. Grouping shots by location saves hours of setup time."
        },
        {
          head: "Shot Spec & Storyboards",
          text: "Shot #, Type (WS/MS/CU), Movement. Be specific. SER.0 automatically generates classic line art storyboards for visual reference."
        },
        {
          head: "Logistics",
          text: "Gear Needs (Lens/Rig), Lighting (Key/Fill), Audio (Boom/Lav). Don't arrive without the right batteries or permits."
        }
      ]
    },
    {
      title: "The Template: Call Sheet",
      id: "call_sheet",
      icon: isPro ? <ClipboardList className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-zinc-400" />,
      isProSection: true,
      content: [
        {
          head: "Logistics First",
          text: "Parking, weather, and nearest hospital. Safety and accessibility are priority #1. Never let a crew member arrive confused."
        },
        {
          head: "The Grid",
          text: "Call times for every crew member. Verify receipt. If they didn't confirm via email or text, assume they aren't coming."
        },
        {
          head: "Schedule",
          text: "Realistic timing blocks. Pad your moves. A call sheet is a promise of a wrap time. Respect the 12-hour turn."
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-oswald font-bold uppercase mb-4 text-white">
          The <span className="text-red-600">Manual</span>
        </h1>
        <p className="text-zinc-300 max-w-2xl mx-auto font-mono text-sm tracking-wide">
          Standard operating procedures for the modern videographer. <br/>
          Elevate your craft. Respect the process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section, idx) => {
          const isLocked = section.isProSection && !isPro;
          // Type guard for section id
          const sectionId = (section as any).id;
          
          return (
            <div 
              key={idx} 
              className={`bg-zinc-900 border shadow-lg transition-all duration-300 group flex flex-col
                ${isLocked 
                  ? 'border-zinc-800 opacity-75' 
                  : section.isProSection 
                    ? 'border-purple-900/50 shadow-purple-900/10 hover:shadow-purple-900/20' 
                    : 'border-zinc-800 hover:shadow-red-900/10'
                }
              `}
            >
              <div className={`p-6 flex items-center justify-between border-b 
                 ${isLocked 
                    ? 'bg-zinc-950 border-zinc-900' 
                    : section.isProSection
                        ? 'bg-purple-900/20 border-purple-900/30'
                        : 'bg-black border-zinc-800'
                 }`}
              >
                <div className="flex flex-col items-start">
                    <div className="flex items-center">
                        <h2 className={`text-xl font-oswald uppercase tracking-wider ${section.isProSection ? 'text-purple-400' : 'text-white'}`}>
                            {section.title}
                        </h2>
                        {section.isProSection && !isLocked && (
                            <Crown className="w-4 h-4 ml-2 text-purple-500 animate-pulse" />
                        )}
                    </div>
                    {sectionId === 'shot_list' && (
                        <div className="mt-2 flex items-center bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
                            <Star className="w-3 h-3 text-yellow-500 mr-2 fill-yellow-500" />
                            <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-wider">Now with classic storyboard generator</span>
                        </div>
                    )}
                </div>
                <div className={`p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300
                    ${isLocked 
                        ? 'bg-zinc-800' 
                        : section.isProSection 
                            ? 'bg-purple-600' 
                            : 'bg-red-600'
                    }`}
                >
                  {section.icon}
                </div>
              </div>
              
              <div className="p-8 space-y-8 flex-grow relative">
                {isLocked && (
                    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                        <Lock className="w-12 h-12 text-zinc-400 mb-4" />
                        <h3 className="text-lg font-oswald uppercase text-white mb-2">Pro Resource Locked</h3>
                        <p className="text-xs text-zinc-300 font-mono mb-0">Upgrade to unlock standard industry templates.</p>
                    </div>
                )}
                
                {section.content.map((item, i) => (
                  <div key={i} className={`relative pl-6 border-l-2 transition-colors duration-300
                     ${section.isProSection 
                        ? 'border-purple-900/50 hover:border-purple-500' 
                        : 'border-zinc-700 hover:border-red-600'
                     }`}
                  >
                    <h3 className="font-bold text-white uppercase text-sm mb-2">{item.head}</h3>
                    <p className="text-zinc-200 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}

                {section.isProSection && !isLocked && (
                    <div className="pt-4 mt-4 border-t border-purple-900/30 space-y-3">
                         {(sectionId === 'shot_list' || sectionId === 'call_sheet') && (
                             <button 
                                onClick={() => openAiAssistant(sectionId as 'shot_list' | 'call_sheet')}
                                className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-purple-900/40"
                            >
                                <Wand2 className="w-3 h-3 mr-2" />
                                Generate with SER.0
                            </button>
                         )}
                         <button 
                            onClick={() => {
                                if (sectionId === 'shot_list') handleCopyTemplate(SHOT_LIST_TEMPLATE, 'shot_list');
                                if (sectionId === 'call_sheet') handleCopyTemplate(CALL_SHEET_TEMPLATE, 'call_sheet');
                            }}
                            className="w-full flex items-center justify-center bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 hover:text-purple-200 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border border-purple-900/50 rounded-sm"
                        >
                            {copiedSectionId === sectionId ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                            {copiedSectionId === sectionId ? 'Copied to Clipboard' : 'Copy JSON Template'}
                        </button>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 bg-zinc-900 border border-zinc-800 p-8 text-center">
        <h3 className="text-2xl font-oswald font-bold uppercase mb-4 text-white">Never Stop Learning</h3>
        <p className="text-zinc-300 text-sm mb-6 max-w-xl mx-auto">
          The industry moves fast. Tools change, but principles remain. Stick to the code, and the work will follow.
        </p>
        <button className="text-red-600 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">
          View Reading List <CheckCircle2 className="w-4 h-4 inline ml-1" />
        </button>
      </div>

       {/* AI MODAL (Shared for Shot List and Call Sheet) */}
       {showAiModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-[90vw] shadow-2xl shadow-purple-900/10 flex flex-col h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <div>
                   <h2 className="text-2xl font-oswald font-bold uppercase text-white">SER<span className="text-red-600">.0</span> <span className="text-purple-500 ml-2">Director's Mode</span></h2>
                   <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1">
                      {activeAiMode === 'shot_list' ? 'Shot List Generator' : 'Call Sheet Generator'}
                   </p>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-zinc-400 hover:text-white">
                   <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
                {/* LEFT: CHAT */}
                <div className="w-full lg:w-1/4 flex flex-col border-r border-zinc-800">
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-3 rounded-sm text-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-purple-900/30 text-white border border-purple-900/50' 
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                                }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-50 text-[9px] uppercase font-bold tracking-widest">
                                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                        {msg.role === 'user' ? 'You' : 'SER.0'}
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-zinc-800 bg-black">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Answer SER.0..."
                                className="flex-grow bg-zinc-900 border border-zinc-700 p-3 text-sm focus:border-purple-600 outline-none text-white placeholder-zinc-500 font-medium"
                                disabled={isAiLoading}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={isAiLoading || !chatInput.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-zinc-800"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW */}
                <div className="w-full lg:w-3/4 bg-zinc-950 flex flex-col overflow-hidden">
                    {activeAiMode === 'shot_list' && generatedShotList && (
                        <>
                             <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                                <h3 className="text-sm font-bold uppercase text-white tracking-widest">Draft Preview (Landscape)</h3>
                                <div className="flex space-x-3">
                                    <button 
                                      onClick={handleShare}
                                      disabled={isSharing}
                                      className="flex items-center text-xs font-bold uppercase text-white hover:text-purple-400 disabled:opacity-50"
                                    >
                                      {isSharing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Share2 className="w-4 h-4 mr-1" />}
                                      Share PDF
                                    </button>
                                    <button onClick={handlePrint} className="flex items-center text-xs font-bold uppercase text-white hover:text-purple-400">
                                        <Printer className="w-4 h-4 mr-1" /> Print
                                    </button>
                                </div>
                             </div>
                             
                             <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-zinc-900" id="shot-list-print-area">
                                 <div className="max-w-6xl mx-auto bg-white text-black p-8 min-h-[800px] shadow-2xl" id="shot-list-pdf-content">
                                     <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
                                         <div>
                                            <h1 className="text-5xl font-bold uppercase tracking-tight leading-none mb-1">{generatedShotList.projectTitle || "Untitled Project"}</h1>
                                            <p className="text-sm font-mono text-gray-700 uppercase tracking-widest">Shot List / Storyboard</p>
                                         </div>
                                         <div className="text-right text-xs font-mono font-bold uppercase">
                                            <span>Date: {new Date().toLocaleDateString()}</span>
                                         </div>
                                     </div>

                                     {generatedShotList.scenes?.map((scene: any, sIdx: number) => (
                                         <div key={sIdx} className="mb-12 break-inside-avoid">
                                             <div className="bg-gray-100 p-4 mb-4 border-l-8 border-black flex justify-between items-center">
                                                 <div>
                                                    <h3 className="font-bold text-2xl uppercase flex items-center">
                                                        <span className="bg-black text-white px-3 py-1 mr-3 text-lg font-mono">SCENE {scene.sceneNumber}</span> 
                                                        {scene.location}
                                                    </h3>
                                                    <p className="text-sm text-gray-800 italic mt-1 ml-1">{scene.description}</p>
                                                 </div>
                                                 <button 
                                                    onClick={() => handleGenerateAllSketchesForScene(sIdx, scene.shots)}
                                                    data-html2canvas-ignore="true"
                                                    className="no-print bg-white border border-gray-300 hover:bg-black hover:text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center shadow-sm"
                                                 >
                                                     <ImageIcon className="w-3 h-3 mr-2" /> Sketch All
                                                 </button>
                                             </div>
                                             
                                             <table className="w-full text-left text-xs border-collapse table-fixed">
                                                 <thead>
                                                     <tr className="border-b-2 border-gray-300">
                                                         <th className="py-2 w-12 pl-2 text-gray-700 uppercase tracking-wider">#</th>
                                                         <th className="py-2 w-[220px] text-gray-700 uppercase tracking-wider">Visual</th>
                                                         <th className="py-2 w-28 pl-6 text-gray-700 uppercase tracking-wider">Spec</th>
                                                         <th className="py-2 pl-6 text-gray-700 uppercase tracking-wider">Action / Audio</th>
                                                         <th className="py-2 w-48 pl-6 text-gray-700 uppercase tracking-wider">Tech Notes</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-gray-200">
                                                     {scene.shots?.map((shot: any, shIdx: number) => {
                                                         const key = `${sIdx}-${shIdx}`;
                                                         const hasImage = !!shotImages[key];
                                                         const isLoading = !!loadingImages[key];
                                                         
                                                         return (
                                                             <tr key={shIdx} className="group hover:bg-gray-50 transition-colors">
                                                                 <td className="py-6 pl-2 font-bold text-lg align-middle text-gray-600 group-hover:text-black">
                                                                    {shot.shotNumber}
                                                                 </td>
                                                                 <td className="py-6 align-top">
                                                                     {hasImage ? (
                                                                         <img 
                                                                           src={shotImages[key]} 
                                                                           alt="Storyboard" 
                                                                           className="w-full aspect-video object-cover border-2 border-black shadow-md bg-zinc-100" 
                                                                         />
                                                                     ) : (
                                                                         <button 
                                                                            onClick={() => handleGenerateSketch(sIdx, shIdx, shot.description, shot.size)}
                                                                            disabled={isLoading}
                                                                            data-html2canvas-ignore="true"
                                                                            className="no-print w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-600 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300 group/btn"
                                                                            title="Generate Sketch"
                                                                         >
                                                                            {isLoading ? (
                                                                                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                                                                            ) : (
                                                                                <>
                                                                                    <Wand2 className="w-6 h-6 mb-2 group-hover/btn:scale-110 transition-transform" />
                                                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Sketch</span>
                                                                                </>
                                                                            )}
                                                                         </button>
                                                                     )}
                                                                 </td>
                                                                 <td className="py-6 pl-6 align-top">
                                                                     <div className="font-mono text-purple-700 font-bold text-lg mb-1">{shot.size}</div>
                                                                     <div className="uppercase text-[10px] font-bold tracking-wider text-gray-700 bg-gray-200 inline-block px-2 py-0.5 rounded-sm">
                                                                        {shot.type}
                                                                     </div>
                                                                 </td>
                                                                 <td className="py-6 pl-6 align-top">
                                                                     <p className="font-medium text-sm leading-relaxed text-gray-900">{shot.description}</p>
                                                                 </td>
                                                                 <td className="py-6 pl-6 align-top">
                                                                     <p className="text-gray-700 italic text-xs leading-relaxed border-l-2 border-gray-300 pl-3">
                                                                        {shot.notes}
                                                                     </p>
                                                                 </td>
                                                             </tr>
                                                         );
                                                     })}
                                                 </tbody>
                                             </table>
                                         </div>
                                     ))}
                                     
                                     <div className="mt-8 pt-8 border-t border-gray-300 flex justify-between items-center text-xs text-gray-600 uppercase tracking-widest font-mono">
                                         <span>Generated by SER.0</span>
                                         <span>Shoot.Edit.Release. // System V.2.1</span>
                                     </div>
                                 </div>
                             </div>
                        </>
                    )}

                    {!generatedShotList && !generatedCallSheet && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-12 text-center bg-black/50">
                            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                                {activeAiMode === 'shot_list' ? <FileSpreadsheet className="w-10 h-10 opacity-50" /> : <ClipboardList className="w-10 h-10 opacity-50" />}
                            </div>
                            <h3 className="text-2xl font-oswald uppercase text-white mb-2 tracking-wide">
                                {activeAiMode === 'shot_list' ? 'Shot List Canvas' : 'Call Sheet Canvas'}
                            </h3>
                            <p className="text-sm max-w-sm text-zinc-300 leading-relaxed">
                                Chat with SER.0 on the left to build your {activeAiMode === 'shot_list' ? 'production plan' : 'schedule'}. <br/>
                                Once generated, the document will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
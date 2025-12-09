import React, { useState } from 'react';
import { Estimate } from '../types';
import { Printer, ArrowLeft, CreditCard, Share2, MapPin, Mail, Phone, Loader2 } from 'lucide-react';

interface InvoiceViewProps {
  estimate: Estimate;
  onBack: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ estimate, onBack }) => {
  const [isSharing, setIsSharing] = useState(false);

  const calculateTotals = () => {
    const subtotal = estimate.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const markupAmount = subtotal * (estimate.markupPercent / 100);
    const taxableSubtotal = estimate.items.reduce((acc, item) => item.taxable ? acc + (item.quantity * item.rate) : acc, 0);
    const taxableAmount = taxableSubtotal + (taxableSubtotal * (estimate.markupPercent / 100));
    const taxAmount = taxableAmount * (estimate.taxPercent / 100);
    const total = subtotal + markupAmount + taxAmount;

    return { subtotal, markupAmount, taxAmount, total };
  };

  const totals = calculateTotals();

  const itemsByCategory: Record<string, typeof estimate.items> = {};
  estimate.items.forEach(item => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    setIsSharing(true);
    const businessName = estimate.details.businessName || 'Shoot.Edit.Release';
    const total = totals.total.toLocaleString(undefined, {minimumFractionDigits: 2});
    const fileName = `${estimate.details.projectName.replace(/\s+/g, '_')}_Estimate.pdf`;
    
    // Construct the text message
    const text = `ESTIMATE FOR REVIEW\n\nProject: ${estimate.details.projectName || 'Untitled'}\nFrom: ${businessName}\nTotal: $${total}\n\n${estimate.details.paymentLink ? `Payment Link: ${estimate.details.paymentLink}\n\n` : ''}Please review the attached PDF.`;

    try {
      // 1. Get the invoice element
      const element = document.getElementById('invoice-pdf-content');
      
      if (!element || !(window as any).html2pdf) {
         throw new Error("PDF Generation unavailable");
      }

      // 2. Generate PDF Blob
      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await (window as any).html2pdf().set(opt).from(element).output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 3. Share with file if supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Estimate: ${estimate.details.projectName}`,
          text: text,
        });
      } else {
        // Fallback: If file sharing not supported, download file and try text share
        // Create download link
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        // Then try simple text share
        if (navigator.share) {
             await navigator.share({
                title: `Estimate: ${estimate.details.projectName}`,
                text: text,
            });
        }
      }
    } catch (err) {
      console.log('Share canceled or failed', err);
      // Basic mailto fallback if everything fails
      const subject = encodeURIComponent(`Estimate: ${estimate.details.projectName} - For Review`);
      const body = encodeURIComponent(text);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } finally {
        setIsSharing(false);
    }
  };

  const businessName = estimate.details.businessName || 'Shoot.Edit.Release';
  const payableTo = estimate.details.payableTo || businessName;

  return (
    <div className="bg-zinc-950 min-h-screen p-4 md:p-8 text-black print:p-0 print:bg-white overflow-x-hidden">
      
      {/* Action Bar */}
      <div className="max-w-[210mm] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center no-print gap-4">
        <button onClick={onBack} className="flex items-center text-zinc-300 hover:text-white font-oswald uppercase tracking-wider text-sm self-start md:self-auto">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return
        </button>
        
        <div className="flex space-x-3 w-full md:w-auto">
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 md:flex-none justify-center bg-black border border-zinc-800 hover:border-white text-white px-6 py-2 font-oswald uppercase tracking-wider text-sm transition-all shadow-sm flex items-center hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-wait"
            >
              {isSharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              {isSharing ? 'Generating...' : 'Share PDF'}
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 md:flex-none justify-center bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-oswald uppercase tracking-wider text-sm shadow-lg shadow-red-900/20 flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
        </div>
      </div>

      {/* Invoice Paper - Scaled Container for Mobile */}
      <div className="w-full overflow-x-auto md:overflow-x-visible flex justify-center no-print">
          <div className="origin-top-left transform scale-[0.45] sm:scale-[0.6] md:scale-100 transition-transform duration-300">
              <div id="invoice-pdf-content" className="w-[210mm] bg-white min-h-[297mm] p-16 shadow-2xl relative overflow-hidden print:shadow-none print:m-0 print:p-12 print:overflow-visible">
                
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>
                <div className="absolute top-0 right-16 w-32 h-3 bg-red-600"></div>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-20">
                  <div className="pt-8">
                    <h1 className="text-6xl font-oswald font-bold tracking-tighter text-black uppercase leading-none">
                      In<span className="text-red-600">voice</span>
                    </h1>
                    <p className="font-mono text-sm text-zinc-600 mt-2">REF: {estimate.id.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                     {estimate.details.businessLogo ? (
                        <div className="mb-4 flex justify-end">
                            <img src={estimate.details.businessLogo} alt={businessName} className="h-16 w-auto object-contain" />
                        </div>
                     ) : (
                        <div className="text-xl font-oswald font-bold uppercase tracking-wide border-b-2 border-red-600 pb-1 mb-3 inline-block">
                            {businessName}
                        </div>
                     )}
                     
                     <div className="text-xs font-mono text-zinc-600 space-y-1">
                        {estimate.details.businessAddress && (
                            <div className="whitespace-pre-line">{estimate.details.businessAddress}</div>
                        )}
                        {estimate.details.businessEmail && <div>{estimate.details.businessEmail}</div>}
                        {estimate.details.businessPhone && <div>{estimate.details.businessPhone}</div>}
                        {(!estimate.details.businessAddress && !estimate.details.businessEmail) && <span>Production Services</span>}
                        <div className="pt-2 uppercase">{new Date().toLocaleDateString()}</div>
                     </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-16 mb-16">
                  <div className="border-l-2 border-black pl-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">Bill To</h3>
                    <p className="text-2xl font-oswald font-bold uppercase">{estimate.details.clientName || 'Unknown Client'}</p>
                    {estimate.details.email && <p className="font-mono text-sm mt-1">{estimate.details.email}</p>}
                  </div>
                  <div className="border-l-2 border-red-600 pl-6">
                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">Project</h3>
                     <p className="text-xl font-oswald font-bold uppercase">{estimate.details.projectName || 'Untitled'}</p>
                     <p className="font-mono text-sm mt-1">{estimate.details.location} // {estimate.details.projectDate}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-12">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-1/2">Description</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-center">Qty</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Rate</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {Object.entries(itemsByCategory).map(([category, items]) => (
                        <React.Fragment key={category}>
                          <tr>
                            <td colSpan={4} className="py-4 pt-8 text-xs font-bold uppercase text-red-600 tracking-widest">
                              {category}
                            </td>
                          </tr>
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 text-sm font-medium">{item.description}</td>
                              <td className="py-2 text-sm font-mono text-zinc-600 text-center">{item.quantity} {item.unit}</td>
                              <td className="py-2 text-sm font-mono text-zinc-600 text-right">${item.rate.toLocaleString()}</td>
                              <td className="py-2 text-sm font-bold font-mono text-right">${(item.quantity * item.rate).toLocaleString()}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                  <div className="w-5/12">
                    <div className="flex justify-between py-2 border-b border-zinc-100">
                      <span className="text-xs uppercase font-bold text-zinc-600">Subtotal</span>
                      <span className="font-mono text-sm font-bold">${totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    {estimate.markupPercent > 0 && (
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-xs uppercase font-bold text-zinc-600">Production Fee ({estimate.markupPercent}%)</span>
                        <span className="font-mono text-sm font-bold">${totals.markupAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-zinc-100">
                      <span className="text-xs uppercase font-bold text-zinc-600">Tax ({estimate.taxPercent}%)</span>
                      <span className="font-mono text-sm font-bold">${totals.taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between py-4 border-b-4 border-black mt-2 items-center">
                      <span className="text-xl font-oswald font-bold uppercase">Total</span>
                      <span className="text-2xl font-oswald font-bold text-red-600">${totals.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>

                    {/* Payment Button */}
                    {estimate.details.paymentLink && (
                      <div className="mt-8 text-right no-print" data-html2canvas-ignore="true">
                        <a 
                          href={estimate.details.paymentLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-oswald font-bold uppercase tracking-widest py-3 px-8 text-sm transition-colors shadow-lg shadow-red-600/20"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Invoice Now
                        </a>
                        <p className="text-[10px] text-zinc-400 mt-2 font-mono uppercase">Secure payment gateway</p>
                      </div>
                    )}
                    {/* Print friendly link - Ensure it shows in PDF */}
                     {estimate.details.paymentLink && (
                      <div className="mt-4 text-right">
                        <p className="text-xs font-mono text-zinc-600">PAY ONLINE:</p>
                        <p className="text-sm font-bold text-red-600 break-all">{estimate.details.paymentLink}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-16 left-16 right-16 border-t border-zinc-200 pt-6">
                   <div className="flex justify-between items-end">
                      <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest w-2/3">
                         Terms: Payment due within 30 days. <br/>
                         Checks payable to: <span className="text-black">{payableTo}</span>.
                      </div>
                      <div className="text-right">
                         <div className="w-16 h-1 bg-black mb-2 ml-auto"></div>
                         <p className="text-xs font-oswald font-bold uppercase">Authorized Signature</p>
                      </div>
                   </div>
                </div>

              </div>
          </div>
      </div>
    </div>
  );
};
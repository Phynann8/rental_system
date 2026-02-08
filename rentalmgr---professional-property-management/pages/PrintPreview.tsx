
import React from 'react';

const PrintPreview: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      <header className="no-print flex items-center justify-between bg-white border-b px-8 py-3 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-500">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">Print Preview</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">Receipt #INV-2023-001 • Ready to print</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="h-10 px-6 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2" onClick={() => window.print()}>
             <span className="material-symbols-outlined text-[20px]">print</span> Print Now
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-100/50">
        <div className="bg-white shadow-2xl w-full max-w-[794px] min-h-[1123px] flex flex-col p-8 space-y-8 relative">
           {/* Two identical copies */}
           {[1, 2].map((i) => (
             <div key={i} className={`flex-1 flex flex-col ${i === 1 ? 'border-b-2 border-dashed border-slate-100 pb-16' : 'pt-8'}`}>
               <div className="flex justify-between items-start mb-8">
                 <div className="flex gap-4">
                   <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">apartment</span></div>
                   <div>
                     <h1 className="text-xl font-black uppercase tracking-tight">Golden Tower Apts.</h1>
                     <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">No. 123, St. 456, Toul Kork, Phnom Penh, Cambodia</p>
                     <p className="text-xs text-slate-500">+855 12 345 678 | info@goldentower.com</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-widest mb-2">{i === 1 ? 'Official Receipt' : 'Owner Copy'}</span>
                   <h3 className="text-2xl font-bold">#INV-2023-001</h3>
                   <p className="text-xs text-slate-500 font-medium">Date: Oct 25, 2023</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Received From</span>
                    <p className="font-bold">Sokha Chan</p>
                    <p className="text-xs text-slate-500">Tenant ID: GT-402</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Property Unit</span>
                    <p className="font-bold">Room 402</p>
                    <p className="text-xs text-slate-500">4th Floor, Type B</p>
                  </div>
               </div>

               <table className="w-full text-sm mb-8">
                 <thead>
                   <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                     <th className="text-left py-2">Description</th>
                     <th className="text-right py-2">Usage</th>
                     <th className="text-right py-2">Rate</th>
                     <th className="text-right py-2">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    <tr><td className="py-3 font-bold text-slate-800">Room Rental<p className="text-[10px] text-slate-400 font-normal">Oct 1 - Oct 31, 2023</p></td><td className="text-right">1 Mo</td><td className="text-right">$350.00</td><td className="text-right font-bold">$350.00</td></tr>
                    <tr><td className="py-3 font-bold text-slate-800">Electricity<p className="text-[10px] text-slate-400 font-normal">Meter #EL-402</p></td><td className="text-right">50 kWh</td><td className="text-right">$0.25</td><td className="text-right font-bold">$12.50</td></tr>
                    <tr><td className="py-3 font-bold text-slate-800">Water Supply<p className="text-[10px] text-slate-400 font-normal">Meter #WT-402</p></td><td className="text-right">5 m³</td><td className="text-right">$0.50</td><td className="text-right font-bold">$2.50</td></tr>
                 </tbody>
               </table>

               <div className="flex justify-end pt-4 border-t border-slate-100">
                 <div className="w-56 space-y-2">
                    <div className="flex justify-between text-slate-500"><span className="text-xs">Subtotal</span><span className="font-bold">$365.00</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-bold">Grand Total (USD)</span><span className="text-xl font-black text-primary">$365.00</span></div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded text-[10px]"><span className="text-slate-400 italic">Rate: 1 USD = 4100 KHR</span><span className="font-bold">1,496,500 ៛</span></div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-12 mt-12 text-center text-[10px] font-bold uppercase text-slate-400">
                 <div className="space-y-2"><div className="border-b border-slate-200"></div>Paid By (Tenant)</div>
                 <div className="space-y-2"><div className="border-b border-slate-200"></div>Received By (Owner)</div>
               </div>
             </div>
           ))}
        </div>
      </main>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; overflow: visible !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintPreview;

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PassbookPage() {
  const t = useTranslations('Passbook');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  
  // Existing states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pdfError, setPdfError] = useState('');

  // New Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState('10');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data for name
        const userRes = await fetch('/api/dashboard');
        if (userRes.status === 401) return router.push(`/${locale}`);
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        // Fetch transactions for display
        const transRes = await fetch('/api/transactions');
        const transData = await transRes.json();
        if (transData.transactions) {
          setTransactions(transData.transactions);
        }
      } catch (error) {
        console.error("Error fetching passbook data", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [locale, router]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setPdfError('');
    try {
      // Fetch specifically for the PDF based on limit
      const transRes = await fetch(`/api/transactions?limit=${selectedLimit}`);
      const transData = await transRes.json();
      
      const pdfTransactions = transData.transactions || [];
      
      if (pdfTransactions.length === 0) {
        setPdfError('No transactions available for the selected range.');
        setIsGenerating(false);
        return;
      }

      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(`SaveMate ${t('title')}`, 14, 22);

      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(`${t('accountHolder')}: ${user?.name || t('fallbackUser')}`, 14, 32);
      doc.text(`${t('generatedOn')}: ${new Date().toLocaleString('en-IN')}`, 14, 40);

      const tableColumn = [t('dateHeader'), t('typeHeader'), t('sourceHeader'), t('amountHeader')];
      const tableRows = [];

      pdfTransactions.forEach(tRow => {
        const d = new Date(tRow.date);
        const amountPrefix = tRow.type === 'withdraw' ? '-' : '+';
        tableRows.push([
          `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          t(tRow.type) || tRow.type.toUpperCase(),
          tRow.source.toUpperCase().replace('_', ' '),
          `${amountPrefix} ${t('rs')} ${tRow.amount.toLocaleString('en-IN')}`
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [30, 215, 96], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { top: 10 }
      });

      const filename = `SaveMate_Passbook_${new Date().toISOString().split('T')[0]}.pdf`;

      // Use blob URL for most reliable download across browsers
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Close modal on success
      setIsModalOpen(false);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfError('Failed to generate PDF. Please try again.');
    }
    setIsGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#1ED760]/30 p-4 md:p-12 pb-32">
      
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        
        {/* TOP NAV & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all border border-transparent group shrink-0">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={transactions.length === 0}
            className="flex items-center justify-center gap-3 bg-[#1ED760] text-black px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 text-sm uppercase tracking-widest disabled:opacity-60"
          >
            <Download size={18} strokeWidth={3} /> {t('downloadPdf')}
          </button>
        </div>

        {/* HEADER AREA */}
        <header className="bg-white/[0.02] p-8 md:p-12 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1ED760] to-[#4ade80]"></div>
          <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 group-hover:-translate-x-4 transition-all duration-1000">
             <FileText size={240} />
          </div>
          <div className="relative z-10 w-20 h-20 bg-[#1ED760]/10 text-[#1ED760] rounded-[28px] flex items-center justify-center border border-[#1ED760]/20">
            <FileText size={40} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1ED760]" style={{ textShadow: "0 0 40px rgba(30,215,96,0.3)" }}>{t('title')}</h1>
            <p className="text-[10px] text-[#888888] uppercase tracking-[0.4em] font-black mt-2">{t('description')}</p>
          </div>
        </header>

        {/* TRANSACTIONS TABLE */}
        <div className="rounded-[32px] overflow-hidden border border-white/5 shadow-2xl bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="p-6 text-[10px] font-black text-[#888888] uppercase tracking-[0.2em]">{t('dateHeader')}</th>
                  <th className="p-6 text-[10px] font-black text-[#888888] uppercase tracking-[0.2em]">{t('typeHeader')}</th>
                  <th className="p-6 text-[10px] font-black text-[#888888] uppercase tracking-[0.2em]">{t('sourceHeader')}</th>
                  <th className="p-6 text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] text-right">{t('amountHeader')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-16 text-center text-[#888888] font-medium italic">{t('noTransactions')}</td>
                  </tr>
                ) : (
                  transactions.map((tRow, i) => (
                    <tr key={tRow._id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="p-6">
                        <div className="font-black text-white">{new Date(tRow.date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#888888] font-black uppercase tracking-widest mt-1">{new Date(tRow.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                          tRow.type === 'income' ? 'bg-[#1ED760]/10 text-[#1ED760] border-[#1ED760]/20 group-hover:bg-[#1ED760]/20' : 
                          tRow.type === 'save' ? 'bg-white/5 text-white border-white/10 group-hover:bg-white/10' : 
                          tRow.type === 'withdraw' ? 'bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500/20' :
                          'bg-white/5 text-[#888888] border-white/5'
                        }`}>
                          {t(tRow.type) || tRow.type}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="text-sm font-bold text-[#888888] capitalize group-hover:text-white transition-colors">{tRow.source.replace('_', ' ')}</div>
                      </td>
                      <td className={`p-6 text-right font-black text-2xl tracking-tighter ${tRow.type === 'withdraw' ? 'text-red-500' : 'text-[#1ED760]'}`} style={tRow.type !== 'withdraw' ? { textShadow: "0 0 20px rgba(30,215,96,0.3)" } : {}}>
                        {tRow.type === 'withdraw' ? '-' : '+'}₹{tRow.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DOWNLOAD MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(30,215,96,0.05)] overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#121212]/90 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Download Passbook</h3>
                <p className="text-[11px] text-[#888] font-bold uppercase tracking-wider mt-1">Select transaction range</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isGenerating}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[#aaa] hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3">
              {[
                { value: '10', label: 'Last 10 Transactions' },
                { value: '50', label: 'Last 50 Transactions' },
                { value: 'all', label: 'All Transactions' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedLimit(option.value)}
                  disabled={isGenerating}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200
                    ${selectedLimit === option.value 
                      ? 'bg-[#1ED760]/10 border-[#1ED760]/50 shadow-[0_0_20px_rgba(30,215,96,0.15)] scale-[1.02]' 
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/20 text-[#aaa] hover:text-white'
                    }
                    disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                  `}
                >
                  <span className={`font-bold text-sm ${selectedLimit === option.value ? 'text-[#1ED760]' : ''}`}>
                    {option.label}
                  </span>
                  {selectedLimit === option.value && (
                    <div className="w-4 h-4 rounded-full bg-[#1ED760] flex items-center justify-center shadow-[0_0_10px_rgba(30,215,96,0.8)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#121212]"></div>
                    </div>
                  )}
                </button>
              ))}

              {pdfError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400 font-bold text-center">{pdfError}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#1ED760] text-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_4px_20px_rgba(30,215,96,0.3)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} strokeWidth={3} />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { PageView } from '../types';
import { Sparkles, Calendar, CheckCircle2, Phone, ChevronRight } from 'lucide-react';
import { CLINIC_SETTINGS } from '../data/mockData';
import { COUNTRIES, detectCountryCode } from '../components/BookingModal';

interface BookOnlineViewProps {
  onSelectView: (view: PageView) => void;
  onOpenBooking: () => void;
}

export const BookOnlineView: React.FC<BookOnlineViewProps> = ({ onSelectView }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', subject: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState('US');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryIndex, setCountryIndex] = useState(0);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    detectCountryCode().then(code => setCountryCode(code));
  }, []);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === 'US')!;

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch.replace(/\D/g, ''))
      )
    : COUNTRIES;

  const selectCountry = (code: string) => {
    setCountryCode(code);
    setCountryOpen(false);
    setCountrySearch('');
    phoneInputRef.current?.focus();
  };

  const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCountryIndex(i => Math.min(i + 1, filteredCountries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCountryIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries[countryIndex]) selectCountry(filteredCountries[countryIndex].code);
    } else if (e.key === 'Escape') {
      setCountryOpen(false);
      phoneInputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: `${selectedCountry.dial} ${formData.phone}`,
          serviceName: formData.subject || 'General Checkup',
          notes: formData.message,
          preferredDate: new Date().toISOString().split('T')[0],
          preferredTimeSlot: '09:00 AM',
          serviceId: 'general-consult',
          doctorPreference: 'Any Available',
          insuranceProvider: 'Private Insurance',
          isNewPatient: true
        })
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
    } catch (err) {
      alert('Failed to submit booking. Please call us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Left Pane - Premium Branding */}
        <div className="hidden md:flex md:w-5/12 relative bg-slate-900 flex-col p-10 overflow-hidden justify-between">
          <div className="absolute inset-0">
            <img src="https://static.wixstatic.com/media/02c124_bfd56d5c986d465ea09e0bc641b8ce19~mv2.jpg" alt="Clinic Office" className="w-full h-full object-cover opacity-50 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
            <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply" />
          </div>
          
          <div className="relative z-10 flex items-center gap-2">
            <img src="/logo.png" alt="First Avenue Dentistry Logo" className="h-10 w-auto object-contain drop-shadow-md" />
          </div>

          <div className="relative z-10 space-y-6 mt-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              5-Star Rated Clinic
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">Experience<br/>Dentistry<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Redefined.</span></h2>
              <p className="text-sm text-blue-100/80 leading-relaxed max-w-xs font-medium">Book your consultation today and take the first step towards a healthier, brighter smile.</p>
            </div>
          </div>
        </div>

        {/* Right Pane - Form */}
        <div className="w-full md:w-7/12 flex flex-col bg-white p-8 sm:p-10">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-700 py-10">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xl relative z-10">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Request Confirmed!</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">We've received your request. Our team will contact you within 2 business hours to finalize your appointment time.</p>
              </div>
              <button onClick={() => setSubmitted(false)} className="px-10 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:scale-95 mt-6">
                Book Another
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Book Appointment</h2>
                <p className="text-sm text-slate-500">Please fill out the details below and we will get back to you.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">First Name *</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Last Name *</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="john.doe@example.com" />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Country & Phone *</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors w-[130px]">
                      <span className="flex items-center gap-2 text-sm"><span className="text-slate-400 font-mono text-xs">{selectedCountry.code}</span> {selectedCountry.dial}</span>
                    </button>
                    <input required type="tel" ref={phoneInputRef} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="(555) 000-0000" />
                  </div>

                  {countryOpen && (
                    <div className="absolute top-[75px] left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <input autoFocus type="text" placeholder="Search country..." value={countrySearch} onChange={e => { setCountrySearch(e.target.value); setCountryIndex(0); }} onKeyDown={handleCountryKeyDown} className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500" />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {filteredCountries.length === 0 ? <div className="p-2 text-sm text-slate-500 text-center">No results</div> : filteredCountries.map((c, i) => (
                          <button key={c.code} type="button" onClick={() => selectCountry(c.code)} className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition-colors ${i === countryIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}>
                            <span className="flex items-center gap-2"><span className="w-5 text-xs text-slate-400 font-mono">{c.code}</span>{c.name}</span>
                            <span className="text-slate-400 font-mono text-xs">{c.dial}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                  <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="e.g. General Checkup" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message</label>
                  <textarea rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none text-sm custom-scrollbar" placeholder="Any specific concerns?" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  <Calendar className="w-4 h-4" /> Submit Booking Request
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

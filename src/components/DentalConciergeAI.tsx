import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, RefreshCw, Calendar, Check } from 'lucide-react';
import { COUNTRIES, detectCountryCode } from './BookingModal';
import { parseFlexibleDate, toSlug, isDateInPast, formatFriendlyDate, todaySlug } from '../lib/dateUtil';

interface DentalConciergeAIProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

type BookingStage =
  | null
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'service'
  | 'date'
  | 'time'
  | 'notes'
  | 'confirm'
  | 'editField'
  | 'editValue';

interface BookingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes: string;
}

export const DentalConciergeAI: React.FC<DentalConciergeAIProps> = ({
  isOpen,
  onClose,
  onOpenBooking
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: "Hello! I am the First Avenue AI assistant. Ask me anything about our dental services, appointment scheduling, or general dental care!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStage, setBookingStage] = useState<BookingStage>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    firstName: '', lastName: '', email: '', phone: '', service: '', date: '', time: '', notes: ''
  });
  const [services, setServices] = useState<{id: string, label: string}[]>([]);
  const [editTarget, setEditTarget] = useState<string>('');
  const [countryCode, setCountryCode] = useState('US');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryListOpen, setCountryListOpen] = useState(false);
  const [countryIndex, setCountryIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    detectCountryCode().then(code => {
      setCountryCode(code);
      const c = COUNTRIES.find(x => x.code === code);
      if (c) setCountrySearch(c.name);
    });
    fetch('/api/services')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setServices(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const addAiMsg = (text: string) => {
    setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text }]);
  };

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === 'CA')!;

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch.replace(/\D/g, ''))
      )
    : COUNTRIES;

  const selectCountry = (c: { code: string, name: string }) => {
    setCountryCode(c.code);
    setCountrySearch(c.name);
    setCountryListOpen(false);
    chatInputRef.current?.focus();
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
      if (filteredCountries[countryIndex]) selectCountry(filteredCountries[countryIndex]);
    } else if (e.key === 'Escape') {
      setCountryListOpen(false);
      chatInputRef.current?.focus();
    }
  };

  const submitBooking = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          serviceName: bookingData.service,
          preferredDate: bookingData.date,
          preferredTimeSlot: bookingData.time,
          notes: bookingData.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        addAiMsg(`Wonderful! Your appointment request has been submitted successfully! 🎉

Here's a summary:
• Name: ${bookingData.firstName} ${bookingData.lastName}
• Email: ${bookingData.email}
• Phone: ${bookingData.phone}
• Service: ${bookingData.service}
• Date: ${bookingData.date}
• Time: ${bookingData.time}
• Notes: ${bookingData.notes || 'None'}

Our team at First Avenue Dentistry will review your request and send a confirmation shortly. You'll receive an email at ${bookingData.email} with the details.

Is there anything else I can help you with?`);
      } else {
        addAiMsg("I'm sorry, there was an issue submitting your appointment. Please try again or call us at (519) 207-6890 for assistance.");
      }
    } catch {
      addAiMsg("I'm having trouble connecting to our booking system. Please call us directly at (519) 207-6890 to schedule your appointment.");
    } finally {
      setIsLoading(false);
      setBookingStage(null);
      setBookingData({ firstName: '', lastName: '', email: '', phone: '', service: '', date: '', time: '', notes: '' });
    }
  };

  const handleBookingInput = (value: string) => {
    if (!bookingStage) return false;

    switch (bookingStage) {
      case 'firstName':
        setBookingData(prev => ({ ...prev, firstName: value }));
        setBookingStage('lastName');
        addAiMsg(`Nice to meet you, ${value}! What's your last name?`);
        return true;

      case 'lastName':
        setBookingData(prev => ({ ...prev, lastName: value }));
        setBookingStage('email');
        addAiMsg(`Great! What email address should we send the confirmation to?`);
        return true;

      case 'email':
        if (!value.includes('@')) {
          addAiMsg("That doesn't look like a valid email. Could you please enter a valid email address?");
          return true;
        }
        setBookingData(prev => ({ ...prev, email: value }));
        setBookingStage('phone');
        addAiMsg(`Perfect! Now please select your country code (use the search box above and type to find your country) and then type your phone number so we can reach you if needed.`);
        return true;

      case 'phone': {
        setBookingData(prev => ({ ...prev, phone: `${selectedCountry.dial} ${value}` }));
        setCountryListOpen(false);
        setBookingStage('service');
        const serviceList = services.map(s => s.label).join(', ');
        addAiMsg(`Thanks! Your number ${selectedCountry.dial} ${value} has been noted. What service are you looking for? ${serviceList ? `(e.g., ${serviceList})` : ''}`);
        return true;
      }

      case 'service': {
        setBookingData(prev => ({ ...prev, service: value }));
        setBookingStage('date');
        addAiMsg(`Got it. What date would you like to come in? (today is ${todaySlug()}; pick any date from today onward, e.g. ${formatFriendlyDate(new Date(Date.now() + 2 * 86400000))})`);
        return true;
      }

      case 'date': {
        const parsed = parseFlexibleDate(value);
        if (!parsed) {
          addAiMsg("I couldn't recognize that date. Please reply like 2026-08-15 or August 15, 2026.");
          return true;
        }
        if (isDateInPast(toSlug(parsed))) {
          addAiMsg(`That date (${formatFriendlyDate(parsed)}) has already passed — please pick a date from today onward.`);
          return true;
        }
        setBookingData(prev => ({ ...prev, date: toSlug(parsed) }));
        setBookingStage('time');
        addAiMsg(`Great — ${formatFriendlyDate(parsed)} works! What time works best for you? (e.g., 10:00 AM, 2:30 PM)`);
        return true;
      }

      case 'time':
        setBookingData(prev => ({ ...prev, time: value }));
        setBookingStage('notes');
        addAiMsg(`Any special requests or notes for the dentist? (If not, just type "none")`);
        return true;

      case 'notes':
        setBookingData(prev => ({ ...prev, notes: value === 'none' ? '' : value }));
        setBookingStage('confirm');
        addAiMsg(`Let me confirm your appointment details:

• Name: ${bookingData.firstName} ${bookingData.lastName}
• Email: ${bookingData.email}
• Phone: ${bookingData.phone}
• Service: ${bookingData.service}
• Date: ${bookingData.date}
• Time: ${bookingData.time}
${(value !== 'none' && value !== '') ? `• Notes: ${value}` : ''}

Does everything look correct? Reply "yes" to submit, "edit" to make changes, or "no" to start over.`);
        return true;

      case 'confirm':
        if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'yep' || value.toLowerCase() === 'correct') {
          submitBooking();
        } else if (value.toLowerCase() === 'edit' || value.toLowerCase().includes('change')) {
          setBookingStage('editField');
          addAiMsg("Which field would you like to edit? (Reply with one of: name, email, phone, service, date, time, notes)");
        } else {
          setBookingStage('firstName');
          setBookingData({ firstName: '', lastName: '', email: '', phone: '', service: '', date: '', time: '', notes: '' });
          addAiMsg("No problem! Let's start over. What's your first name?");
        }
        return true;

      case 'editField': {
        const field = value.toLowerCase();
        if (field.includes('name')) {
          setEditTarget('name');
          setBookingStage('editValue');
          addAiMsg(`Current name is ${bookingData.firstName} ${bookingData.lastName}. What should the new name be? (First Last)`);
        } else if (field.includes('email')) {
          setEditTarget('email');
          setBookingStage('editValue');
          addAiMsg(`Current email is ${bookingData.email}. What should the new email be?`);
        } else if (field.includes('phone')) {
          setEditTarget('phone');
          setBookingStage('editValue');
          addAiMsg(`Current phone is ${bookingData.phone}. What should the new phone number be?`);
        } else if (field.includes('service')) {
          setEditTarget('service');
          setBookingStage('editValue');
          addAiMsg(`Current service is ${bookingData.service}. What service do you need?`);
        } else if (field.includes('date')) {
          setEditTarget('date');
          setBookingStage('editValue');
          addAiMsg(`Current date is ${bookingData.date}. What should the new date be? (e.g. 2026-08-15)`);
        } else if (field.includes('time')) {
          setEditTarget('time');
          setBookingStage('editValue');
          addAiMsg(`Current time is ${bookingData.time}. What should the new time be?`);
        } else if (field.includes('note')) {
          setEditTarget('notes');
          setBookingStage('editValue');
          addAiMsg(`Current notes are: ${bookingData.notes}. What should the new notes be?`);
        } else {
          addAiMsg("I didn't catch that. Please reply with one of: name, email, phone, service, date, time, notes");
        }
        return true;
      }

      case 'editValue': {
        if (editTarget === 'name') {
          const parts = value.split(' ');
          const first = parts[0];
          const last = parts.slice(1).join(' ') || '';
          setBookingData(prev => ({ ...prev, firstName: first, lastName: last }));
        } else if (editTarget === 'email') {
          if (!value.includes('@')) {
            addAiMsg("That doesn't look like a valid email. Could you please enter a valid email address?");
            return true;
          }
          setBookingData(prev => ({ ...prev, email: value }));
        } else if (editTarget === 'phone') {
          setBookingData(prev => ({ ...prev, phone: value }));
        } else if (editTarget === 'service') {
          setBookingData(prev => ({ ...prev, service: value }));
        } else if (editTarget === 'date') {
          const parsed = parseFlexibleDate(value);
          if (!parsed) {
            addAiMsg("I couldn't recognize that date. Please reply like 2026-08-15 or August 15, 2026.");
            return true;
          }
          if (isDateInPast(toSlug(parsed))) {
            addAiMsg(`That date has already passed. Please pick a date from today onward.`);
            return true;
          }
          setBookingData(prev => ({ ...prev, date: toSlug(parsed) }));
        } else if (editTarget === 'time') {
          setBookingData(prev => ({ ...prev, time: value }));
        } else if (editTarget === 'notes') {
          setBookingData(prev => ({ ...prev, notes: value === 'none' ? '' : value }));
        }

        // Re-confirm after edit
        setBookingStage('confirm');
        addAiMsg(`Got it! I've updated the ${editTarget}. Let me re-confirm your appointment details:

• Name: ${editTarget === 'name' ? value : `${bookingData.firstName} ${bookingData.lastName}`}
• Email: ${editTarget === 'email' ? value : bookingData.email}
• Phone: ${editTarget === 'phone' ? value : bookingData.phone}
• Service: ${editTarget === 'service' ? value : bookingData.service}
• Date: ${editTarget === 'date' ? toSlug(parseFlexibleDate(value)!) : bookingData.date}
• Time: ${editTarget === 'time' ? value : bookingData.time}
• Notes: ${editTarget === 'notes' ? value : bookingData.notes}

Does everything look correct? Reply "yes" to submit, "edit" to make changes, or "no" to start over.`);
        return true;
      }
    }
    return false;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);

    if (bookingStage) {
      handleBookingInput(userText);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/dental-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();

      if (data.action === 'booking_start') {
        setBookingStage('firstName');
      }

      addAiMsg(data.answer || "Thank you for reaching out! Our team at First Avenue Dentistry is here to help.");
    } catch {
      addAiMsg("I'm having trouble connecting. Please call us directly at (519) 207-6890 for immediate assistance!");
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    "What services do you offer?",
    "Do you accept new patients?",
    "What are your office hours?",
    "Do you offer teeth whitening?"
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      <div className="p-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              First Avenue AI
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[11px] text-blue-100">Dental Care Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map(m => (
          <div key={m.id} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-white rounded-xl w-fit border border-slate-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
            AI is composing a response...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!bookingStage && (
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200">
          <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5">Quick Questions:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setInput("I'd like to book an appointment"); }}
              className="text-[10px] text-blue-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 hover:bg-blue-50 transition-colors truncate"
            >
              Book an Appointment
            </button>
            <button
              onClick={() => setInput("What services do you offer?")}
              className="text-[10px] text-blue-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 hover:bg-blue-50 transition-colors truncate"
            >
              What services do you offer?
            </button>
          </div>
        </div>
      )}

      {bookingStage === 'phone' && (
        <div className="px-4 py-3 bg-slate-100/70 border-t border-slate-200 space-y-2">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Country Code (type to search)</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => { setCountrySearch(e.target.value); setCountryListOpen(true); setCountryIndex(0); }}
              onFocus={() => setCountryListOpen(true)}
              onKeyDown={handleCountryKeyDown}
              placeholder="Search country, code or +dial..."
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setCountryListOpen(!countryListOpen)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              {selectedCountry.dial}
            </button>
          </div>
          {countryListOpen && (
            <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
              {filteredCountries.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400">No countries found. Try another spelling.</div>
              )}
              {filteredCountries.map((c, i) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c.code)}
                  onMouseEnter={() => setCountryIndex(i)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                    i === countryIndex ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span className="w-10 shrink-0">{c.dial}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400 shrink-0">{c.code}</span>
                  {c.code === countryCode && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400">Use ↑ ↓ arrows + Enter to pick, or just type your number in the chat box ({selectedCountry.dial} will be used).</p>
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          ref={chatInputRef}
          type="text"
          placeholder={bookingStage ? "Type your response..." : "Ask a question..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="p-3 bg-blue-600 text-white text-center flex items-center justify-between text-xs px-4">
        <span className="text-blue-100">Ready to book an appointment?</span>
        <button
          onClick={() => { onClose(); onOpenBooking(); }}
          className="px-3 py-1.5 rounded-lg bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors text-[11px]"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};
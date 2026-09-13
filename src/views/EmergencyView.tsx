import React from 'react';
import { PageView } from '../types';
import { CLINIC_SETTINGS } from '../data/mockData';
import { ShieldAlert, PhoneCall, AlertTriangle, ArrowRight, HeartPulse, Stethoscope, Activity } from 'lucide-react';

interface EmergencyViewProps {
  onSelectView: (view: PageView) => void;
  onOpenBooking: (serviceId?: string, isEmergency?: boolean) => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ onSelectView, onOpenBooking }) => {
  const emergencies = [
    {
      title: "Severe Toothache",
      urgency: "HIGH PRIORITY",
      icon: <Activity className="w-5 h-5 text-red-500" />,
      steps: ["Rinse mouth thoroughly with warm salt water.", "Gently floss around tooth to remove lodged food debris.", "Apply cold compress to outside of cheek.", "Call our office immediately for an appointment."]
    },
    {
      title: "Fractured Tooth",
      urgency: "MODERATE PRIORITY",
      icon: <Stethoscope className="w-5 h-5 text-amber-500" />,
      steps: ["Save any broken tooth fragments.", "Rinse mouth with warm water.", "Cover sharp tooth edge with dental wax.", "Contact us to schedule a same-day repair."]
    },
    {
      title: "Knocked-Out Tooth",
      urgency: "CRITICAL ACTION",
      icon: <HeartPulse className="w-5 h-5 text-red-600" />,
      steps: ["Pick up tooth ONLY by the crown.", "Rinse gently with cold water. Do NOT scrub.", "Attempt to re-insert tooth into socket gently, or store in cold milk.", "Call emergency line immediately (30-60 min window)."]
    }
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-slate-50 flex flex-col items-center px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-6xl space-y-10">
        
        {/* Hero Section */}
        <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-800">
          <div className="absolute inset-0">
            <img src="https://static.wixstatic.com/media/02c124_bfd56d5c986d465ea09e0bc641b8ce19~mv2.jpg" alt="Clinic Office" className="w-full h-full object-cover opacity-20 scale-105 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-900/20" />
          </div>
          
          <div className="relative z-10 flex-1 p-10 sm:p-14 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md self-start">
              <ShieldAlert className="w-4 h-4" /> 24/7 Emergency Care
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Immediate Dental<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Emergency Support.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl font-medium">Experiencing severe pain, a knocked-out tooth, or critical trauma? We offer priority scheduling for urgent cases.</p>
          </div>
          
          <div className="relative z-10 w-full md:w-5/12 bg-white/5 backdrop-blur-xl border-l border-white/10 p-10 flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
              <PhoneCall className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-300 uppercase tracking-wider font-semibold mb-2">Emergency Hotline</p>
              <a href={`tel:${CLINIC_SETTINGS.phone.replace(/\D/g, '')}`} className="text-3xl font-black text-white hover:text-red-400 transition-colors">
                {CLINIC_SETTINGS.phone}
              </a>
            </div>
            <button onClick={() => onOpenBooking(undefined, true)} className="w-full py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-xl">
              Book Urgent Appointment
            </button>
          </div>
        </div>

        {/* Emergency Steps */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Emergency Guidelines</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {emergencies.map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden group transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-10 transition-transform duration-500">
                  {item.icon}
                </div>
                
                <div className="space-y-4 relative z-10 flex-1">
                  <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${idx === 2 ? 'bg-red-100 text-red-700' : idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.urgency}
                  </span>
                  
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  
                  <ul className="space-y-3 pt-2">
                    {item.steps.map((s, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{sIdx + 1}</span>
                        <span className="text-sm text-slate-600 font-medium leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button onClick={() => onOpenBooking(undefined, true)} className="mt-8 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  Book Urgent <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

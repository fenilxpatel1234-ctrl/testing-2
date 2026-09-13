import React from 'react';
import { PageView } from '../types';
import { HOME_FEATURES, SERVICE_CATEGORIES_HOME, PILLARS_OF_CARE, CLINIC_SETTINGS } from '../data/mockData';
import { ToothCanvas } from '../components/3d/ToothCanvas';
import { ReviewsSection } from '../components/ReviewsSection';
import { Sparkles, Calendar, Phone, Clock, MapPin, ChevronRight, Bot } from 'lucide-react';

interface HomeViewProps {
  onSelectView: (view: PageView) => void;
  onOpenBooking: () => void;
  onSelectService: (serviceId: string) => void;
  onToggleAiDrawer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectView, onOpenBooking, onSelectService, onToggleAiDrawer }) => {
  return (
    <div className="space-y-20 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-white to-slate-50 pointer-events-none"></div>
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: "url('https://static.wixstatic.com/media/02c124_36a52e4cab754ef580b36acfdbe42d01~mv2.jpg')" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-600 text-xs font-semibold shadow-sm mb-6">
                <Sparkles className="w-4 h-4" />
                Welcome to First Avenue Dentistry
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Join Our Family <br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  of Smiles
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
                Looking for a dental team that makes your comfort and care a priority? Our friendly professionals provide comprehensive general and cosmetic dentistry in a modern, welcoming environment. Whether it's a routine checkup or a smile makeover, we're here to make your visit easy and stress-free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onOpenBooking}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Your Visit Today
                </button>
                <div className="relative">
                  <button
                    onClick={onToggleAiDrawer}
                    className="w-full sm:w-auto px-6 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10"
                  >
                    <Bot className="w-4 h-4 text-blue-500" />
                    Ask AI Assistant
                  </button>
                  {/* AI Notification Popup */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap animate-bounce z-0">
                    Hi! I am the AI chat bot. How can I help you?
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-blue-600 to-cyan-500 rotate-45 rounded-sm" />
                  </div>
                </div>
              </div>
              <a
                href={`mailto:${CLINIC_SETTINGS.email}?subject=BOOKING%20FROM%20FIRST%20AVENUE%20DENTIST`}
                className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline"
              >
                Or Email — {CLINIC_SETTINGS.email}
              </a>
            </div>

            {/* 3D Tooth - Desktop only */}
            <div className="hidden lg:block lg:col-span-5 h-[420px] rounded-3xl bg-gradient-to-b from-blue-50/50 via-white to-slate-50 p-2 border border-slate-200/80 shadow-2xl relative overflow-hidden">
              <ToothCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* WHY PATIENTS CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Patients Choose Us
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOME_FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg text-center space-y-3 hover:shadow-xl transition-all"
            >
              <img src={feature.image} alt={feature.title} className="w-16 h-16 mx-auto object-contain" />
              <h3 className="font-bold text-slate-900 text-sm">{feature.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE DO - SERVICE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Dental Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICE_CATEGORIES_HOME.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg hover:shadow-xl transition-all"
            >
              <img src={cat.image} alt={cat.title} className="w-14 h-14 object-contain mb-4" />
              <h3 className="font-bold text-slate-900 text-sm mb-3">{cat.title}</h3>
              <ul className="space-y-2">
                {cat.items.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAMILY-FIRST DENTIST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-12 space-y-6">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">Family-First Dentist</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              The Leading Family Dental Care Clinic in St. Thomas, ON
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you on the lookout for comprehensive dental care in St. Thomas, ON? Head over to First Avenue Dentistry today where your dental health and comfort are our top priorities.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              As one of the leading dental care clinics in St. Thomas, ON, we take pride in our unparalleled expertise and incomparable experience. We understand the importance of a healthy smile and the peace of mind that comes with knowing you have access to emergency dental services when you need them the most.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our team of dental care experts is committed to excellence and goes beyond just emergency care; we offer a wide range of services encompassing family dentistry and cosmetic dentistry to ensure every aspect of your dental health is addressed with compassion. So what are you waiting for? Head on over to our family dental clinic today for customized dental treatment.
            </p>
            <button
              onClick={() => onSelectView('our-team')}
              className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              About Our Practice <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-80 lg:h-auto bg-slate-100">
            <img
              src="https://static.wixstatic.com/media/2a5871_80caaa27bd5949c89db52cd2ab65c1bf~mv2.png"
              alt="First Avenue Dentistry Team"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* THREE PILLARS OF CARE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">We Offer</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Three Pillars of Care for Every Patient
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS_OF_CARE.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg text-center space-y-4 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto font-black text-lg shadow-md">
                {pillar.number}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{pillar.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* APPOINTMENT CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Request An Appointment Today</h2>
            <p className="text-sm text-blue-100">
              Takes 30 seconds — we'll confirm by phone.
            </p>
            <button
              onClick={onOpenBooking}
              className="px-8 py-4 rounded-full bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-colors shadow-lg inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Request an Appointment
            </button>
            <p className="text-xs text-blue-200">
              Or call us at <a href={`tel:${CLINIC_SETTINGS.phone.replace(/\D/g, '')}`} className="font-bold underline">{CLINIC_SETTINGS.phone}</a>
            </p>
          </div>
        </div>
      </section>

      {/* PATIENT REVIEWS */}
      <ReviewsSection onSelectView={onSelectView} />

      {/* LOCATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-10 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Visit Our Office</h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{CLINIC_SETTINGS.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <a href={`tel:${CLINIC_SETTINGS.phone.replace(/\D/g, '')}`} className="hover:text-blue-600 font-semibold">{CLINIC_SETTINGS.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Mon-Fri: {CLINIC_SETTINGS.hours.weekdays} | Sat: {CLINIC_SETTINGS.hours.saturday}</span>
              </div>
            </div>
            <button
              onClick={onOpenBooking}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Book Appointment
            </button>
          </div>
          <div className="h-[300px] lg:h-auto bg-slate-200">
            <iframe
              title="First Avenue Dentistry Location"
              src={CLINIC_SETTINGS.googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

    </div>
  );
};

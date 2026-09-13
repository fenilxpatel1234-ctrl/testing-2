import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Doctor, ServiceListEntry } from '../types';
import { isDateInPast, todaySlug } from '../lib/dateUtil';

export const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', dial: '+93' },
  { code: 'AL', name: 'Albania', dial: '+355' },
  { code: 'DZ', name: 'Algeria', dial: '+213' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'AM', name: 'Armenia', dial: '+374' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994' },
  { code: 'BH', name: 'Bahrain', dial: '+973' },
  { code: 'BD', name: 'Bangladesh', dial: '+880' },
  { code: 'BY', name: 'Belarus', dial: '+375' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'BJ', name: 'Benin', dial: '+229' },
  { code: 'BO', name: 'Bolivia', dial: '+591' },
  { code: 'BA', name: 'Bosnia & Herzegovina', dial: '+387' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'BN', name: 'Brunei', dial: '+673' },
  { code: 'BG', name: 'Bulgaria', dial: '+359' },
  { code: 'KH', name: 'Cambodia', dial: '+855' },
  { code: 'CM', name: 'Cameroon', dial: '+237' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'CR', name: 'Costa Rica', dial: '+506' },
  { code: 'HR', name: 'Croatia', dial: '+385' },
  { code: 'CU', name: 'Cuba', dial: '+53' },
  { code: 'CY', name: 'Cyprus', dial: '+357' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'DO', name: 'Dominican Republic', dial: '+1-809' },
  { code: 'EC', name: 'Ecuador', dial: '+593' },
  { code: 'EG', name: 'Egypt', dial: '+20' },
  { code: 'SV', name: 'El Salvador', dial: '+503' },
  { code: 'EE', name: 'Estonia', dial: '+372' },
  { code: 'ET', name: 'Ethiopia', dial: '+251' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'GE', name: 'Georgia', dial: '+995' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'GH', name: 'Ghana', dial: '+233' },
  { code: 'GR', name: 'Greece', dial: '+30' },
  { code: 'GT', name: 'Guatemala', dial: '+502' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'HU', name: 'Hungary', dial: '+36' },
  { code: 'IS', name: 'Iceland', dial: '+354' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'ID', name: 'Indonesia', dial: '+62' },
  { code: 'IR', name: 'Iran', dial: '+98' },
  { code: 'IQ', name: 'Iraq', dial: '+964' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'IL', name: 'Israel', dial: '+972' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'JM', name: 'Jamaica', dial: '+1-876' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'JO', name: 'Jordan', dial: '+962' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'KW', name: 'Kuwait', dial: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', dial: '+996' },
  { code: 'LA', name: 'Laos', dial: '+856' },
  { code: 'LV', name: 'Latvia', dial: '+371' },
  { code: 'LB', name: 'Lebanon', dial: '+961' },
  { code: 'LY', name: 'Libya', dial: '+218' },
  { code: 'LI', name: 'Liechtenstein', dial: '+423' },
  { code: 'LT', name: 'Lithuania', dial: '+370' },
  { code: 'LU', name: 'Luxembourg', dial: '+352' },
  { code: 'MO', name: 'Macau', dial: '+853' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'MV', name: 'Maldives', dial: '+960' },
  { code: 'MT', name: 'Malta', dial: '+356' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'MC', name: 'Monaco', dial: '+377' },
  { code: 'MN', name: 'Mongolia', dial: '+976' },
  { code: 'ME', name: 'Montenegro', dial: '+382' },
  { code: 'MA', name: 'Morocco', dial: '+212' },
  { code: 'MM', name: 'Myanmar', dial: '+95' },
  { code: 'NP', name: 'Nepal', dial: '+977' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'KP', name: 'North Korea', dial: '+850' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'OM', name: 'Oman', dial: '+968' },
  { code: 'PK', name: 'Pakistan', dial: '+92' },
  { code: 'PS', name: 'Palestine', dial: '+970' },
  { code: 'PA', name: 'Panama', dial: '+507' },
  { code: 'PY', name: 'Paraguay', dial: '+595' },
  { code: 'PE', name: 'Peru', dial: '+51' },
  { code: 'PH', name: 'Philippines', dial: '+63' },
  { code: 'PL', name: 'Poland', dial: '+48' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'PR', name: 'Puerto Rico', dial: '+1-787' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'RO', name: 'Romania', dial: '+40' },
  { code: 'RU', name: 'Russia', dial: '+7' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'SN', name: 'Senegal', dial: '+221' },
  { code: 'RS', name: 'Serbia', dial: '+381' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'SK', name: 'Slovakia', dial: '+421' },
  { code: 'SI', name: 'Slovenia', dial: '+386' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94' },
  { code: 'SD', name: 'Sudan', dial: '+249' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'SY', name: 'Syria', dial: '+963' },
  { code: 'TW', name: 'Taiwan', dial: '+886' },
  { code: 'TJ', name: 'Tajikistan', dial: '+992' },
  { code: 'TZ', name: 'Tanzania', dial: '+255' },
  { code: 'TH', name: 'Thailand', dial: '+66' },
  { code: 'TN', name: 'Tunisia', dial: '+216' },
  { code: 'TR', name: 'Turkey', dial: '+90' },
  { code: 'TM', name: 'Turkmenistan', dial: '+993' },
  { code: 'UG', name: 'Uganda', dial: '+256' },
  { code: 'UA', name: 'Ukraine', dial: '+380' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'UY', name: 'Uruguay', dial: '+598' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998' },
  { code: 'VE', name: 'Venezuela', dial: '+58' },
  { code: 'VN', name: 'Vietnam', dial: '+84' },
  { code: 'YE', name: 'Yemen', dial: '+967' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263' },
];

export function getCountryByTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const map: Record<string, string> = {
      // United States
      'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
      'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
      'America/Indiana/Indianapolis': 'US', 'America/Indiana/Knox': 'US',
      'America/Indiana/Marengo': 'US', 'America/Indiana/Petersburg': 'US',
      'America/Indiana/Tell_City': 'US', 'America/Indiana/Vevay': 'US',
      'America/Indiana/Vincennes': 'US', 'America/Indiana/Winamac': 'US',
      'America/Kentucky/Louisville': 'US', 'America/Kentucky/Monticello': 'US',
      'America/Detroit': 'US', 'America/Menominee': 'US', 'America/North_Dakota/Beulah': 'US',
      'America/North_Dakota/Center': 'US', 'America/North_Dakota/New_Salem': 'US',
      'America/Boise': 'US', 'America/Phoenix': 'US', 'America/Sitka': 'US',
      'America/Yakutat': 'US', 'America/Juneau': 'US', 'America/Nome': 'US',
      'America/Metlakatla': 'US', 'Pacific/Pago_Pago': 'US', 'Pacific/Guam': 'US',
      // Canada (all zones - this was the main failure before)
      'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA',
      'America/Halifax': 'CA', 'America/Winnipeg': 'CA', 'America/Edmonton': 'CA',
      'America/St_Johns': 'CA', 'America/Regina': 'CA', 'America/Whitehorse': 'CA',
      'America/Yellowknife': 'CA', 'America/Iqaluit': 'CA', 'America/Moncton': 'CA',
      'America/Glace_Bay': 'CA', 'America/Goose_Bay': 'CA', 'America/Nipigon': 'CA',
      'America/Pangnirtung': 'CA', 'America/Rainy_River': 'CA', 'America/Rankin_Inlet': 'CA',
      'America/Thunder_Bay': 'CA', 'America/Blanc-Sablon': 'CA', 'America/Cambridge_Bay': 'CA',
      'America/Creston': 'CA', 'America/Dawson': 'CA', 'America/Dawson_Creek': 'CA',
      'America/Fort_Nelson': 'CA', 'America/Inuvik': 'CA', 'America/Swift_Current': 'CA',
      // United Kingdom & Europe
      'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
      'Europe/Lisbon': 'PT', 'Europe/Dublin': 'IE', 'Europe/Zurich': 'CH',
      'Europe/Vienna': 'AT', 'Europe/Brussels': 'BE', 'Europe/Copenhagen': 'DK',
      'Europe/Oslo': 'NO', 'Europe/Stockholm': 'SE', 'Europe/Helsinki': 'FI',
      'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Bratislava': 'SK',
      'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG',
      'Europe/Athens': 'GR', 'Europe/Belgrade': 'RS', 'Europe/Zagreb': 'HR',
      'Europe/Ljubljana': 'SI', 'Europe/Sarajevo': 'BA', 'Europe/Skopje': 'MK',
      'Europe/Tirane': 'AL', 'Europe/Kyiv': 'UA', 'Europe/Minsk': 'BY',
      'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR', 'Europe/Kiev': 'UA',
      'Asia/Dubai': 'AE', 'Asia/Ashgabat': 'TM', 'Asia/Baku': 'AZ',
      'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Jerusalem': 'IL',
      // Asia & Pacific
      'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Shanghai': 'CN',
      'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Hong_Kong': 'HK',
      'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH',
      'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Asia/Karachi': 'PK',
      'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
      'Asia/Taipei': 'TW', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Riyadh': 'SA',
      'Asia/Tehran': 'IR', 'Asia/Baghdad': 'IQ', 'Asia/Beirut': 'LB',
      'Asia/Amman': 'JO', 'Asia/Kuwait': 'KW', 'Asia/Doha': 'QA',
      'Asia/Muscat': 'OM', 'Asia/Bahrain': 'BH', 'Asia/Nicosia': 'CY',
      'Asia/Almaty': 'KZ', 'Asia/Tashkent': 'UZ', 'Asia/Bishkek': 'KG',
      'Asia/Dushanbe': 'TJ', 'Asia/Ulaanbaatar': 'MN', 'Asia/Pyongyang': 'KP',
      'Asia/Rangoon': 'MM', 'Asia/Yangon': 'MM', 'Asia/Phnom_Penh': 'KH',
      'Asia/Vientiane': 'LA', 'Asia/Kabul': 'AF',
      'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
      'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Darwin': 'AU',
      'Australia/Hobart': 'AU', 'Australia/Canberra': 'AU', 'Australia/Lord_Howe': 'AU',
      'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ', 'Pacific/Fiji': 'FJ',
      // Latin America & Africa
      'America/Sao_Paulo': 'BR', 'America/Rio_Branco': 'BR', 'America/Manaus': 'BR',
      'America/Cuiaba': 'BR', 'America/Campo_Grande': 'BR', 'America/Bahia': 'BR',
      'America/Belem': 'BR', 'America/Recife': 'BR', 'America/Fortaleza': 'BR',
      'America/Maceio': 'BR', 'America/Porto_Velho': 'BR', 'America/Boa_Vista': 'BR',
      'America/Cayenne': 'FR', 'America/Mexico_City': 'MX', 'America/Tijuana': 'MX',
      'America/Monterrey': 'MX', 'America/Chihuahua': 'MX', 'America/Mazatlan': 'MX',
      'America/Hermosillo': 'MX', 'America/Cancun': 'MX', 'America/Merida': 'MX',
      'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Managua': 'NI',
      'America/Costa_Rica': 'CR', 'America/Panama': 'PA', 'America/Havana': 'CU',
      'America/Port-au-Prince': 'HT', 'America/Santo_Domingo': 'DO',
      'America/Puerto_Rico': 'PR', 'America/Jamaica': 'JM', 'America/Nassau': 'BS',
      'America/Bogota': 'CO', 'America/Caracas': 'VE', 'America/Lima': 'PE',
      'America/Guayaquil': 'EC', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY',
      'America/Montevideo': 'UY', 'America/Santiago': 'CL', 'America/Buenos_Aires': 'AR',
      'America/Argentina/Buenos_Aires': 'AR', 'America/Argentina/Cordoba': 'AR',
      'America/Argentina/Salta': 'AR', 'America/Argentina/Jujuy': 'AR',
      'America/Argentina/Tucuman': 'AR', 'America/Argentina/Catamarca': 'AR',
      'America/Argentina/La_Rioja': 'AR', 'America/Argentina/San_Juan': 'AR',
      'America/Argentina/Mendoza': 'AR', 'America/Argentina/San_Luis': 'AR',
      'America/Argentina/Rio_Gallegos': 'AR', 'America/Argentina/Ushuaia': 'AR',
      'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
      'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ',
      'Africa/Tripoli': 'LY', 'Africa/Khartoum': 'SD', 'Africa/Accra': 'GH',
      'Africa/Johannesburg': 'ZA', 'Africa/Addis_Ababa': 'ET', 'Africa/Dar_es_Salaam': 'TZ',
      'Africa/Kampala': 'UG', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI',
    };
    return map[tz] || 'US';
  } catch {
    return 'US';
  }
}

// Best-effort country auto-detection: server-side IP geolocation first (accurate),
// then browser timezone as fallback. Never throws.
export async function detectCountryCode(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000); // Increased timeout to 6s
    const res = await fetch('/api/geo', { signal: ctrl.signal });
    clearTimeout(timer);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryCode && COUNTRIES.some(c => c.code === data.countryCode)) {
        return data.countryCode;
      }
    }
  } catch (err) {
    console.warn('Geo IP fetch failed, falling back to timezone.', err);
  }
  return getCountryByTimezone();
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  isEmergency?: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, preselectedServiceId, isEmergency }) => {
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState('US');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryIndex, setCountryIndex] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    preferredTimeSlot: '09:00 AM',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceListEntry[]>([]);
  const [doctorPreference, setDoctorPreference] = useState('Any Available');
  const [selectedService, setSelectedService] = useState(preselectedServiceId || '');
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    detectCountryCode().then(code => {
      setCountryCode(code);
      const c = COUNTRIES.find(x => x.code === code);
      if (c) setCountrySearch(c.name);
    });
  }, []);

  useEffect(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDoctors(data); })
      .catch(() => {});
    fetch('/api/services')
      .then(r => r.json())
      .then(data => { 
        if (Array.isArray(data)) {
          setServices(data);
          if (preselectedServiceId && data.find(s => s.id === preselectedServiceId)) {
            setSelectedService(data.find(s => s.id === preselectedServiceId)!.label);
          }
        }
      })
      .catch(() => {});
  }, [preselectedServiceId]);

  if (!isOpen) return null;

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === 'US')!;

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
    setCountryOpen(false);
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
      if (filteredCountries[countryIndex]) selectCountry(filteredCountries[countryIndex]);
    } else if (e.key === 'Escape') {
      setCountryOpen(false);
      phoneInputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: `${selectedCountry.dial} ${formData.phone}`,
          preferredDate: formData.preferredDate,
          preferredTimeSlot: formData.preferredTimeSlot,
          serviceId: selectedService,
          serviceName: selectedService || (isEmergency ? 'Emergency Dental Care' : 'General Consultation'),
          doctorPreference,
          notes: formData.notes,
          isEmergency
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        setErrorMsg(data.error || 'Something went wrong.');
      }
    } catch {
      setErrorMsg('Network error. Please call us instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-white/20 animate-in zoom-in-95 duration-500">
        
        {/* Left Pane - Premium Branding */}
        <div className="hidden md:flex md:w-5/12 relative bg-slate-900 flex-col p-10 overflow-hidden justify-between">
          <div className="absolute inset-0">
            <img src="https://static.wixstatic.com/media/02c124_bfd56d5c986d465ea09e0bc641b8ce19~mv2.jpg" alt="Clinic Office" className="w-full h-full object-cover opacity-50 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
            <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply" />
          </div>
          
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">First Avenue<br/><span className="text-blue-300 font-medium text-sm">Dentistry</span></span>
          </div>

          <div className="relative z-10 space-y-6 mt-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              5-Star Rated Clinic
            </div>
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-3 leading-[1.1] tracking-tight">Experience<br/>Dentistry<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Redefined.</span></h2>
              <p className="text-sm text-blue-100/80 leading-relaxed max-w-xs font-medium">Book your consultation today and take the first step towards a healthier, brighter smile.</p>
            </div>
          </div>
        </div>

        {/* Right Pane - Form */}
        <div className="w-full md:w-7/12 flex flex-col h-full max-h-[95vh] bg-white">
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-white z-10 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEmergency ? 'Emergency Booking' : 'Book Appointment'}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <div className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-sm' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-sm' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-sm' : 'bg-slate-200'}`} />
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:px-10 sm:py-8 custom-scrollbar relative">
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
                <button onClick={() => { setSubmitted(false); onClose(); }} className="px-10 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:scale-95 mt-6">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 pb-6 h-full flex flex-col">
                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                    <div className="mt-0.5"><X className="w-4 h-4" /></div>
                    <div className="font-medium">{errorMsg}</div>
                  </div>
                )}

                <div className="flex-1">
                  {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-forwards">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800">Personal Information</h3>
                        <p className="text-xs text-slate-500">Let's start with the basics so we know who you are.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2 group">
                          <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">First Name *</label>
                          <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" placeholder="John" />
                        </div>
                        <div className="space-y-2 group">
                          <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Last Name *</label>
                          <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" placeholder="Doe" />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Email Address *</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" placeholder="john.doe@example.com" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">Country & Phone *</label>
                        <div className="flex flex-col gap-3 relative">
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              value={countrySearch}
                              placeholder="Search country name (e.g. Canada)..."
                              onChange={(e) => { setCountrySearch(e.target.value); setCountryOpen(true); setCountryIndex(0); }}
                              onFocus={() => setCountryOpen(true)}
                              onKeyDown={handleCountryKeyDown}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pl-12 shadow-sm"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                               {selectedCountry.code}
                            </div>
                            {countryOpen && (
                              <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-20">
                                {filteredCountries.length === 0 && (
                                  <div className="px-3 py-4 text-xs text-slate-400 text-center">No countries found.</div>
                                )}
                                {filteredCountries.map((c, i) => (
                                  <button key={c.code} type="button" onClick={() => selectCountry(c)} onMouseEnter={() => setCountryIndex(i)} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${i === countryIndex ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                                    <span className="font-mono text-slate-400 w-10 text-xs">{c.dial}</span>
                                    <span className="truncate flex-1">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm border-r border-slate-200 pr-3">{selectedCountry.dial}</span>
                            <input ref={phoneInputRef} type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-20 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium tracking-wide shadow-sm" placeholder="Phone number" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-forwards">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800">Appointment Details</h3>
                        <p className="text-xs text-slate-500">Tell us what you're coming in for.</p>
                      </div>
                      
                      <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Service Required *</label>
                        <select required value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm">
                          <option value="" disabled>Select a service...</option>
                          {services.map(srv => (
                            <option key={srv.id} value={srv.label}>{srv.label}</option>
                          ))}
                          <option value="General Consultation">General Consultation / Other</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Preferred Doctor</label>
                        <select value={doctorPreference} onChange={(e) => setDoctorPreference(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm">
                          <option value="Any Available">Any Available Doctor</option>
                          {doctors.map(doc => (
                            <option key={doc.id} value={`${doc.name}${doc.credentials ? `, ${doc.credentials}` : ''}`}>
                              {doc.name}{doc.credentials ? `, ${doc.credentials}` : ''} — {doc.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-forwards">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800">Date & Time</h3>
                        <p className="text-xs text-slate-500">When works best for you?</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2 group">
                          <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Preferred Date *</label>
                          <input type="date" required min={todaySlug()} value={formData.preferredDate} onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2 group">
                          <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Preferred Time *</label>
                          <select required value={formData.preferredTimeSlot} onChange={(e) => setFormData({ ...formData, preferredTimeSlot: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm">
                            <option value="09:00 AM">9:00 AM (Morning)</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:00 AM">11:00 AM</option>
                            <option value="12:00 PM">12:00 PM (Noon)</option>
                            <option value="01:00 PM">1:00 PM</option>
                            <option value="02:00 PM">2:00 PM</option>
                            <option value="03:00 PM">3:00 PM</option>
                            <option value="04:00 PM">4:00 PM (Late Afternoon)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase transition-colors group-focus-within:text-blue-600">Additional Notes</label>
                        <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none shadow-sm" placeholder="Any specific concerns, symptoms, or requests..." />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-auto border-t border-slate-100 flex gap-3">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm">
                      Back
                    </button>
                  )}
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95">
                    {isSubmitting ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</>
                    ) : step < 3 ? (
                      <>Next Step <span className="group-hover:translate-x-1 transition-transform">→</span></>
                    ) : (
                      <>Confirm Booking <CheckCircle2 className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


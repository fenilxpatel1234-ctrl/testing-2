import React, { useState, useEffect } from 'react';
import { PageView, AppointmentRequest, PatientMessage, AdminUser, Doctor, SiteReview } from '../types';
import { CLINIC_SETTINGS } from '../data/mockData';
import { 
  Lock, 
  UserCheck, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  MessageSquare, 
  BarChart2, 
  Settings, 
  Printer, 
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Plus,
  Edit3,
  Trash2,
  Save,
  UserPlus,
  Stethoscope,
  Phone,
  Users,
  Globe,
  TrendingUp,
  CalendarCheck,
  AlertCircle,
  Star,
  Quote
} from 'lucide-react';

interface AdminViewProps {
  onSelectView: (view: PageView) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onSelectView }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminLogin, setAdminLogin] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; name: string; username?: string; gender?: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'appointments' | 'emergency-apt' | 'messages' | 'analytics' | 'emails' | 'settings' | 'admins' | 'doctors' | 'reviews'>('appointments');
  const [visitorCount, setVisitorCount] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Admin management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', username: '', password: '', role: 'Admin' as AdminUser['role'], gender: '' as string });
  const [profileForm, setProfileForm] = useState({ name: 'Dr. Sarah Jenkins', email: 'admin@firstavenuedentistry.com', username: 'admin', gender: '' as string, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');

  // Doctors management
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newDoctor, setNewDoctor] = useState({ name: '', title: '', credentials: '', bio: '', image: '' });
  const [doctorMsg, setDoctorMsg] = useState('');

  // Reviews management
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [showAddReview, setShowAddReview] = useState(false);
  const [editingReview, setEditingReview] = useState<SiteReview | null>(null);
  const [newReview, setNewReview] = useState({ authorName: '', rating: 5, text: '', source: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  // Selected appointment for modal action
  const [selectedApt, setSelectedApt] = useState<AppointmentRequest | null>(null);
  const [actionDoctor, setActionDoctor] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionTime, setActionTime] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments', { credentials: 'same-origin' });
      if (handleAuthFailure(res)) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/contact', { credentials: 'same-origin' });
      if (handleAuthFailure(res)) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/accounts', { credentials: 'same-origin' });
      if (handleAuthFailure(res)) return;
      const data = await res.json();
      if (Array.isArray(data)) setAdmins(data);
    } catch {}
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch {}
  };

  // Session is server-side (httpOnly cookie) and NOT persisted client-side,
  // so the login page always appears when opening #admin.
  const handleAuthFailure = (res: Response): boolean => {
    if (res.status === 401) {
      setIsLoggedIn(false);
      setLoggedInUser(null);
      setLoginError('Session expired. Please sign in again.');
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAppointments();
      fetchMessages();
      fetchAdmins();
      fetchDoctors();
      fetchReviews();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (loggedInUser) {
      setProfileForm(prev => ({
        ...prev,
        name: loggedInUser.name,
        username: loggedInUser.username || prev.username,
        gender: loggedInUser.gender || prev.gender
      }));
    }
  }, [loggedInUser]);

  // Idle timeout & Visitor tracking
  useEffect(() => {
    if (!isLoggedIn) return;

    // Visitor tracking
    const fetchVisitors = async () => {
      try {
        const res = await fetch('/api/analytics/visitors');
        const data = await res.json();
        if (typeof data.count === 'number') setVisitorCount(data.count);
      } catch {}
    };
    fetchVisitors();
    const visitorInterval = setInterval(fetchVisitors, 60000);

    // Idle Auto-Lock (15 minutes)
    let idleSeconds = 0;
    const MAX_IDLE_SECONDS = 15 * 60; 
    
    const resetIdle = () => { idleSeconds = 0; };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);
    window.addEventListener('scroll', resetIdle);

    const idleInterval = setInterval(() => {
      idleSeconds++;
      if (idleSeconds >= MAX_IDLE_SECONDS) {
        handleSignOut();
        setLoginError('Your session was locked due to inactivity. Please sign in again.');
      }
    }, 1000);

    return () => {
      clearInterval(visitorInterval);
      clearInterval(idleInterval);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminLogin, password: adminPassword })
      });

      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setLoggedInUser(data.user || null);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Authentication server error');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setIsLoggedIn(false);
    setLoggedInUser(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentRequest['status']) => {
    try {
      if (newStatus === 'Approved') {
        if (!actionDoctor.trim()) {
          alert('Please assign an available doctor before confirming. The patient will see this doctor in the email.');
          return;
        }
        if (!actionDate) {
          alert('A confirmed date is required before confirming.');
          return;
        }
        if (!actionTime.trim()) {
          alert('A confirmed time is required before confirming.');
          return;
        }
      }
      if (newStatus === 'Rescheduled') {
        if (!actionReason.trim()) {
          alert('A reason is required to reschedule. The patient will see it in the email.');
          return;
        }
        if (!actionDate || !actionTime.trim()) {
          alert('Please set the new date and time for the rescheduled appointment.');
          return;
        }
      }
      if (newStatus === 'Rejected') {
        if (!actionReason.trim()) {
          alert('A reason is required to decline. The patient will see it in the email.');
          return;
        }
      }
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assignedDoctor: actionDoctor || undefined,
          confirmedDate: actionDate || undefined,
          confirmedTime: actionTime || undefined,
          adminNotes: actionNotes,
          reason: actionReason
        })
      });

      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        setSelectedApt(null);
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment request?')) return;
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (err) {
      alert('Failed to delete appointment.');
    }
  };

  const openManageModal = (apt: AppointmentRequest) => {
    setSelectedApt(apt);
    setActionDate(apt.confirmedDate || apt.preferredDate);
    setActionTime(apt.confirmedTime || apt.preferredTimeSlot);
    setActionNotes(apt.adminNotes || '');
    setActionReason(apt.reason || '');
    const known = doctors.map(d => `${d.name}${d.credentials ? `, ${d.credentials}` : ''}`);
    const pref = apt.assignedDoctor || apt.doctorPreference;
    // Keep the doctor the patient actually chose (if it's a real doctor on file).
    // If the patient said "Any available doctor", leave the field empty so the
    // admin MUST pick one before confirming — no silent defaults.
    const anyDoctor = /any\s*(available|doctor)?/i.test(pref);
    setActionDoctor(anyDoctor ? '' : (known.includes(pref) ? pref : (apt.assignedDoctor && known.includes(apt.assignedDoctor) ? apt.assignedDoctor : '')));
  };

  const filteredAppointments = appointments.filter(a => {
    if (a.isEmergency) return false;

    const matchesSearch = 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isLoggedIn) {
    if (showForgotPassword) {
      if (showResetForm) {
        return (
          <div className="pt-32 pb-20 max-w-md mx-auto px-4 flex items-center justify-center min-h-[70vh]">
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Enter Reset Code</h2>
                <p className="text-xs text-slate-500">A 6-digit code was sent to {forgotEmail}</p>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">{resetError}</div>
              )}
              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl font-medium">{resetSuccess}</div>
              )}

              {!resetSuccess && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setResetError('');
                  setResetSuccess('');
                  if (resetCode.length !== 6 || !/^\d{6}$/.test(resetCode)) {
                    setResetError('Please enter a valid 6-digit code.');
                    return;
                  }
                  if (resetNewPassword.length < 6) {
                    setResetError('Password must be at least 6 characters.');
                    return;
                  }
                  if (resetNewPassword !== resetConfirmPassword) {
                    setResetError('Passwords do not match.');
                    return;
                  }
                  setResetSubmitting(true);
                  try {
                    const res = await fetch('/api/admin/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: resetCode, newPassword: resetNewPassword })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setResetSuccess('Password reset successfully!');
                      setTimeout(() => {
                        setShowForgotPassword(false);
                        setShowResetForm(false);
                        setForgotMsg('');
                        setResetCode('');
                        setResetNewPassword('');
                        setResetConfirmPassword('');
                      }, 2000);
                    } else {
                      setResetError(data.error || 'Failed to reset password.');
                    }
                  } catch {
                    setResetError('Network error.');
                  } finally { setResetSubmitting(false); }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Code</label>
                    <input type="text" required maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter code" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input type="password" required minLength={6} value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 6 characters" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                    <input type="password" required minLength={6} value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repeat new password" />
                  </div>
                  <button type="submit" disabled={resetSubmitting} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {resetSubmitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Resetting...</> : <><Lock className="w-4 h-4" /> Reset Password</>}
                  </button>
                  <button type="button" onClick={() => { setShowResetForm(false); setResetError(''); }} className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">Back</button>
                </form>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="pt-32 pb-20 max-w-md mx-auto px-4 flex items-center justify-center min-h-[70vh]">
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-xs text-slate-500">Enter your registered email to receive a 6-digit reset code</p>
            </div>

            {forgotMsg && (
              <div className={`p-3 border text-xs rounded-xl font-medium ${forgotMsg.includes('sent') ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>{forgotMsg}</div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setForgotMsg('');
              setForgotLoading(true);
              try {
                const res = await fetch('/api/admin/forgot-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: forgotEmail })
                });
                const data = await res.json();
                if (data.success) {
                  setForgotMsg('6-digit code sent!');
                  setShowResetForm(true);
                } else {
                  setForgotMsg(data.error || 'Failed to send reset code.');
                }
              } catch {
                setForgotMsg('Network error.');
              } finally { setForgotLoading(false); }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email</label>
                <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={forgotLoading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50">{forgotLoading ? 'Sending...' : 'Send Reset Code'}</button>
              <button type="button" onClick={() => { setShowForgotPassword(false); setForgotMsg(''); }} className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">Back to Login</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-32 pb-20 max-w-md mx-auto px-4 flex items-center justify-center min-h-[70vh]">
        <div className="w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Clinic Admin Portal</h2>
            <p className="text-xs text-slate-500">First Avenue Family Dentistry Secure Dashboard</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={adminLogin}
                onChange={(e) => setAdminLogin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-right -mt-2">
              <button type="button" onClick={() => { setShowForgotPassword(true); setLoginError(''); }} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Forgot Password?</button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Admin Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-3xl p-6 border border-blue-800/50 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-14 left-1/4 w-44 h-44 bg-cyan-300/20 rounded-full blur-2xl"></div>
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {(() => {
                const hour = new Date().getHours();
                const period = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
                const prefix = loggedInUser?.gender === 'male' ? 'Mr.' : loggedInUser?.gender === 'female' ? 'Mrs.' : '';
                return `${period} ${prefix} ${loggedInUser?.name || 'Admin'}`;
              })()}
            </h1>
            <p className="text-xs text-blue-100">First Avenue Dentistry — Admin Management Console</p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2.5">
          {visitorCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {visitorCount} visitor{visitorCount !== 1 ? 's' : ''} online
            </div>
          )}
          <a
            href="/api/admin/export-csv"
            className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 bg-transparent">
        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl gap-1 overflow-x-auto border border-slate-200/80 shadow-lg scrollbar-thin">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'appointments' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Appointments <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'appointments' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{appointments.filter(a => !a.isEmergency).length}</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency-apt')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'emergency-apt' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Emergency <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'emergency-apt' ? 'bg-white/25 text-white' : 'bg-red-50 text-red-600'}`}>{appointments.filter(a => a.isEmergency).length}</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'messages' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Messages <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'messages' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{messages.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'emails' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" /> Email Automations
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" /> Site & SEO
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'admins' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Admins
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'doctors' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctors <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'doctors' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{doctors.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reviews' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-4 h-4" /> Reviews <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'reviews' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{reviews.length}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-full sm:w-auto flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name, email, phone, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                onClick={fetchAppointments}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Refresh Appointments"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Requests', value: appointments.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Pending Review', value: appointments.filter(a => !a.isEmergency && a.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Approved', value: appointments.filter(a => !a.isEmergency && a.status === 'Approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Emergency', value: appointments.filter(a => a.isEmergency).length, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 shadow-sm`}>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Ref ID / Patient</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Requested Service</th>
                    <th className="p-4">Pref Date & Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No appointment records match search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-mono text-[11px] text-blue-600 font-bold">{apt.id}</div>
                          <div className="font-bold text-slate-900 mt-0.5">{apt.firstName} {apt.lastName}</div>
                          <div className="text-[10px] text-slate-400">{apt.isNewPatient ? 'New Patient' : 'Existing Patient'}</div>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div>{apt.email}</div>
                          <div className="text-slate-400">{apt.phone}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{apt.serviceName}</div>
                          <div className="text-[10px] text-slate-400">Doctor: {apt.doctorPreference}</div>
                          <div className="text-[10px] text-emerald-600">{apt.insuranceProvider}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold">{apt.confirmedDate || apt.preferredDate}</div>
                          <div className="text-slate-400">{apt.confirmedTime || apt.preferredTimeSlot}</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            apt.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            apt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            apt.status === 'Rescheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {apt.status}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => openManageModal(apt)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-xs text-slate-500">
                No appointment records match search criteria.
              </div>
            ) : (
              filteredAppointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] text-blue-600 font-bold">{apt.id}</div>
                      <div className="font-bold text-slate-900">{apt.firstName} {apt.lastName}</div>
                      <div className="text-[10px] text-slate-400">{apt.isNewPatient ? 'New Patient' : 'Existing Patient'}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      apt.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      apt.status === 'Rescheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Service</div>
                      <div className="font-semibold text-slate-800">{apt.serviceName}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">When</div>
                      <div className="font-semibold text-slate-800">{apt.confirmedDate || apt.preferredDate}</div>
                      <div className="text-slate-400">{apt.confirmedTime || apt.preferredTimeSlot}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Contact</div>
                      <div className="text-slate-700 truncate">{apt.email}</div>
                      <div className="text-slate-400 truncate">{apt.phone}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Doctor / Ins.</div>
                      <div className="font-semibold text-slate-800 truncate">{apt.doctorPreference}</div>
                      <div className="text-emerald-600 truncate">{apt.insuranceProvider}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedApt(apt);
                        setActionDate(apt.preferredDate);
                        setActionTime(apt.preferredTimeSlot);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY APPOINTMENTS */}
      {activeTab === 'emergency-apt' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-2xl p-4 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Emergency Appointments</h3>
              <p className="text-xs text-red-100">These patients require priority handling</p>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-red-50 border-b border-red-200 text-[11px] font-bold uppercase tracking-wider text-red-600">
                    <th className="p-4">Ref ID / Patient</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Requested Service</th>
                    <th className="p-4">Pref Date & Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {appointments.filter(a => a.isEmergency).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No emergency appointments.
                      </td>
                    </tr>
                  ) : (
                    appointments.filter(a => a.isEmergency).map(apt => (
                      <tr key={apt.id} className="hover:bg-red-50/30 transition-colors bg-red-50/10">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="font-mono text-[11px] text-red-600 font-bold">{apt.id}</span>
                          </div>
                          <div className="font-bold text-slate-900 mt-0.5">{apt.firstName} {apt.lastName}</div>
                          <div className="text-[10px] text-slate-400">{apt.isNewPatient ? 'New Patient' : 'Existing Patient'}</div>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div>{apt.email}</div>
                          <div className="text-slate-400">{apt.phone}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{apt.serviceName}</div>
                          <div className="text-[10px] text-slate-400">Doctor: {apt.doctorPreference}</div>
                          <div className="text-[10px] text-emerald-600">{apt.insuranceProvider}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold">{apt.confirmedDate || apt.preferredDate}</div>
                          <div className="text-slate-400">{apt.confirmedTime || apt.preferredTimeSlot}</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            apt.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            apt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            apt.status === 'Rescheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {apt.status}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => openManageModal(apt)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {appointments.filter(a => a.isEmergency).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-xs text-slate-500">
                No emergency appointments.
              </div>
            ) : (
              appointments.filter(a => a.isEmergency).map(apt => (
                <div key={apt.id} className="bg-white rounded-2xl border-l-4 border-red-500 border border-slate-200/80 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="font-mono text-[10px] text-red-600 font-bold">{apt.id}</span>
                      </div>
                      <div className="font-bold text-slate-900">{apt.firstName} {apt.lastName}</div>
                      <div className="text-[10px] text-slate-400">{apt.isNewPatient ? 'New Patient' : 'Existing Patient'}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      apt.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      apt.status === 'Rescheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-red-50/60 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-0.5">Service</div>
                      <div className="font-semibold text-slate-800">{apt.serviceName}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">When</div>
                      <div className="font-semibold text-slate-800">{apt.confirmedDate || apt.preferredDate}</div>
                      <div className="text-slate-400">{apt.confirmedTime || apt.preferredTimeSlot}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Contact</div>
                      <div className="text-slate-700 truncate">{apt.email}</div>
                      <div className="text-slate-400 truncate">{apt.phone}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Doctor / Ins.</div>
                      <div className="font-semibold text-slate-800 truncate">{apt.doctorPreference}</div>
                      <div className="text-emerald-600 truncate">{apt.insuranceProvider}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedApt(apt);
                        setActionDate(apt.preferredDate);
                        setActionTime(apt.preferredTimeSlot);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Patient Contact Form Submissions</h3>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold">{messages.length} total</span>
            </div>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No patient messages received yet.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {msg.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="font-bold text-slate-900 truncate">{msg.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{new Date(msg.date).toLocaleString()}</span>
                      </div>
                      <div className="text-blue-600 font-semibold">{msg.subject}</div>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500"><Mail className="w-3 h-3 inline mr-1 -mt-0.5" />{msg.email}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500"><Phone className="w-3 h-3 inline mr-1 -mt-0.5" />{msg.phone}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pt-1">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
              <Users className="w-6 h-6 text-blue-100 mb-3" />
              <div className="text-3xl font-black flex items-center gap-3">
                {visitorCount}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-blue-100 mt-1 font-semibold">Live Audience — visitors right now</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-teal-400 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
              <CalendarCheck className="w-6 h-6 text-teal-100 mb-3" />
              <div className="text-3xl font-black">{appointments.length}</div>
              <div className="text-[11px] text-teal-100 mt-1 font-semibold">Total Booking Requests</div>
              <div className="text-[11px] text-teal-200 mt-2 inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> {appointments.filter(a => a.isEmergency).length} emergency</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-400 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
              <TrendingUp className="w-6 h-6 text-emerald-100 mb-3" />
              <div className="text-3xl font-black">
                {appointments.length ? Math.round((appointments.filter(a => a.status === 'Approved').length / appointments.length) * 100) : 100}%
              </div>
              <div className="text-[11px] text-emerald-100 mt-1 font-semibold">Approval Rate</div>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-400 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
              <MessageSquare className="w-6 h-6 text-purple-100 mb-3" />
              <div className="text-3xl font-black">{messages.length}</div>
              <div className="text-[11px] text-purple-100 mt-1 font-semibold">Patient Messages</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Status Distribution</h4>
              {(['Approved', 'Pending', 'Rescheduled', 'Rejected'] as const).map(status => {
                const count = appointments.filter(a => a.status === status).length;
                const pct = appointments.length ? Math.round((count / appointments.length) * 100) : 0;
                const bar = status === 'Approved' ? 'bg-emerald-500' : status === 'Pending' ? 'bg-amber-400' : status === 'Rescheduled' ? 'bg-blue-500' : 'bg-red-500';
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{status}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Requested Treatments</h4>
              {(() => {
                const counts = new Map<string, number>();
                appointments.forEach(a => counts.set(a.serviceName, (counts.get(a.serviceName) || 0) + 1));
                const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                const max = sorted.length ? sorted[0][1] : 1;
                return sorted.length ? sorted.map(([name, count]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 truncate pr-2">{name}</span>
                      <span className="text-slate-400 shrink-0">{count} request{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${(count / max) * 100}%` }}></div>
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-400">No booking data yet.</p>;
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Doctors on Staff</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{doctors.length}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Accounts</div>
              <div className="text-2xl font-black text-violet-600 mt-1">{admins.length}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Requests</div>
              <div className="text-2xl font-black text-red-600 mt-1">{appointments.filter(a => a.isEmergency).length}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Awaiting Approval</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{appointments.filter(a => a.status === 'Pending').length}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL AUTOMATIONS */}
      {activeTab === 'emails' && <EmailAutomationsTab />}

      {/* TAB 5: SITE & SEO SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl p-4 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Site & SEO Settings</h3>
              <p className="text-xs text-slate-300">Manage clinic details and search engine information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" /> Practice Information & SEO Meta</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Clinic Name</label>
                <input type="text" defaultValue={CLINIC_SETTINGS.clinicName} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Phone Number</label>
                <input type="text" defaultValue={CLINIC_SETTINGS.phone} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Meta Title</label>
                <input type="text" defaultValue={CLINIC_SETTINGS.metaTitle} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Meta Description</label>
                <textarea defaultValue={CLINIC_SETTINGS.metaDescription} rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none" />
              </div>
              <button onClick={() => alert('Settings updated successfully!')} className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-xl transition-colors shadow-md">
                Save Settings
              </button>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><UserCheck className="w-5 h-5 text-violet-600" /> My Profile</h3>
            {profileMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">{profileMsg}</div>}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Username (for login)</label>
                <input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gender</label>
                <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900 mb-3">Change Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="password" placeholder="Current password" value={profileForm.currentPassword} onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="New password" value={profileForm.newPassword} onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="Confirm new password" value={profileForm.confirmPassword} onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button onClick={async () => {
                setProfileMsg('');
                if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) { setProfileMsg('Passwords do not match'); return; }
                const res = await fetch('/api/admin/profile', {
                  method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: loggedInUser?.id,
                    name: profileForm.name,
                    email: profileForm.email,
                    username: profileForm.username || undefined,
                    gender: profileForm.gender || undefined,
                    currentPassword: profileForm.currentPassword || undefined,
                    newPassword: profileForm.newPassword || undefined
                  })
                });
                const data = await res.json();
                if (data.success) {
                  setLoggedInUser({ id: data.user.id, name: data.user.name, username: data.user.username, gender: data.user.gender });
                  setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                  setProfileMsg('Profile updated successfully! Your changes are now live.');
                } else {
                  setProfileMsg(data.error || 'Error updating profile');
                }
              }} className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-xl transition-colors shadow-md">
                Update Profile
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 6: ADMIN ACCOUNTS */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Admin Accounts</h3>
            <button onClick={() => setShowAddAdmin(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Admin
            </button>
          </div>

          {showAddAdmin && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-900">New Admin Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" placeholder="Full Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminUser['role'] })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none">
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <select value={newAdmin.gender} onChange={(e) => setNewAdmin({ ...newAdmin, gender: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none">
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={async () => {
                  if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return alert('Fill all fields');
                  const res = await fetch('/api/admin/accounts', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAdmin)
                  });
                  const data = await res.json();
                  if (data.success) { setShowAddAdmin(false); setNewAdmin({ name: '', email: '', username: '', password: '', role: 'Admin', gender: '' }); fetchAdmins(); }
                  else alert(data.error);
                }} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors">Save</button>
                <button onClick={() => setShowAddAdmin(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{admin.name}</td>
                    <td className="p-4 text-slate-600">{admin.email}</td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{admin.username || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : admin.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{admin.role}</span>
                    </td>
                    <td className="p-4 text-slate-400">{admin.lastLogin || 'Never'}</td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => setEditingAdmin(admin)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] transition-colors"><Edit3 className="w-3 h-3 inline" /> Edit</button>
                      <button onClick={async () => {
                        if (!confirm(`Delete ${admin.name}?`)) return;
                        await fetch(`/api/admin/accounts/${admin.id}`, { method: 'DELETE' });
                        fetchAdmins();
                      }} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] transition-colors"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile admin cards */}
          <div className="md:hidden space-y-3">
            {admins.map(admin => (
              <div key={admin.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {admin.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{admin.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{admin.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : admin.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{admin.role}</span>
                    <span className="text-[10px] text-slate-400">{admin.username ? `@${admin.username}` : ''} • {admin.lastLogin || 'Never logged in'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => setEditingAdmin(admin)} className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold transition-colors">Edit</button>
                  <button onClick={async () => {
                    if (!confirm(`Delete ${admin.name}?`)) return;
                    await fetch(`/api/admin/accounts/${admin.id}`, { method: 'DELETE' });
                    fetchAdmins();
                  }} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {editingAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl space-y-4 my-8">
                <h3 className="font-bold text-base text-slate-900">Edit Admin: {editingAdmin.name}</h3>
                <div className="space-y-3">
                  <input type="text" value={editingAdmin.name} onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Name" />
                  <input type="email" value={editingAdmin.email} onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Email" />
                  <input type="text" value={editingAdmin.username || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Username" />
                  <input type="password" placeholder="New password (leave blank to keep)" onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                  <select value={editingAdmin.role} onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as AdminUser['role'] })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <select value={editingAdmin.gender || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, gender: e.target.value as AdminUser['gender'] })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={async () => {
                    const res = await fetch(`/api/admin/accounts/${editingAdmin.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editingAdmin)
                    });
                    const data = await res.json();
                    if (data.success) { setEditingAdmin(null); fetchAdmins(); }
                  }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"><Save className="w-3.5 h-3.5 inline" /> Save</button>
                  <button onClick={() => setEditingAdmin(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DOCTORS MANAGEMENT */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Doctors & Team Members</h3>
              <p className="text-xs text-slate-500">Create and manage the doctors shown on your website.</p>
            </div>
            <button onClick={() => setShowAddDoctor(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Doctor
            </button>
          </div>

          {doctorMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">{doctorMsg}</div>}

          {showAddDoctor && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-900">New Doctor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Full Name *" value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Title (e.g. Lead Dentist)" value={newDoctor.title} onChange={(e) => setNewDoctor({ ...newDoctor, title: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Credentials (e.g. DDS)" value={newDoctor.credentials} onChange={(e) => setNewDoctor({ ...newDoctor, credentials: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Image URL (optional)" value={newDoctor.image} onChange={(e) => setNewDoctor({ ...newDoctor, image: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
                <textarea rows={3} placeholder="Short bio about the doctor..." value={newDoctor.bio} onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  setDoctorMsg('');
                  if (!newDoctor.name) return alert('Doctor name is required.');
                  const res = await fetch('/api/doctors', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDoctor)
                  });
                  const data = await res.json();
                  if (data.success) { setShowAddDoctor(false); setNewDoctor({ name: '', title: '', credentials: '', bio: '', image: '' }); fetchDoctors(); setDoctorMsg('Doctor added successfully!'); }
                  else alert(data.error);
                }} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors">Save Doctor</button>
                <button onClick={() => setShowAddDoctor(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-shadow p-6 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start gap-4 relative">
                  {doc.image ? (
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md"><Stethoscope className="w-7 h-7" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{doc.name}</h4>
                    <p className="text-xs text-blue-600 font-semibold">{doc.title}{doc.credentials ? `, ${doc.credentials}` : ''}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 relative">{doc.bio || 'No bio provided.'}</p>
                <div className="flex gap-2 pt-2 border-t border-slate-100 relative">
                  <button onClick={() => setEditingDoctor(doc)} className="flex-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold transition-colors"><Edit3 className="w-3 h-3 inline" /> Edit</button>
                  <button onClick={async () => {
                    if (!confirm(`Delete ${doc.name}?`)) return;
                    const res = await fetch(`/api/doctors/${doc.id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) { fetchDoctors(); setDoctorMsg('Doctor removed.'); }
                  }} className="flex-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-colors"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="col-span-full p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center text-sm text-slate-400">
                No doctors yet. Click "Add Doctor" to create your first one.
              </div>
            )}
          </div>

          {editingDoctor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl space-y-4 my-8">
                <h3 className="font-bold text-base text-slate-900">Edit Doctor: {editingDoctor.name}</h3>
                <div className="space-y-3">
                  <input type="text" value={editingDoctor.name} onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Full Name" />
                  <input type="text" value={editingDoctor.title} onChange={(e) => setEditingDoctor({ ...editingDoctor, title: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Title" />
                  <input type="text" value={editingDoctor.credentials || ''} onChange={(e) => setEditingDoctor({ ...editingDoctor, credentials: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Credentials" />
                  <input type="text" value={editingDoctor.image || ''} onChange={(e) => setEditingDoctor({ ...editingDoctor, image: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Image URL" />
                  <textarea rows={3} value={editingDoctor.bio} onChange={(e) => setEditingDoctor({ ...editingDoctor, bio: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none resize-none" placeholder="Bio" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={async () => {
                    const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: editingDoctor.name, title: editingDoctor.title, credentials: editingDoctor.credentials, bio: editingDoctor.bio, image: editingDoctor.image })
                    });
                    const data = await res.json();
                    if (data.success) { setEditingDoctor(null); fetchDoctors(); setDoctorMsg('Doctor updated successfully!'); }
                  }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"><Save className="w-3.5 h-3.5 inline" /> Save</button>
                  <button onClick={() => setEditingDoctor(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: REVIEWS MANAGEMENT */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Patient Reviews</h3>
              <p className="text-xs text-slate-500">Reviews added here appear on the homepage automatically. Synced to Firebase, so they survive redeploys.</p>
            </div>
            <button onClick={() => setShowAddReview(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Add Review
            </button>
          </div>

          {reviewMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">{reviewMsg}</div>}

          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-3 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-slate-900">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500">Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Shown on the homepage "What Our Patients Say" section</span>
            </div>
          )}

          {showAddReview && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-900">New Review</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Patient Name *" value={newReview.authorName} onChange={(e) => setNewReview({ ...newReview, authorName: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Source (e.g. Google, Walk-in) — optional" value={newReview.source} onChange={(e) => setNewReview({ ...newReview, source: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: i })}
                      className="p-1 rounded-lg hover:scale-110 transition-transform"
                      aria-label={`${i} star${i === 1 ? '' : 's'}`}
                    >
                      <Star className={`w-7 h-7 ${i <= newReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{newReview.rating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Text</label>
                <textarea rows={3} placeholder="What did this patient say?" value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  setReviewMsg('');
                  if (!newReview.authorName.trim()) return alert('Patient name is required.');
                  if (!newReview.text.trim()) return alert('Review text is required.');
                  const res = await fetch('/api/reviews', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReview)
                  });
                  const data = await res.json();
                  if (res.ok && data.id) { setShowAddReview(false); setNewReview({ authorName: '', rating: 5, text: '', source: '' }); fetchReviews(); setReviewMsg('Review published — it now shows on the homepage.'); }
                  else if (handleAuthFailure(res)) return;
                  else alert(data.error || 'Failed to add review.');
                }} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors">Publish Review</button>
                <button onClick={() => setShowAddReview(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-shadow p-6 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                    {rev.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                      {rev.authorName}
                      {rev.source && <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 shrink-0">{rev.source}</span>}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 relative">{rev.text}</p>
                <div className="flex gap-2 pt-2 border-t border-slate-100 relative">
                  <button onClick={() => setEditingReview(rev)} className="flex-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold transition-colors"><Edit3 className="w-3 h-3 inline" /> Edit</button>
                  <button onClick={async () => {
                    if (!confirm(`Delete this review by ${rev.authorName}?`)) return;
                    const res = await fetch(`/api/reviews/${rev.id}`, { method: 'DELETE' });
                    if (handleAuthFailure(res)) return;
                    fetchReviews(); setReviewMsg('Review removed from the homepage.');
                  }} className="flex-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-colors"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && !showAddReview && (
              <div className="col-span-full p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center text-sm text-slate-400">
                No reviews yet. Click "Add Review" to publish your first patient testimonial.
              </div>
            )}
          </div>

          {editingReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl space-y-4 my-8">
                <h3 className="font-bold text-base text-slate-900">Edit Review</h3>
                <div className="space-y-3">
                  <input type="text" value={editingReview.authorName} onChange={(e) => setEditingReview({ ...editingReview, authorName: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Patient Name" />
                  <input type="text" value={editingReview.source || ''} onChange={(e) => setEditingReview({ ...editingReview, source: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" placeholder="Source (optional)" />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditingReview({ ...editingReview, rating: i })}
                          className="p-1 rounded-lg hover:scale-110 transition-transform"
                        >
                          <Star className={`w-7 h-7 ${i <= editingReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">{editingReview.rating}/5</span>
                    </div>
                  </div>
                  <textarea rows={3} value={editingReview.text} onChange={(e) => setEditingReview({ ...editingReview, text: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none resize-none" placeholder="Review text" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={async () => {
                    const res = await fetch(`/api/reviews/${editingReview.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ authorName: editingReview.authorName, rating: editingReview.rating, text: editingReview.text, source: editingReview.source })
                    });
                    if (handleAuthFailure(res)) return;
                    const data = await res.json();
                    if (res.ok) { setEditingReview(null); fetchReviews(); setReviewMsg('Review updated — homepage is synced.'); }
                    else alert(data.error || 'Failed to update review.');
                  }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"><Save className="w-3.5 h-3.5 inline" /> Save</button>
                  <button onClick={() => setEditingReview(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPOINTMENT MANAGEMENT MODAL */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Manage Appointment #{selectedApt.id}</h3>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 p-4 rounded-2xl">
              <div><strong>Patient:</strong> {selectedApt.firstName} {selectedApt.lastName} ({selectedApt.email})</div>
              <div><strong>Treatment:</strong> {selectedApt.serviceName}</div>
              <div><strong>Insurance:</strong> {selectedApt.insuranceProvider}</div>
              <div><strong>Notes:</strong> {selectedApt.notes || 'None'}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Assign Doctor <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={actionDoctor}
                  onChange={(e) => setActionDoctor(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs ${actionDoctor ? 'border-slate-200' : 'border-amber-300'}`}
                >
                  <option value="" disabled>— Select an available doctor to confirm —</option>
                  {doctors.map(doc => {
                    const label = `${doc.name}${doc.credentials ? `, ${doc.credentials}` : ''}`;
                    return <option key={doc.id} value={label}>{label} — {doc.title}</option>;
                  })}
                </select>
                {selectedApt.doctorPreference && !/any\s*(available|doctor)?/i.test(selectedApt.doctorPreference) && (
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">
                    Patient requested: {selectedApt.doctorPreference}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Confirmed Date <span className="text-red-500 font-bold">*</span></label>
                  <input
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Confirmed Time <span className="text-red-500 font-bold">*</span></label>
                  <input
                    type="text"
                    value={actionTime}
                    onChange={(e) => setActionTime(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Reason for Reschedule / Decline <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Required when rescheduling or declining — this reason is sent to the patient by email."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Internal Admin Notes (not sent to patient)</label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes for receptionist or prep instructions..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApt.id, 'Approved')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Approve Request
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApt.id, 'Rescheduled')}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApt.id, 'Rejected')}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function EmailAutomationsTab() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/email-status').then(r => r.json()).then(setStatus).catch(() => {});
    fetch('/api/admin/email-log').then(r => r.json()).then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Email System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border text-xs ${status?.smtpReady ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">SMTP Server</div>
            <div className={`text-lg font-black ${status?.smtpReady ? 'text-emerald-600' : 'text-red-400'}`}>
              {status?.smtpReady ? 'Connected' : 'Offline'}
            </div>
            <div className="mt-1 text-[10px] text-slate-400 break-all">{status?.smtpHost}:{status?.smtpPort}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs">
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Emails Logged</div>
            <div className="text-lg font-black text-blue-600">{logs.length}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs">
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Log File Size</div>
            <div className="text-lg font-black text-slate-600">{status?.logFile ? `${(status.logFile / 1024).toFixed(1)} KB` : '0 B'}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs">
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery</div>
            <div className="text-lg font-black text-emerald-600">By Code</div>
            <div className="mt-1 text-[10px] text-slate-400 break-all">from: {status?.from}</div>
          </div>
        </div>

        {!status?.smtpReady && status?.smtpError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 break-all">
            <span className="font-bold">SMTP error: </span>{status.smtpError}
          </div>
        )}

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 leading-relaxed">
          Emails are composed and sent directly by our own server code with a branded HTML design - no third-party email services involved. All outgoing messages are automatically saved to the log below.
        </div>

        {!status?.smtpReady && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
            <div className="font-bold text-amber-700">Email server offline. Set these environment variables on Render, then deploy:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-amber-600 font-mono">
              <div>SMTP_HOST (smtp-relay.brevo.com)</div>
              <div>SMTP_PORT (2525 - bypasses Render's SMTP block)</div>
              <div>SMTP_USER (Brevo SMTP login)</div>
              <div>SMTP_PASS (Brevo SMTP key)</div>
              <div>EMAIL_FROM (verified sender, e.g. no-reply@yourdomain)</div>
            </div>
            <div className="text-amber-600">Current setup: Brevo free relay via port 2525 (Render free tier blocks ports 25/465/587). On Render: Dashboard → your service → Environment → add these → Deploy. No code changes needed.</div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Send Test Email</h3>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email to send test to..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
          />
          <button
            onClick={async () => {
              setTestMsg('');
              const target = testEmail || 'fenilxpatel2642@gmail.com';
              const res = await fetch('/api/admin/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: target })
              });
              const data = await res.json();
              setTestMsg(`Test email queued for ${target}. SMTP: ${data.smtpReady ? 'connected' : 'offline'}`);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
          >
            Send Test
          </button>
        </div>
        {testMsg && <div className="text-xs text-blue-600">{testMsg}</div>}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Email Log ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400">No emails logged yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...logs].reverse().map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">To: {log.to}</span>
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="font-semibold text-blue-600">{log.subject}</div>
                <pre className="text-slate-500 text-[10px] whitespace-pre-wrap line-clamp-3">{log.body}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

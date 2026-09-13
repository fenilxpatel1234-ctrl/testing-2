import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { AppointmentRequest, PatientMessage, AdminUser, ResetToken, Doctor, SiteReview, ServiceListEntry } from './src/types';
import { initFirebase, isFirebaseReady, fbGet, fbSet } from './src/lib/firebase';
import { CLINIC_SETTINGS, SERVICES_LIST, SERVICE_DETAILS } from './src/data/mockData';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100kb' }));

// --- Security: Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);


// --- Security headers ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const host = (req.headers.host || '').toLowerCase();
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (!isLocal) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self'; form-action 'self'"
    );
  }
  next();
});

// --- Live Visitor Tracking ---
const visitorHits = new Map<string, number>();
const VISITOR_TIMEOUT_MS = 1 * 60 * 1000;
app.use((req, _res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const key = `${ip}|${ua}`;
  visitorHits.set(key, Date.now());
  next();
});
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of visitorHits) {
    if (now - time > VISITOR_TIMEOUT_MS) visitorHits.delete(ip);
  }
}, 60_000);
function getActiveVisitorCount(): number {
  const now = Date.now();
  let count = 0;
  for (const time of visitorHits.values()) {
    if (now - time <= VISITOR_TIMEOUT_MS) count++;
  }
  return count;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SEEDS_DIR = path.join(DATA_DIR, 'seeds');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const DOCTORS_FILE = path.join(DATA_DIR, 'doctors.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJSON<T>(filePath: string, fallback: T[], seedFile?: string): T[] {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Fresh deploy (e.g. Render): restore committed seed data so doctors/settings don't reset
    if (seedFile && fs.existsSync(seedFile)) {
      const seed: T[] = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      fs.writeFileSync(filePath, JSON.stringify(seed, null, 2));
      return seed;
    }
  } catch {}
  return fallback;
}

function saveJSON<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-1', name: 'Dr. Sarah Jenkins', email: 'admin@firstavenuedentistry.com', username: 'admin', password: 'AdminPassword2026!', role: 'Super Admin', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
};

let appointmentDatabase: AppointmentRequest[] = loadJSON(APPOINTMENTS_FILE, [], path.join(SEEDS_DIR, 'appointments.json'));
let messageDatabase: PatientMessage[] = loadJSON(MESSAGES_FILE, [], path.join(SEEDS_DIR, 'messages.json'));
let doctorDatabase: Doctor[] = loadJSON(DOCTORS_FILE, [], path.join(SEEDS_DIR, 'doctors.json'));
let reviewDatabase: SiteReview[] = loadJSON(REVIEWS_FILE, [], path.join(SEEDS_DIR, 'reviews.json'));
let servicesDatabase: ServiceListEntry[] = loadJSON(SERVICES_FILE, SERVICES_LIST);

if (doctorDatabase.length === 0) {
  doctorDatabase = [
    { id: 'dr-1', name: 'Dr. Sarah Jenkins', title: 'Lead Dentist', credentials: 'DDS', bio: 'Founder of First Avenue Dentistry with over 15 years of experience in family and cosmetic dentistry.', createdAt: new Date().toISOString() }
  ];
  saveJSON(DOCTORS_FILE, doctorDatabase);
}

// Load admins from file; if missing, seed from defaults + env
let adminDatabase: AdminUser[] = loadJSON(ADMINS_FILE, []);
if (adminDatabase.length === 0) {
  adminDatabase = [DEFAULT_ADMIN];
  // Seed extra admins from environment variable (JSON array)
  try {
    const seed = process.env.ADMIN_SEED;
    if (seed) {
      const extra: AdminUser[] = JSON.parse(seed);
      for (const a of extra) {
        if (!adminDatabase.find(x => x.email === a.email)) adminDatabase.push(a);
      }
    }
  } catch {}
  saveJSON(ADMINS_FILE, adminDatabase);
} else {
  // Ensure default admin exists even if file was carried over without it
  if (!adminDatabase.find(a => a.email === DEFAULT_ADMIN.email)) {
    adminDatabase.unshift(DEFAULT_ADMIN);
    saveJSON(ADMINS_FILE, adminDatabase);
  }
}

function persistAppointments() { saveJSON(APPOINTMENTS_FILE, appointmentDatabase); fbSet('appointments', appointmentDatabase); }
function persistMessages() { saveJSON(MESSAGES_FILE, messageDatabase); fbSet('messages', messageDatabase); }
function persistAdmins() { saveJSON(ADMINS_FILE, adminDatabase); fbSet('admins', adminDatabase); }
function persistDoctors() { saveJSON(DOCTORS_FILE, doctorDatabase); fbSet('doctors', doctorDatabase); }
function persistReviews() { saveJSON(REVIEWS_FILE, reviewDatabase); fbSet('reviews', reviewDatabase); }
function persistServices() { saveJSON(SERVICES_FILE, servicesDatabase); fbSet('services', servicesDatabase); }

// --- Admin auth: password hashing, httpOnly sessions, brute-force protection ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return `sha256$${salt}$${hash}`;
}

function passwordMatches(stored: string, password: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('sha256$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const candidate = crypto.createHash('sha256').update(parts[1] + password).digest('hex');
    return candidate === parts[2];
  }
  return stored === password; // legacy plaintext (upgraded to hash on next login)
}

// Simple auth helper (accepts email or username)
function authenticateAdmin(login: string, password: string): AdminUser | null {
  const admin = adminDatabase.find(a => a.email === login || a.username === login) || null;
  if (!admin || !passwordMatches(admin.password, password)) return null;
  // Upgrade legacy plaintext passwords to salted hashes
  if (!admin.password.startsWith('sha256$')) {
    admin.password = hashPassword(password);
    persistAdmins();
  }
  return admin;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.ip || 'unknown';
}

// In-memory admin sessions (httpOnly cookie; no localStorage on the client)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const adminSessions = new Map<string, { adminId: string; expiresAt: number }>();

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

function createSession(adminId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { adminId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function clearSession(req: Request, res: Response) {
  const token = parseCookies(req)['admin_session'];
  if (token) adminSessions.delete(token);
  res.clearCookie('admin_session', { path: '/' });
}

setInterval(() => {
  const now = Date.now();
  for (const [token, s] of adminSessions) {
    if (s.expiresAt < now) adminSessions.delete(token);
  }
}, 60_000);

function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const token = parseCookies(req)['admin_session'];
  const session = token ? adminSessions.get(token) : undefined;
  if (!session || session.expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  (req as any).adminId = session.adminId;
  next();
}

// Brute-force protection: 5 failed logins per IP locks for 15 minutes
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

// Email delivery: built into the server code (SMTP via nodemailer) with file-log fallback.
// No third-party email services are used - emails are composed and sent by our own code.
// SMTP settings come from env vars (.env.local locally, Render dashboard in production):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
// Current setup: Brevo free relay (smtp-relay.brevo.com:587).
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'fenilxpatel2642@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'skww dpsl hobz stiz';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;
const EMAIL_LOG_FILE = path.join(DATA_DIR, 'email_log.json');

let smtpTransporter: nodemailer.Transporter | null = null;
let smtpReady = false;
let smtpError = 'Not connected yet';

(async () => {
  const configs = [
    { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, requireTLS: false },
    { host: SMTP_HOST, port: SMTP_PORT === 465 ? 587 : SMTP_PORT, secure: false, requireTLS: true }
  ];
  for (const cfg of configs) {
    try {
      smtpTransporter = nodemailer.createTransport({
        host: cfg.host, port: cfg.port, secure: cfg.secure, requireTLS: cfg.requireTLS,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000
      });
      await smtpTransporter.verify();
      smtpReady = true;
      smtpError = '';
      console.log(`SMTP ready (${cfg.host}:${cfg.port})`);
      return;
    } catch (err: any) {
      smtpError = err.message || 'Unknown SMTP error';
      console.log(`SMTP ${cfg.host}:${cfg.port} failed: ${smtpError}`);
    }
  }
  console.log('SMTP unavailable - will use file log');
})();

function logEmailToFile(to: string, subject: string, html: string): void {
  try {
    const logs = loadJSON(EMAIL_LOG_FILE, []);
    logs.push({ to, subject, body: html, timestamp: new Date().toISOString() });
    saveJSON(EMAIL_LOG_FILE, logs);
  } catch {}
}

// --- Designed HTML email template (branded, interactive, no third-party tools) ---
const CLINIC_NAME = 'First Avenue Dentistry';
const CLINIC_PHONE = '(519) 207-6890';
const CLINIC_ADDRESS = '308 Wellington Street, St. Thomas, ON N5R 2S9';
const SITE_URL = (process.env.SITE_URL || 'https://vantage-i.me').replace(/\/$/, '');

function emailShell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CLINIC_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf9f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:#1e293b;border-bottom:4px solid #d4af37;padding:36px 40px;text-align:center;">
              <div style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:2px;font-family:Georgia,serif;">FIRST AVENUE<br>DENTISTRY</div>
              <div style="font-size:11px;color:#cbd5e1;margin-top:8px;letter-spacing:3px;text-transform:uppercase;">St. Thomas &bull; Ontario</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px;color:#334155;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:32px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <div style="font-size:12px;color:#475569;line-height:1.8;">
                <strong>${CLINIC_NAME}</strong><br>
                ${CLINIC_ADDRESS}<br>
                <a href="tel:+15192076890" style="color:#d4af37;text-decoration:none;font-weight:bold;">${CLINIC_PHONE}</a> &nbsp;|&nbsp;
                <a href="mailto:firstavenuedentistry@gmail.com" style="color:#475569;text-decoration:none;">firstavenuedentistry@gmail.com</a><br>
                Mon &ndash; Fri: 9am &ndash; 6pm &nbsp;|&nbsp; Sat: 9am &ndash; 5pm
              </div>
              <div style="font-size:11px;color:#94a3b8;line-height:1.6;margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
                This is an automated email from ${CLINIC_NAME}. Please do not reply to this message &mdash; replies are not monitored.<br>
                For assistance, please call <a href="tel:+15192076890" style="color:#475569;text-decoration:underline;">${CLINIC_PHONE}</a>.
              </div>
              <div style="font-size:10px;color:#cbd5e1;margin-top:16px;">&copy; ${new Date().getFullYear()} ${CLINIC_NAME}. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:#64748b;width:40%;border-radius:8px 0 0 8px;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`;
}

function summaryTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;margin:20px 0;">${rows}</table>`;
}

function ctaButton(text: string, href: string, bg = '#2563eb'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="background:${bg};border-radius:9999px;padding:13px 36px;">
        <a href="${href}" style="display:inline-block;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.5px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function heading(text: string, sub?: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">${text}</h1>
  ${sub ? `<p style="margin:0 0 24px;font-size:14px;color:#64748b;">${sub}</p>` : ''}`;
}

// Parse a time slot like "09:00 AM" / "01:30 PM" into 24-hour "HH:MM"
function timeSlotTo24h(slot: string): string {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(String(slot).trim());
  if (!m) return '09:00';
  let h = parseInt(m[1], 10);
  const min = m[2] ? m[2].padStart(2, '0') : '00';
  const suffix = (m[3] || '').toUpperCase();
  if (suffix === 'PM' && h < 12) h += 12;
  if (suffix === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

// Build a .ics calendar invite that opens the phone calendar on iOS and Android.
// Floating local times (no Z) let each phone show the appointment in its own timezone.
function buildIcs(apt: AppointmentRequest): string {
  const date = (apt.confirmedDate || apt.preferredDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const start = timeSlotTo24h(apt.confirmedTime || apt.preferredTimeSlot);
  const [sh, sm] = start.split(':').map(Number);
  const endMin = sh * 60 + sm + 60;
  const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  const title = `Dental Visit - ${apt.serviceName} - First Avenue Dentistry`;
  const description = `Your appointment with ${apt.assignedDoctor || apt.doctorPreference} at ${CLINIC_NAME}. Please arrive 10 minutes early. Questions? Call ${CLINIC_PHONE}.`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//First Avenue Dentistry//Appointment//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\r?\n/g, '\\n')}`,
    `LOCATION:${CLINIC_ADDRESS}`,
    `DTSTART:${date}T${start}00`,
    `DTEND:${date}T${end}00`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Build a Google Calendar link that opens the Google Calendar app on Android
// with the appointment pre-filled (falls back to web on iPhone).
function buildGoogleCalendarUrl(apt: AppointmentRequest): string {
  const date = (apt.confirmedDate || apt.preferredDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const start = timeSlotTo24h(apt.confirmedTime || apt.preferredTimeSlot);
  const [sh, sm] = start.split(':').map(Number);
  const endMin = sh * 60 + sm + 60;
  const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  const enc = encodeURIComponent;
  const title = `Dental Visit - ${apt.serviceName} - First Avenue Dentistry`;
  const details = `Appointment with ${apt.assignedDoctor || apt.doctorPreference} at ${CLINIC_NAME}. Please arrive 10 minutes early. Questions? Call ${CLINIC_PHONE}.`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(title)}&dates=${date}T${start.replace(':', '')}00/${date}T${end.replace(':', '')}00&details=${enc(details)}&location=${enc(CLINIC_ADDRESS)}&sf=true&output=xml`;
}

// webcal:// link opens Apple Calendar directly on iPhone/iPad with the event ready to save.
function webcalUrl(apt: AppointmentRequest): string {
  return `${SITE_URL.replace(/^https:\/\//i, 'webcal://')}/api/ics/${apt.id}`;
}

// --- Email builders ---
function appointmentReceivedEmail(apt: AppointmentRequest): { subject: string; html: string } {
  const subject = `We Received Your Appointment Request - ${CLINIC_NAME}`;
  const html = emailShell(`
    ${heading('Thank you, ' + apt.firstName + '!', 'Your appointment request has been received and is being reviewed by our team.')}
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 4px;">Here is a summary of your request:</p>
    ${summaryTable(
      detailRow('Patient', apt.firstName + ' ' + apt.lastName) +
      detailRow('Service', apt.serviceName) +
      detailRow('Preferred Date', apt.preferredDate) +
      detailRow('Preferred Time', apt.preferredTimeSlot) +
      detailRow('Phone', apt.phone) +
      detailRow('Email', apt.email)
    )}
    <p style="font-size:13px;color:#64748b;line-height:1.7;">You will receive a confirmation email once your appointment is confirmed. If you have any questions, feel free to call us anytime.</p>
    ${ctaButton('Call Us Now', 'tel:+15192076890')}
  `);
  return { subject, html };
}

function appointmentStatusEmail(apt: AppointmentRequest, newStatus: string): { subject: string; html: string; ics?: string } | null {
  const patientName = `${apt.firstName} ${apt.lastName}`;
  const date = apt.confirmedDate || apt.preferredDate;
  const time = apt.confirmedTime || apt.preferredTimeSlot;
  const doctor = apt.assignedDoctor || apt.doctorPreference;

  if (newStatus === 'Approved') {
    return {
      subject: `Your Appointment is Confirmed! - ${CLINIC_NAME}`,
      html: emailShell(`
        ${heading('Appointment Confirmed!', 'Dear ' + patientName + ', your appointment has been confirmed.')}
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:14px;font-weight:800;color:#047857;">&#10003; Confirmed</div>
        </div>
        ${summaryTable(
          detailRow('Date', date) +
          detailRow('Time', time) +
          detailRow('Doctor', doctor) +
          detailRow('Service', apt.serviceName) +
          detailRow('Location', CLINIC_ADDRESS)
        )}
        <p style="font-size:13px;color:#64748b;line-height:1.7;">Please arrive 10 minutes early. If you need to reschedule, kindly contact us at least 24 hours in advance.</p>
        <p style="font-size:13px;color:#64748b;line-height:1.7;">A calendar invite is attached to this email — tap <strong>&#8220;Add to Calendar&#8221;</strong> to save it to your phone (works on both iPhone and Android).</p>
        ${ctaButton('Add to iPhone Calendar', webcalUrl(apt), '#059669')}
        ${ctaButton('Add to Google Calendar (Android)', buildGoogleCalendarUrl(apt), '#ea4335')}
        ${ctaButton('Call Our Office', 'tel:+15192076890')}
      `),
      ics: buildIcs(apt)
    };
  }
  if (newStatus === 'Rescheduled') {
    return {
      subject: `Your Appointment Has Been Rescheduled - ${CLINIC_NAME}`,
      html: emailShell(`
        ${heading('Appointment Rescheduled', 'Dear ' + patientName + ', here are your updated appointment details.')}
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:14px;font-weight:800;color:#b45309;">&#128259; Rescheduled</div>
        </div>
        ${summaryTable(
          detailRow('New Date', date) +
          detailRow('New Time', time) +
          detailRow('Doctor', doctor) +
          detailRow('Service', apt.serviceName) +
          (apt.reason || apt.adminNotes ? detailRow('Reason', apt.reason || apt.adminNotes) : '')
        )}
        <p style="font-size:13px;color:#64748b;line-height:1.7;">If this new time doesn't work for you, please call us and we will be happy to help.</p>
        ${ctaButton('Call Our Office', 'tel:+15192076890')}
      `)
    };
  }
  if (newStatus === 'Rejected') {
    return {
      subject: `Update on Your Appointment Request - ${CLINIC_NAME}`,
      html: emailShell(`
        ${heading('Appointment Request Update', 'Dear ' + patientName + ', we are unable to accommodate your request at this time.')}
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:14px;font-weight:800;color:#b91c1c;">&#10060; Not Available</div>
        </div>
        ${apt.reason || apt.adminNotes ? summaryTable(detailRow('Reason for Declining', apt.reason || apt.adminNotes)) : ''}
        <p style="font-size:13px;color:#64748b;line-height:1.7;">Please feel free to book another appointment through our website, or call us and we will find a time that works for you. We apologize for any inconvenience.</p>
        ${ctaButton('Book Another Appointment', `${SITE_URL}/#book-online`, '#b91c1c')}
        ${ctaButton('Call Our Office', 'tel:+15192076890')}
      `)
    };
  }
  return null;
}

function contactMessageEmail(msg: PatientMessage): { subject: string; html: string } {
  const subject = `New Contact Message from ${msg.name} - ${CLINIC_NAME}`;
  const html = emailShell(`
    ${heading('New Contact Form Message', 'Someone just sent a message through the website contact form.')}
    ${summaryTable(
      detailRow('Name', msg.name) +
      detailRow('Email', msg.email) +
      detailRow('Phone', msg.phone || 'Not provided') +
      detailRow('Subject', msg.subject)
    )}
    <p style="font-size:14px;color:#0f172a;font-weight:600;margin:16px 0 4px;">Message:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;font-size:13px;color:#334155;line-height:1.7;">${msg.message.replace(/\n/g, '<br>')}</div>
    ${ctaButton('Reply by Email', 'mailto:' + msg.email)}
  `);
  return { subject, html };
}

function resetCodeEmail(code: string): { subject: string; html: string } {
  const subject = `Your Password Reset Code - ${CLINIC_NAME} Admin`;
  const html = emailShell(`
    ${heading('Password Reset Code', 'You requested a password reset for your admin account.')}
    <p style="font-size:14px;color:#475569;line-height:1.7;">Use the code below to reset your password. It expires in <strong>15 minutes</strong>.</p>
    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <div style="font-size:36px;font-weight:800;color:#2563eb;letter-spacing:12px;">${code}</div>
    </div>
    ${ctaButton('Reset Your Password', `${SITE_URL}/#reset-password`)}
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;">If you did not request this, you can safely ignore this email.</p>
  `);
  return { subject, html };
}

async function deliverEmail(to: string, subject: string, html: string, ics?: string): Promise<void> {
  console.log(`Delivering email to ${to}: [${subject}]`);
  logEmailToFile(to, subject, html);

  if (smtpReady && smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${CLINIC_NAME}" <${EMAIL_FROM}>`,
        to, subject, html, text: 'Please view this email in an HTML-enabled client.',
        ...(ics ? { attachments: [{ filename: 'first-avenue-dentistry-appointment.ics', content: ics, contentType: 'text/calendar' }] } : {})
      });
      console.log('Email sent via SMTP:', info.messageId);
      return;
    } catch (err: any) {
      console.error('SMTP failed:', err.message);
    }
  }

  console.log('Email saved to log file only (no delivery method available)');
}

function sendStatusEmail(apt: AppointmentRequest, newStatus: string): void {
  const email = appointmentStatusEmail(apt, newStatus);
  if (!email) return;
  deliverEmail(apt.email, email.subject, email.html, email.ics);
}

function sendNewAppointmentNotification(apt: AppointmentRequest): void {
  const email = appointmentReceivedEmail(apt);
  deliverEmail(apt.email, email.subject, email.html);
}

// --- SEO ---
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`);
});
app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/#home</loc><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/#book-online</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/#emergency</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/#our-team</loc><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/#contact-us</loc><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/#blog</loc><priority>0.6</priority></url>
  <url><loc>${SITE_URL}/#legal</loc><priority>0.5</priority></url>
</urlset>`);
});

// --- API ENDPOINTS ---

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Live Visitor Count
app.get('/api/analytics/visitors', (req: Request, res: Response) => {
  res.json({ count: getActiveVisitorCount(), timestamp: new Date().toISOString() });
});

// Free IP geolocation (no API key, no cost) - used to auto-detect the visitor's country
const geoCache = new Map<string, { countryCode: string; country: string; t: number }>();
const GEO_CACHE_TTL = 6 * 60 * 60 * 1000;

app.get('/api/geo', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    if (!ip || ip === 'unknown' || ip.startsWith('::1') || ip === '127.0.0.1') {
      return res.json({ countryCode: '', country: '' });
    }
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.t < GEO_CACHE_TTL) {
      return res.json({ countryCode: cached.countryCode, country: cached.country });
    }

    const providers: Array<() => Promise<{ countryCode: string; country: string }>> = [
      async () => {
        const r = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(3500) });
        const d = await r.json() as { country_code?: string; country?: string };
        if (!d.country_code) throw new Error('no result');
        return { countryCode: d.country_code, country: d.country || '' };
      },
      async () => {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`, { signal: AbortSignal.timeout(3500) });
        const d = await r.json() as { status?: string; countryCode?: string; country?: string };
        if (d.status !== 'success' || !d.countryCode) throw new Error('no result');
        return { countryCode: d.countryCode, country: d.country || '' };
      }
    ];

    let result: { countryCode: string; country: string } | null = null;
    for (const p of providers) {
      try {
        result = await p();
        break;
      } catch {}
    }
    if (result) geoCache.set(ip, { ...result, t: Date.now() });
    return res.json({ countryCode: result?.countryCode || '', country: result?.country || '' });
  } catch {
    return res.json({ countryCode: '', country: '' });
  }
});

// --- Reviews (manual, managed from Admin panel; synced to Firebase) ---

// Public: homepage fetches the review list
app.get('/api/reviews', (_req: Request, res: Response) => {
  const sorted = [...reviewDatabase].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(sorted);
});

// Admin: add a review
app.post('/api/reviews', requireAdmin, (req: Request, res: Response) => {
  const { authorName, rating, text, source } = req.body || {};
  const name = String(authorName || '').trim();
  const body = String(text || '').trim();
  const stars = Math.round(Number(rating));
  if (!name || !body) return res.status(400).json({ error: 'Author name and review text are required.' });
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Review text is too long (max 2000 characters).' });

  const review: SiteReview = {
    id: `rev-${Date.now().toString().slice(-6)}`,
    authorName: name,
    rating: stars,
    text: body,
    source: String(source || '').trim().slice(0, 40) || undefined,
    createdAt: new Date().toISOString()
  };
  reviewDatabase.unshift(review);
  persistReviews();
  res.status(201).json(review);
});

// Admin: update a review
app.patch('/api/reviews/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = reviewDatabase.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Review not found.' });
  const { authorName, rating, text, source } = req.body || {};
  const name = String(authorName ?? reviewDatabase[idx].authorName).trim();
  const body = String(text ?? reviewDatabase[idx].text).trim();
  const stars = rating !== undefined ? Math.round(Number(rating)) : reviewDatabase[idx].rating;
  if (!name || !body) return res.status(400).json({ error: 'Author name and review text are required.' });
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Review text is too long (max 2000 characters).' });

  reviewDatabase[idx] = {
    ...reviewDatabase[idx],
    authorName: name,
    rating: stars,
    text: body,
    source: String(source ?? '').trim().slice(0, 40) || undefined
  };
  persistReviews();
  res.json(reviewDatabase[idx]);
});

// Admin: delete a review
app.delete('/api/reviews/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = reviewDatabase.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Review not found.' });
  reviewDatabase.splice(idx, 1);
  persistReviews();
  res.json({ ok: true });
});

// Submit Appointment Request
app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      preferredDate,
      preferredTimeSlot,
      serviceId,
      serviceName,
      doctorPreference,
      insuranceProvider,
      isNewPatient,
      notes,
      isEmergency
    } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required contact details.' });
    }

    const newAppointment: AppointmentRequest = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      firstName,
      lastName,
      email,
      phone,
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTimeSlot: preferredTimeSlot || '09:00 AM',
      serviceId: serviceId || 'general-consult',
      serviceName: serviceName || 'General Consultation & Smile Evaluation',
      doctorPreference: doctorPreference || 'Any Available Specialist',
      insuranceProvider: insuranceProvider || 'Self-Pay / Membership Plan',
      isNewPatient: Boolean(isNewPatient),
      notes: notes || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      isEmergency: Boolean(isEmergency)
    };

    appointmentDatabase.unshift(newAppointment);
    persistAppointments();

    sendNewAppointmentNotification(newAppointment);

    return res.status(201).json({
      success: true,
      message: 'Appointment request received successfully!',
      appointment: newAppointment
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process appointment booking.' });
  }
});

// Admin: Get all appointments (requires sign-in)
app.get('/api/appointments', requireAdmin, (req: Request, res: Response) => {
  res.json(appointmentDatabase);
});

// Admin: Update appointment status / reschedule / notes
app.patch('/api/appointments/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, assignedDoctor, confirmedDate, confirmedTime, adminNotes, reason } = req.body;

  const aptIndex = appointmentDatabase.findIndex(a => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  const existing = appointmentDatabase[aptIndex];
  const oldStatus = existing.status;

  if (status === 'Approved') {
    // Admin MUST pick an available doctor before confirming.
    const doc = String(assignedDoctor || '').trim();
    const knownDoctors = doctorDatabase.map(d => `${d.name}${d.credentials ? `, ${d.credentials}` : ''}`);
    if (!doc) {
      return res.status(400).json({ error: 'Please assign an available doctor before confirming the appointment.' });
    }
    if (!knownDoctors.some(k => k.toLowerCase() === doc.toLowerCase())) {
      return res.status(400).json({ error: 'The assigned doctor is not in your doctors list. Add or select a valid doctor first.' });
    }
    if (!confirmedDate) return res.status(400).json({ error: 'A confirmed date is required before confirming the appointment.' });
    if (!confirmedTime) return res.status(400).json({ error: 'A confirmed time is required before confirming the appointment.' });
  }

  if ((status === 'Rejected' || status === 'Rescheduled')) {
    const theReason = String(reason || adminNotes || '').trim();
    if (!theReason) {
      return res.status(400).json({
        error: status === 'Rejected'
          ? 'A reason is required to decline the appointment. The patient will see it in the email.'
          : 'A reason is required to reschedule. The patient will see it in the email.'
      });
    }
  }

  if (status === 'Rescheduled') {
    if (!confirmedDate) return res.status(400).json({ error: 'A new date is required when rescheduling.' });
    if (!confirmedTime) return res.status(400).json({ error: 'A new time is required when rescheduling.' });
  }

  const assigned: string | undefined =
    status === 'Approved' ? assignedDoctor
    : (assignedDoctor !== undefined ? assignedDoctor : existing.assignedDoctor);

  appointmentDatabase[aptIndex] = {
    ...existing,
    ...(status && { status }),
    ...(assigned !== undefined && { assignedDoctor: assigned }),
    ...(confirmedDate !== undefined && { confirmedDate }),
    ...(confirmedTime !== undefined && { confirmedTime }),
    ...(adminNotes !== undefined && { adminNotes }),
    ...(reason !== undefined ? { reason: String(reason).trim() } : existing.reason ? { reason: existing.reason } : {})
  };
  persistAppointments();

  // Send email on status change
  if (status && status !== oldStatus) {
    sendStatusEmail(appointmentDatabase[aptIndex], status);
  }

  return res.json({
    success: true,
    message: `Appointment ${id} updated to ${status}.`,
    appointment: appointmentDatabase[aptIndex]
  });
});

// Admin: Delete appointment
app.delete('/api/appointments/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  appointmentDatabase = appointmentDatabase.filter(a => a.id !== id);
  persistAppointments();
  return res.json({ success: true, message: 'Appointment record removed.' });
});

// Export CSV Endpoint (requires sign-in)
app.get('/api/admin/export-csv', requireAdmin, (req: Request, res: Response) => {
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date', 'Time Slot', 'Service', 'Doctor', 'Status', 'Insurance'];
  const rows = appointmentDatabase.map(a => [
    a.id,
    `"${a.firstName}"`,
    `"${a.lastName}"`,
    `"${a.email}"`,
    `"${a.phone}"`,
    a.confirmedDate || a.preferredDate,
    a.confirmedTime || a.preferredTimeSlot,
    `"${a.serviceName}"`,
    `"${a.assignedDoctor || a.doctorPreference}"`,
    a.status,
    `"${a.insuranceProvider}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="first_avenue_dentistry_appointments.csv"');
  res.send(csvContent);
});

// Generate ICS File Download (for "Add to Calendar" fallback links)
app.get('/api/ics/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const apt = appointmentDatabase.find(a => a.id === id);
  const icsContent = buildIcs(apt || {
    id: 'unknown', firstName: 'Your', lastName: 'Appointment',
    email: '', phone: '', preferredDate: new Date().toISOString().split('T')[0],
    preferredTimeSlot: '09:00 AM', serviceId: '', serviceName: 'Dental Visit',
    doctorPreference: 'Our Team', insuranceProvider: '', isNewPatient: true,
    notes: '', status: 'Approved', createdAt: new Date().toISOString()
  } as AppointmentRequest);

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="appointment-${id}.ics"`);
  res.send(icsContent);
});

// Contact Messages Endpoint
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  const newMsg: PatientMessage = {
    id: `msg-${Date.now().toString().slice(-6)}`,
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
    date: new Date().toISOString(),
    read: false
  };

  messageDatabase.unshift(newMsg);
  persistMessages();

  const notif = contactMessageEmail(newMsg);
  deliverEmail('firstavenuedentistry@gmail.com', notif.subject, notif.html);
  deliverEmail(newMsg.email, 'We Received Your Message - First Avenue Dentistry', emailShell(`
    ${heading('Thank you, ' + newMsg.name.split(' ')[0] + '!', 'We received your message and our team will get back to you shortly.')}
    <p style="font-size:13px;color:#64748b;line-height:1.7;">For anything urgent, please call us directly at <a href="tel:+15192076890" style="color:#2563eb;font-weight:bold;">(519) 207-6890</a>.</p>
    ${ctaButton('Visit Our Website', SITE_URL)}
  `));

  return res.json({ success: true, message: 'Your message has been sent to our concierge team.' });
});

// Admin: Get all contact messages (requires sign-in)
app.get('/api/contact', requireAdmin, (req: Request, res: Response) => {
  res.json(messageDatabase);
});

// --- Doctors CRUD ---
app.get('/api/doctors', (req: Request, res: Response) => {
  res.json(doctorDatabase);
});

app.post('/api/doctors', requireAdmin, (req: Request, res: Response) => {
  const { name, title, credentials, bio, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Doctor name is required.' });
  const newDoctor: Doctor = {
    id: `dr-${Date.now().toString(36)}`,
    name,
    title: title || 'Dentist',
    credentials: credentials || '',
    bio: bio || '',
    image: image || '',
    createdAt: new Date().toISOString()
  };
  doctorDatabase.push(newDoctor);
  persistDoctors();
  res.json({ success: true, doctor: newDoctor });
});

app.patch('/api/doctors/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = doctorDatabase.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Doctor not found.' });
  const { name, title, credentials, bio, image } = req.body;
  if (name) doctorDatabase[idx].name = name;
  if (title !== undefined) doctorDatabase[idx].title = title;
  if (credentials !== undefined) doctorDatabase[idx].credentials = credentials;
  if (bio !== undefined) doctorDatabase[idx].bio = bio;
  if (image !== undefined) doctorDatabase[idx].image = image;
  persistDoctors();
  res.json({ success: true, doctor: doctorDatabase[idx] });
});

app.delete('/api/doctors/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  doctorDatabase = doctorDatabase.filter(d => d.id !== id);
  persistDoctors();
  res.json({ success: true, message: 'Doctor removed.' });
});

// --- Services CRUD ---
app.get('/api/services', (req: Request, res: Response) => {
  res.json(servicesDatabase);
});

app.post('/api/services', requireAdmin, (req: Request, res: Response) => {
  const { label, description, icon } = req.body;
  if (!label) return res.status(400).json({ error: 'Service label is required.' });
  const newService: ServiceListEntry = {
    id: `srv-${Date.now().toString(36)}`,
    label,
    description: description || '',
    icon: icon || 'Circle'
  };
  servicesDatabase.push(newService);
  persistServices();
  res.json({ success: true, service: newService });
});

app.patch('/api/services/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = servicesDatabase.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Service not found.' });
  const { label, description, icon } = req.body;
  if (label) servicesDatabase[idx].label = label;
  if (description !== undefined) servicesDatabase[idx].description = description;
  if (icon !== undefined) servicesDatabase[idx].icon = icon;
  persistServices();
  res.json({ success: true, service: servicesDatabase[idx] });
});

app.delete('/api/services/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  servicesDatabase = servicesDatabase.filter(s => s.id !== id);
  persistServices();
  res.json({ success: true, message: 'Service removed.' });
});

// Admin Auth Endpoint (accepts email or username)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const mins = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${mins} minute(s).` });
  }

  const { email, username, password } = req.body;
  const login = email || username || '';
  const admin = authenticateAdmin(login, password);
  if (admin) {
    loginAttempts.delete(ip);
    admin.lastLogin = new Date().toISOString();
    persistAdmins();
    const token = createSession(admin.id);
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const secure = req.secure || forwardedProto.includes('https');
    res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? '; Secure' : ''}`);
    return res.json({
      success: true,
      user: { id: admin.id, email: admin.email, username: admin.username, role: admin.role, name: admin.name, gender: admin.gender }
    });
  }

  const cur = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  cur.count += 1;
  if (cur.count >= LOGIN_MAX_FAILURES) {
    loginAttempts.set(ip, { count: 0, lockedUntil: Date.now() + LOGIN_LOCK_MS });
    return res.status(429).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
  }
  loginAttempts.set(ip, cur);
  return res.status(401).json({ error: 'Invalid credentials.' });
});

// Admin: Sign out (clears the httpOnly session cookie)
app.post('/api/admin/logout', (req: Request, res: Response) => {
  clearSession(req, res);
  res.json({ success: true });
});

// Admin: Get all admin accounts
app.get('/api/admin/accounts', requireAdmin, (req: Request, res: Response) => {
  const safe = adminDatabase.map(({ password, ...rest }) => rest);
  res.json(safe);
});

// Admin: Create admin account
app.post('/api/admin/accounts', requireAdmin, (req: Request, res: Response) => {
  const { name, email, username, password, role, gender } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required.' });
  if (adminDatabase.find(a => a.email === email)) return res.status(400).json({ error: 'Email already exists.' });
  if (username && adminDatabase.find(a => a.username === username)) return res.status(400).json({ error: 'Username already exists.' });
  const newAdmin: AdminUser = {
    id: `admin-${Date.now().toString(36)}`,
    name, email, username,
    password: hashPassword(password),
    role: role || 'Admin',
    gender: gender || undefined,
    createdAt: new Date().toISOString()
  };
  adminDatabase.push(newAdmin);
  persistAdmins();
  const { password: _, ...safe } = newAdmin;
  res.json({ success: true, admin: safe });
});

// Admin: Update admin account
app.patch('/api/admin/accounts/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = adminDatabase.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Admin not found.' });
  const { name, email, username, password, role, gender } = req.body;
  if (name) adminDatabase[idx].name = name;
  if (email) adminDatabase[idx].email = email;
  if (username !== undefined) adminDatabase[idx].username = username;
  if (password) adminDatabase[idx].password = hashPassword(password);
  if (role) adminDatabase[idx].role = role;
  if (gender !== undefined) adminDatabase[idx].gender = gender;
  persistAdmins();
  const { password: _, ...safe } = adminDatabase[idx];
  res.json({ success: true, admin: safe });
});

// Admin: Delete admin account
app.delete('/api/admin/accounts/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  adminDatabase = adminDatabase.filter(a => a.id !== id);
  persistAdmins();
  res.json({ success: true });
});

// Admin: Update own profile
app.patch('/api/admin/profile', requireAdmin, (req: Request, res: Response) => {
  const { id, name, email, username, gender, currentPassword, newPassword } = req.body;
  const admin = adminDatabase.find(a => a.id === id);
  if (!admin) return res.status(404).json({ error: 'No admin found.' });
  if (currentPassword && !passwordMatches(admin.password, currentPassword)) return res.status(401).json({ error: 'Current password is incorrect.' });
  if (name) admin.name = name;
  if (email) admin.email = email;
  if (username !== undefined) admin.username = username;
  if (gender !== undefined) admin.gender = gender;
  if (newPassword) admin.password = hashPassword(newPassword);
  persistAdmins();
  const { password: _, ...safe } = admin;
  res.json({ success: true, user: safe });
});

// Forgot password - generate 6-digit code and email
const RESET_TOKENS_FILE = path.join(DATA_DIR, 'reset_tokens.json');
let resetTokens: ResetToken[] = loadJSON(RESET_TOKENS_FILE, []);
function persistResetTokens() { saveJSON(RESET_TOKENS_FILE, resetTokens); }
setInterval(() => {
  const now = Date.now();
  resetTokens = resetTokens.filter(t => new Date(t.expiresAt).getTime() > now);
  persistResetTokens();
}, 300_000);

// Anti-abuse: max 3 reset codes per email per 15 minutes
const forgotRequests = new Map<string, number[]>();
const FORGOT_MAX_PER_WINDOW = 3;
const FORGOT_WINDOW_MS = 15 * 60 * 1000;

function generateResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

app.post('/api/admin/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const key = String(email).toLowerCase();
    const now = Date.now();
    const recent = (forgotRequests.get(key) || []).filter(t => now - t < FORGOT_WINDOW_MS);
    if (recent.length >= FORGOT_MAX_PER_WINDOW) {
      return res.status(429).json({ error: 'Too many reset requests. Try again later.' });
    }
    recent.push(now);
    forgotRequests.set(key, recent);

    const admin = adminDatabase.find(a => a.email === email);
    if (!admin) return res.status(404).json({ error: 'No account found with that email.' });

    // Clean up expired tokens
    resetTokens = resetTokens.filter(t => new Date(t.expiresAt).getTime() > now);

    // Remove any existing code for this email
    resetTokens = resetTokens.filter(t => t.email !== email);

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    resetTokens.push({ email, code, expiresAt });
    persistResetTokens();

    const mail = resetCodeEmail(code);
    await deliverEmail(email, mail.subject, mail.html);

    return res.json({ success: true, message: 'A 6-digit reset code has been sent to your email.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send reset code.' });
  }
});

// Reset password with 6-digit code
const resetAttempts = new Map<string, { count: number; lockedUntil: number }>();
app.post('/api/admin/reset-password', (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const attempt = resetAttempts.get(ip);
    if (attempt && attempt.lockedUntil > Date.now()) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const { code, newPassword } = req.body;
    if (!code || !newPassword) return res.status(400).json({ error: 'Reset code and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const now = Date.now();
    resetTokens = resetTokens.filter(t => new Date(t.expiresAt).getTime() > now);
    persistResetTokens();

    const stored = resetTokens.find(t => t.code === code);
    if (!stored) {
      const cur = resetAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      cur.count += 1;
      if (cur.count >= 10) {
        resetAttempts.set(ip, { count: 0, lockedUntil: Date.now() + LOGIN_LOCK_MS });
        return res.status(429).json({ error: 'Too many attempts. Try again later.' });
      }
      resetAttempts.set(ip, cur);
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }
    resetAttempts.delete(ip);

    const admin = adminDatabase.find(a => a.email === stored.email);
    if (!admin) return res.status(404).json({ error: 'Admin account not found.' });

    admin.password = hashPassword(newPassword);
    persistAdmins();

    resetTokens = resetTokens.filter(t => t.code !== code);
    persistResetTokens();

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Email log endpoint (requires sign-in)
app.get('/api/admin/email-log', requireAdmin, (req: Request, res: Response) => {
  const logs = loadJSON(EMAIL_LOG_FILE, []);
  res.json(logs);
});

// Email status endpoint (requires sign-in)
app.get('/api/admin/email-status', requireAdmin, (req: Request, res: Response) => {
  res.json({
    smtpReady,
    smtpError,
    smtpHost: SMTP_HOST,
    smtpPort: SMTP_PORT,
    from: EMAIL_FROM,
    logFile: fs.existsSync(EMAIL_LOG_FILE) ? fs.statSync(EMAIL_LOG_FILE).size : 0
  });
});

// Test email endpoint (requires sign-in)
app.post('/api/admin/test-email', requireAdmin, (req: Request, res: Response) => {
  const { to } = req.body;
  const target = to || 'fenilxpatel2642@gmail.com';
  const email = emailShell(`
    ${heading('Test Email', 'This is a test to verify the email system is working.')}
    <p style="font-size:14px;color:#475569;line-height:1.7;">If you received this email, the First Avenue Dentistry email system is delivering messages correctly.</p>
    ${ctaButton('Visit Our Website', SITE_URL)}
  `);
  deliverEmail(target, 'Test Email from First Avenue Dentistry', email);
  res.json({ success: true, message: `Email queued for ${target}.`, smtpReady });
});

// --- AI Dental Concierge Answer Engine ---
// Every treatment answer is generated live from the same service data used on
// the Services page (src/data/mockData.ts), so the bot always explains exactly
// what we promote on the website.

const SERVICE_TOPICS: Array<{ id: string; title: string; aliases: string[] }> = [
  { id: 'root-canals', title: 'Root Canals', aliases: ['root canal', 'endodontic', 'abscessed tooth', 'infected pulp', 'tooth infection', 'toothache', 'tooth ache'] },
  { id: 'dental-implant', title: 'Dental Implants', aliases: ['dental implant', 'implants', 'mouth implant', 'missing tooth', 'missing teeth', 'lost tooth', 'replace a tooth', 'restore a tooth'] },
  { id: 'orthodontics', title: 'Orthodontics', aliases: ['invisalign', 'clear aligner', 'aligners', 'brace', 'braces', 'straighten', 'misaligned', 'crooked', 'overbite', 'underbite', 'orthodont'] },
  { id: 'porcelain-veneers', title: 'Porcelain Veneers', aliases: ['veneers', 'veneer', 'smile makeover', 'cover my teeth', 'fix my gap', 'fix my chips'] },
  { id: 'teeth-whitening', title: 'Teeth Whitening', aliases: ['whitening', 'white my teeth', 'yellow teeth', 'stained teeth', 'discolored', 'discolour', 'zoom whitening'] },
  { id: 'childrens-dentistry', title: "Children's Dentistry", aliases: ['children', 'child', 'kids', 'pediatric', 'toddler', 'my daughter', 'my son'] },
  { id: 'sedation-sleep-dentistry', title: 'Sedation Dentistry', aliases: ['sedation', 'dental anxiety', 'nervous', 'afraid of dentist', 'fear', 'phobia', 'laughing gas', 'nitrous', 'sleep dentistry', 'gag reflex'] },
  { id: 'crowns-bridges', title: 'Crowns & Bridges', aliases: ['crown', 'crowns', 'bridge', 'bridges', 'cracked tooth', 'broken tooth', 'weak tooth'] },
  { id: 'teeth-cleaning', title: 'Teeth Cleaning', aliases: ['cleaning', 'dental cleaning', 'scale', 'tartar', 'plaque', 'checkup', 'check-up', 'hygiene', 'routine visit', 'oral health'] },
  { id: 'wisdom-teeth-extraction', title: 'Wisdom Teeth Extraction', aliases: ['wisdom', 'extraction', 'extract', 'remove a tooth', 'pull the tooth', 'pulled tooth', 'impacted'] },
  { id: 'oral-surgery', title: 'Oral Surgery', aliases: ['oral surgery', 'flap surgery', 'bone graft', 'bone regeneration', 'tissue regeneration', 'surgical extraction'] },
  { id: 'oral-cancer-screening', title: 'Oral Cancer Screening', aliases: ['cancer', 'screening', 'velscope', 'lesion', 'sore that will not heal'] },
];

function pickServiceTopic(lower: string) {
  let best: { id: string; title: string; matched: string } | null = null;
  for (const topic of SERVICE_TOPICS) {
    for (const alias of topic.aliases) {
      if (lower.includes(alias)) {
        if (!best || alias.length > best.matched.length) {
          best = { id: topic.id, title: topic.title, matched: alias };
        }
      }
    }
  }
  return best;
}

function buildTreatmentAnswer(topicId: string, topicTitle: string): string {
  const service = SERVICE_DETAILS[topicId];
  if (!service) return '';
  const benefits = (service.benefits || []).slice(0, 4);
  const intent = `We'd be happy to walk you through ${topicTitle.toLowerCase()} — this is one of our most popular services!`;

  let lines = [intent];
  if (service.description) lines.push(`\n${service.description}`);
  if (service.procedure) lines.push(`\nWhat the treatment involves:\n• ${service.procedure}`);
  if (service.recoveryTime) lines.push(`\nRecovery: ${service.recoveryTime}`);
  if (benefits.length) lines.push(`\nKey benefits:\n${benefits.map(b => `• ${b}`).join('\n')}`);
  lines.push(`\nEvery smile is different, so we'll personalise this for you at a consultation. Want me to book an appointment? 😊`);

  return lines.join('\n');
}

function buildServicesOverview(): string {
  const list = SERVICES_LIST.map(s => `• ${s.label} — ${s.description}`).join('\n');
  return `We offer a full range of dental care at First Avenue Dentistry. Here's what you can choose from:\n\n${list}\n\nNot sure which one fits you? Ask me about any treatment — or tell me your concern and I'll point you in the right direction. 😊`;
}

const FAQ_RESPONSES: Record<string, string> = {
  'hours': `Our office hours are: Monday – Friday ${CLINIC_SETTINGS.hours.weekdays}, Saturday ${CLINIC_SETTINGS.hours.saturday}, and Sunday ${CLINIC_SETTINGS.hours.sunday}.`,
  'new patient': 'Yes, we are welcoming new patients! You can book your first visit online right now — it only takes about 30 seconds — or call us and we will set everything up for you.',
  'insurance': 'We accept most major dental insurance plans and offer flexible payment plans for self-pay patients. Bring your insurance details to your first visit and our front desk will handle the rest.',
  'cost': 'Treatment costs depend on your specific needs. We provide clear, written estimates before any work begins and we offer payment plans to help spread the cost.',
  'emergency': `If this is a dental emergency, don't wait — call us right away at ${CLINIC_SETTINGS.phone}. For severe pain, swelling, or trauma we offer same-day emergency appointments.`,
  'first visit': 'Your first visit starts with a friendly chat, a full examination, and any X-rays or screening you need. You\'ll leave with a clear treatment plan. Plan on about 45–60 minutes.',
  'payment': 'We make care affordable with insurance billing and flexible payment plans.',
  'parking': 'We have convenient parking available right at the office.',
  'location': `You'll find us at 308 Wellington Street, St. Thomas, ON N5R 2S9 — easy to reach with parking on site.`
};

// AI Dental Concierge Endpoint
app.post('/api/ai/dental-assistant', async (req: Request, res: Response) => {
  try {
    const { message, prompt } = req.body;
    const input = message || prompt;
    if (!input) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const lower = input.toLowerCase();
    const trimmed = lower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1) Booking intent
    const bookingKeywords = ['make an appointment', 'book an appointment', 'schedule a visit', 'want to book', 'book appointment', 'i want to book', 'can i book', 'id like to book', "i'd like to book", 'book online'];
    const isBookingIntent = bookingKeywords.some(k => trimmed.includes(k));
    if (isBookingIntent) {
      return res.json({
        answer: "I'd be happy to help you book an appointment! Let me guide you through it.\n\nFirst, what's your first name?",
        action: 'booking_start'
      });
    }

    // 2) Most specific treatment explainer (built from the services page data)
    const topic = pickServiceTopic(lower);
    if (topic) {
      return res.json({ answer: buildTreatmentAnswer(topic.id, topic.title) });
    }

    // 2b) Office hours / day questions
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const asksHours = ['open', 'hours', 'close', 'timing', 'time', 'when are you', 'what time'].some(k => trimmed.includes(k));
    if (asksHours || dayNames.some(d => lower.includes(d))) {
      return res.json({ answer: FAQ_RESPONSES['hours'] + '\n\nWould you like me to help you book an appointment?' });
    }

    // 3) "What services do you offer?" overview
    if (trimmed.includes('service') || trimmed.includes('treat')) {
      return res.json({ answer: buildServicesOverview() });
    }

    // 4) Quick FAQs
    for (const [keyword, answer] of Object.entries(FAQ_RESPONSES)) {
      if (lower.includes(keyword)) {
        return res.json({ answer: answer + '\n\nWould you like me to help you book an appointment, or can I explain any treatment for you?' });
      }
    }

    // 5) Friendly default - Advanced Fallback
    return res.json({
      answer: "I'm here to help with any dental concern or question you have! 😊\n\nWhether you're experiencing pain, wondering about cosmetic improvements, or just need a routine checkup, our expert team at First Avenue Dentistry has you covered.\n\nPlease provide a few more details about your specific situation so I can give you the best possible advice, or feel free to call our clinic directly at " + CLINIC_SETTINGS.phone + " for immediate assistance."
    });
  } catch (err: any) {
    return res.json({
      answer: "Thank you for your question. Please call us at " + CLINIC_SETTINGS.phone + " for immediate assistance or book an appointment online!"
    });
  }
});

// Start Server or mount Vite middleware
async function hydrateFromFirebase(): Promise<void> {
  if (!initFirebase()) {
    console.log('[storage] Firebase not configured - using local JSON files (data will reset on every Render redeploy).');
    return;
  }

  // Doctors
  const fbDoctors = await fbGet<Doctor[]>('doctors');
  if (Array.isArray(fbDoctors)) {
    doctorDatabase = fbDoctors;
    saveJSON(DOCTORS_FILE, doctorDatabase);
  } else {
    await fbSet('doctors', doctorDatabase); // first run: push seeded data up
  }

  // Appointments
  const fbAppointments = await fbGet<AppointmentRequest[]>('appointments');
  if (Array.isArray(fbAppointments)) {
    appointmentDatabase = fbAppointments;
    saveJSON(APPOINTMENTS_FILE, appointmentDatabase);
  } else {
    await fbSet('appointments', appointmentDatabase);
  }

  // Messages
  const fbMessages = await fbGet<PatientMessage[]>('messages');
  if (Array.isArray(fbMessages)) {
    messageDatabase = fbMessages;
    saveJSON(MESSAGES_FILE, messageDatabase);
  } else {
    await fbSet('messages', messageDatabase);
  }

  // Admins (trust Firebase over local defaults once it has data)
  const fbAdmins = await fbGet<AdminUser[]>('admins');
  if (Array.isArray(fbAdmins) && fbAdmins.length > 0) {
    adminDatabase = fbAdmins;
    saveJSON(ADMINS_FILE, adminDatabase);
  } else {
    await fbSet('admins', adminDatabase);
  }

  // Reviews
  const fbReviews = await fbGet<SiteReview[]>('reviews');
  if (Array.isArray(fbReviews)) {
    reviewDatabase = fbReviews;
    saveJSON(REVIEWS_FILE, reviewDatabase);
  } else {
    await fbSet('reviews', reviewDatabase);
  }

  // Services
  const fbServices = await fbGet<ServiceListEntry[]>('services');
  if (Array.isArray(fbServices)) {
    servicesDatabase = fbServices;
    saveJSON(SERVICES_FILE, servicesDatabase);
  } else {
    await fbSet('services', servicesDatabase);
  }

  console.log(`[storage] Firebase source of truth: ${doctorDatabase.length} doctors, ${servicesDatabase.length} services, ${appointmentDatabase.length} appointments, ${messageDatabase.length} messages, ${adminDatabase.length} admins, ${reviewDatabase.length} reviews`);
}

async function startServer() {
  await hydrateFromFirebase();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`First Avenue Family Dentistry Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

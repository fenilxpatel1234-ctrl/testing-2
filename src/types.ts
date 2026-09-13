export type PageView = 
  | 'home' 
  | 'services'
  | 'service-detail'
  | 'book-online'
  | 'emergency'
  | 'our-team'
  | 'contact-us'
  | 'blog'
  | 'reviews'
  | 'legal'
  | 'admin'
  | 'reset-password';

export interface ServiceListEntry {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  image2?: string;
  benefits: string[];
  procedure: string;
  recoveryTime: string;
}

export interface SiteSettings {
  clinicName: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  googleMapsEmbedUrl: string;
  metaTitle: string;
  metaDescription: string;
}

export interface AppointmentRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTimeSlot: string;
  serviceId: string;
  serviceName: string;
  doctorPreference: string;
  insuranceProvider: string;
  isNewPatient: boolean;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rescheduled' | 'Rejected' | 'Completed' | 'Cancelled';
  assignedDoctor?: string;
  confirmedDate?: string;
  confirmedTime?: string;
  adminNotes?: string;
  reason?: string;
  createdAt: string;
  isEmergency?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  role: 'Super Admin' | 'Admin' | 'Viewer';
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
  lastLogin?: string;
}

export interface ResetToken {
  email: string;
  code: string;
  expiresAt: string;
}

export interface PatientMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  credentials: string;
  bio: string;
  image?: string;
  createdAt: string;
}

export interface SiteReview {
  id: string;
  authorName: string;
  rating: number; // 1-5
  text: string;
  source?: string; // e.g. 'Google', 'Patient', 'Walk-in'
  createdAt: string;
}

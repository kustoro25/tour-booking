// Tour Types
export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  name: string;
  slug: string;
  category: TourCategory;
  destination: string;
  duration: string;
  priceAdult: number;
  priceChild: number;
  discount: number;
  maxSlot: number;
  minPax: number;
  itinerary: ItineraryDay[];
  includes: string[];
  excludes: string[];
  terms: string;
  isActive: boolean;
  coverImg: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  gallery?: GalleryImage[];
  slots?: TourSlot[];
  _count?: { orders: number; reviews: number };
  avgRating?: number;
}

export type TourCategory = 'OPEN_TRIP' | 'PRIVATE_TRIP' | 'HONEYMOON' | 'CORPORATE' | 'FAMILY' | 'ADVENTURE' | 'CULTURE' | 'STUDY_TOUR' | 'GROUP';

export const TourCategoryLabels: Record<TourCategory, string> = {
  OPEN_TRIP: 'Open Trip',
  PRIVATE_TRIP: 'Private Trip',
  HONEYMOON: 'Honeymoon',
  CORPORATE: 'Corporate',
  FAMILY: 'Family Tour',
  ADVENTURE: 'Petualangan',
  CULTURE: 'Wisata Budaya',
  STUDY_TOUR: 'Study Tour',
  GROUP: 'Rombongan',
};

// Gallery Types
export interface GalleryImage {
  id: string;
  tourId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

// Tour Slot Types
export interface TourSlot {
  id: string;
  tourId: string;
  date: string;
  quota: number;
  bookedCount: number;
  priceOverride: number | null;
  isBlackout: boolean;
}

// Order Types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentType = 'FULL' | 'INSTALLMENT';

export const PaymentTypeLabels: Record<PaymentType, string> = {
  FULL: 'Lunas',
  INSTALLMENT: 'Angsuran',
};

export const OrderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  CONFIRMED: 'Terkonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const OrderStatusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const OrderStatusIcons: Record<OrderStatus, string> = {
  PENDING: '⏳',
  CONFIRMED: '✅',
  COMPLETED: '🏁',
  CANCELLED: '❌',
};

export const OrderStatusDotColors: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-emerald-500',
  COMPLETED: 'bg-sky-500',
  CANCELLED: 'bg-rose-500',
};

export interface Order {
  id: string;
  tourId: string;
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tourDate: string;
  adults: number;
  children: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentProof: string | null;
  paymentType: PaymentType;
  notes: string | null;
  adminNotes: string | null;
  reviewToken: string | null;
  reviewSentAt: string | null;
  expiryAt: string;
  createdAt: string;
  updatedAt: string;
  tour?: Tour;
  invoice?: Invoice;
  review?: Review;
  installmentPlan?: InstallmentPlan;
}

// Invoice Types
export interface Invoice {
  id: string;
  orderId: string;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
}

// Installment Types
export type InstallmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const InstallmentPlanStatusLabels: Record<InstallmentPlanStatus, string> = {
  ACTIVE: 'Aktif',
  COMPLETED: 'Lunas',
  CANCELLED: 'Dibatalkan',
};

export const InstallmentPlanStatusColors: Record<InstallmentPlanStatus, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export type InstallmentPaymentStatus = 'PENDING' | 'PAID' | 'CONFIRMED' | 'OVERDUE';

export const InstallmentPaymentStatusLabels: Record<InstallmentPaymentStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Menunggu Konfirmasi',
  CONFIRMED: 'Terkonfirmasi',
  OVERDUE: 'Terlambat',
};

export const InstallmentPaymentStatusColors: Record<InstallmentPaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-sky-50 text-sky-700 border-sky-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const InstallmentPaymentStatusDots: Record<InstallmentPaymentStatus, string> = {
  PENDING: 'bg-amber-500',
  PAID: 'bg-sky-500',
  CONFIRMED: 'bg-emerald-500',
  OVERDUE: 'bg-rose-500',
};

export interface InstallmentPlan {
  id: string;
  orderId: string;
  totalAmount: number;
  installmentCount: number;
  amountPerInstallment: number;
  downPayment: number;
  dpPercentage: number;
  installmentDates: string[];
  agreementDocUrl: string | null;
  status: InstallmentPlanStatus;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  payments?: InstallmentPayment[];
}

export interface InstallmentPayment {
  id: string;
  planId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: InstallmentPaymentStatus;
  paymentProof: string | null;
  adminConfirmedBy: string | null;
  adminConfirmedAt: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';

export interface Review {
  id: string;
  orderId: string;
  tourId: string;
  rating: number;
  reviewText: string;
  photos: string[];
  status: ReviewStatus;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  order?: { customerName: string; tour?: { name: string } };
  tour?: { name: string; slug: string };
}

// User / Admin Types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTENT_MANAGER';

export const UserRoleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin Operasional',
  CONTENT_MANAGER: 'Content Manager',
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: string;
}

// Destination Types
export interface Destination {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  location: string;
  imageUrl: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  bestTimeToVisit: string;
  activities: string[];
  highlight: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Page CMS Types
export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  updatedAt: string;
}

// Setting Types
export interface AppSettings {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  paymentDeadline: number; // hours
  bankAccounts: BankAccount[];
  paymentGateway: 'manual' | 'midtrans' | 'xendit';
  midtransServerKey: string;
  midtransClientKey: string;
  // Installment settings
  installmentEnabled: boolean;
  installmentOptions: number[];
  dpPercentage: number;
  minAmountForInstallment: number;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Booking Form Data
export interface BookingFormData {
  tourId: string;
  tourDate: string;
  adults: number;
  children: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

// Calendar Day
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  available: boolean;
  quota: number;
  bookedCount: number;
  isBlackout: boolean;
  priceOverride: number | null;
}

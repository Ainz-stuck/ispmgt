export type UserRole = "STUDENT" | "FACULTY" | "ADMINISTRATOR";

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  contactNumber?: string;
  department: string;
  role: UserRole;
  studentOrEmployeeId: string;
  avatarUrl?: string;
  status: "ACTIVE" | "DEACTIVATED";
  createdAt?: string;
}

export type FacilityId =
  | "function-hall"
  | "dining-hall"
  | "gym"
  | "dance-hall"
  | "avr"
  | "rooftop-engineering";

export type FacilityStatus = "AVAILABLE" | "MAINTENANCE" | "BOOKED";

export interface Facility {
  id: FacilityId;
  name: string;
  code: string;
  description: string;
  location: string;
  building: string;
  floor: string;
  capacity: number;
  status: FacilityStatus;
  image: string;
  availableResources: string[];
  features: string[];
  operatingHours: string;
  contactPerson: string;
  contactEmail: string;
  guidelines: string[];
}

export type ResourceCategory = "AV_EQUIPMENT" | "AUDIO" | "FURNITURE" | "DISPLAY";
export type ResourceCondition = "EXCELLENT" | "GOOD" | "FAIR" | "UNDER_REPAIR";

export interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  facilityScope: FacilityId | "CAMPUS_WIDE";
  totalQuantity: number;
  availableQuantity: number;
  condition: ResourceCondition;
  unit: string;
}

export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface RequestedResource {
  resourceId: string;
  name: string;
  quantity: number;
}

export interface Reservation {
  id: string;
  reservationCode: string;
  facilityId: FacilityId;
  facilityName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  department: string;
  eventName: string;
  purpose: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  expectedAttendees: number;
  resources: RequestedResource[];
  status: ReservationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface ApprovalLog {
  id: string;
  reservationId: string;
  reservationCode: string;
  eventName: string;
  facilityName: string;
  actorName: string;
  actorRole: UserRole;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "STATUS_OVERRIDE" | "MAINTENANCE_TOGGLE" | "USER_STATUS_CHANGE" | "FACILITY_DETAILS_UPDATE";
  timestamp: string;
  notes: string;
}

export type NotificationType =
  | "RESERVATION_SUBMITTED"
  | "RESERVATION_APPROVED"
  | "RESERVATION_REJECTED"
  | "SCHEDULE_REMINDER"
  | "FACILITY_UPDATE"
  | "ACCOUNT_SECURITY";

export interface SystemNotification {
  id: string;
  userId: string;
  targetRole?: UserRole | "ALL";
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  reservationId?: string;
}

export interface FacilityScheduleEntry {
  id: string;
  facilityId: FacilityId;
  facilityName: string;
  eventName: string;
  userName: string;
  userRole: UserRole;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export type AuthView = "landing" | "login" | "register" | "forgot-password" | "app";

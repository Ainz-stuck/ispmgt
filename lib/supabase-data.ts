import { supabase } from "./supabase";
export { supabase };
import {
  User,
  UserRole,
  Facility,
  FacilityId,
  FacilityStatus,
  ResourceItem,
  ResourceCondition,
  Reservation,
  ReservationStatus,
  RequestedResource,
  ApprovalLog,
  SystemNotification,
} from "../types";

// ==========================================
// Mappers (Database snake_case -> App camelCase)
// ==========================================

export function mapProfileToUser(p: any): User {
  return {
    id: p.id,
    name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
    firstName: p.first_name || undefined,
    lastName: p.last_name || undefined,
    email: p.email,
    contactNumber: p.contact_number || undefined,
    department: p.department || "",
    role: p.role as UserRole,
    studentOrEmployeeId: p.student_or_employee_id || "",
    avatarUrl: p.avatar_url || undefined,
    status: p.status as "ACTIVE" | "DEACTIVATED",
    createdAt: p.created_at ? p.created_at.split("T")[0] : undefined,
  };
}

export function mapFacility(f: any): Facility {
  return {
    id: f.id as FacilityId,
    name: f.name,
    code: f.code,
    description: f.description || "",
    location: f.location || "",
    building: f.building || "",
    floor: f.floor || "",
    capacity: f.capacity || 0,
    status: f.status as FacilityStatus,
    image: f.image || "",
    availableResources: f.available_resources || [],
    features: f.features || [],
    operatingHours: f.operating_hours || "",
    contactPerson: f.contact_person || "",
    contactEmail: f.contact_email || "",
    guidelines: f.guidelines || [],
  };
}

export function mapResource(r: any): ResourceItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    facilityScope: r.facility_scope,
    totalQuantity: r.total_quantity || 0,
    availableQuantity: r.available_quantity || 0,
    condition: r.condition as ResourceCondition,
    unit: r.unit || "Units",
  };
}

export function mapReservation(r: any, requestedResources: RequestedResource[] = [], profile?: any, facility?: any): Reservation {
  return {
    id: r.id,
    reservationCode: r.reservation_code,
    facilityId: r.facility_id as FacilityId,
    facilityName: facility?.name || r.facilities?.name || r.facility_id,
    userId: r.user_id,
    userName: profile?.name || r.profiles?.name || "Unknown User",
    userRole: (profile?.role || r.profiles?.role || "STUDENT") as UserRole,
    userEmail: profile?.email || r.profiles?.email || "",
    department: profile?.department || r.profiles?.department || "",
    eventName: r.event_name,
    purpose: r.purpose || "",
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    expectedAttendees: r.expected_attendees || 0,
    resources: requestedResources,
    status: r.status as ReservationStatus,
    submittedAt: r.submitted_at ? r.submitted_at.replace("T", " ").substring(0, 16) : "",
    reviewedAt: r.reviewed_at ? r.reviewed_at.replace("T", " ").substring(0, 16) : undefined,
    reviewedBy: r.reviewed_by || undefined,
    rejectionReason: r.rejection_reason || undefined,
    adminNotes: r.admin_notes || undefined,
  };
}

export function mapApprovalLog(l: any): ApprovalLog {
  return {
    id: l.id,
    reservationId: l.reservation_id,
    reservationCode: l.reservation_code || "",
    eventName: l.event_name || "",
    facilityName: l.facility_name || "",
    actorName: l.actor_name || "",
    actorRole: l.actor_role as UserRole,
    action: l.action as any,
    timestamp: l.timestamp ? l.timestamp.replace("T", " ").substring(0, 16) : "",
    notes: l.notes || "",
  };
}

export function mapNotification(n: any): SystemNotification {
  return {
    id: n.id,
    userId: n.user_id || "all",
    targetRole: n.target_role as any,
    title: n.title,
    message: n.message || "",
    type: n.type as any,
    timestamp: n.timestamp ? n.timestamp.replace("T", " ").substring(0, 16) : "",
    read: !!n.read,
    reservationId: n.reservation_id || undefined,
  };
}

// ==========================================
// Profiles & Users
// ==========================================

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapProfileToUser(data);
}

export async function fetchAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapProfileToUser);
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const updates: any = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.firstName !== undefined) updates.first_name = data.firstName;
  if (data.lastName !== undefined) updates.last_name = data.lastName;
  if (data.contactNumber !== undefined) updates.contact_number = data.contactNumber;
  if (data.department !== undefined) updates.department = data.department;
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
  if (data.status !== undefined) updates.status = data.status;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
}

export async function toggleUserStatus(userId: string, currentStatus: "ACTIVE" | "DEACTIVATED"): Promise<"ACTIVE" | "DEACTIVATED"> {
  const nextStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
  const { error } = await supabase
    .from("profiles")
    .update({ status: nextStatus })
    .eq("id", userId);

  if (error) throw error;
  return nextStatus;
}

// ==========================================
// Facilities
// ==========================================

export async function fetchFacilities(): Promise<Facility[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map(mapFacility);
}

export async function updateFacilityStatus(facilityId: FacilityId, status: FacilityStatus): Promise<void> {
  const { error } = await supabase
    .from("facilities")
    .update({ status })
    .eq("id", facilityId);

  if (error) throw error;
}

export async function updateFacilityCapacity(facilityId: FacilityId, capacity: number): Promise<void> {
  const { error } = await supabase
    .from("facilities")
    .update({ capacity })
    .eq("id", facilityId);

  if (error) throw error;
}

export async function updateFacilityDetails(facilityId: FacilityId, data: Partial<Facility>): Promise<void> {
  const updates: any = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code;
  if (data.description !== undefined) updates.description = data.description;
  if (data.location !== undefined) updates.location = data.location;
  if (data.building !== undefined) updates.building = data.building;
  if (data.floor !== undefined) updates.floor = data.floor;
  if (data.capacity !== undefined) updates.capacity = data.capacity;
  if (data.status !== undefined) updates.status = data.status;
  if (data.image !== undefined) updates.image = data.image;
  if (data.availableResources !== undefined) updates.available_resources = data.availableResources;
  if (data.features !== undefined) updates.features = data.features;
  if (data.operatingHours !== undefined) updates.operating_hours = data.operatingHours;
  if (data.contactPerson !== undefined) updates.contact_person = data.contactPerson;
  if (data.contactEmail !== undefined) updates.contact_email = data.contactEmail;
  if (data.guidelines !== undefined) updates.guidelines = data.guidelines;

  const { error } = await supabase
    .from("facilities")
    .update(updates)
    .eq("id", facilityId);

  if (error) throw error;
}

// ==========================================
// Resources
// ==========================================

export async function fetchResources(): Promise<ResourceItem[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map(mapResource);
}

export async function updateResourceCondition(resourceId: string, condition: ResourceCondition): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .update({ condition })
    .eq("id", resourceId);

  if (error) throw error;
}

export async function updateResourceQuantity(resourceId: string, totalQuantity: number): Promise<void> {
  const { data: res } = await supabase
    .from("resources")
    .select("available_quantity")
    .eq("id", resourceId)
    .single();

  const currentAvailable = res?.available_quantity || 0;
  const availableQuantity = Math.min(currentAvailable, totalQuantity);

  const { error } = await supabase
    .from("resources")
    .update({
      total_quantity: totalQuantity,
      available_quantity: availableQuantity,
    })
    .eq("id", resourceId);

  if (error) throw error;
}

// ==========================================
// Reservations & Conflict Checker
// ==========================================

export async function fetchReservations(): Promise<Reservation[]> {
  const [resData, reqData] = await Promise.all([
    supabase
      .from("reservations")
      .select("*, facilities(name), profiles(name, role, email, department)")
      .order("submitted_at", { ascending: false }),
    supabase
      .from("requested_resources")
      .select("*"),
  ]);

  if (resData.error || !resData.data) return [];

  const requestedMap: Record<string, RequestedResource[]> = {};
  if (reqData.data) {
    for (const r of reqData.data) {
      if (!requestedMap[r.reservation_id]) {
        requestedMap[r.reservation_id] = [];
      }
      requestedMap[r.reservation_id].push({
        resourceId: r.resource_id,
        name: r.name,
        quantity: r.quantity,
      });
    }
  }

  return resData.data.map((r: any) =>
    mapReservation(r, requestedMap[r.id] || [], r.profiles, r.facilities)
  );
}

export function checkTimeConflict(
  existing: { date: string; startTime: string; endTime: string; status: string; facilityId: string; id: string },
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): boolean {
  if (existing.id === excludeReservationId) return false;
  if (existing.facilityId !== facilityId) return false;
  if (existing.date !== date) return false;
  if (existing.status === "REJECTED" || existing.status === "CANCELLED") return false;

  const startMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const newStart = startMinutes(startTime);
  const newEnd = startMinutes(endTime);
  const existingStart = startMinutes(existing.startTime);
  const existingEnd = startMinutes(existing.endTime);

  return newStart < existingEnd && newEnd > existingStart;
}

export async function createReservationRecord(
  data: Omit<
    Reservation,
    "id" | "reservationCode" | "status" | "submittedAt" | "userId" | "userName" | "userRole" | "userEmail" | "department"
  >,
  currentUser: User,
  allReservations: Reservation[]
): Promise<{ success: boolean; conflict?: Reservation; reservationCode?: string; reservation?: Reservation }> {
  // 1. Conflict Check
  const conflict = allReservations.find((r) =>
    checkTimeConflict(r, data.facilityId, data.date, data.startTime, data.endTime)
  );

  if (conflict) {
    return { success: false, conflict };
  }

  // 2. Generate ID & Code
  const reservationId = `res-${Date.now()}`;
  const code = `US-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const submittedAt = new Date().toISOString();

  // 3. Insert into reservations
  const { error: resError } = await supabase.from("reservations").insert({
    id: reservationId,
    reservation_code: code,
    facility_id: data.facilityId,
    user_id: currentUser.id,
    event_name: data.eventName,
    purpose: data.purpose,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    expected_attendees: data.expectedAttendees,
    status: "PENDING",
    submitted_at: submittedAt,
  });

  if (resError) throw resError;

  // 4. Insert requested resources
  if (data.resources && data.resources.length > 0) {
    const resourceRows = data.resources.map((res, idx) => ({
      id: `req-${Date.now()}-${idx}`,
      reservation_id: reservationId,
      resource_id: res.resourceId,
      name: res.name,
      quantity: res.quantity,
    }));

    await supabase.from("requested_resources").insert(resourceRows);
  }

  // 5. Insert approval log
  await supabase.from("approval_logs").insert({
    id: `log-${Date.now()}`,
    reservation_id: reservationId,
    reservation_code: code,
    event_name: data.eventName,
    facility_name: data.facilityName,
    actor_name: currentUser.name,
    actor_role: currentUser.role,
    action: "SUBMITTED",
    timestamp: submittedAt,
    notes: "Reservation submitted and queued for administrator schedule review.",
  });

  // 6. User notification
  await supabase.from("notifications").insert([
    {
      id: `notif-${Date.now()}`,
      user_id: currentUser.id,
      title: `Reservation Submitted: ${data.facilityName}`,
      message: `Your booking request ${code} for "${data.eventName}" has been logged and is pending review.`,
      type: "RESERVATION_SUBMITTED",
      timestamp: submittedAt,
      read: false,
      reservation_id: reservationId,
    },
    {
      id: `notif-adm-${Date.now()}`,
      user_id: null,
      target_role: "ADMINISTRATOR",
      title: `New Reservation Request: ${data.facilityName}`,
      message: `${currentUser.name} (${currentUser.role}) requested ${data.facilityName} for "${data.eventName}" on ${data.date}.`,
      type: "RESERVATION_SUBMITTED",
      timestamp: submittedAt,
      read: false,
      reservation_id: reservationId,
    },
  ]);

  const newReservation: Reservation = {
    ...data,
    id: reservationId,
    reservationCode: code,
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    userEmail: currentUser.email,
    department: currentUser.department,
    status: "PENDING",
    submittedAt: submittedAt.replace("T", " ").substring(0, 16),
  };

  return { success: true, reservationCode: code, reservation: newReservation };
}

export async function approveReservationRecord(
  reservation: Reservation,
  actor: User,
  notes?: string
): Promise<void> {
  const reviewedAt = new Date().toISOString();
  const adminNotes = notes || "Approved by facility administrator.";

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "APPROVED",
      reviewed_at: reviewedAt,
      reviewed_by: actor.name,
      admin_notes: adminNotes,
    })
    .eq("id", reservation.id);

  if (error) throw error;

  await supabase.from("approval_logs").insert({
    id: `log-${Date.now()}`,
    reservation_id: reservation.id,
    reservation_code: reservation.reservationCode,
    event_name: reservation.eventName,
    facility_name: reservation.facilityName,
    actor_name: actor.name,
    actor_role: actor.role,
    action: "APPROVED",
    timestamp: reviewedAt,
    notes: adminNotes,
  });

  await supabase.from("notifications").insert({
    id: `notif-${Date.now()}`,
    user_id: reservation.userId,
    title: `Reservation Approved: ${reservation.facilityName}`,
    message: `Your booking request ${reservation.reservationCode} for "${reservation.eventName}" on ${reservation.date} has been approved.`,
    type: "RESERVATION_APPROVED",
    timestamp: reviewedAt,
    read: false,
    reservation_id: reservation.id,
  });
}

export async function rejectReservationRecord(
  reservation: Reservation,
  actor: User,
  reason: string
): Promise<void> {
  const reviewedAt = new Date().toISOString();

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "REJECTED",
      reviewed_at: reviewedAt,
      reviewed_by: actor.name,
      rejection_reason: reason,
    })
    .eq("id", reservation.id);

  if (error) throw error;

  await supabase.from("approval_logs").insert({
    id: `log-${Date.now()}`,
    reservation_id: reservation.id,
    reservation_code: reservation.reservationCode,
    event_name: reservation.eventName,
    facility_name: reservation.facilityName,
    actor_name: actor.name,
    actor_role: actor.role,
    action: "REJECTED",
    timestamp: reviewedAt,
    notes: `Rejected with reason: ${reason}`,
  });

  await supabase.from("notifications").insert({
    id: `notif-${Date.now()}`,
    user_id: reservation.userId,
    title: `Reservation Rejected: ${reservation.facilityName}`,
    message: `Your booking request ${reservation.reservationCode} for "${reservation.eventName}" was declined. Reason: ${reason}`,
    type: "RESERVATION_REJECTED",
    timestamp: reviewedAt,
    read: false,
    reservation_id: reservation.id,
  });
}

export async function cancelReservationRecord(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ status: "CANCELLED" })
    .eq("id", reservationId);

  if (error) throw error;
}

// ==========================================
// Approval Logs
// ==========================================

export async function fetchApprovalLogs(): Promise<ApprovalLog[]> {
  const { data, error } = await supabase
    .from("approval_logs")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error || !data) return [];
  return data.map(mapApprovalLog);
}

// ==========================================
// Notifications
// ==========================================

export async function fetchNotifications(userId: string, userRole?: string): Promise<SystemNotification[]> {
  let query = supabase.from("notifications").select("*");

  if (userRole === "ADMINISTRATOR") {
    query = query.or(`user_id.eq.${userId},target_role.eq.ADMINISTRATOR,target_role.eq.ALL,user_id.is.null`);
  } else if (userRole) {
    query = query.or(`user_id.eq.${userId},target_role.eq.${userRole},target_role.eq.ALL`);
  } else {
    query = query.or(`user_id.eq.${userId},target_role.eq.ALL`);
  }

  const { data, error } = await query.order("timestamp", { ascending: false });

  if (error || !data) return [];
  return data.map(mapNotification);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .or(`user_id.eq.${userId},target_role.eq.ALL`);

  if (error) throw error;
}

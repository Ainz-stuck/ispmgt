import { supabase } from "./supabase";
import {
  User,
  UserRole,
  Facility,
  FacilityId,
  FacilityStatus,
  FacilityScheduleEntry,
  ResourceItem,
  ResourceCondition,
  Reservation,
  ReservationStatus,
  RequestedResource,
  ApprovalLog,
  SystemNotification,
} from "../types";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function assertDeletedRows(deletedRows: any[] | null, errorMessage: string): void {
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error(errorMessage);
  }
}

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

export function mapReservation(
  r: any,
  requestedResources: RequestedResource[] = [],
  profile?: any,
  facility?: any
): Reservation {
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

export function mapNotification(n: any, readSet?: Set<string>): SystemNotification {
  const isBroadcast = !n.user_id;
  const isRead = isBroadcast
    ? Boolean(readSet?.has(n.id))
    : Boolean(n.read) || Boolean(readSet?.has(n.id));

  return {
    id: n.id,
    userId: n.user_id || "all",
    targetRole: n.target_role as any,
    title: n.title,
    message: n.message || "",
    type: n.type as any,
    timestamp: n.timestamp ? n.timestamp.replace("T", " ").substring(0, 16) : "",
    read: isRead,
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
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.firstName !== undefined) updates.first_name = data.firstName;
  if (data.lastName !== undefined) updates.last_name = data.lastName;
  if (data.contactNumber !== undefined) updates.contact_number = data.contactNumber;
  if (data.department !== undefined) updates.department = data.department;
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: "ACTIVE" | "DEACTIVATED"
): Promise<"ACTIVE" | "DEACTIVATED"> {
  const nextStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
  const { error } = await supabase
    .from("profiles")
    .update({ status: nextStatus })
    .eq("id", userId);

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error("Insufficient administrator permissions to modify user status.");
    }
    throw error;
  }
  return nextStatus;
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<UserRole> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }
  return role;
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

export async function updateFacilityStatus(
  facilityId: FacilityId,
  status: FacilityStatus
): Promise<void> {
  const { error } = await supabase
    .from("facilities")
    .update({ status })
    .eq("id", facilityId);

  if (error) throw error;
}

export async function updateFacilityCapacity(
  facilityId: FacilityId,
  capacity: number
): Promise<void> {
  const { error } = await supabase
    .from("facilities")
    .update({ capacity })
    .eq("id", facilityId);

  if (error) throw error;
}

export async function updateFacilityDetails(
  facilityId: FacilityId,
  data: Partial<Facility>
): Promise<void> {
  const updates: Record<string, unknown> = {};
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

export async function updateResourceCondition(
  resourceId: string,
  condition: ResourceCondition
): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .update({ condition })
    .eq("id", resourceId);

  if (error) throw error;
}

export async function updateResourceQuantity(
  resourceId: string,
  totalQuantity: number
): Promise<void> {
  const { data: res, error: fetchError } = await supabase
    .from("resources")
    .select("available_quantity")
    .eq("id", resourceId)
    .single();

  if (fetchError) throw fetchError;

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

export async function createResource(
  data: Omit<ResourceItem, "id">
): Promise<ResourceItem> {
  const id = newId("resrc");
  const totalQuantity = Math.max(0, Math.floor(data.totalQuantity));
  const availableQuantity = Math.min(
    Math.max(0, Math.floor(data.availableQuantity)),
    totalQuantity
  );

  const { error } = await supabase.from("resources").insert({
    id,
    name: data.name.trim(),
    category: data.category,
    facility_scope: data.facilityScope || "CAMPUS_WIDE",
    total_quantity: totalQuantity,
    available_quantity: availableQuantity,
    condition: data.condition,
    unit: data.unit.trim() || "Units",
  });

  if (error) throw error;

  return {
    ...data,
    id,
    name: data.name.trim(),
    totalQuantity,
    availableQuantity,
    unit: data.unit.trim() || "Units",
  };
}

export async function updateResource(
  resourceId: string,
  data: Partial<Omit<ResourceItem, "id">>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.category !== undefined) updates.category = data.category;
  if (data.facilityScope !== undefined) updates.facility_scope = data.facilityScope;
  if (data.condition !== undefined) updates.condition = data.condition;
  if (data.unit !== undefined) updates.unit = data.unit.trim() || "Units";
  if (data.totalQuantity !== undefined) {
    const safeTotal = Math.max(0, Math.floor(data.totalQuantity));
    updates.total_quantity = safeTotal;
    if (data.availableQuantity !== undefined) {
      updates.available_quantity = Math.min(
        Math.max(0, Math.floor(data.availableQuantity)),
        safeTotal
      );
    }
  } else if (data.availableQuantity !== undefined) {
    updates.available_quantity = Math.max(0, Math.floor(data.availableQuantity));
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", resourceId);

  if (error) throw error;
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { data: deletedRows, error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .select("id");

  if (error) throw error;
  assertDeletedRows(
    deletedRows,
    "Unable to delete equipment item (insufficient database permissions or item already removed)."
  );
}

// ==========================================
// Reservations, Schedule & Conflict Checker
// ==========================================

export async function fetchFacilitySchedule(): Promise<FacilityScheduleEntry[]> {
  const { data, error } = await supabase.rpc("get_facility_schedule");
  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    facilityId: row.facility_id as FacilityId,
    facilityName: row.facility_name,
    eventName: row.event_name,
    userName: row.user_name,
    userRole: row.user_role as UserRole,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as ReservationStatus,
    isOwner: Boolean(row.is_owner),
  }));
}

export async function fetchReservations(): Promise<Reservation[]> {
  const [resData, reqData] = await Promise.all([
    supabase
      .from("reservations")
      .select("*, facilities(name), profiles(name, role, email, department)")
      .order("submitted_at", { ascending: false }),
    supabase.from("requested_resources").select("*"),
  ]);

  if (resData.error || !resData.data) return [];

  const requestedMap: Record<string, RequestedResource[]> = {};
  if (reqData.data) {
    for (const r of reqData.data) {
      if (!requestedMap[r.reservation_id]) {
        requestedMap[r.reservation_id] = [];
      }
      requestedMap[r.reservation_id].push({
        resourceId: r.resource_id || `deleted-${r.id}`,
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
  existing: {
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    facilityId: string;
    id: string;
  },
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
    | "id"
    | "reservationCode"
    | "status"
    | "submittedAt"
    | "userId"
    | "userName"
    | "userRole"
    | "userEmail"
    | "department"
  >,
  currentUser: User,
  scheduleSlots: FacilityScheduleEntry[]
): Promise<{
  success: boolean;
  conflict?: FacilityScheduleEntry;
  reservationCode?: string;
  reservation?: Reservation;
}> {
  // 1. Client-side check against campus-wide anonymized schedule slots
  const conflict = scheduleSlots.find((slot) =>
    checkTimeConflict(slot, data.facilityId, data.date, data.startTime, data.endTime)
  );

  if (conflict) {
    return { success: false, conflict };
  }

  // 2. Generate unique ID & tracking code
  const reservationId = newId("res");
  const code = `US-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const submittedAt = new Date().toISOString();

  // 3. Insert into reservations (DB trigger check_reservation_overlap also enforces atomically)
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

  if (resError) {
    if (resError.message?.includes("LEAD_TIME_VIOLATION")) {
      throw new Error(
        resError.message.replace(/^.*LEAD_TIME_VIOLATION:\s*/i, "")
      );
    }
    if (resError.message?.includes("SCHEDULE_CONFLICT")) {
      const latestSlots = await fetchFacilitySchedule();
      const dbConflict = latestSlots.find((slot) =>
        checkTimeConflict(slot, data.facilityId, data.date, data.startTime, data.endTime)
      );
      return { success: false, conflict: dbConflict };
    }
    throw resError;
  }

  // 4. Insert requested resources
  if (data.resources && data.resources.length > 0) {
    const resourceRows = data.resources.map((res) => ({
      id: newId("req"),
      reservation_id: reservationId,
      resource_id: res.resourceId,
      name: res.name,
      quantity: res.quantity,
    }));

    const { error: reqErr } = await supabase
      .from("requested_resources")
      .insert(resourceRows);
    if (reqErr) {
      await supabase.from("reservations").delete().eq("id", reservationId);
      throw reqErr;
    }
  }

  // 5. Insert approval log
  await insertApprovalLog({
    reservationId,
    reservationCode: code,
    eventName: data.eventName,
    facilityName: data.facilityName,
    actorName: currentUser.name,
    actorRole: currentUser.role,
    action: "SUBMITTED",
    timestamp: submittedAt,
    notes: "Reservation submitted and queued for administrator schedule review.",
  });

  // 6. Insert user and admin notifications
  const { error: notifErr } = await supabase.from("notifications").insert([
    {
      id: newId("notif"),
      user_id: currentUser.id,
      title: `Reservation Submitted: ${data.facilityName}`,
      message: `Your booking request ${code} for "${data.eventName}" has been logged and is pending review.`,
      type: "RESERVATION_SUBMITTED",
      timestamp: submittedAt,
      read: false,
      reservation_id: reservationId,
    },
    {
      id: newId("notif-adm"),
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
  if (notifErr) throw notifErr;

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

function aggregateRequestedResources(
  items: Array<{ resourceId: string; quantity: number }>
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!item.resourceId || item.resourceId.startsWith("deleted-") || qty <= 0) continue;
    totals.set(item.resourceId, (totals.get(item.resourceId) || 0) + qty);
  }
  return totals;
}

async function computeResourceStockAdjustments(
  items: Array<{ resourceId: string; quantity: number }>,
  mode: "DEDUCT" | "RESTORE"
): Promise<Array<{ id: string; nextAvailable: number }>> {
  const requestedById = aggregateRequestedResources(items);
  if (requestedById.size === 0) return [];

  const resourceIds = Array.from(requestedById.keys());
  const { data: rows, error } = await supabase
    .from("resources")
    .select("id, name, total_quantity, available_quantity, condition")
    .in("id", resourceIds);

  if (error) throw error;

  const rowMap = new Map<string, any>();
  for (const row of rows || []) {
    rowMap.set(row.id, row);
  }

  const updates: Array<{ id: string; nextAvailable: number }> = [];
  for (const [resId, qty] of requestedById.entries()) {
    const row = rowMap.get(resId);
    if (!row) {
      if (mode === "DEDUCT") {
        throw new Error(`Requested inventory item (${resId}) no longer exists.`);
      }
      continue;
    }

    const totalQty = Number(row.total_quantity) || 0;
    const availQty = Number(row.available_quantity) || 0;

    if (mode === "DEDUCT") {
      if (row.condition === "UNDER_REPAIR") {
        throw new Error(`${row.name} is currently under repair and cannot be allocated.`);
      }
      if (availQty < qty) {
        throw new Error(
          `Insufficient available stock for ${row.name} (requested ${qty}, available ${availQty}).`
        );
      }
      updates.push({ id: resId, nextAvailable: Math.max(0, availQty - qty) });
    } else {
      updates.push({ id: resId, nextAvailable: Math.min(totalQty, availQty + qty) });
    }
  }

  return updates;
}

async function applyResourceStockUpdates(
  updates: Array<{ id: string; nextAvailable: number }>
): Promise<void> {
  if (updates.length === 0) return;
  await Promise.all(
    updates.map(async (u) => {
      const { error } = await supabase
        .from("resources")
        .update({ available_quantity: u.nextAvailable })
        .eq("id", u.id);
      if (error) throw error;
    })
  );
}

export async function approveReservationRecord(
  reservation: Reservation,
  actor: User,
  notes?: string
): Promise<void> {
  const reviewedAt = new Date().toISOString();
  const adminNotes = notes || "Approved by facility administrator.";

  // Validate requested resource availability before committing approval
  const stockUpdates = await computeResourceStockAdjustments(
    reservation.resources || [],
    "DEDUCT"
  );

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "APPROVED",
      reviewed_at: reviewedAt,
      reviewed_by: actor.name,
      admin_notes: adminNotes,
    })
    .eq("id", reservation.id);

  if (error) {
    if (error.message?.includes("SCHEDULE_CONFLICT")) {
      throw new Error(
        "Schedule conflict detected with an existing reservation for this venue and time slot."
      );
    }
    throw error;
  }

  await applyResourceStockUpdates(stockUpdates);

  await insertApprovalLog({
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: reservation.eventName,
    facilityName: reservation.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "APPROVED",
    timestamp: reviewedAt,
    notes: adminNotes,
  });

  await insertNotification({
    userId: reservation.userId,
    title: `Reservation Approved: ${reservation.facilityName}`,
    message: `Your booking request ${reservation.reservationCode} for "${reservation.eventName}" on ${reservation.date} has been approved.`,
    type: "RESERVATION_APPROVED",
    timestamp: reviewedAt,
    read: false,
    reservationId: reservation.id,
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

  await insertApprovalLog({
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: reservation.eventName,
    facilityName: reservation.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "REJECTED",
    timestamp: reviewedAt,
    notes: `Rejected with reason: ${reason}`,
  });

  await insertNotification({
    userId: reservation.userId,
    title: `Reservation Rejected: ${reservation.facilityName}`,
    message: `Your booking request ${reservation.reservationCode} for "${reservation.eventName}" was declined. Reason: ${reason}`,
    type: "RESERVATION_REJECTED",
    timestamp: reviewedAt,
    read: false,
    reservationId: reservation.id,
  });
}

export async function cancelReservationRecord(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ status: "CANCELLED" })
    .eq("id", reservationId);

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error("Only pending reservations you own can be cancelled.");
    }
    throw error;
  }
}

export async function updateReservationRecord(
  reservation: Reservation,
  data: Omit<
    Reservation,
    | "id"
    | "reservationCode"
    | "status"
    | "submittedAt"
    | "userId"
    | "userName"
    | "userRole"
    | "userEmail"
    | "department"
  >,
  actor: User,
  scheduleSlots: FacilityScheduleEntry[]
): Promise<{ success: boolean; conflict?: FacilityScheduleEntry; reservation?: Reservation }> {
  const conflict = scheduleSlots.find((slot) =>
    checkTimeConflict(
      slot,
      data.facilityId,
      data.date,
      data.startTime,
      data.endTime,
      reservation.id
    )
  );

  if (conflict) {
    return { success: false, conflict };
  }

  const { data: priorReqRows } = await supabase
    .from("requested_resources")
    .select("id, resource_id, name, quantity")
    .eq("reservation_id", reservation.id);

  const { error: updErr } = await supabase
    .from("reservations")
    .update({
      facility_id: data.facilityId,
      event_name: data.eventName,
      purpose: data.purpose,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      expected_attendees: data.expectedAttendees,
    })
    .eq("id", reservation.id);

  if (updErr) {
    if (updErr.message?.includes("LEAD_TIME_VIOLATION")) {
      throw new Error(updErr.message.replace(/^.*LEAD_TIME_VIOLATION:\s*/i, ""));
    }
    if (updErr.message?.includes("SCHEDULE_CONFLICT")) {
      const latestSlots = await fetchFacilitySchedule();
      const dbConflict = latestSlots.find((slot) =>
        checkTimeConflict(
          slot,
          data.facilityId,
          data.date,
          data.startTime,
          data.endTime,
          reservation.id
        )
      );
      return { success: false, conflict: dbConflict };
    }
    if (updErr.message?.includes("FORBIDDEN")) {
      throw new Error("Only pending reservations can be edited.");
    }
    throw updErr;
  }

  const rollbackReservationFields = async () => {
    await supabase
      .from("reservations")
      .update({
        facility_id: reservation.facilityId,
        event_name: reservation.eventName,
        purpose: reservation.purpose,
        date: reservation.date,
        start_time: reservation.startTime,
        end_time: reservation.endTime,
        expected_attendees: reservation.expectedAttendees,
      })
      .eq("id", reservation.id);
  };

  if (priorReqRows && priorReqRows.length > 0) {
    const { data: deletedReqRows, error: delReqErr } = await supabase
      .from("requested_resources")
      .delete()
      .eq("reservation_id", reservation.id)
      .select("id");
    if (delReqErr || !deletedReqRows || deletedReqRows.length === 0) {
      await rollbackReservationFields().catch(() => {});
      throw (
        delReqErr ||
        new Error(
          "Unable to update requested equipment because delete permissions are restricted on requested_resources (run supabase_schema.sql)."
        )
      );
    }
  }

  if (data.resources && data.resources.length > 0) {
    const resourceRows = data.resources.map((res) => ({
      id: newId("req"),
      reservation_id: reservation.id,
      resource_id: res.resourceId,
      name: res.name,
      quantity: res.quantity,
    }));
    const { error: insReqErr } = await supabase
      .from("requested_resources")
      .insert(resourceRows);
    if (insReqErr) {
      await rollbackReservationFields().catch(() => {});
      if (priorReqRows && priorReqRows.length > 0) {
        try {
          await supabase.from("requested_resources").insert(
            priorReqRows.map((row: any) => ({
              id: row.id,
              reservation_id: reservation.id,
              resource_id: row.resource_id,
              name: row.name,
              quantity: row.quantity,
            }))
          );
        } catch {
          // Ignore secondary rollback error
        }
      }
      throw insReqErr;
    }
  }

  await insertApprovalLog({
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: data.eventName,
    facilityName: data.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "RESERVATION_UPDATED",
    timestamp: new Date().toISOString(),
    notes: `Pending reservation updated (${data.facilityName} · ${data.date} ${data.startTime}-${data.endTime}).`,
  }).catch(() => {});

  return {
    success: true,
    reservation: {
      ...reservation,
      ...data,
    },
  };
}

export async function deleteReservationRecord(
  reservationId: string,
  reservation?: Pick<Reservation, "status" | "resources">
): Promise<void> {
  let statusToRestore = reservation?.status;
  let resourcesToRestore: Array<{ resourceId: string; quantity: number }> =
    reservation?.resources?.map((r) => ({
      resourceId: r.resourceId,
      quantity: r.quantity,
    })) || [];

  if (!statusToRestore) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("status, requested_resources(resource_id, quantity)")
      .eq("id", reservationId)
      .maybeSingle();
    if (existing) {
      statusToRestore = existing.status;
      resourcesToRestore = (existing.requested_resources || []).map((r: any) => ({
        resourceId: r.resource_id,
        quantity: Number(r.quantity) || 0,
      }));
    }
  }

  const { data: deletedRows, error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId)
    .select("id");

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error("Insufficient permissions to delete this reservation.");
    }
    throw error;
  }
  assertDeletedRows(
    deletedRows,
    "Unable to delete reservation (missing database delete permissions or record already removed)."
  );

  if (statusToRestore === "APPROVED" && resourcesToRestore.length > 0) {
    const restoreUpdates = await computeResourceStockAdjustments(
      resourcesToRestore,
      "RESTORE"
    );
    await applyResourceStockUpdates(restoreUpdates);
  }
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

export async function insertApprovalLog(log: Omit<ApprovalLog, "id">): Promise<ApprovalLog> {
  const id = newId("log");
  const timestampIso = log.timestamp || new Date().toISOString();

  const { error } = await supabase.from("approval_logs").insert({
    id,
    reservation_id: log.reservationId,
    reservation_code: log.reservationCode,
    event_name: log.eventName,
    facility_name: log.facilityName,
    actor_name: log.actorName,
    actor_role: log.actorRole,
    action: log.action,
    timestamp: timestampIso,
    notes: log.notes,
  });

  if (error) throw error;

  return {
    ...log,
    id,
    timestamp: timestampIso.replace("T", " ").substring(0, 16),
  };
}

// ==========================================
// Notifications (with per-user read tracking)
// ==========================================

function isMissingDismissedColumnError(err: any): boolean {
  const msg = String(err?.message || "");
  return err?.code === "42703" || err?.code === "PGRST204" || /dismissed/i.test(msg);
}

export async function fetchNotifications(
  userId: string,
  userRole?: string
): Promise<SystemNotification[]> {
  let query = supabase.from("notifications").select("*");

  if (userRole === "ADMINISTRATOR") {
    query = query.or(
      `user_id.eq.${userId},target_role.eq.ADMINISTRATOR,target_role.eq.ALL`
    );
  } else if (userRole) {
    query = query.or(
      `user_id.eq.${userId},target_role.eq.${userRole},target_role.eq.ALL`
    );
  } else {
    query = query.or(`user_id.eq.${userId},target_role.eq.ALL`);
  }

  const [notifResult, readsResult] = await Promise.all([
    query.order("timestamp", { ascending: false }),
    supabase
      .from("notification_reads")
      .select("notification_id, dismissed")
      .eq("user_id", userId),
  ]);

  if (notifResult.error || !notifResult.data) return [];

  let readRows: any[] = readsResult.data || [];
  if (readsResult.error && isMissingDismissedColumnError(readsResult.error)) {
    const fallbackReads = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", userId);
    readRows = fallbackReads.data || [];
  }

  const readSet = new Set<string>();
  const dismissedSet = new Set<string>();
  for (const r of readRows) {
    readSet.add(r.notification_id);
    if (r.dismissed) {
      dismissedSet.add(r.notification_id);
    }
  }

  return notifResult.data
    .filter((n: any) => !(dismissedSet.has(n.id) && n.user_id !== userId))
    .map((n: any) => mapNotification(n, readSet));
}

export async function insertNotification(
  notif: Omit<SystemNotification, "id" | "userId"> & { userId?: string | null }
): Promise<SystemNotification> {
  const id = newId("notif");
  const timestampIso = notif.timestamp || new Date().toISOString();

  const { error } = await supabase.from("notifications").insert({
    id,
    user_id: notif.userId ?? null,
    target_role: notif.targetRole ?? null,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    timestamp: timestampIso,
    read: Boolean(notif.read),
    reservation_id: notif.reservationId ?? null,
  });

  if (error) throw error;

  return {
    ...notif,
    id,
    userId: notif.userId || "all",
    timestamp: timestampIso.replace("T", " ").substring(0, 16),
  };
}

export async function markNotificationAsRead(
  notif: SystemNotification,
  userId: string
): Promise<void> {
  if (notif.userId === userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notif.id);
    if (error) throw error;
    return;
  }

  // Broadcast or role-targeted notification: record read receipt per user
  const { error } = await supabase
    .from("notification_reads")
    .upsert({ notification_id: notif.id, user_id: userId });
  if (error) throw error;
}

export async function markAllNotificationsAsRead(
  userId: string,
  unreadNotifications: SystemNotification[]
): Promise<void> {
  if (unreadNotifications.length === 0) return;

  const personalIds = unreadNotifications
    .filter((n) => n.userId === userId)
    .map((n) => n.id);
  const broadcastIds = unreadNotifications
    .filter((n) => n.userId !== userId)
    .map((n) => n.id);

  if (personalIds.length > 0) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", personalIds);
    if (error) throw error;
  }

  if (broadcastIds.length > 0) {
    const rows = broadcastIds.map((notification_id) => ({
      notification_id,
      user_id: userId,
    }));
    const { error } = await supabase.from("notification_reads").upsert(rows);
    if (error) throw error;
  }
}

export async function deleteNotificationRecord(
  notif: SystemNotification,
  userId: string
): Promise<void> {
  if (notif.userId === userId) {
    const { data: deletedRows, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notif.id)
      .select("id");
    if (error) throw error;
    assertDeletedRows(
      deletedRows,
      "Unable to delete notification (missing database DELETE policy — run supabase_schema.sql)."
    );
    return;
  }

  const { error } = await supabase.from("notification_reads").upsert({
    notification_id: notif.id,
    user_id: userId,
    dismissed: true,
  });
  if (error) {
    if (isMissingDismissedColumnError(error)) {
      throw new Error(
        "Dismissing broadcast announcements requires adding the notification_reads.dismissed column on Supabase (run supabase_schema.sql)."
      );
    }
    throw error;
  }
}

export async function clearReadNotifications(
  userId: string,
  readNotifications: SystemNotification[]
): Promise<void> {
  if (readNotifications.length === 0) return;

  const personalIds = readNotifications
    .filter((n) => n.userId === userId)
    .map((n) => n.id);
  const broadcastIds = readNotifications
    .filter((n) => n.userId !== userId)
    .map((n) => n.id);

  if (personalIds.length > 0) {
    const { data: deletedRows, error } = await supabase
      .from("notifications")
      .delete()
      .in("id", personalIds)
      .select("id");
    if (error) throw error;
    assertDeletedRows(
      deletedRows,
      "Unable to delete personal notifications (missing database DELETE policy — run supabase_schema.sql)."
    );
  }

  if (broadcastIds.length > 0) {
    const rows = broadcastIds.map((notification_id) => ({
      notification_id,
      user_id: userId,
      dismissed: true,
    }));
    const { error } = await supabase.from("notification_reads").upsert(rows);
    if (error) {
      if (isMissingDismissedColumnError(error)) {
        throw new Error(
          "Clearing broadcast announcements requires adding the notification_reads.dismissed column on Supabase (run supabase_schema.sql)."
        );
      }
      throw error;
    }
  }
}

import { supabase, type Database } from "./supabase";
import { checkTimeConflict } from "./utils";
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

export { checkTimeConflict };

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FacilityRow = Database["public"]["Tables"]["facilities"]["Row"];
type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"] & {
  facilities?: { name: string } | null;
  profiles?: Pick<ProfileRow, "name" | "role" | "email" | "department"> | null;
  requested_resources?: Array<
    Pick<Database["public"]["Tables"]["requested_resources"]["Row"], "id" | "resource_id" | "name" | "quantity">
  > | null;
};
type ApprovalLogRow = Database["public"]["Tables"]["approval_logs"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type ScheduleRow = Database["public"]["Functions"]["get_facility_schedule"]["Returns"][number];

function assertDeletedRows(deletedRows: Array<{ id: string }> | null, errorMessage: string): void {
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error(errorMessage);
  }
}

// ==========================================
// Mappers (Database snake_case -> App camelCase)
// ==========================================

function mapProfileToUser(p: ProfileRow): User {
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

function mapFacility(f: FacilityRow): Facility {
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

function mapResource(r: ResourceRow): ResourceItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category as ResourceItem["category"],
    facilityScope: r.facility_scope as ResourceItem["facilityScope"],
    totalQuantity: r.total_quantity || 0,
    availableQuantity: r.available_quantity || 0,
    condition: r.condition as ResourceCondition,
    unit: r.unit || "Units",
  };
}

function mapReservation(
  r: ReservationRow,
  requestedResources: RequestedResource[] = [],
  profile?: ReservationRow["profiles"],
  facility?: ReservationRow["facilities"]
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

function mapApprovalLog(l: ApprovalLogRow): ApprovalLog {
  return {
    id: l.id,
    reservationId: l.reservation_id,
    reservationCode: l.reservation_code || "",
    eventName: l.event_name || "",
    facilityName: l.facility_name || "",
    actorName: l.actor_name || "",
    actorRole: l.actor_role as UserRole,
    action: l.action as ApprovalLog["action"],
    timestamp: l.timestamp ? l.timestamp.replace("T", " ").substring(0, 16) : "",
    notes: l.notes || "",
  };
}

function mapNotification(n: NotificationRow, readSet?: Set<string>): SystemNotification {
  const isBroadcast = !n.user_id;
  const isRead = isBroadcast
    ? Boolean(readSet?.has(n.id))
    : Boolean(n.read) || Boolean(readSet?.has(n.id));

  return {
    id: n.id,
    userId: n.user_id || "all",
    targetRole: (n.target_role ?? undefined) as SystemNotification["targetRole"],
    title: n.title,
    message: n.message || "",
    type: n.type as SystemNotification["type"],
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
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProfileToUser(data);
}

export async function fetchAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapProfileToUser);
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
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
  currentStatus: "ACTIVE" | "DEACTIVATED",
  target: Pick<User, "name" | "email" | "studentOrEmployeeId">,
  actor: User
): Promise<{ nextStatus: "ACTIVE" | "DEACTIVATED"; log: ApprovalLog }> {
  const nextStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
  const logId = newId("log");
  const { error } = await supabase.rpc("admin_update_user_access_tx", {
    p_target_user_id: userId,
    p_next_role: null,
    p_next_status: nextStatus,
    p_log_id: logId,
    p_notif_id: null,
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  return {
    nextStatus,
    log: {
      id: logId,
      reservationId: `user-${userId}`,
      reservationCode: target.studentOrEmployeeId,
      eventName: "User Access State Modified",
      facilityName: "Security & Role Access",
      actorName: actor.name,
      actorRole: actor.role,
      action: "USER_STATUS_CHANGE",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `User ${target.name} (${target.email}) account status changed to ${nextStatus}.`,
    },
  };
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  target: Pick<User, "name" | "email" | "role" | "studentOrEmployeeId">,
  actor: User
): Promise<{ role: UserRole; log: ApprovalLog }> {
  const logId = newId("log");
  const { error } = await supabase.rpc("admin_update_user_access_tx", {
    p_target_user_id: userId,
    p_next_role: role,
    p_next_status: null,
    p_log_id: logId,
    p_notif_id: newId("notif"),
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  return {
    role,
    log: {
      id: logId,
      reservationId: `user-${userId}`,
      reservationCode: target.studentOrEmployeeId,
      eventName: "User Role Assignment Changed",
      facilityName: "Security & Role Access",
      actorName: actor.name,
      actorRole: actor.role,
      action: "USER_ROLE_CHANGE",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `User ${target.name} (${target.email}) role updated from ${target.role} to ${role}.`,
    },
  };
}

// ==========================================
// Facilities
// ==========================================

export async function fetchFacilities(): Promise<Facility[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapFacility);
}

export async function updateFacilityStatus(
  facilityId: FacilityId,
  status: FacilityStatus,
  facility: Pick<Facility, "name" | "code"> | undefined,
  actor: User
): Promise<ApprovalLog> {
  const logId = newId("log");
  const { error } = await supabase.rpc("admin_update_facility_tx", {
    p_facility_id: facilityId,
    p_updates: { status },
    p_action: "MAINTENANCE_TOGGLE",
    p_log_id: logId,
    p_notif_id: null,
  });

  if (error) throw error;

  return {
    id: logId,
    reservationId: `facility-${facilityId}`,
    reservationCode: facility?.code || facilityId,
    eventName: "Facility Status Modification",
    facilityName: facility?.name || facilityId,
    actorName: actor.name,
    actorRole: actor.role,
    action: "MAINTENANCE_TOGGLE",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    notes: `Status changed to ${status} by administrator.`,
  };
}

export async function updateFacilityDetails(
  facilityId: FacilityId,
  data: Partial<Facility>,
  facility: Pick<Facility, "name" | "code"> | undefined,
  actor: User
): Promise<{ log: ApprovalLog; notification: SystemNotification }> {
  const updates: Record<string, string | number | string[]> = {};
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

  const logId = newId("log");
  const notifId = newId("notif");
  const nextName = data.name || facility?.name || facilityId;
  const { error } = await supabase.rpc("admin_update_facility_tx", {
    p_facility_id: facilityId,
    p_updates: updates,
    p_action: "FACILITY_DETAILS_UPDATE",
    p_log_id: logId,
    p_notif_id: notifId,
  });

  if (error) throw error;

  const ts = new Date().toISOString().replace("T", " ").substring(0, 16);
  return {
    log: {
      id: logId,
      reservationId: `facility-${facilityId}`,
      reservationCode: data.code || facility?.code || facilityId,
      eventName: "Facility Specification Updated",
      facilityName: nextName,
      actorName: actor.name,
      actorRole: actor.role,
      action: "FACILITY_DETAILS_UPDATE",
      timestamp: ts,
      notes: `Facility specifications and media updated by administrator ${actor.name}.`,
    },
    notification: {
      id: notifId,
      userId: "all",
      targetRole: "ALL",
      title: "Facility Details Updated",
      message: `Specifications for ${nextName} were updated by ${actor.name}.`,
      timestamp: ts,
      read: false,
      type: "FACILITY_UPDATE",
    },
  };
}

// ==========================================
// Resources
// ==========================================

export async function fetchResources(): Promise<ResourceItem[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapResource);
}

export async function createResource(
  data: Omit<ResourceItem, "id">,
  actor: User
): Promise<{ resource: ResourceItem; log: ApprovalLog }> {
  const id = newId("resrc");
  const logId = newId("log");
  const name = data.name.trim();
  const facilityScope = data.facilityScope || "CAMPUS_WIDE";
  const unit = data.unit.trim() || "Units";
  const totalQuantity = Math.max(0, Math.floor(data.totalQuantity));
  const availableQuantity = Math.min(
    Math.max(0, Math.floor(data.availableQuantity)),
    totalQuantity
  );

  const { error } = await supabase.rpc("create_resource_tx", {
    p_id: id,
    p_name: name,
    p_category: data.category,
    p_facility_scope: facilityScope,
    p_total_quantity: totalQuantity,
    p_available_quantity: availableQuantity,
    p_condition: data.condition,
    p_unit: unit,
    p_log_id: logId,
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  return {
    resource: {
      ...data,
      id,
      name,
      facilityScope,
      totalQuantity,
      availableQuantity,
      unit,
    },
    log: {
      id: logId,
      reservationId: `resource-${id}`,
      reservationCode: data.category,
      eventName: `Equipment Added: ${name}`,
      facilityName:
        facilityScope === "CAMPUS_WIDE" ? "Campus-Wide Warehouse" : facilityScope,
      actorName: actor.name,
      actorRole: actor.role,
      action: "RESOURCE_CREATED",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `Created ${name} (${availableQuantity}/${totalQuantity} ${unit}, ${data.condition}).`,
    },
  };
}

export async function updateResource(
  resourceId: string,
  data: Partial<Omit<ResourceItem, "id">>
): Promise<void> {
  const updates: Database["public"]["Tables"]["resources"]["Update"] = {};
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

export async function deleteResource(
  resourceId: string,
  target?: Pick<ResourceItem, "name" | "category">,
  actor?: User
): Promise<ApprovalLog | null> {
  const logId = newId("log");
  const { error } = await supabase.rpc("delete_resource_tx", {
    p_resource_id: resourceId,
    p_log_id: logId,
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  if (!target || !actor) return null;

  return {
    id: logId,
    reservationId: `resource-${resourceId}`,
    reservationCode: target.category,
    eventName: `Equipment Deleted: ${target.name}`,
    facilityName: "Campus-Wide Warehouse",
    actorName: actor.name,
    actorRole: actor.role,
    action: "RESOURCE_DELETED",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    notes: `Removed ${target.name} from active inventory catalog.`,
  };
}

// ==========================================
// Reservations, Schedule & Conflict Checker
// ==========================================

export async function fetchFacilitySchedule(): Promise<FacilityScheduleEntry[]> {
  const { data, error } = await supabase.rpc("get_facility_schedule");
  if (error) throw error;

  return (data || []).map((row: ScheduleRow) => ({
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
  // shortcut: loads all reservations via range pagination; move ReportsView aggregation to SQL if campus exceeds ~10k rows.
  const PAGE_SIZE = 1000;
  const allRows: ReservationRow[] = [];

  for (let from = 0; ; ) {
    const { data, count, error } = await supabase
      .from("reservations")
      .select(
        "*, facilities(name), profiles(name, role, email, department), requested_resources(id, resource_id, name, quantity)",
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const rows = (data || []) as ReservationRow[];
    allRows.push(...rows);
    from += rows.length;
    if (rows.length === 0 || (count !== null ? allRows.length >= count : rows.length < PAGE_SIZE)) {
      break;
    }
  }

  return allRows.map((r) => {
    const requested: RequestedResource[] = (r.requested_resources || []).map((req) => ({
      resourceId: req.resource_id || `deleted-${req.id}`,
      name: req.name,
      quantity: req.quantity,
    }));
    return mapReservation(r, requested, r.profiles, r.facilities);
  });
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
  log?: ApprovalLog;
}> {
  // 1. Client-side check against campus-wide anonymized schedule slots
  const conflict = scheduleSlots.find((slot) =>
    checkTimeConflict(slot, data.facilityId, data.date, data.startTime, data.endTime)
  );

  if (conflict) {
    return { success: false, conflict };
  }

  // 2. Generate IDs and execute atomic Postgres transaction RPC
  const reservationId = newId("res");
  const codeSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();
  const code = `US-${new Date().getFullYear()}-${codeSuffix}`;
  const submittedAt = new Date().toISOString();
  const logId = newId("log");
  const resourceRows = (data.resources || []).map((res) => ({
    id: newId("req"),
    resource_id: res.resourceId,
    name: res.name,
    quantity: res.quantity,
  }));

  const { error: txError } = await supabase.rpc("create_reservation_tx", {
    p_id: reservationId,
    p_reservation_code: code,
    p_facility_id: data.facilityId,
    p_event_name: data.eventName,
    p_purpose: data.purpose,
    p_date: data.date,
    p_start_time: data.startTime,
    p_end_time: data.endTime,
    p_expected_attendees: data.expectedAttendees,
    p_submitted_at: submittedAt,
    p_facility_name: data.facilityName,
    p_resources: resourceRows,
    p_log_id: logId,
    p_user_notif_id: newId("notif"),
    p_admin_notif_id: newId("notif-adm"),
  });

  if (txError) {
    if (txError.message?.includes("LEAD_TIME_VIOLATION")) {
      throw new Error(txError.message.replace(/^.*LEAD_TIME_VIOLATION:\s*/i, ""));
    }
    if (txError.message?.includes("VALIDATION_ERROR")) {
      throw new Error(txError.message.replace(/^.*VALIDATION_ERROR:\s*/i, ""));
    }
    if (txError.message?.includes("FORBIDDEN")) {
      throw new Error(txError.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    if (txError.message?.includes("SCHEDULE_CONFLICT")) {
      const latestSlots = await fetchFacilitySchedule();
      const dbConflict = latestSlots.find((slot) =>
        checkTimeConflict(slot, data.facilityId, data.date, data.startTime, data.endTime)
      );
      return { success: false, conflict: dbConflict };
    }
    throw txError;
  }

  const formattedTs = submittedAt.replace("T", " ").substring(0, 16);
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
    submittedAt: formattedTs,
  };
  const log: ApprovalLog = {
    id: logId,
    reservationId,
    reservationCode: code,
    eventName: data.eventName,
    facilityName: data.facilityName,
    actorName: currentUser.name,
    actorRole: currentUser.role,
    action: "SUBMITTED",
    timestamp: formattedTs,
    notes: "Reservation submitted and queued for administrator schedule review.",
  };

  return { success: true, reservationCode: code, reservation: newReservation, log };
}

export async function approveReservationRecord(
  reservation: Reservation,
  actor: User,
  notes?: string
): Promise<ApprovalLog> {
  const reviewedAt = new Date().toISOString();
  const adminNotes = notes || "Approved by facility administrator.";
  const logId = newId("log");

  const { error } = await supabase.rpc("approve_reservation_tx", {
    p_reservation_id: reservation.id,
    p_reviewed_at: reviewedAt,
    p_admin_notes: adminNotes,
    p_log_id: logId,
    p_notif_id: newId("notif"),
  });

  if (error) {
    if (error.message?.includes("SCHEDULE_CONFLICT")) {
      throw new Error(
        "Schedule conflict detected with an existing reservation for this venue and time slot."
      );
    }
    if (error.message?.includes("VALIDATION_ERROR")) {
      throw new Error(error.message.replace(/^.*VALIDATION_ERROR:\s*/i, ""));
    }
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  return {
    id: logId,
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: reservation.eventName,
    facilityName: reservation.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "APPROVED",
    timestamp: reviewedAt.replace("T", " ").substring(0, 16),
    notes: adminNotes,
  };
}

export async function rejectReservationRecord(
  reservation: Reservation,
  actor: User,
  reason: string
): Promise<ApprovalLog> {
  const reviewedAt = new Date().toISOString();
  const logId = newId("log");

  const { error } = await supabase.rpc("reject_reservation_tx", {
    p_reservation_id: reservation.id,
    p_reviewed_at: reviewedAt,
    p_rejection_reason: reason,
    p_log_id: logId,
    p_notif_id: newId("notif"),
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error(error.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw error;
  }

  return {
    id: logId,
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: reservation.eventName,
    facilityName: reservation.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "REJECTED",
    timestamp: reviewedAt.replace("T", " ").substring(0, 16),
    notes: `Rejected with reason: ${reason}`,
  };
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
): Promise<{
  success: boolean;
  conflict?: FacilityScheduleEntry;
  reservation?: Reservation;
  log?: ApprovalLog;
}> {
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

  const logId = newId("log");
  const logNotes = `Pending reservation updated (${data.facilityName} · ${data.date} ${data.startTime}-${data.endTime}).`;
  const resourceRows = (data.resources || []).map((res) => ({
    id: newId("req"),
    resource_id: res.resourceId,
    name: res.name,
    quantity: res.quantity,
  }));

  const { error: txError } = await supabase.rpc("update_reservation_tx", {
    p_reservation_id: reservation.id,
    p_facility_id: data.facilityId,
    p_facility_name: data.facilityName,
    p_event_name: data.eventName,
    p_purpose: data.purpose,
    p_date: data.date,
    p_start_time: data.startTime,
    p_end_time: data.endTime,
    p_expected_attendees: data.expectedAttendees,
    p_resources: resourceRows,
    p_log_id: logId,
    p_log_notes: logNotes,
  });

  if (txError) {
    if (txError.message?.includes("LEAD_TIME_VIOLATION")) {
      throw new Error(txError.message.replace(/^.*LEAD_TIME_VIOLATION:\s*/i, ""));
    }
    if (txError.message?.includes("VALIDATION_ERROR")) {
      throw new Error(txError.message.replace(/^.*VALIDATION_ERROR:\s*/i, ""));
    }
    if (txError.message?.includes("SCHEDULE_CONFLICT")) {
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
    if (txError.message?.includes("FORBIDDEN")) {
      throw new Error(txError.message.replace(/^.*FORBIDDEN:\s*/i, ""));
    }
    throw txError;
  }

  const log: ApprovalLog = {
    id: logId,
    reservationId: reservation.id,
    reservationCode: reservation.reservationCode,
    eventName: data.eventName,
    facilityName: data.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "RESERVATION_UPDATED",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    notes: logNotes,
  };

  return {
    success: true,
    reservation: {
      ...reservation,
      ...data,
    },
    log,
  };
}

export async function deleteReservationRecord(
  reservationId: string,
  reservation?: Pick<Reservation, "id" | "reservationCode" | "eventName" | "facilityName" | "status">,
  actor?: User
): Promise<ApprovalLog | null> {
  const isAdmin = actor?.role === "ADMINISTRATOR";
  const logId = isAdmin ? newId("log") : null;

  const { error } = await supabase.rpc("delete_reservation_tx", {
    p_reservation_id: reservationId,
    p_log_id: logId,
  });

  if (error) {
    if (error.message?.includes("FORBIDDEN")) {
      throw new Error("Insufficient permissions to delete this reservation.");
    }
    throw error;
  }

  if (!isAdmin || !logId || !reservation || !actor) return null;

  return {
    id: logId,
    reservationId,
    reservationCode: reservation.reservationCode,
    eventName: reservation.eventName,
    facilityName: reservation.facilityName,
    actorName: actor.name,
    actorRole: actor.role,
    action: "RESERVATION_DELETED",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    notes: `Reservation ${reservation.reservationCode} (${reservation.status}) deleted by administrator.`,
  };
}

// ==========================================
// Approval Logs
// ==========================================

export async function fetchApprovalLogs(): Promise<ApprovalLog[]> {
  const { data, error } = await supabase
    .from("approval_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []).map(mapApprovalLog);
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

function isMissingDismissedColumnError(err: unknown): boolean {
  const msg =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message || "")
      : "";
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? (err as { code?: unknown }).code
      : undefined;
  return code === "42703" || code === "PGRST204" || /dismissed/i.test(msg);
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
    query.order("timestamp", { ascending: false }).limit(200),
    supabase
      .from("notification_reads")
      .select("notification_id, dismissed")
      .eq("user_id", userId),
  ]);

  if (notifResult.error) throw notifResult.error;

  let readRows: Array<{ notification_id: string; dismissed?: boolean }> = readsResult.data || [];
  if (readsResult.error) {
    if (!isMissingDismissedColumnError(readsResult.error)) {
      throw readsResult.error;
    }
    const fallbackReads = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", userId);
    if (fallbackReads.error) throw fallbackReads.error;
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

  return (notifResult.data || [])
    .filter((n) => !(dismissedSet.has(n.id) && n.user_id !== userId))
    .map((n) => mapNotification(n, readSet));
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

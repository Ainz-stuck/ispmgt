import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessTab,
  getCampusDateYMD,
  getMinReservationDate,
  getRoleQueuePriority,
  hasPermission,
  isInstitutionalRegistrationEmail,
  validateReservationLeadTime,
} from "../lib/rbac.ts";
import {
  checkTimeConflict,
  computeLeadDays,
  escapeCsvCell,
  getErrorMessage,
  getPeakVenue,
  getUpcomingFacilitySlots,
  MAX_FACILITY_IMAGE_BYTES,
  safeFacilityImageSrc,
  slotOverlapsHour,
  validateFacilityImageUrl,
} from "../lib/utils.ts";

test("escapeCsvCell neutralizes spreadsheet formula injection triggers", () => {
  assert.equal(escapeCsvCell("=CMD()"), "\"'=CMD()\"");
  assert.equal(escapeCsvCell("+1+1"), "\"'+1+1\"");
  assert.equal(escapeCsvCell("-1+1"), "\"'-1+1\"");
  assert.equal(escapeCsvCell("@SUM(A1)"), "\"'@SUM(A1)\"");
  assert.equal(escapeCsvCell("\t=1"), "\"'\t=1\"");
  assert.equal(escapeCsvCell("\r=1"), "\"'\r=1\"");
  assert.equal(escapeCsvCell('Hello "World"'), '"Hello ""World"""');
});

test("slotOverlapsHour compares minutes accurately across partial-hour spans", () => {
  assert.equal(slotOverlapsHour("16:30", "17:30", 16), true);
  assert.equal(slotOverlapsHour("16:30", "17:30", 17), true);
  assert.equal(slotOverlapsHour("16:30", "17:30", 18), false);
  assert.equal(slotOverlapsHour("09:00", "11:00", 11), false);
  assert.equal(slotOverlapsHour("09:00", "11:00", 10), true);
});

test("validateFacilityImageUrl accepts safe paths/https/raster data URIs and rejects unsafe ones", () => {
  assert.equal(validateFacilityImageUrl("/images/facilities/gym.jpg").valid, true);
  assert.equal(validateFacilityImageUrl("https://cdn.example.edu/hall.jpg").valid, true);

  // Traversal, insecure scheme, javascript URI, SVG XSS, and oversized data URIs must fail
  assert.equal(validateFacilityImageUrl("/images/../secret").valid, false);
  assert.equal(validateFacilityImageUrl("http://example.com/a.jpg").valid, false);
  assert.equal(validateFacilityImageUrl("javascript:alert(1)").valid, false);
  assert.equal(
    validateFacilityImageUrl("data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Lz48L3N2Zz4=").valid,
    false
  );

  const oversizedBase64 = "A".repeat(Math.ceil(((MAX_FACILITY_IMAGE_BYTES + 16) * 4) / 3));
  assert.equal(validateFacilityImageUrl(`data:image/png;base64,${oversizedBase64}`).valid, false);

  assert.equal(safeFacilityImageSrc("javascript:alert(1)"), "/images/campus_hero.jpg");
  assert.equal(safeFacilityImageSrc("/images/facilities/avr.jpg"), "/images/facilities/avr.jpg");
});

test("checkTimeConflict detects overlaps while allowing adjacent slots, self-edits, and inactive bookings", () => {
  const activeSlot = {
    id: "res-1",
    facilityId: "avr",
    date: "2026-12-01",
    startTime: "09:00",
    endTime: "11:00",
    status: "APPROVED",
  };

  assert.equal(checkTimeConflict(activeSlot, "avr", "2026-12-01", "10:00", "12:00"), true);
  assert.equal(checkTimeConflict(activeSlot, "avr", "2026-12-01", "11:00", "13:00"), false);
  assert.equal(checkTimeConflict(activeSlot, "avr", "2026-12-01", "10:00", "12:00", "res-1"), false);
  assert.equal(checkTimeConflict(activeSlot, "gym", "2026-12-01", "10:00", "12:00"), false);
  assert.equal(
    checkTimeConflict({ ...activeSlot, status: "CANCELLED" }, "avr", "2026-12-01", "10:00", "12:00"),
    false
  );
  assert.equal(
    checkTimeConflict({ ...activeSlot, status: "REJECTED" }, "avr", "2026-12-01", "10:00", "12:00"),
    false
  );
});

test("getPeakVenue returns None for empty months and selects the highest-usage venue otherwise", () => {
  assert.equal(getPeakVenue({}), "None");
  assert.equal(getPeakVenue({ "Function Hall": 0 }), "None");
  assert.equal(getPeakVenue({ AVR: 120, "Function Hall": 240 }), "Function Hall");
});

test("rbac permissions, email validation, and student lead-time rules behave as specified", () => {
  assert.equal(hasPermission("STUDENT", "RESERVATION_CREATE"), true);
  assert.equal(hasPermission("STUDENT", "RESERVATION_APPROVE"), false);
  assert.equal(hasPermission("FACULTY", "RESERVATION_BYPASS_LEAD_TIME"), true);
  assert.equal(hasPermission("ADMINISTRATOR", "RESERVATION_CREATE"), false);
  assert.equal(hasPermission("ADMINISTRATOR", "RESERVATION_BYPASS_LEAD_TIME"), false);
  assert.equal(hasPermission("ADMINISTRATOR", "RESERVATION_APPROVE"), true);
  assert.equal(hasPermission("ADMINISTRATOR", "USERS_MANAGE"), true);

  assert.equal(canAccessTab("STUDENT", "users"), false);
  assert.equal(canAccessTab("FACULTY", "reports"), false);
  assert.equal(canAccessTab("ADMINISTRATOR", "reservations"), true);
  assert.equal(canAccessTab("ADMINISTRATOR", "audit-logs"), true);

  assert.equal(isInstitutionalRegistrationEmail("student@chmsu.edu.ph"), true);
  assert.equal(isInstitutionalRegistrationEmail("user@gmail.com"), false);
  assert.equal(isInstitutionalRegistrationEmail("@chmsu.edu.ph"), false);

  const base = new Date(2026, 10, 10); // Nov 10, 2026
  assert.equal(getMinReservationDate("STUDENT", base), "2026-11-13");
  assert.equal(getMinReservationDate("FACULTY", base), "2026-11-10");
  assert.equal(validateReservationLeadTime("STUDENT", "2026-11-12", base).valid, false);
  assert.equal(validateReservationLeadTime("STUDENT", "2026-11-13", base).valid, true);
  assert.equal(validateReservationLeadTime("FACULTY", "2026-11-10", base).valid, true);
  assert.equal(validateReservationLeadTime("FACULTY", "2026-11-09", base).valid, false);

  assert.ok(getRoleQueuePriority("FACULTY") < getRoleQueuePriority("ADMINISTRATOR"));
  assert.ok(getRoleQueuePriority("ADMINISTRATOR") < getRoleQueuePriority("STUDENT"));

  assert.equal(getErrorMessage(new Error("boom"), "fallback"), "boom");
  assert.equal(getErrorMessage({ message: "Postgrest fail" }, "fallback"), "Postgrest fail");
  assert.equal(getErrorMessage({ message: "" }, "fallback"), "fallback");
  assert.equal(getErrorMessage(null, "fallback"), "fallback");
});

test("getUpcomingFacilitySlots excludes past, cancelled, rejected, and other-venue bookings", () => {
  const slots = [
    { id: "past", facilityId: "avr", date: "2026-11-27", startTime: "09:00", status: "APPROVED" },
    { id: "cancelled", facilityId: "avr", date: "2026-11-29", startTime: "09:00", status: "CANCELLED" },
    { id: "rejected", facilityId: "avr", date: "2026-11-29", startTime: "10:00", status: "REJECTED" },
    { id: "other", facilityId: "gym", date: "2026-11-29", startTime: "09:00", status: "APPROVED" },
    { id: "later", facilityId: "avr", date: "2026-12-01", startTime: "13:00", status: "PENDING" },
    { id: "today-pm", facilityId: "avr", date: "2026-11-28", startTime: "14:00", status: "APPROVED" },
    { id: "today-am", facilityId: "avr", date: "2026-11-28", startTime: "08:00", status: "APPROVED" },
  ];

  const upcoming = getUpcomingFacilitySlots(slots, "avr", "2026-11-28");
  assert.deepEqual(
    upcoming.map((s) => s.id),
    ["today-am", "today-pm", "later"]
  );
});

test("computeLeadDays parses bare submittedAt timestamps as UTC consistently", () => {
  const bareUtc = computeLeadDays("2026-11-28", "2026-11-25 14:32");
  const explicitUtc = computeLeadDays("2026-11-28", "2026-11-25T14:32:00Z");
  assert.ok(bareUtc !== null && explicitUtc !== null);
  assert.equal(bareUtc, explicitUtc);
  assert.equal(computeLeadDays("", "2026-11-25 14:32"), null);
});

test("getCampusDateYMD uses Asia/Manila date across UTC day rollovers", () => {
  // 2026-11-28T20:00:00Z is already 2026-11-29 04:00 in Asia/Manila (UTC+8).
  assert.equal(getCampusDateYMD(new Date("2026-11-28T20:00:00Z")), "2026-11-29");
  assert.equal(getCampusDateYMD(new Date("2026-11-28T15:59:59Z")), "2026-11-28");
});

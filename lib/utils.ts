export function getInitials(name?: string | null): string {
  if (!name) return "US";
  const cleaned = name
    .replace(/^(dr\.?|prof\.?|engr\.?)\s+/i, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getLocalYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const MAX_FACILITY_IMAGE_BYTES = 1_048_576; // 1 MB
export const ALLOWED_FACILITY_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function validateFacilityImageUrl(value: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return { valid: false, error: "Facility image path or URL is required." };
  }

  if (trimmed.startsWith("/images/")) {
    if (trimmed.includes("..") || trimmed.includes("\\")) {
      return { valid: false, error: "Local image path must not contain traversal segments." };
    }
    return { valid: true, sanitized: trimmed };
  }

  if (/^https:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "https:" && parsed.hostname) {
        return { valid: true, sanitized: parsed.toString() };
      }
    } catch {
      return { valid: false, error: "Invalid https:// facility image URL." };
    }
  }

  if (/^data:/i.test(trimmed)) {
    const match = trimmed.match(
      /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i
    );
    if (!match) {
      return {
        valid: false,
        error: "Only base64 PNG, JPEG, or WebP images are permitted (SVG data URIs are blocked).",
      };
    }
    const base64 = match[2];
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const byteLength = Math.floor((base64.length * 3) / 4) - padding;
    if (byteLength > MAX_FACILITY_IMAGE_BYTES) {
      return {
        valid: false,
        error: "Uploaded image exceeds the 1 MB size limit.",
      };
    }
    return { valid: true, sanitized: trimmed };
  }

  return {
    valid: false,
    error: "Facility image must be a /images/ path, https:// URL, or PNG/JPEG/WebP file under 1 MB.",
  };
}

export function safeFacilityImageSrc(value?: string | null): string {
  const check = validateFacilityImageUrl(value || "");
  return check.valid && check.sanitized ? check.sanitized : "/images/campus_hero.jpg";
}

export function escapeCsvCell(val: unknown): string {
  const raw = String(val ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function slotOverlapsHour(startTime: string, endTime: string, hourInt: number): boolean {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const endMins = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
  const slotStart = hourInt * 60;
  const slotEnd = (hourInt + 1) * 60;
  return startMins < slotEnd && endMins > slotStart;
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeCsvCell,
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

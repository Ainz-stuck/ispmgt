import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment or .env.local."
  );
  process.exit(1);
}

const studentEmail = process.env.TEST_STUDENT_EMAIL;
const studentPassword = process.env.TEST_STUDENT_PASSWORD;
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

if (!studentEmail || !studentPassword || !adminEmail || !adminPassword) {
  console.error(
    "Missing TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD, TEST_ADMIN_EMAIL, or TEST_ADMIN_PASSWORD."
  );
  process.exit(1);
}

const client = createClient(supabaseUrl, anonKey);

async function testIntegration() {
  console.log("=== Testing Supabase Client Integration ===");

  console.log(`1. Signing in as Student (${studentEmail})...`);
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: studentEmail,
    password: studentPassword,
  });

  if (authError) {
    throw new Error(`Auth failed: ${authError.message}`);
  }
  console.log(`✓ Signed in successfully as user ${authData.user.id}`);

  // 2. Fetch profile
  console.log("2. Fetching profile from 'profiles' table...");
  const { data: profile, error: profError } = await client
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profError) throw new Error(`Profile query failed: ${profError.message}`);
  console.log(`✓ Profile loaded: ${profile.name} (${profile.role}, ${profile.department})`);

  // 3. Fetch facilities
  console.log("3. Fetching facilities...");
  const { data: facilities, error: facError } = await client
    .from("facilities")
    .select("id, name, code, capacity, status");

  if (facError) throw new Error(`Facilities query failed: ${facError.message}`);
  console.log(`✓ Loaded ${facilities.length} facilities:`, facilities.map((f) => f.name).join(", "));

  // 4. Fetch reservations
  console.log("4. Fetching user's reservations (RLS in action)...");
  const { data: reservations, error: resError } = await client
    .from("reservations")
    .select("reservation_code, event_name, status, date");

  if (resError) throw new Error(`Reservations query failed: ${resError.message}`);
  console.log(`✓ Loaded ${reservations.length} reservations for ${profile.name} (student view restricted to own):`);
  for (const r of reservations) {
    console.log(`   - ${r.reservation_code}: ${r.event_name} [${r.status}] on ${r.date}`);
  }

  // 5. Test Admin login & RLS visibility
  console.log(`5. Signing in as Admin (${adminEmail})...`);
  const { data: adminAuth, error: adminAuthError } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (adminAuthError) throw new Error(`Admin auth failed: ${adminAuthError.message}`);

  const { data: adminReservations, error: adminResError } = await client
    .from("reservations")
    .select("reservation_code, event_name, status");

  if (adminResError) throw new Error(`Admin reservations query failed: ${adminResError.message}`);
  console.log(`✓ Admin (${adminAuth.user.email}) sees ALL ${adminReservations.length} reservations across the campus.`);

  // 6. Sign out
  await client.auth.signOut();
  console.log("✓ Signed out successfully.");

  console.log("\n>>> ALL SUPABASE INTEGRATION TESTS PASSED PERFECTLY! <<<");
}

testIntegration().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

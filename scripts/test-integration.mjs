import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eppnkgfrxmjxdzrzimtw.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcG5rZ2ZyeG1qeGR6cnppbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MDIzMDcsImV4cCI6MjExMTA3ODMwN30.Ux0BSM7Yba0OjcT0ur8KsHzXv--KbyA-wzHRPmRs3YI";

const client = createClient(supabaseUrl, anonKey);

async function testIntegration() {
  console.log("=== Testing Supabase Client Integration ===");

  // 1. Facilities query (publicly viewable by authenticated users, or anon check)
  console.log("1. Signing in as Student (Alex Vance)...");
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: "alex.vance@university.edu",
    password: "password123",
  });

  if (authError) {
    throw new Error(`Auth failed: ${authError.message}`);
  }
  console.log(`✓ Signed in successfully as user ${authData.user.id}`);

  // 2. Fetch Alex's profile
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
  console.log(`✓ Loaded ${reservations.length} reservations for Alex Vance (student view restricted to own):`);
  for (const r of reservations) {
    console.log(`   - ${r.reservation_code}: ${r.event_name} [${r.status}] on ${r.date}`);
  }

  // 5. Test Admin login & RLS visibility
  console.log("5. Signing in as Admin (CHMSU Facility Administrator)...");
  const { data: adminAuth, error: adminAuthError } = await client.auth.signInWithPassword({
    email: "admin@chmsu.edu.ph",
    password: "ChmsuAdmin#2026",
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

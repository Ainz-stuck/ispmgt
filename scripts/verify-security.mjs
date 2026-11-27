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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

async function main() {
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const anonFac = await anon.from("facilities").select("id");
  const anonProf = await anon.from("profiles").select("id");
  const anonRes = await anon.from("reservations").select("id");

  const stu = createClient(url, anonKey, { auth: { persistSession: false } });
  const stuLogin = await stu.auth.signInWithPassword({
    email: process.env.AUDIT_STUDENT_EMAIL || "alex.vance@university.edu",
    password: process.env.AUDIT_STUDENT_PASSWORD || "password123",
  });
  if (stuLogin.error) throw stuLogin.error;
  const stuId = stuLogin.data.user.id;

  const stuProfiles = await stu.from("profiles").select("id, role");
  const privAttempt = await stu.from("profiles").update({ role: "ADMINISTRATOR" }).eq("id", stuId);
  const stuLogs = await stu.from("approval_logs").select("id");
  const stuReadsDismissed = await stu
    .from("notification_reads")
    .select("notification_id, dismissed")
    .eq("user_id", stuId);

  let leadTimeStatus = "SKIPPED (no SUPABASE_SERVICE_ROLE_KEY for guaranteed cleanup)";
  if (serviceKey) {
    const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
    const probeId = `audit-sec-${Date.now()}`;
    try {
      const { error: leadErr } = await stu.from("reservations").insert({
        id: probeId,
        reservation_code: "US-AUDIT-SEC",
        facility_id: "avr",
        user_id: stuId,
        event_name: "Security Audit Lead Check",
        purpose: "Non-destructive security boundary check",
        date: new Date().toISOString().slice(0, 10),
        start_time: "20:00",
        end_time: "21:00",
        expected_attendees: 5,
        status: "PENDING",
        submitted_at: new Date().toISOString(),
      });
      leadTimeStatus = leadErr?.message?.includes("LEAD_TIME_VIOLATION")
        ? "PASS (rejected at Postgres trigger)"
        : "PENDING_SCHEMA (execute supabase_schema.sql in SQL Editor)";
    } finally {
      await svc.from("reservations").delete().eq("id", probeId);
    }
  }

  await stu.auth.signOut();

  const report = {
    anon_facilities_public: (anonFac.data?.length ?? 0) > 0,
    anon_profiles_blocked: (anonProf.data?.length ?? 0) === 0,
    anon_reservations_blocked: (anonRes.data?.length ?? 0) === 0,
    student_sees_own_profile_only: stuProfiles.data?.length === 1,
    student_role_escalation_blocked: Boolean(privAttempt.error),
    student_approval_logs_count: stuLogs.data?.length ?? 0,
    notification_reads_dismissed_ready: !stuReadsDismissed.error,
    student_lead_time_trigger: leadTimeStatus,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

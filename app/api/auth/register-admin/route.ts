import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isInstitutionalRegistrationEmail } from "../../../../lib/rbac";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      department,
      studentOrEmployeeId,
      password,
      inviteCode,
    } = body ?? {};

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !contactNumber?.trim() ||
      !department?.trim() ||
      !studentOrEmployeeId?.trim() ||
      !password ||
      password.length < 6
    ) {
      return NextResponse.json(
        { error: "All required registration fields must be valid." },
        { status: 400 }
      );
    }

    if (!isInstitutionalRegistrationEmail(email)) {
      return NextResponse.json(
        { error: "Institutional registration requires a valid @chmsu.edu.ph email address." },
        { status: 400 }
      );
    }

    const expectedCode = process.env.ADMIN_INVITE_CODE;
    if (
      !expectedCode ||
      typeof inviteCode !== "string" ||
      inviteCode.trim().toUpperCase() !== expectedCode.trim().toUpperCase()
    ) {
      return NextResponse.json(
        { error: "Invalid administrator authorization invite code." },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server authentication configuration is incomplete." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const employeeId = studentOrEmployeeId.trim().toUpperCase();

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          contact_number: contactNumber.trim(),
          department: department.trim(),
          role: "STUDENT",
          student_or_employee_id: employeeId,
        },
      });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create administrator account." },
        { status: 400 }
      );
    }

    // Elevate role server-side using service_role (bypasses client signup trigger restriction)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: created.user.id,
        name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        contact_number: contactNumber.trim(),
        department: department.trim(),
        role: "ADMINISTRATOR",
        student_or_employee_id: employeeId,
        status: "ACTIVE",
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Failed to finalize administrator profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, userId: created.user.id });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}

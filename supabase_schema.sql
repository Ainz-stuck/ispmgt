-- 0. Cleanup triggers/functions before recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS guard_profile_privileged_fields ON public.profiles;
DROP TRIGGER IF EXISTS check_reservation_overlap ON public.reservations;
DROP TRIGGER IF EXISTS check_reservation_rbac ON public.reservations;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.protect_profile_privileged_fields();
DROP FUNCTION IF EXISTS public.prevent_reservation_overlap();
DROP FUNCTION IF EXISTS public.guard_reservation_rbac();
DROP FUNCTION IF EXISTS public.get_facility_schedule();

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT,
  department TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'FACULTY', 'ADMINISTRATOR')),
  student_or_employee_id TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEACTIVATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin check function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'ADMINISTRATOR'
  );
$$;

-- Guard privileged profile fields from non-admin client updates
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL THEN
    IF NEW.id = (SELECT auth.uid()) AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'FORBIDDEN: Administrators cannot change or demote their own role';
    END IF;
    IF NOT public.is_admin() THEN
      IF NEW.role IS DISTINCT FROM OLD.role
         OR NEW.status IS DISTINCT FROM OLD.status
         OR NEW.student_or_employee_id IS DISTINCT FROM OLD.student_or_employee_id THEN
        RAISE EXCEPTION 'FORBIDDEN: Only administrators can modify role, status, or institutional ID';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users view own profile or admins view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Auto-create profile trigger on signup (never trusts ADMINISTRATOR from public signup metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  assigned_role := CASE
    WHEN (NEW.raw_user_meta_data->>'role') IN ('STUDENT', 'FACULTY')
      THEN NEW.raw_user_meta_data->>'role'
    ELSE 'STUDENT'
  END;

  INSERT INTO public.profiles (
    id, name, first_name, last_name, email,
    contact_number, department, role,
    student_or_employee_id, status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'contact_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'student_or_employee_id', ''),
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    contact_number = EXCLUDED.contact_number,
    department = EXCLUDED.department,
    student_or_employee_id = EXCLUDED.student_or_employee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  building TEXT NOT NULL DEFAULT '',
  floor TEXT NOT NULL DEFAULT '',
  capacity INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'BOOKED')),
  image TEXT NOT NULL DEFAULT '',
  available_resources TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  operating_hours TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  guidelines TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facilities are viewable by authenticated users" ON public.facilities;
DROP POLICY IF EXISTS "Facilities are viewable by everyone" ON public.facilities;
CREATE POLICY "Facilities are viewable by everyone"
  ON public.facilities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;
CREATE POLICY "Admins can manage facilities"
  ON public.facilities FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('AV_EQUIPMENT','AUDIO','FURNITURE','DISPLAY')),
  facility_scope TEXT NOT NULL DEFAULT 'CAMPUS_WIDE',
  total_quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'GOOD'
    CHECK (condition IN ('EXCELLENT','GOOD','FAIR','UNDER_REPAIR')),
  unit TEXT NOT NULL DEFAULT 'Units'
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources are viewable by authenticated users" ON public.resources;
CREATE POLICY "Resources are viewable by authenticated users"
  ON public.resources FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  reservation_code TEXT NOT NULL,
  facility_id TEXT NOT NULL REFERENCES public.facilities(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  expected_attendees INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  admin_notes TEXT
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
CREATE POLICY "Users can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status = 'PENDING')
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'CANCELLED');

DROP POLICY IF EXISTS "Admins can update any reservation" ON public.reservations;
CREATE POLICY "Admins can update any reservation"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DB-level RBAC lead-time & state transition guard on reservations
CREATE OR REPLACE FUNCTION public.guard_reservation_rbac()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_role TEXT;
  campus_today DATE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_admin() THEN
      SELECT role INTO requester_role FROM public.profiles WHERE id = NEW.user_id;
      campus_today := (now() AT TIME ZONE 'Asia/Manila')::date;
      IF COALESCE(requester_role, 'STUDENT') = 'STUDENT' AND NEW.date < (campus_today + 3) THEN
        RAISE EXCEPTION 'LEAD_TIME_VIOLATION: Student reservations require at least 3 days advance notice (earliest allowed: %).', (campus_today + 3);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_admin() THEN
      IF OLD.status <> 'PENDING' OR NEW.status <> 'CANCELLED'
         OR NEW.facility_id IS DISTINCT FROM OLD.facility_id
         OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.date IS DISTINCT FROM OLD.date
         OR NEW.start_time IS DISTINCT FROM OLD.start_time
         OR NEW.end_time IS DISTINCT FROM OLD.end_time
         OR NEW.event_name IS DISTINCT FROM OLD.event_name
         OR NEW.purpose IS DISTINCT FROM OLD.purpose
         OR NEW.expected_attendees IS DISTINCT FROM OLD.expected_attendees THEN
        RAISE EXCEPTION 'FORBIDDEN: Non-administrators may only cancel their own pending reservations.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_reservation_rbac
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_rbac();

-- DB-level double-booking prevention trigger
CREATE OR REPLACE FUNCTION public.prevent_reservation_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('PENDING', 'APPROVED') THEN
    IF EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id <> NEW.id
        AND r.facility_id = NEW.facility_id
        AND r.date = NEW.date
        AND r.status IN ('PENDING', 'APPROVED')
        AND (NEW.start_time < r.end_time AND NEW.end_time > r.start_time)
    ) THEN
      RAISE EXCEPTION 'SCHEDULE_CONFLICT: Facility % already has an active reservation overlapping % - % on %',
        NEW.facility_id, NEW.start_time, NEW.end_time, NEW.date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_reservation_overlap
  BEFORE INSERT OR UPDATE OF facility_id, date, start_time, end_time, status
  ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_reservation_overlap();

-- Anonymized schedule RPC so all authenticated users can view occupied slots & check conflicts safely
CREATE OR REPLACE FUNCTION public.get_facility_schedule()
RETURNS TABLE (
  id TEXT,
  facility_id TEXT,
  facility_name TEXT,
  event_name TEXT,
  user_name TEXT,
  user_role TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  status TEXT,
  is_owner BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    r.id,
    r.facility_id,
    f.name AS facility_name,
    CASE WHEN r.user_id = (SELECT auth.uid()) OR public.is_admin() THEN r.event_name ELSE 'Reserved Venue Slot' END AS event_name,
    CASE WHEN r.user_id = (SELECT auth.uid()) OR public.is_admin() THEN p.name ELSE 'Verified Campus Unit' END AS user_name,
    p.role AS user_role,
    r.date,
    r.start_time,
    r.end_time,
    r.status,
    (r.user_id = (SELECT auth.uid())) AS is_owner
  FROM public.reservations r
  JOIN public.facilities f ON f.id = r.facility_id
  JOIN public.profiles p ON p.id = r.user_id
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND r.status IN ('PENDING', 'APPROVED');
$$;

-- 5. Requested Resources table
CREATE TABLE IF NOT EXISTS public.requested_resources (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES public.resources(id),
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

ALTER TABLE public.requested_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requested resources" ON public.requested_resources;
CREATE POLICY "Users can view own requested resources"
  ON public.requested_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE id = reservation_id AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all requested resources" ON public.requested_resources;
CREATE POLICY "Admins can view all requested resources"
  ON public.requested_resources FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert requested resources" ON public.requested_resources;
CREATE POLICY "Users can insert requested resources"
  ON public.requested_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE id = reservation_id AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage requested resources" ON public.requested_resources;
CREATE POLICY "Admins can manage requested resources"
  ON public.requested_resources FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Approval Logs table
CREATE TABLE IF NOT EXISTS public.approval_logs (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  reservation_code TEXT NOT NULL DEFAULT '',
  event_name TEXT NOT NULL DEFAULT '',
  facility_name TEXT NOT NULL DEFAULT '',
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN (
    'SUBMITTED','APPROVED','REJECTED','STATUS_OVERRIDE',
    'MAINTENANCE_TOGGLE','USER_STATUS_CHANGE','USER_ROLE_CHANGE','FACILITY_DETAILS_UPDATE'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.approval_logs DROP CONSTRAINT IF EXISTS approval_logs_action_check;
ALTER TABLE public.approval_logs ADD CONSTRAINT approval_logs_action_check CHECK (action IN (
  'SUBMITTED','APPROVED','REJECTED','STATUS_OVERRIDE',
  'MAINTENANCE_TOGGLE','USER_STATUS_CHANGE','USER_ROLE_CHANGE','FACILITY_DETAILS_UPDATE'
));

ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logs are viewable by authenticated users" ON public.approval_logs;
DROP POLICY IF EXISTS "Users view own reservation logs or admins view all" ON public.approval_logs;
CREATE POLICY "Users view own reservation logs or admins view all"
  ON public.approval_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.approval_logs;
DROP POLICY IF EXISTS "Admins or owners for submissions can insert logs" ON public.approval_logs;
CREATE POLICY "Admins or owners for submissions can insert logs"
  ON public.approval_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      action = 'SUBMITTED'
      AND actor_role IN ('STUDENT', 'FACULTY')
      AND EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.id = reservation_id AND r.user_id = (SELECT auth.uid())
      )
    )
  );

-- 7. Notifications table & per-user read tracking
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN (
    'RESERVATION_SUBMITTED','RESERVATION_APPROVED','RESERVATION_REJECTED',
    'SCHEDULE_REMINDER','FACILITY_UPDATE','ACCOUNT_SECURITY'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false,
  reservation_id TEXT
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR target_role = 'ALL'
    OR target_role = (
      SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authorized notification inserts" ON public.notifications;
CREATE POLICY "Authorized notification inserts"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      type = 'RESERVATION_SUBMITTED'
      AND (
        user_id = (SELECT auth.uid())
        OR (user_id IS NULL AND target_role = 'ADMINISTRATOR')
      )
      AND (
        reservation_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.reservations r
          WHERE r.id = reservation_id AND r.user_id = (SELECT auth.uid())
        )
      )
    )
    OR (
      type = 'ACCOUNT_SECURITY'
      AND user_id = (SELECT auth.uid())
      AND target_role IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;
CREATE POLICY "Admins can update all notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id TEXT NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification reads" ON public.notification_reads;
CREATE POLICY "Users manage own notification reads"
  ON public.notification_reads FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

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
DROP FUNCTION IF EXISTS public.is_active_user();
DROP FUNCTION IF EXISTS public.create_reservation_tx(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_reservation_tx(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, TIMESTAMPTZ, TEXT, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_reservation_tx(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_reservation_tx(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.reject_reservation_tx(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_reservation_tx(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, JSONB, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_reservation_tx(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_reservation_tx(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_reservation_tx(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_user_access_tx(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_facility_tx(TEXT, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_resource_tx(TEXT, TEXT);

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

-- Admin & active-user checks with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'ADMINISTRATOR' AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND status = 'ACTIVE'
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
  USING ((SELECT auth.uid()) = id AND public.is_active_user())
  WITH CHECK ((SELECT auth.uid()) = id AND public.is_active_user());

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

ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_available_bounds;
ALTER TABLE public.resources
  ADD CONSTRAINT resources_available_bounds
  CHECK (available_quantity >= 0 AND available_quantity <= total_quantity);

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_code_unique
  ON public.reservations (reservation_code);

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
  WITH CHECK ((SELECT auth.uid()) = user_id AND public.is_active_user() AND NOT public.is_admin());

DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
CREATE POLICY "Users can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status = 'PENDING' AND public.is_active_user())
  WITH CHECK ((SELECT auth.uid()) = user_id AND status IN ('PENDING', 'CANCELLED') AND public.is_active_user());

DROP POLICY IF EXISTS "Admins can update any reservation" ON public.reservations;
CREATE POLICY "Admins can update any reservation"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can delete own non-approved reservations" ON public.reservations;
CREATE POLICY "Users can delete own non-approved reservations"
  ON public.reservations FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status IN ('PENDING', 'CANCELLED', 'REJECTED') AND public.is_active_user());

DROP POLICY IF EXISTS "Admins can delete any reservation" ON public.reservations;
CREATE POLICY "Admins can delete any reservation"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- DB-level RBAC lead-time, validation & state transition guard on reservations
CREATE OR REPLACE FUNCTION public.guard_reservation_rbac()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_role TEXT;
  campus_today DATE;
  v_fac RECORD;
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL THEN
    IF NOT public.is_active_user() THEN
      RAISE EXCEPTION 'FORBIDDEN: Account suspended. Please contact the Facility Administrator.';
    END IF;

    IF NEW.status IN ('PENDING', 'APPROVED') THEN
      IF NEW.start_time !~ '^\d{2}:\d{2}$' OR NEW.end_time !~ '^\d{2}:\d{2}$'
         OR NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: End time must be later than start time.';
      END IF;
      IF NEW.start_time < '06:00' OR NEW.end_time > '22:00' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Bookings must fall within campus operating hours (06:00 to 22:00).';
      END IF;

      SELECT capacity, status INTO v_fac
      FROM public.facilities
      WHERE id = NEW.facility_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Selected facility does not exist.';
      END IF;
      IF v_fac.status = 'MAINTENANCE' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Selected facility is currently under maintenance.';
      END IF;
      IF NEW.expected_attendees < 1 OR NEW.expected_attendees > v_fac.capacity THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Expected attendees (%) must be between 1 and venue capacity (%).',
          NEW.expected_attendees, v_fac.capacity;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (SELECT auth.uid()) IS NOT NULL THEN
      IF public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Administrators oversee reservations and cannot submit facility bookings.';
      END IF;
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
      IF OLD.status <> 'PENDING' OR NEW.status NOT IN ('PENDING', 'CANCELLED')
         OR NEW.id IS DISTINCT FROM OLD.id
         OR NEW.reservation_code IS DISTINCT FROM OLD.reservation_code
         OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
         OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
         OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
         OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
         OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
        RAISE EXCEPTION 'FORBIDDEN: Non-administrators may only edit or cancel their own pending reservations.';
      END IF;
      IF NEW.date IS DISTINCT FROM OLD.date THEN
        SELECT role INTO requester_role FROM public.profiles WHERE id = NEW.user_id;
        campus_today := (now() AT TIME ZONE 'Asia/Manila')::date;
        IF COALESCE(requester_role, 'STUDENT') = 'STUDENT' AND NEW.date < (campus_today + 3) THEN
          RAISE EXCEPTION 'LEAD_TIME_VIOLATION: Student reservations require at least 3 days advance notice (earliest allowed: %).', (campus_today + 3);
        END IF;
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
    AND r.status IN ('PENDING', 'APPROVED')
    AND r.date >= ((date_trunc('month', now() AT TIME ZONE 'Asia/Manila'))::date - 31);
$$;

CREATE INDEX IF NOT EXISTS idx_reservations_status_date
  ON public.reservations (status, date);

-- 5. Requested Resources table
CREATE TABLE IF NOT EXISTS public.requested_resources (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES public.resources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

ALTER TABLE public.requested_resources ALTER COLUMN resource_id DROP NOT NULL;
ALTER TABLE public.requested_resources DROP CONSTRAINT IF EXISTS requested_resources_resource_id_fkey;
ALTER TABLE public.requested_resources
  ADD CONSTRAINT requested_resources_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;

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
    public.is_active_user()
    AND EXISTS (
      SELECT 1 FROM public.reservations
      WHERE id = reservation_id AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own pending requested resources" ON public.requested_resources;
CREATE POLICY "Users can delete own pending requested resources"
  ON public.requested_resources FOR DELETE
  TO authenticated
  USING (
    public.is_active_user()
    AND EXISTS (
      SELECT 1 FROM public.reservations
      WHERE id = reservation_id AND user_id = (SELECT auth.uid()) AND status = 'PENDING'
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
    'SUBMITTED','APPROVED','REJECTED','RESERVATION_UPDATED','RESERVATION_DELETED','STATUS_OVERRIDE',
    'MAINTENANCE_TOGGLE','RESOURCE_CREATED','RESOURCE_DELETED','USER_STATUS_CHANGE','USER_ROLE_CHANGE','FACILITY_DETAILS_UPDATE'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.approval_logs DROP CONSTRAINT IF EXISTS approval_logs_action_check;
ALTER TABLE public.approval_logs ADD CONSTRAINT approval_logs_action_check CHECK (action IN (
  'SUBMITTED','APPROVED','REJECTED','RESERVATION_UPDATED','RESERVATION_DELETED','STATUS_OVERRIDE',
  'MAINTENANCE_TOGGLE','RESOURCE_CREATED','RESOURCE_DELETED','USER_STATUS_CHANGE','USER_ROLE_CHANGE','FACILITY_DETAILS_UPDATE'
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
      action IN ('SUBMITTED', 'RESERVATION_UPDATED')
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

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can delete any notification" ON public.notifications;
CREATE POLICY "Admins can delete any notification"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id TEXT NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE public.notification_reads
  ADD COLUMN IF NOT EXISTS dismissed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification reads" ON public.notification_reads;
CREATE POLICY "Users manage own notification reads"
  ON public.notification_reads FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 8. Atomic Transaction RPCs (SECURITY INVOKER preserves caller RLS & triggers)
CREATE OR REPLACE FUNCTION public.create_reservation_tx(
  p_id TEXT,
  p_reservation_code TEXT,
  p_facility_id TEXT,
  p_event_name TEXT,
  p_purpose TEXT,
  p_date DATE,
  p_start_time TEXT,
  p_end_time TEXT,
  p_expected_attendees INT,
  p_submitted_at TIMESTAMPTZ,
  p_facility_name TEXT,
  p_resources JSONB,
  p_log_id TEXT,
  p_user_notif_id TEXT,
  p_admin_notif_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: Authentication required.';
  END IF;

  SELECT name, role, status INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  IF NOT FOUND OR v_actor.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'FORBIDDEN: Account suspended or profile missing.';
  END IF;
  IF v_actor.role = 'ADMINISTRATOR' THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrators oversee reservations and cannot submit facility bookings.';
  END IF;

  INSERT INTO public.reservations (
    id, reservation_code, facility_id, user_id, event_name, purpose,
    date, start_time, end_time, expected_attendees, status, submitted_at
  ) VALUES (
    p_id, p_reservation_code, p_facility_id, v_uid, p_event_name, COALESCE(p_purpose, ''),
    p_date, p_start_time, p_end_time, COALESCE(p_expected_attendees, 0), 'PENDING', p_submitted_at
  );

  IF jsonb_typeof(p_resources) = 'array' AND jsonb_array_length(p_resources) > 0 THEN
    INSERT INTO public.requested_resources (id, reservation_id, resource_id, name, quantity)
    SELECT
      elem->>'id',
      p_id,
      elem->>'resource_id',
      elem->>'name',
      GREATEST(1, COALESCE((elem->>'quantity')::INT, 1))
    FROM jsonb_array_elements(p_resources) AS elem;
  END IF;

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id, p_id, p_reservation_code, p_event_name, p_facility_name,
    v_actor.name, v_actor.role, 'SUBMITTED', p_submitted_at,
    'Reservation submitted and queued for administrator schedule review.'
  );

  INSERT INTO public.notifications (
    id, user_id, target_role, title, message, type, timestamp, read, reservation_id
  ) VALUES
    (
      p_user_notif_id, v_uid, NULL,
      'Reservation Submitted: ' || p_facility_name,
      'Your booking request ' || p_reservation_code || ' for "' || p_event_name || '" has been logged and is pending review.',
      'RESERVATION_SUBMITTED', p_submitted_at, false, p_id
    ),
    (
      p_admin_notif_id, NULL, 'ADMINISTRATOR',
      'New Reservation Request: ' || p_facility_name,
      v_actor.name || ' (' || v_actor.role || ') requested ' || p_facility_name || ' for "' || p_event_name || '" on ' || p_date::TEXT || '.',
      'RESERVATION_SUBMITTED', p_submitted_at, false, p_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_reservation_tx(
  p_reservation_id TEXT,
  p_reviewed_at TIMESTAMPTZ,
  p_admin_notes TEXT,
  p_log_id TEXT,
  p_notif_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_res RECORD;
  v_req RECORD;
  v_inv RECORD;
  v_notes TEXT := COALESCE(NULLIF(p_admin_notes, ''), 'Approved by facility administrator.');
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Only active Facility Administrators can approve reservations.';
  END IF;

  SELECT name, role INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  SELECT r.id, r.reservation_code, r.event_name, r.user_id, r.date, r.status, f.name AS facility_name
  INTO v_res
  FROM public.reservations r
  JOIN public.facilities f ON f.id = r.facility_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found.';
  END IF;
  IF v_res.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Reservation is no longer pending (current status: %).', v_res.status;
  END IF;

  UPDATE public.reservations
  SET status = 'APPROVED',
      reviewed_at = p_reviewed_at,
      reviewed_by = v_actor.name,
      admin_notes = v_notes
  WHERE id = p_reservation_id;

  -- Lock & deduct inventory in deterministic order to avoid stock races and deadlocks
  FOR v_req IN
    SELECT rr.resource_id, SUM(rr.quantity)::INT AS qty
    FROM public.requested_resources rr
    WHERE rr.reservation_id = p_reservation_id
      AND rr.resource_id IS NOT NULL
      AND rr.quantity > 0
    GROUP BY rr.resource_id
    ORDER BY rr.resource_id
  LOOP
    SELECT id, name, available_quantity, condition
    INTO v_inv
    FROM public.resources
    WHERE id = v_req.resource_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Requested inventory item (%) no longer exists.', v_req.resource_id;
    END IF;
    IF v_inv.condition = 'UNDER_REPAIR' THEN
      RAISE EXCEPTION '% is currently under repair and cannot be allocated.', v_inv.name;
    END IF;
    IF v_inv.available_quantity < v_req.qty THEN
      RAISE EXCEPTION 'Insufficient available stock for % (requested %, available %).',
        v_inv.name, v_req.qty, v_inv.available_quantity;
    END IF;

    UPDATE public.resources
    SET available_quantity = available_quantity - v_req.qty
    WHERE id = v_req.resource_id;
  END LOOP;

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id, v_res.id, v_res.reservation_code, v_res.event_name, v_res.facility_name,
    v_actor.name, v_actor.role, 'APPROVED', p_reviewed_at, v_notes
  );

  INSERT INTO public.notifications (
    id, user_id, target_role, title, message, type, timestamp, read, reservation_id
  ) VALUES (
    p_notif_id, v_res.user_id, NULL,
    'Reservation Approved: ' || v_res.facility_name,
    'Your booking request ' || v_res.reservation_code || ' for "' || v_res.event_name || '" on ' || v_res.date::TEXT || ' has been approved.',
    'RESERVATION_APPROVED', p_reviewed_at, false, v_res.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_reservation_tx(
  p_reservation_id TEXT,
  p_reviewed_at TIMESTAMPTZ,
  p_rejection_reason TEXT,
  p_log_id TEXT,
  p_notif_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_res RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Only active Facility Administrators can reject reservations.';
  END IF;

  SELECT name, role INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  SELECT r.id, r.reservation_code, r.event_name, r.user_id, r.status, f.name AS facility_name
  INTO v_res
  FROM public.reservations r
  JOIN public.facilities f ON f.id = r.facility_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found.';
  END IF;
  IF v_res.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Reservation is no longer pending (current status: %).', v_res.status;
  END IF;

  UPDATE public.reservations
  SET status = 'REJECTED',
      reviewed_at = p_reviewed_at,
      reviewed_by = v_actor.name,
      rejection_reason = p_rejection_reason
  WHERE id = p_reservation_id;

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id, v_res.id, v_res.reservation_code, v_res.event_name, v_res.facility_name,
    v_actor.name, v_actor.role, 'REJECTED', p_reviewed_at,
    'Rejected with reason: ' || p_rejection_reason
  );

  INSERT INTO public.notifications (
    id, user_id, target_role, title, message, type, timestamp, read, reservation_id
  ) VALUES (
    p_notif_id, v_res.user_id, NULL,
    'Reservation Rejected: ' || v_res.facility_name,
    'Your booking request ' || v_res.reservation_code || ' for "' || v_res.event_name || '" was declined. Reason: ' || p_rejection_reason,
    'RESERVATION_REJECTED', p_reviewed_at, false, v_res.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_reservation_tx(
  p_reservation_id TEXT,
  p_facility_id TEXT,
  p_facility_name TEXT,
  p_event_name TEXT,
  p_purpose TEXT,
  p_date DATE,
  p_start_time TEXT,
  p_end_time TEXT,
  p_expected_attendees INT,
  p_resources JSONB,
  p_log_id TEXT,
  p_log_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_res RECORD;
BEGIN
  SELECT name, role, status INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  IF NOT FOUND OR v_actor.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'FORBIDDEN: Account suspended or profile missing.';
  END IF;

  SELECT id, reservation_code, status
  INTO v_res
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation record not found.';
  END IF;
  IF v_res.status <> 'PENDING' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only pending reservations can be edited.';
  END IF;

  UPDATE public.reservations
  SET facility_id = p_facility_id,
      event_name = p_event_name,
      purpose = COALESCE(p_purpose, ''),
      date = p_date,
      start_time = p_start_time,
      end_time = p_end_time,
      expected_attendees = COALESCE(p_expected_attendees, 0)
  WHERE id = p_reservation_id;

  DELETE FROM public.requested_resources
  WHERE reservation_id = p_reservation_id;

  IF jsonb_typeof(p_resources) = 'array' AND jsonb_array_length(p_resources) > 0 THEN
    INSERT INTO public.requested_resources (id, reservation_id, resource_id, name, quantity)
    SELECT
      elem->>'id',
      p_reservation_id,
      CASE
        WHEN NULLIF(elem->>'resource_id', '') IS NULL OR (elem->>'resource_id') LIKE 'deleted-%' THEN NULL
        ELSE elem->>'resource_id'
      END,
      elem->>'name',
      GREATEST(1, COALESCE((elem->>'quantity')::INT, 1))
    FROM jsonb_array_elements(p_resources) AS elem;
  END IF;

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id, p_reservation_id, v_res.reservation_code, p_event_name, p_facility_name,
    v_actor.name, v_actor.role, 'RESERVATION_UPDATED', now(), p_log_notes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_reservation_tx(
  p_reservation_id TEXT,
  p_log_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_res RECORD;
  v_restore JSONB := '[]'::jsonb;
  v_req RECORD;
BEGIN
  SELECT name, role, status INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  IF NOT FOUND OR v_actor.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'FORBIDDEN: Account suspended or profile missing.';
  END IF;

  SELECT r.id, r.reservation_code, r.event_name, r.status, f.name AS facility_name
  INTO v_res
  FROM public.reservations r
  JOIN public.facilities f ON f.id = r.facility_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to delete reservation (missing database delete permissions or record already removed).';
  END IF;

  IF v_res.status = 'APPROVED' THEN
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object('resource_id', agg.resource_id, 'qty', agg.qty)),
      '[]'::jsonb
    )
    INTO v_restore
    FROM (
      SELECT rr.resource_id, SUM(rr.quantity)::INT AS qty
      FROM public.requested_resources rr
      WHERE rr.reservation_id = p_reservation_id
        AND rr.resource_id IS NOT NULL
        AND rr.quantity > 0
      GROUP BY rr.resource_id
      ORDER BY rr.resource_id
    ) AS agg;
  END IF;

  DELETE FROM public.reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to delete reservation (missing database delete permissions or record already removed).';
  END IF;

  IF v_res.status = 'APPROVED' AND jsonb_array_length(v_restore) > 0 THEN
    FOR v_req IN
      SELECT resource_id, qty
      FROM jsonb_to_recordset(v_restore) AS x(resource_id TEXT, qty INT)
      ORDER BY resource_id
    LOOP
      UPDATE public.resources
      SET available_quantity = LEAST(total_quantity, available_quantity + v_req.qty)
      WHERE id = v_req.resource_id;
    END LOOP;
  END IF;

  IF public.is_admin() AND p_log_id IS NOT NULL THEN
    INSERT INTO public.approval_logs (
      id, reservation_id, reservation_code, event_name, facility_name,
      actor_name, actor_role, action, timestamp, notes
    ) VALUES (
      p_log_id, v_res.id, v_res.reservation_code, v_res.event_name, v_res.facility_name,
      v_actor.name, v_actor.role, 'RESERVATION_DELETED', now(),
      'Reservation ' || v_res.reservation_code || ' (' || v_res.status || ') deleted by administrator.'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_access_tx(
  p_target_user_id UUID,
  p_next_role TEXT,
  p_next_status TEXT,
  p_log_id TEXT,
  p_notif_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_target RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Active administrator privileges required.';
  END IF;
  IF p_target_user_id = v_uid THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrators cannot modify their own role or account status.';
  END IF;

  SELECT name, role INTO v_actor FROM public.profiles WHERE id = v_uid;
  SELECT id, name, email, role, status, student_or_employee_id
  INTO v_target
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  UPDATE public.profiles
  SET role = COALESCE(p_next_role, role),
      status = COALESCE(p_next_status, status)
  WHERE id = p_target_user_id;

  IF p_next_role IS NOT NULL THEN
    INSERT INTO public.approval_logs (
      id, reservation_id, reservation_code, event_name, facility_name,
      actor_name, actor_role, action, timestamp, notes
    ) VALUES (
      p_log_id, 'user-' || p_target_user_id::TEXT, v_target.student_or_employee_id,
      'User Role Assignment Changed', 'Security & Role Access',
      v_actor.name, v_actor.role, 'USER_ROLE_CHANGE', now(),
      'User ' || v_target.name || ' (' || v_target.email || ') role updated from ' || v_target.role || ' to ' || p_next_role || '.'
    );

    IF p_notif_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        id, user_id, target_role, title, message, type, timestamp, read
      ) VALUES (
        p_notif_id, p_target_user_id, NULL,
        'Institutional Role Updated',
        'Your UniSpace access role was updated to ' || p_next_role || ' by ' || v_actor.name || '.',
        'ACCOUNT_SECURITY', now(), false
      );
    END IF;
  ELSIF p_next_status IS NOT NULL THEN
    INSERT INTO public.approval_logs (
      id, reservation_id, reservation_code, event_name, facility_name,
      actor_name, actor_role, action, timestamp, notes
    ) VALUES (
      p_log_id, 'user-' || p_target_user_id::TEXT, v_target.student_or_employee_id,
      'User Access State Modified', 'Security & Role Access',
      v_actor.name, v_actor.role, 'USER_STATUS_CHANGE', now(),
      'User ' || v_target.name || ' (' || v_target.email || ') account status changed to ' || p_next_status || '.'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_facility_tx(
  p_facility_id TEXT,
  p_updates JSONB,
  p_action TEXT,
  p_log_id TEXT,
  p_notif_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_fac RECORD;
  v_next_name TEXT;
  v_next_code TEXT;
  v_next_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Active administrator privileges required.';
  END IF;

  SELECT name, role INTO v_actor FROM public.profiles WHERE id = v_uid;
  SELECT * INTO v_fac FROM public.facilities WHERE id = p_facility_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facility not found.';
  END IF;

  UPDATE public.facilities
  SET
    name = COALESCE(p_updates->>'name', name),
    code = COALESCE(p_updates->>'code', code),
    description = COALESCE(p_updates->>'description', description),
    location = COALESCE(p_updates->>'location', location),
    building = COALESCE(p_updates->>'building', building),
    floor = COALESCE(p_updates->>'floor', floor),
    capacity = COALESCE((p_updates->>'capacity')::INT, capacity),
    status = COALESCE(p_updates->>'status', status),
    image = COALESCE(p_updates->>'image', image),
    available_resources = CASE
      WHEN jsonb_typeof(p_updates->'available_resources') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_updates->'available_resources'))
      ELSE available_resources
    END,
    features = CASE
      WHEN jsonb_typeof(p_updates->'features') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_updates->'features'))
      ELSE features
    END,
    operating_hours = COALESCE(p_updates->>'operating_hours', operating_hours),
    contact_person = COALESCE(p_updates->>'contact_person', contact_person),
    contact_email = COALESCE(p_updates->>'contact_email', contact_email),
    guidelines = CASE
      WHEN jsonb_typeof(p_updates->'guidelines') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_updates->'guidelines'))
      ELSE guidelines
    END
  WHERE id = p_facility_id;

  v_next_name := COALESCE(p_updates->>'name', v_fac.name);
  v_next_code := COALESCE(p_updates->>'code', v_fac.code);
  v_next_status := COALESCE(p_updates->>'status', v_fac.status);

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id,
    'facility-' || p_facility_id,
    v_next_code,
    CASE WHEN p_action = 'MAINTENANCE_TOGGLE' THEN 'Facility Status Modification' ELSE 'Facility Specification Updated' END,
    v_next_name,
    v_actor.name,
    v_actor.role,
    p_action,
    now(),
    CASE
      WHEN p_action = 'MAINTENANCE_TOGGLE' THEN 'Status changed to ' || v_next_status || ' by administrator.'
      ELSE 'Facility specifications and media updated by administrator ' || v_actor.name || '.'
    END
  );

  IF p_action = 'FACILITY_DETAILS_UPDATE' AND p_notif_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      id, user_id, target_role, title, message, type, timestamp, read
    ) VALUES (
      p_notif_id, NULL, 'ALL',
      'Facility Details Updated',
      'Specifications for ' || v_next_name || ' were updated by ' || v_actor.name || '.',
      'FACILITY_UPDATE', now(), false
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_resource_tx(
  p_resource_id TEXT,
  p_log_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_actor RECORD;
  v_res RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Active administrator privileges required.';
  END IF;

  SELECT name, role INTO v_actor FROM public.profiles WHERE id = v_uid;

  DELETE FROM public.resources
  WHERE id = p_resource_id
  RETURNING id, name, category INTO v_res;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to delete equipment item (insufficient database permissions or item already removed).';
  END IF;

  INSERT INTO public.approval_logs (
    id, reservation_id, reservation_code, event_name, facility_name,
    actor_name, actor_role, action, timestamp, notes
  ) VALUES (
    p_log_id,
    'resource-' || v_res.id,
    v_res.category,
    'Equipment Deleted: ' || v_res.name,
    'Campus-Wide Warehouse',
    v_actor.name,
    v_actor.role,
    'RESOURCE_DELETED',
    now(),
    'Removed ' || v_res.name || ' from active inventory catalog.'
  );
END;
$$;

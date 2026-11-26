import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eppnkgfrxmjxdzrzimtw.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcG5rZ2ZyeG1qeGR6cnppbXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTUwMjMwNywiZXhwIjoyMTExMDc4MzA3fQ.wE2b2hkPa7E9fgTTXNG39skiut3ni6udwt5hGtelY8o";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MOCK_USERS = [
  {
    mockId: "usr-student-01",
    name: "Alex Vance",
    firstName: "Alex",
    lastName: "Vance",
    email: "alex.vance@university.edu",
    password: "password123",
    contactNumber: "+1 (555) 234-5678",
    department: "College of Computer Studies",
    role: "STUDENT",
    studentOrEmployeeId: "2023-10492",
    avatarUrl: "/avatars/alex.jpg",
    status: "ACTIVE",
  },
  {
    mockId: "usr-faculty-01",
    name: "Dr. Evelyn Reed",
    firstName: "Evelyn",
    lastName: "Reed",
    email: "e.reed@university.edu",
    password: "password123",
    contactNumber: "+1 (555) 345-6789",
    department: "Department of Electrical Engineering",
    role: "FACULTY",
    studentOrEmployeeId: "FAC-8821",
    avatarUrl: "/avatars/evelyn.jpg",
    status: "ACTIVE",
  },
  {
    mockId: "usr-admin-01",
    name: "CHMSU Facility Administrator",
    firstName: "CHMSU",
    lastName: "Administrator",
    email: "admin@chmsu.edu.ph",
    password: "ChmsuAdmin#2026",
    contactNumber: "+63 917 000 2026",
    department: "Office of University Facility & Asset Operations",
    role: "ADMINISTRATOR",
    studentOrEmployeeId: "ADM-2026-001",
    avatarUrl: "/avatars/admin.jpg",
    status: "ACTIVE",
  },
  {
    mockId: "usr-student-02",
    name: "Sarah Jenkins",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.j@university.edu",
    password: "password123",
    contactNumber: "+1 (555) 567-8901",
    department: "College of Engineering",
    role: "STUDENT",
    studentOrEmployeeId: "2024-30112",
    avatarUrl: "/avatars/sarah.jpg",
    status: "ACTIVE",
  },
  {
    mockId: "usr-faculty-02",
    name: "Prof. Arthur Pendelton",
    firstName: "Arthur",
    lastName: "Pendelton",
    email: "a.pendelton@university.edu",
    password: "password123",
    contactNumber: "+1 (555) 678-9012",
    department: "Department of Performing Arts",
    role: "FACULTY",
    studentOrEmployeeId: "FAC-7740",
    avatarUrl: "/avatars/arthur.jpg",
    status: "ACTIVE",
  },
];

const INITIAL_FACILITIES = [
  {
    id: "function-hall",
    name: "Function Hall",
    code: "FH-MAIN",
    description: "Premier multipurpose auditorium engineered for university symposiums, academic convocations, cultural exhibitions, and major collegiate events. Features stage rigging and acoustic wall treatments.",
    location: "Main Administration Complex",
    building: "Administration Building",
    floor: "2nd Floor",
    capacity: 350,
    status: "AVAILABLE",
    image: "/images/facilities/function_hall.jpg",
    available_resources: ["Projector", "Sound System", "Microphone", "Chairs", "Tables"],
    features: [
      "Motorized Projection Screen",
      "Elevated Presentation Stage",
      "Acoustic Timber Baffles",
      "Control Booth with DMX Lighting",
      "Green Room & VIP Holding Lounge",
    ],
    operating_hours: "07:00 AM - 10:00 PM",
    contact_person: "Engr. David Soriano",
    contact_email: "d.soriano@university.edu",
    guidelines: [
      "Requests must be submitted at least 3 business days in advance.",
      "Strictly no food or open drinks inside the cushioned theatre stalls.",
      "Stage lighting adjustments must be operated by authorized university technicians.",
    ],
  },
  {
    id: "dining-hall",
    name: "Dining Hall",
    code: "DH-COMMONS",
    description: "Spacious university dining and communal hall suitable for student banquets, departmental luncheon forums, collegiate mixers, and formal hospitality gatherings.",
    location: "Student Center Complex",
    building: "Student Commons",
    floor: "Ground Level",
    capacity: 200,
    status: "AVAILABLE",
    image: "/images/facilities/dining_hall.jpg",
    available_resources: ["Sound System", "Microphone", "Chairs", "Tables"],
    features: [
      "Food Prep & Catering Serving Counters",
      "Modular Dining Tables & Chairs",
      "Commercial Grade Handwashing Stations",
      "Ambient Natural Lighting & Floor Glass Panels",
      "Industrial Waste Disposal Sinks",
    ],
    operating_hours: "06:30 AM - 09:00 PM",
    contact_person: "Clara Mendoza",
    contact_email: "c.mendoza@university.edu",
    guidelines: [
      "Catering arrangements must provide food-handling safety certifications.",
      "Organizers must ensure complete post-event waste segregation.",
      "Maximum occupancy limits are strictly monitored.",
    ],
  },
  {
    id: "gym",
    name: "Gym",
    code: "GYM-ARENA",
    description: "Full-scale collegiate sports arena with Olympic-spec hardwood court for basketball, volleyball, university pep rallies, intramural championships, and physical education tournaments.",
    location: "Sports and Athletic Center",
    building: "University Gymnasium",
    floor: "Ground Floor",
    capacity: 500,
    status: "AVAILABLE",
    image: "/images/facilities/gym.jpg",
    available_resources: ["Sound System", "Microphone", "Chairs", "Tables"],
    features: [
      "Regulation Hardwood Court Surface",
      "Dual Electronic Scoreboards",
      "Tiered Stadium Bleachers",
      "Locker Rooms & Shower Suites",
      "High-Output LED Sports Floodlights",
    ],
    operating_hours: "06:00 AM - 10:00 PM",
    contact_person: "Coach Gabriel Cruz",
    contact_email: "g.cruz@university.edu",
    guidelines: [
      "Only non-marking athletic shoes permitted on hardwood court surfaces.",
      "Sports equipment must be signed out through the Athletic Equipment Office.",
      "Clean-up protocol required after each tournament or rally.",
    ],
  },
  {
    id: "dance-hall",
    name: "Dance Hall",
    code: "DH-STUDIO",
    description: "Professional performing arts studio designed for dance troupe rehearsals, choreography workshops, aerobic training, and performing arts examinations.",
    location: "Arts & Humanities Pavilion",
    building: "Creative Arts Wing B",
    floor: "2nd Floor",
    capacity: 80,
    status: "AVAILABLE",
    image: "/images/facilities/dance_hall.jpg",
    available_resources: ["Sound System", "Microphone", "Chairs"],
    features: [
      "Sprung Hardwood Dance Floor",
      "Full-Length Wall Mirrors with Curtains",
      "Dual-Height Mounted Ballet Barres",
      "High-Fidelity Bluetooth Audio System",
      "Dedicated Changing & Bag Cubbies",
    ],
    operating_hours: "07:00 AM - 09:00 PM",
    contact_person: "Patricia Gomez",
    contact_email: "p.gomez@university.edu",
    guidelines: [
      "Street footwear strictly prohibited; clean dance shoes or bare feet only.",
      "Do not lean heavy props against the wall-length mirrors.",
      "Audio levels must conform to academic floor decibel limits.",
    ],
  },
  {
    id: "avr",
    name: "AVR (Audio Visual Room)",
    code: "AVR-LIB",
    description: "Acoustically treated multimedia lecture theater optimized for thesis defenses, video conferences, university research symposiums, film screenings, and interactive seminars.",
    location: "University Library Building",
    building: "Central Learning Resource Center",
    floor: "3rd Floor",
    capacity: 120,
    status: "AVAILABLE",
    image: "/images/facilities/avr.jpg",
    available_resources: ["Projector", "Sound System", "Microphone", "Chairs", "Tables"],
    features: [
      "High-Definition Dual Digital Laser Projectors",
      "Surround Sound Audio System",
      "Motorized Presentation Lectern with Laptop HDMI/USB-C",
      "Tiered Ergonomic Lecture Seating with Writing Tablets",
      "Dedicated Video Conferencing PTZ Cameras",
    ],
    operating_hours: "08:00 AM - 08:00 PM",
    contact_person: "Librarian Raymond Tan",
    contact_email: "r.tan@university.edu",
    guidelines: [
      "Ensure all tech compatibility tests are completed 15 minutes before session.",
      "Quiet zone policy applies in adjacent library corridors.",
      "Return all wireless clickers and microphone transmitters to the media desk.",
    ],
  },
  {
    id: "rooftop-engineering",
    name: "Rooftop Engineering Building",
    code: "ENG-ROOF",
    description: "Open-air panoramic rooftop terrace featuring sustainable engineering demonstration units, weather instrumentation stations, and an outdoor pavilion for engineering showcases and evening colloquia.",
    location: "College of Engineering",
    building: "Engineering Innovation Tower",
    floor: "7th Floor Rooftop Terrace",
    capacity: 150,
    status: "AVAILABLE",
    image: "/images/facilities/rooftop_engineering.jpg",
    available_resources: ["Sound System", "Microphone", "Chairs", "Tables"],
    features: [
      "Panoramic University Campus & Skyline Vista",
      "Solar Panel Demonstration Array & Monitoring Kiosks",
      "Safety Glass Perimeter Balustrades",
      "Weatherproof Electrical Outlets",
      "Shaded Pergolas & Teak Wood Decking",
    ],
    operating_hours: "08:00 AM - 08:30 PM",
    contact_person: "Dr. Ronald Navarro",
    contact_email: "r.navarro@university.edu",
    guidelines: [
      "Inclement weather contingency plan required for all outdoor reservations.",
      "Access to solar array maintenance zones is restricted to certified personnel.",
      "Overhead drone operations require prior safety clearance.",
    ],
  },
];

const INITIAL_RESOURCES = [
  {
    id: "res-proj",
    name: "Projector",
    category: "AV_EQUIPMENT",
    facility_scope: "CAMPUS_WIDE",
    total_quantity: 12,
    available_quantity: 9,
    condition: "EXCELLENT",
    unit: "Units",
  },
  {
    id: "res-sound",
    name: "Sound System",
    category: "AUDIO",
    facility_scope: "CAMPUS_WIDE",
    total_quantity: 8,
    available_quantity: 5,
    condition: "EXCELLENT",
    unit: "Sets",
  },
  {
    id: "res-mic",
    name: "Microphone",
    category: "AUDIO",
    facility_scope: "CAMPUS_WIDE",
    total_quantity: 24,
    available_quantity: 18,
    condition: "GOOD",
    unit: "Pieces",
  },
  {
    id: "res-chair",
    name: "Chairs",
    category: "FURNITURE",
    facility_scope: "CAMPUS_WIDE",
    total_quantity: 800,
    available_quantity: 620,
    condition: "EXCELLENT",
    unit: "Pieces",
  },
  {
    id: "res-table",
    name: "Tables",
    category: "FURNITURE",
    facility_scope: "CAMPUS_WIDE",
    total_quantity: 150,
    available_quantity: 110,
    condition: "GOOD",
    unit: "Pieces",
  },
];

async function seed() {
  console.log("Starting Supabase database seeding...");

  // 1. Create or retrieve users in auth
  const userIdMap = {};

  for (const user of MOCK_USERS) {
    console.log(`Setting up user: ${user.email} (${user.role})...`);
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    let authUser = listData.users.find((u) => u.email === user.email);

    if (!authUser) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          first_name: user.firstName,
          last_name: user.lastName,
          contact_number: user.contactNumber,
          department: user.department,
          role: user.role,
          student_or_employee_id: user.studentOrEmployeeId,
        },
      });

      if (error) {
        console.error(`Failed to create ${user.email}:`, error);
        continue;
      }
      authUser = created.user;
    } else {
      // Update password and metadata to ensure correct
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          first_name: user.firstName,
          last_name: user.lastName,
          contact_number: user.contactNumber,
          department: user.department,
          role: user.role,
          student_or_employee_id: user.studentOrEmployeeId,
        },
      });
    }

    userIdMap[user.mockId] = authUser.id;

    // Ensure profile entry exists
    await supabase.from("profiles").upsert({
      id: authUser.id,
      name: user.name,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      contact_number: user.contactNumber,
      department: user.department,
      role: user.role,
      student_or_employee_id: user.studentOrEmployeeId,
      avatar_url: user.avatarUrl,
      status: user.status,
    });
  }

  console.log("Users created/upserted successfully!");

  // 2. Insert facilities
  console.log("Upserting facilities...");
  for (const f of INITIAL_FACILITIES) {
    const { error } = await supabase.from("facilities").upsert(f);
    if (error) console.error("Error upserting facility", f.id, error);
  }
  console.log("Facilities upserted!");

  // 3. Insert resources
  console.log("Upserting resources...");
  for (const r of INITIAL_RESOURCES) {
    const { error } = await supabase.from("resources").upsert(r);
    if (error) console.error("Error upserting resource", r.id, error);
  }
  console.log("Resources upserted!");

  // 4. Insert reservations and requested resources
  console.log("Upserting reservations...");
  const INITIAL_RESERVATIONS = [
    {
      id: "res-001",
      reservation_code: "US-2026-7841",
      facility_id: "function-hall",
      user_id: userIdMap["usr-student-01"],
      event_name: "ACM Annual Hackathon Keynote & Awards",
      purpose: "Collegiate technology competition closing ceremony and keynote address from industry guest speakers.",
      date: "2026-10-05",
      start_time: "09:00",
      end_time: "13:00",
      expected_attendees: 280,
      status: "APPROVED",
      submitted_at: "2026-09-28T14:20:00Z",
      reviewed_at: "2026-09-29T10:15:00Z",
      reviewed_by: "CHMSU Facility Administrator",
      admin_notes: "Approved. Audio technicians will assist with sound booth configuration at 08:30 AM.",
      resources: [
        { resourceId: "res-proj", name: "Projector", quantity: 2 },
        { resourceId: "res-sound", name: "Sound System", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 4 },
        { resourceId: "res-chair", name: "Chairs", quantity: 250 },
        { resourceId: "res-table", name: "Tables", quantity: 20 },
      ],
    },
    {
      id: "res-002",
      reservation_code: "US-2026-7842",
      facility_id: "avr",
      user_id: userIdMap["usr-faculty-01"],
      event_name: "Graduate Thesis Oral Defenses - Batch A",
      purpose: "Formal defense presentations for MS Electrical and Electronics Engineering graduating candidates.",
      date: "2026-10-06",
      start_time: "13:30",
      end_time: "17:30",
      expected_attendees: 65,
      status: "APPROVED",
      submitted_at: "2026-09-29T09:30:00Z",
      reviewed_at: "2026-09-29T11:00:00Z",
      reviewed_by: "CHMSU Facility Administrator",
      admin_notes: "Priority academic review approved. HDMI and laser clickers prepared.",
      resources: [
        { resourceId: "res-proj", name: "Projector", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 2 },
        { resourceId: "res-chair", name: "Chairs", quantity: 60 },
        { resourceId: "res-table", name: "Tables", quantity: 6 },
      ],
    },
    {
      id: "res-003",
      reservation_code: "US-2026-7843",
      facility_id: "gym",
      user_id: userIdMap["usr-student-01"],
      event_name: "Inter-Collegiate Volleyball Elimination Round",
      purpose: "Quarterfinal matches for the university intramural volleyball league.",
      date: "2026-10-07",
      start_time: "14:00",
      end_time: "18:00",
      expected_attendees: 320,
      status: "PENDING",
      submitted_at: "2026-09-30T16:45:00Z",
      resources: [
        { resourceId: "res-sound", name: "Sound System", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 2 },
        { resourceId: "res-chair", name: "Chairs", quantity: 100 },
        { resourceId: "res-table", name: "Tables", quantity: 4 },
      ],
    },
    {
      id: "res-004",
      reservation_code: "US-2026-7844",
      facility_id: "rooftop-engineering",
      user_id: userIdMap["usr-faculty-01"],
      event_name: "Renewable Microgrid Showcase & Astronomy Stargazing",
      purpose: "Evening demonstration of solar telemetry data coupled with introductory astronomy observation.",
      date: "2026-10-08",
      start_time: "17:00",
      end_time: "20:30",
      expected_attendees: 90,
      status: "PENDING",
      submitted_at: "2026-09-30T18:10:00Z",
      resources: [
        { resourceId: "res-sound", name: "Sound System", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 2 },
        { resourceId: "res-chair", name: "Chairs", quantity: 80 },
        { resourceId: "res-table", name: "Tables", quantity: 8 },
      ],
    },
    {
      id: "res-005",
      reservation_code: "US-2026-7845",
      facility_id: "dance-hall",
      user_id: userIdMap["usr-student-01"],
      event_name: "Annual Cultural Dance Showcase Rehearsal",
      purpose: "Technical choreography run-through with lighting and musical cues.",
      date: "2026-10-09",
      start_time: "16:00",
      end_time: "19:00",
      expected_attendees: 45,
      status: "APPROVED",
      submitted_at: "2026-09-27T11:15:00Z",
      reviewed_at: "2026-09-28T09:20:00Z",
      reviewed_by: "CHMSU Facility Administrator",
      admin_notes: "Approved. Please maintain clean footwear protocol.",
      resources: [
        { resourceId: "res-sound", name: "Sound System", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 1 },
      ],
    },
    {
      id: "res-006",
      reservation_code: "US-2026-7846",
      facility_id: "dining-hall",
      user_id: userIdMap["usr-student-01"],
      event_name: "Freshman Welcome Dinner & Leadership Fellowship",
      purpose: "Orientation dinner for incoming student leaders and department representatives.",
      date: "2026-10-04",
      start_time: "18:00",
      end_time: "21:00",
      expected_attendees: 180,
      status: "APPROVED",
      submitted_at: "2026-09-25T15:40:00Z",
      reviewed_at: "2026-09-26T13:10:00Z",
      reviewed_by: "CHMSU Facility Administrator",
      admin_notes: "Approved. Facilities custodian Clara Mendoza notified for catering setup.",
      resources: [
        { resourceId: "res-sound", name: "Sound System", quantity: 1 },
        { resourceId: "res-mic", name: "Microphone", quantity: 2 },
        { resourceId: "res-chair", name: "Chairs", quantity: 160 },
        { resourceId: "res-table", name: "Tables", quantity: 25 },
      ],
    },
    {
      id: "res-007",
      reservation_code: "US-2026-7839",
      facility_id: "function-hall",
      user_id: userIdMap["usr-student-01"],
      event_name: "Campus Inter-College Debate Tournament",
      purpose: "Parliamentary debate preliminary rounds.",
      date: "2026-09-25",
      start_time: "10:00",
      end_time: "16:00",
      expected_attendees: 120,
      status: "REJECTED",
      submitted_at: "2026-09-20T08:30:00Z",
      reviewed_at: "2026-09-21T11:45:00Z",
      reviewed_by: "CHMSU Facility Administrator",
      rejection_reason: "Schedule conflict with scheduled university Board of Regents plenary assembly. Facility unavailable on this date.",
      resources: [
        { resourceId: "res-mic", name: "Microphone", quantity: 4 },
        { resourceId: "res-chair", name: "Chairs", quantity: 120 },
      ],
    },
  ];

  for (const r of INITIAL_RESERVATIONS) {
    if (!r.user_id) continue;
    const { resources, ...resRow } = r;
    await supabase.from("reservations").upsert(resRow);

    if (resources && resources.length > 0) {
      for (const [idx, req] of resources.entries()) {
        await supabase.from("requested_resources").upsert({
          id: `${r.id}-res-${idx}`,
          reservation_id: r.id,
          resource_id: req.resourceId,
          name: req.name,
          quantity: req.quantity,
        });
      }
    }
  }
  console.log("Reservations & requested resources upserted!");

  // 5. Insert approval logs
  console.log("Upserting approval logs...");
  const INITIAL_APPROVAL_LOGS = [
    {
      id: "log-001",
      reservation_id: "res-001",
      reservation_code: "US-2026-7841",
      event_name: "ACM Annual Hackathon Keynote & Awards",
      facility_name: "Function Hall",
      actor_name: "CHMSU Facility Administrator",
      actor_role: "ADMINISTRATOR",
      action: "APPROVED",
      timestamp: "2026-09-29T10:15:00Z",
      notes: "Facility availability verified. Sound booth tech scheduled for 08:30 AM prep.",
    },
    {
      id: "log-002",
      reservation_id: "res-002",
      reservation_code: "US-2026-7842",
      event_name: "Graduate Thesis Oral Defenses - Batch A",
      facility_name: "AVR (Audio Visual Room)",
      actor_name: "CHMSU Facility Administrator",
      actor_role: "ADMINISTRATOR",
      action: "APPROVED",
      timestamp: "2026-09-29T11:00:00Z",
      notes: "Priority academic booking cleared for graduate committee.",
    },
    {
      id: "log-003",
      reservation_id: "res-007",
      reservation_code: "US-2026-7839",
      event_name: "Campus Inter-College Debate Tournament",
      facility_name: "Function Hall",
      actor_name: "CHMSU Facility Administrator",
      actor_role: "ADMINISTRATOR",
      action: "REJECTED",
      timestamp: "2026-09-21T11:45:00Z",
      notes: "Conflict with Board of Regents institutional assembly.",
    },
    {
      id: "log-004",
      reservation_id: "res-005",
      reservation_code: "US-2026-7845",
      event_name: "Annual Cultural Dance Showcase Rehearsal",
      facility_name: "Dance Hall",
      actor_name: "CHMSU Facility Administrator",
      actor_role: "ADMINISTRATOR",
      action: "APPROVED",
      timestamp: "2026-09-28T09:20:00Z",
      notes: "Approved with clean footwear compliance reminder.",
    },
    {
      id: "log-005",
      reservation_id: "res-006",
      reservation_code: "US-2026-7846",
      event_name: "Freshman Welcome Dinner & Leadership Fellowship",
      facility_name: "Dining Hall",
      actor_name: "CHMSU Facility Administrator",
      actor_role: "ADMINISTRATOR",
      action: "APPROVED",
      timestamp: "2026-09-26T13:10:00Z",
      notes: "Approved. Catering waste protocols acknowledged.",
    },
  ];

  for (const log of INITIAL_APPROVAL_LOGS) {
    await supabase.from("approval_logs").upsert(log);
  }
  console.log("Approval logs upserted!");

  // 6. Insert notifications
  console.log("Upserting notifications...");
  const INITIAL_NOTIFICATIONS = [
    {
      id: "notif-001",
      user_id: userIdMap["usr-student-01"],
      title: "Reservation Approved: Function Hall",
      message: "Your reservation US-2026-7841 for 'ACM Annual Hackathon Keynote & Awards' on October 5 has been officially approved.",
      type: "RESERVATION_APPROVED",
      timestamp: "2026-10-01T12:00:00Z",
      read: false,
      reservation_id: "res-001",
    },
    {
      id: "notif-002",
      user_id: userIdMap["usr-student-01"],
      title: "Pending Review: Inter-Collegiate Volleyball",
      message: "Reservation US-2026-7843 for the Gym is currently undergoing facility administrator conflict verification.",
      type: "RESERVATION_SUBMITTED",
      timestamp: "2026-10-01T08:00:00Z",
      read: false,
      reservation_id: "res-003",
    },
    {
      id: "notif-003",
      user_id: userIdMap["usr-faculty-01"],
      title: "Reservation Approved: AVR Facility",
      message: "Your academic defense schedule US-2026-7842 for October 6 has been confirmed with priority status.",
      type: "RESERVATION_APPROVED",
      timestamp: "2026-09-30T10:00:00Z",
      read: true,
      reservation_id: "res-002",
    },
    {
      id: "notif-004",
      user_id: userIdMap["usr-admin-01"],
      title: "Action Required: 2 Pending Reservation Requests",
      message: "Two new reservation requests require administrator review and schedule approval.",
      type: "RESERVATION_SUBMITTED",
      timestamp: "2026-10-01T14:00:00Z",
      read: false,
    },
    {
      id: "notif-005",
      user_id: null,
      target_role: "ALL",
      title: "Facility Notice: Routine Maintenance Inspection",
      message: "Electrical diagnostics scheduled for the Gym lighting grid this Saturday evening from 10:00 PM onwards.",
      type: "FACILITY_UPDATE",
      timestamp: "2026-09-28T09:00:00Z",
      read: true,
    },
  ];

  for (const n of INITIAL_NOTIFICATIONS) {
    await supabase.from("notifications").upsert(n);
  }
  console.log("Notifications upserted!");

  console.log("Database seeding completed successfully!");
}

seed().catch(console.error);

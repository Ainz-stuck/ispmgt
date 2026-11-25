import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eppnkgfrxmjxdzrzimtw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcG5rZ2ZyeG1qeGR6cnppbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MDIzMDcsImV4cCI6MjExMTA3ODMwN30.Ux0BSM7Yba0OjcT0ur8KsHzXv--KbyA-wzHRPmRs3YI";

export const supabase: any = createClient(supabaseUrl, supabaseAnonKey);


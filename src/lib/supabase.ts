import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://niicgimyporxhzgzwxri.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWNnaW15cG9yeGh6Z3p3eHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE4NTYsImV4cCI6MjA5MDU1Nzg1Nn0.JTo1m67QrBaSRIif2xbr_bYPwETtvYlMXYIfSTE8eSw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Note = {
  id: number;
  note: string;
};


// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://udveemrbyfjjtfurrsgb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdmVlbXJieWZqanRmdXJyc2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mjk4MjUsImV4cCI6MjA1ODMwNTgyNX0.hm9PRAEAymH8-hvLCk4TguVttOzBOvBlYDmrExBS9O0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fuumjemjsdruyswnloxb.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dW1qZW1qc2RydXlzd25sb3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDE0NTQsImV4cCI6MjA4NDQxNzQ1NH0.FLenY_66EYMJIIJp9WQRyihWUwy8YY9aN1Kw06dQs1Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

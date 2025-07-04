import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
// Use service_role key for migrations
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2MjUyMSwiZXhwIjoyMDY3MDM4NTIxfQ.vYqS61JkFG9TD84pugIKE5NoVojpVKMrK2R8YiXmhyM';

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'cache-control': 'no-cache'
    }
  }
}); 
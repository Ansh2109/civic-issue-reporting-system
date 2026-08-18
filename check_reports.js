const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const res = await supabase.from('reports').select('id, ticket_number, created_at').order('created_at', { ascending: false }).limit(10);
  console.log(res);
}
run();

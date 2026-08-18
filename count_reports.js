const { createClient } = require('@supabase/supabase-js');
async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count, error } = await supabase.from('reports').select('*', { count: 'exact', head: true });
  console.log("Total reports in DB:", count);

  const { data } = await supabase.from('reports').select('id, ticket_number, created_at, status').order('created_at', { ascending: false }).limit(40);
  console.log("Latest ticket numbers:");
  console.log(data.map(d => d.ticket_number).join(', '));
}
run();

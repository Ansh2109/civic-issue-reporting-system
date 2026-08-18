const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_policies_or_constraints_maybe'); // not real
  // I will just fetch 1 report that has 'pothole' to see what the category actually is.
  const { data: d1 } = await supabase.from('reports').select('category').eq('category', 'pothole').limit(1);
  const { data: d2 } = await supabase.from('reports').select('category').limit(10);
  console.log("Pothole check:", d1);
  console.log("Any check:", d2);
}
run();

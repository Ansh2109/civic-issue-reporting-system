const { createClient } = require('@supabase/supabase-js');
async function test() {
  const res = await fetch('http://localhost:3000/api/map/reports');
  const data = await res.json();
  console.log("Reports:", data.reports.length);
  const valid = data.reports.filter(r => r.lat != null && r.lng != null);
  console.log("Valid coords:", valid.length);
  if (valid.length > 0) {
    console.log("Sample:", valid[0].lat, typeof valid[0].lat, valid[0].lng, typeof valid[0].lng);
  }
}
test();

require('dotenv').config({ path: '.env.local' });
const inputs = [
  'There is a large pothole near the college gate.',
  'The garbage bin near the hostel is overflowing.',
  'The streetlight outside the main gate is not working.',
  'There is a water pipe leaking continuously on the road.',
  'The drain near the hostel is blocked and dirty water is overflowing.',
  'The traffic signal at the main intersection is broken.'
];

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  for (const desc of inputs) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 64,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: 'You are a civic issue classifier. Classify the description into exactly one category, rate its urgency, and assign it to the relevant department. Respond with ONLY valid JSON — no markdown, no explanation, no extra text. Example: {"category":"pothole","urgency":4,"department":"Roads & Transport"}\n\nClassify this civic issue report:\n\n"' + desc + '"\n\nRules:\n- "category" must be exactly one of: pothole, streetlight, garbage, water_leak, drainage, illegal_construction, stray_animal, traffic_signal, roads, other\n- Pick "other" ONLY when nothing else genuinely fits.\n- "urgency" must be an integer 1 (minor inconvenience) to 5 (immediate danger)\n- "department" must be exactly one of: Roads & Transport, Sanitation, Water Supply, Electricity, Public Works, Animal Control, General\nRespond with ONLY the JSON object.' }]
          }
        ]
      })
    });
    const data = await res.json();
    console.log('---');
    console.log('Input:', desc);
    console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text || data);
  }
}
run();

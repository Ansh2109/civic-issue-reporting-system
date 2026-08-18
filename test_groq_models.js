async function run() {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log(data.data.map(m => m.id));
}
run();

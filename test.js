const inputs = [
  'There is a large pothole near the college gate.',
  'The garbage bin near the hostel is overflowing and smells terrible.',
  'The streetlight outside the main gate is not working.',
  'There is a water pipe leaking continuously on the road.',
  'The drain near the hostel is blocked and dirty water is overflowing.',
  'The traffic signal at the main intersection is broken.',
  'A large tree branch has fallen across the road.'
];

async function run() {
  for (const desc of inputs) {
    const res = await fetch('http://localhost:3000/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('---');
      console.log('Input:', desc);
      console.log('Response:', data);
    } else {
      console.log('---');
      console.log('Input:', desc);
      console.log('Error:', res.status, await res.text());
    }
  }
}
run();

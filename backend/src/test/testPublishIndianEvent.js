async function runTest() {
  try {
    const regEmail = `indiatest_${Date.now()}@localvibe.test`;
    console.log('Registering user:', regEmail);
    const regRes = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Rohan Sharma', email: regEmail, password: 'TestPassword123!' })
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status, 'token exists:', !!regData?.data?.token);
    const token = regData.data.token;

    console.log('Publishing event in Bengaluru with curated cover image...');
    const createRes = await fetch('http://127.0.0.1:5000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Bengaluru Rooftop Acoustic Sunset Sessions',
        shortDescription: 'Unplugged acoustic evening overlooking Indiranagar skyline with artisanal brews',
        description: 'Join us for a tranquil sunset acoustic session featuring local indie artists and specialty craft sodas.',
        category: 'Music',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        price: 299,
        isFree: false,
        capacity: 60,
        tags: ['AcousticOnly', 'SoloFriendly', 'FairyLights'],
        startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3 + 14400000).toISOString(),
        location: {
          address: '100 Feet Rd, HAL 2nd Stage, Indiranagar',
          city: 'Bengaluru',
          coordinates: [77.6408, 12.9784]
        }
      })
    });

    const createData = await createRes.json();
    console.log('Create Event HTTP Status:', createRes.status);
    console.log('Create Event Success:', createData.success);
    console.log('Created Event ID:', createData.data?._id || createData.data?.id);
    console.log('Created Event Title:', createData.data?.title);
    console.log('Created Event City:', createData.data?.location?.city);
    console.log('Created Event Coordinates:', createData.data?.location?.coordinates);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();

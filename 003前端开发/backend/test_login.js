(async () => {
  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'yangwenjian', password: 'abc123456' }),
  });
  const loginData = await loginRes.json();
  console.log('Login:', JSON.stringify(loginData, null, 2));

  if (loginData.code !== 0) { console.log('LOGIN FAILED'); return; }
  const token = loginData.data.token;

  // 2. Profile
  const profileRes = await fetch('http://localhost:3000/api/auth/profile', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const profileData = await profileRes.json();
  console.log('Profile:', JSON.stringify(profileData, null, 2));

  // 3. Transactions
  const txRes = await fetch('http://localhost:3000/api/transactions?page=1&pageSize=5', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const txData = await txRes.json();
  console.log('Transactions:', txData.code === 0 ? 'OK, total=' + txData.data.total : 'FAIL: ' + txData.message);

  // 4. Statistics
  const statRes = await fetch('http://localhost:3000/api/statistics/monthly?month=2026-09', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const statData = await statRes.json();
  console.log('Statistics:', statData.code === 0 ? 'OK' : 'FAIL: ' + statData.message, JSON.stringify(statData.data));

  // 5. Categories
  const catRes = await fetch('http://localhost:3000/api/categories', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const catData = await catRes.json();
  console.log('Categories:', catData.code === 0 ? 'OK, count=' + catData.data.length : 'FAIL: ' + catData.message);

  // 6. Reserve
  const resRes = await fetch('http://localhost:3000/api/reserve/current', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const resData = await resRes.json();
  console.log('Reserve:', resData.code === 0 ? 'OK' : 'FAIL: ' + resData.message, JSON.stringify(resData.data));
})();

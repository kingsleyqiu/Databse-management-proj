// Charging sessions functionality
document.addEventListener('DOMContentLoaded', () => {
  loadSessionDetails();
  loadSessionCostRate();
  setupForm();
});

function setupForm() {
  const form = document.getElementById('sessionForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSessionSubmit();
  });
}

async function handleSessionSubmit() {
  const form = document.getElementById('sessionForm');
  const formData = new FormData(form);
  const sessionId = document.getElementById('sessionId').value;
  const resultDiv = document.getElementById('formResult');
  
  const startTime = formData.get('startt');
  const endTime = formData.get('endt');
  
  // Convert datetime-local to MySQL datetime format
  const startt = new Date(startTime).toISOString().slice(0, 19).replace('T', ' ');
  const endt = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
  
  const data = {
    user_id: parseInt(formData.get('user_id')),
    charger_id: parseInt(formData.get('charger_id')),
    res_id: formData.get('res_id') ? parseInt(formData.get('res_id')) : null,
    startt: startt,
    endt: endt,
    energy_delivered_kwh: parseFloat(formData.get('energy_delivered_kwh')),
    cost: parseFloat(formData.get('cost')),
    payment_stat: formData.get('payment_stat') || 'Pending'
  };
  
  try {
    if (sessionId) {
      // Update existing session
      await updateSession(sessionId, data);
      resultDiv.innerHTML = '<p style="color: green;">Session updated successfully!</p>';
    } else {
      // Create new session
      await createSession(data);
      resultDiv.innerHTML = '<p style="color: green;">Session created successfully!</p>';
    }
    
    form.reset();
    document.getElementById('sessionId').value = '';
    document.getElementById('submitBtn').textContent = 'Create Session';
    document.getElementById('cancelBtn').style.display = 'none';
    await loadSessionDetails();
    await loadSessionCostRate();
    
    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving session:', error);
    resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

function cancelEdit() {
  const form = document.getElementById('sessionForm');
  form.reset();
  document.getElementById('sessionId').value = '';
  document.getElementById('submitBtn').textContent = 'Create Session';
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formResult').innerHTML = '';
}

async function loadSessionDetails() {
  try {
    const sessions = await getView('session-details');
    const container = document.getElementById('sessionDetails');
    
    if (sessions.length === 0) {
      container.innerHTML = '<p>No charging sessions found</p>';
      return;
    }
    
    let html = '<table><tr><th>Session ID</th><th>User</th><th>Car</th><th>Station</th><th>Charger</th><th>Start Time</th><th>End Time</th><th>Energy (kWh)</th><th>Cost</th><th>Payment Status</th><th>Actions</th></tr>';
    sessions.forEach(session => {
      html += `<tr>
        <td>${session.session_id}</td>
        <td>${session.fname || ''} ${session.lname || ''}</td>
        <td>${session.make || 'N/A'} ${session.model || ''}</td>
        <td>${session.station_name || 'N/A'}</td>
        <td>${session.connector_type || 'N/A'} ${session.charging_speed_kw || ''}kW</td>
        <td>${formatDateTime(session.startt)}</td>
        <td>${formatDateTime(session.endt)}</td>
        <td>${parseFloat(session.energy_delivered_kwh || 0).toFixed(2)}</td>
        <td>$${parseFloat(session.cost || 0).toFixed(2)}</td>
        <td>${session.payment_stat || 'N/A'}</td>
        <td>
          <button onclick="editSession(${session.session_id})">Edit</button>
          <button onclick="deleteSessionConfirm(${session.session_id})">Delete</button>
        </td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading session details:', error);
    document.getElementById('sessionDetails').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function loadSessionCostRate() {
  try {
    const sessions = await getView('session-cost-rate');
    const container = document.getElementById('sessionCostRate');
    
    if (sessions.length === 0) {
      container.innerHTML = '<p>No session cost/rate data found</p>';
      return;
    }
    
    let html = '<table><tr><th>Session ID</th><th>Station Name</th><th>Posted Rate (per kWh)</th><th>Effective Rate (per kWh)</th><th>Energy (kWh)</th><th>Cost</th></tr>';
    sessions.forEach(session => {
      const postedRate = parseFloat(session.posted_rate_per_kwh || 0).toFixed(2);
      const effectiveRate = parseFloat(session.effective_rate_per_kwh || 0).toFixed(2);
      const energy = parseFloat(session.energy_delivered_kwh || 0).toFixed(2);
      const cost = parseFloat(session.cost || 0).toFixed(2);
      
      html += `<tr>
        <td>${session.session_id}</td>
        <td>${session.station_name || 'N/A'}</td>
        <td>$${postedRate}</td>
        <td>$${effectiveRate}</td>
        <td>${energy}</td>
        <td>$${cost}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading session cost/rate:', error);
    document.getElementById('sessionCostRate').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function editSession(id) {
  try {
    const session = await getSession(id);
    const form = document.getElementById('sessionForm');
    
    // Populate form with session data
    document.getElementById('sessionId').value = session.session_id;
    form.querySelector('[name="user_id"]').value = session.user_id;
    form.querySelector('[name="charger_id"]').value = session.charger_id;
    form.querySelector('[name="res_id"]').value = session.res_id || '';
    
    // Convert MySQL datetime to datetime-local format
    const startDate = new Date(session.startt);
    const endDate = new Date(session.endt);
    const startLocal = startDate.toISOString().slice(0, 16);
    const endLocal = endDate.toISOString().slice(0, 16);
    
    document.getElementById('startTime').value = startLocal;
    document.getElementById('endTime').value = endLocal;
    form.querySelector('[name="energy_delivered_kwh"]').value = session.energy_delivered_kwh;
    form.querySelector('[name="cost"]').value = session.cost;
    form.querySelector('[name="payment_stat"]').value = session.payment_stat;
    
    // Change button text and show cancel
    document.getElementById('submitBtn').textContent = 'Update Session';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading session:', error);
    alert('Error loading session: ' + error.message);
  }
}

async function deleteSessionConfirm(id) {
  if (!confirm('Are you sure you want to delete this charging session? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteSession(id);
    alert('Session deleted successfully!');
    await loadSessionDetails();
    await loadSessionCostRate();
  } catch (error) {
    console.error('Error deleting session:', error);
    alert('Error deleting session: ' + error.message);
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

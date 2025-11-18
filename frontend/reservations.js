// Reservations functionality
document.addEventListener('DOMContentLoaded', () => {
  loadFutureReservations();
  loadAllReservations();
  setupForm();
  loadUsers();
  loadChargers();
});

function setupForm() {
  const form = document.getElementById('reservationForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleReservationSubmit();
  });
}

async function loadUsers() {
  try {
    const users = await getUsers();
    const select = document.getElementById('userId');
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.user_id;
      option.textContent = `${user.fname} ${user.lname} (${user.email})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadChargers() {
  try {
    // Get available chargers from resources view
    const resources = await getView('resources');
    const chargers = resources.filter(r => r.resource_type === 'Charger' && r.status === 'Available');
    
    const select = document.getElementById('chargerId');
    chargers.forEach(charger => {
      const option = document.createElement('option');
      option.value = charger.resource_id;
      option.textContent = charger.label;
      select.appendChild(option);
    });
    
    // If no available chargers, try getting all stations and chargers
    if (chargers.length === 0) {
      const stations = await getStations();
      // Note: We'd need a chargers API endpoint to get full charger details
      // For now, show stations as placeholder
      stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.id;
        option.textContent = `${station.name} - Station ID: ${station.id}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading chargers:', error);
  }
}

async function handleReservationSubmit() {
  const form = document.getElementById('reservationForm');
  const formData = new FormData(form);
  const reservationId = document.getElementById('reservationId').value;
  const resultDiv = document.getElementById('formResult');
  
  const startTime = formData.get('startt');
  const endTime = formData.get('endt');
  
  // Convert datetime-local to MySQL datetime format
  const startt = new Date(startTime).toISOString().slice(0, 19).replace('T', ' ');
  const endt = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
  
  const data = {
    user_id: parseInt(formData.get('user_id')),
    charger_id: parseInt(formData.get('charger_id')),
    startt: startt,
    endt: endt,
    status: formData.get('status') || 'Reserved'
  };
  
  try {
    if (reservationId) {
      // Update existing reservation
      await updateReservation(reservationId, data);
      resultDiv.innerHTML = '<p style="color: green;">Reservation updated successfully!</p>';
    } else {
      // Create new reservation
      await createReservation(data);
      resultDiv.innerHTML = '<p style="color: green;">Reservation created successfully!</p>';
    }
    
    form.reset();
    document.getElementById('reservationId').value = '';
    document.getElementById('submitBtn').textContent = 'Create Reservation';
    document.getElementById('cancelBtn').style.display = 'none';
    await loadFutureReservations();
    await loadAllReservations();
    
    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving reservation:', error);
    resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

async function loadFutureReservations() {
  try {
    const reservations = await getView('future-res-details');
    const container = document.getElementById('futureReservations');
    
    if (reservations.length === 0) {
      container.innerHTML = '<p>No future reservations found</p>';
      return;
    }
    
    let html = '<table><tr><th>Reservation ID</th><th>User</th><th>Station</th><th>Connector Type</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th></tr>';
    reservations.forEach(res => {
      html += `<tr>
        <td>${res.res_id}</td>
        <td>${res.fname || ''} ${res.lname || ''}</td>
        <td>${res.station_name || 'N/A'}</td>
        <td>${res.connector_type || 'N/A'}</td>
        <td>${formatDateTime(res.startt)}</td>
        <td>${formatDateTime(res.endt)}</td>
        <td>${res.status}</td>
        <td>
          <button onclick="editReservation(${res.res_id})">Edit</button>
          <button onclick="cancelReservation(${res.res_id}, '${res.status}')">Cancel</button>
          <button onclick="deleteReservationConfirm(${res.res_id})">Delete</button>
        </td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading future reservations:', error);
    document.getElementById('futureReservations').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function loadAllReservations() {
  try {
    const reservations = await getView('reservations-session');
    const container = document.getElementById('allReservations');
    
    if (reservations.length === 0) {
      container.innerHTML = '<p>No reservations found</p>';
      return;
    }
    
    let html = '<table><tr><th>Reservation ID</th><th>User ID</th><th>Charger ID</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Has Session</th></tr>';
    reservations.forEach(res => {
      html += `<tr>
        <td>${res.res_id}</td>
        <td>${res.user_id}</td>
        <td>${res.charger_id}</td>
        <td>${formatDateTime(res.startt)}</td>
        <td>${formatDateTime(res.endt)}</td>
        <td>${res.status}</td>
        <td>${res.has_session ? 'Yes' : 'No'}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading all reservations:', error);
    document.getElementById('allReservations').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

async function editReservation(id) {
  try {
    const reservation = await getReservation(id);
    const form = document.getElementById('reservationForm');
    
    // Populate form with reservation data
    document.getElementById('reservationId').value = reservation.res_id;
    document.getElementById('userId').value = reservation.user_id;
    document.getElementById('chargerId').value = reservation.charger_id;
    
    // Convert MySQL datetime to datetime-local format
    const startDate = new Date(reservation.startt);
    const endDate = new Date(reservation.endt);
    const startLocal = startDate.toISOString().slice(0, 16);
    const endLocal = endDate.toISOString().slice(0, 16);
    
    document.getElementById('startTime').value = startLocal;
    document.getElementById('endTime').value = endLocal;
    form.querySelector('[name="status"]').value = reservation.status;
    
    // Change button text and show cancel
    document.getElementById('submitBtn').textContent = 'Update Reservation';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading reservation:', error);
    alert('Error loading reservation: ' + error.message);
  }
}

function cancelEdit() {
  const form = document.getElementById('reservationForm');
  form.reset();
  document.getElementById('reservationId').value = '';
  document.getElementById('submitBtn').textContent = 'Create Reservation';
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formResult').innerHTML = '';
  loadUsers();
  loadChargers();
}

async function deleteReservationConfirm(id) {
  if (!confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteReservation(id);
    alert('Reservation deleted successfully!');
    await loadFutureReservations();
    await loadAllReservations();
  } catch (error) {
    console.error('Error deleting reservation:', error);
    alert('Error deleting reservation: ' + error.message);
  }
}

async function cancelReservation(resId, currentStatus) {
  if (currentStatus === 'Cancelled') {
    alert('This reservation is already cancelled.');
    return;
  }
  
  if (!confirm('Are you sure you want to cancel this reservation?')) {
    return;
  }
  
  try {
    // Get the full reservation first to preserve other fields
    const reservation = await getReservation(resId);
    await updateReservation(resId, { 
      ...reservation,
      status: 'Cancelled' 
    });
    alert('Reservation cancelled successfully!');
    await loadFutureReservations();
    await loadAllReservations();
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    alert('Error cancelling reservation: ' + error.message);
  }
}

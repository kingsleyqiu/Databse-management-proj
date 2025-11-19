// Function to open calendar picker
function openCalendar(inputId) {
  const input = document.getElementById(inputId);
  // Remove readonly temporarily to allow calendar to open
  input.removeAttribute('readonly');
  // Use showPicker() if available (modern browsers), otherwise focus and click
  if (input.showPicker) {
    input.showPicker().catch(() => {
      // Fallback if showPicker fails
      input.focus();
      input.click();
    });
  } else {
    input.focus();
    input.click();
  }
  // Re-add readonly after a short delay to prevent typing
  setTimeout(() => {
    input.setAttribute('readonly', 'readonly');
  }, 200);
}

// Reservations functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  
  if (!role || !userId) {
    alert("You must log in first.");
    window.location.href = "index.html";
    return;
  }
  
  // Auto-set user ID for non-admin users
  if (role !== "admin") {
    document.getElementById('userId').value = userId;
    // Hide user selection for regular users
    document.getElementById('userSelectContainer').style.display = 'none';
    // Show user info display
    displayCurrentUserInfo(userId);
  } else {
    // Show user selection for admins
    document.getElementById('userSelectContainer').style.display = 'block';
    document.getElementById('userInfoDisplay').style.display = 'none';
    loadUsers();
  }
  
  // Setup calendar inputs to open picker on click
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  
  startTimeInput.addEventListener('click', () => openCalendar('startTime'));
  endTimeInput.addEventListener('click', () => openCalendar('endTime'));
  
  // Prevent typing in datetime inputs
  startTimeInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    openCalendar('startTime');
  });
  endTimeInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    openCalendar('endTime');
  });
  
  loadFutureReservations();
  loadAllReservations();
  setupForm();
  loadChargers();
});

// Function to convert MySQL datetime (YYYY-MM-DD HH:mm:ss) to datetime-local format (YYYY-MM-DDTHH:mm:ss) in local time
function mysqlToDatetimeLocal(mysqlDateTime) {
  if (!mysqlDateTime) return '';
  
  // Replace space with T if present (MySQL format uses space, ISO uses T)
  const isoString = mysqlDateTime.replace(' ', 'T');
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Format as YYYY-MM-DDTHH:mm:ss in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Function to normalize datetime value (ensures it has seconds)
function normalizeDateTimeValue(value) {
  if (!value) return '';
  const trimmed = value.trim();
  // datetime-local can be 16 chars (YYYY-MM-DDTHH:mm) or 19 chars (YYYY-MM-DDTHH:mm:ss)
  // If it's 16 chars, add :00 seconds to make it 19 chars
  if (trimmed.length === 16 && trimmed.includes('T')) {
    return trimmed + ':00';
  }
  // If it's already 19 chars, return as is
  if (trimmed.length === 19 && trimmed.includes('T')) {
    return trimmed;
  }
  return trimmed;
}

function setupForm() {
  const form = document.getElementById('reservationForm');
  
  // Simple form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const resultDiv = document.getElementById('formResult');
    
    // Get and normalize datetime values (ensure they have seconds)
    let startTime = startTimeInput.value ? normalizeDateTimeValue(startTimeInput.value) : '';
    let endTime = endTimeInput.value ? normalizeDateTimeValue(endTimeInput.value) : '';
    
    // Simple validation - check if values exist and are in correct format (16 or 19 chars)
    if (!startTime || (startTime.length !== 16 && startTime.length !== 19)) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a complete start date and time.</p>';
      startTimeInput.focus();
      return;
    }
    
    if (!endTime || (endTime.length !== 16 && endTime.length !== 19)) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a complete end date and time.</p>';
      endTimeInput.focus();
      return;
    }
    
    // Ensure both have seconds format (19 chars) for consistent processing
    if (startTime.length === 16) {
      startTime = startTime + ':00';
    }
    if (endTime.length === 16) {
      endTime = endTime + ':00';
    }
    
    // Get user_id from hidden field
    const userId = document.getElementById('userId').value;
    if (!userId) {
      resultDiv.innerHTML = '<p style="color: red;">Error: User ID is required</p>';
      return;
    }
    
    // Convert datetime-local to MySQL datetime format (preserve seconds from input)
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Validate dates are valid
    if (isNaN(startDate.getTime())) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Invalid start time. Please select a valid date and time.</p>';
      startTimeInput.focus();
      return;
    }
    
    if (isNaN(endDate.getTime())) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Invalid end time. Please select a valid date and time.</p>';
      endTimeInput.focus();
      return;
    }
    
    // Extract seconds from input if provided, otherwise use 00
    const startSeconds = startTime.length === 19 ? startTime.split(':')[2] : '00';
    const endSeconds = endTime.length === 19 ? endTime.split(':')[2] : '00';
    
    // Set the seconds from the input
    startDate.setSeconds(parseInt(startSeconds), 0);
    endDate.setSeconds(parseInt(endSeconds), 0);
    
    // Convert to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
    const startt = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const endt = endDate.toISOString().slice(0, 19).replace('T', ' ');
    
    // Get form data
    const formData = new FormData(form);
    const reservationId = document.getElementById('reservationId').value;
    
    const data = {
      user_id: parseInt(userId),
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
      
      // Ensure readonly is maintained on datetime inputs after reset
      const startTimeInput = document.getElementById('startTime');
      const endTimeInput = document.getElementById('endTime');
      startTimeInput.setAttribute('readonly', 'readonly');
      endTimeInput.setAttribute('readonly', 'readonly');
      
      // Reset user ID based on role
      const role = localStorage.getItem("userRole");
      const userIdFromStorage = localStorage.getItem("userId");
      if (role !== "admin") {
        document.getElementById('userId').value = userIdFromStorage;
      }
      
      await loadFutureReservations();
      await loadAllReservations();
      
      setTimeout(() => {
        resultDiv.innerHTML = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving reservation:', error);
      resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  });
}

async function displayCurrentUserInfo(userId) {
  try {
    const users = await getUsers();
    const user = users.find(u => u.user_id == userId);
    if (user) {
      document.getElementById('currentUserInfo').textContent = `${user.fname} ${user.lname} (${user.email})`;
      document.getElementById('userInfoDisplay').style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

async function loadUsers() {
  try {
    const users = await getUsers();
    const select = document.getElementById('userSelect');
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.user_id;
      option.textContent = `${user.fname} ${user.lname} (${user.email})`;
      select.appendChild(option);
    });
    
    // Add event listener to sync userSelect with hidden userId field
    select.addEventListener('change', (e) => {
      document.getElementById('userId').value = e.target.value;
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


async function loadFutureReservations() {
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    let reservations = await getView('future-res-details');
    
    // Filter by user_id if not admin
    if (role !== "admin" && userId) {
      // Get all reservations to match user_id, then filter
      const allReservations = await getReservations();
      const userReservationIds = new Set(
        allReservations
          .filter(r => r.user_id == userId)
          .map(r => r.res_id)
      );
      reservations = reservations.filter(res => userReservationIds.has(res.res_id));
    }
    
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
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    let reservations = await getView('reservations-session');
    
    // Filter by user_id if not admin
    if (role !== "admin" && userId) {
      reservations = reservations.filter(res => res.user_id == userId);
    }
    
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
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const reservation = await getReservation(id);
    
    // Security check: non-admin users can only edit their own reservations
    if (role !== "admin" && reservation.user_id != userId) {
      alert('You can only edit your own reservations.');
      return;
    }
    
    const form = document.getElementById('reservationForm');
    
    // Populate form with reservation data
    document.getElementById('reservationId').value = reservation.res_id;
    document.getElementById('userId').value = reservation.user_id;
    
    // If admin, also update the user select dropdown
    if (role === "admin") {
      const userSelect = document.getElementById('userSelect');
      if (userSelect) {
        userSelect.value = reservation.user_id;
      }
    }
    
    document.getElementById('chargerId').value = reservation.charger_id;
    
    // Convert MySQL datetime to datetime-local format (preserve seconds, use local time)
    const startLocal = mysqlToDatetimeLocal(reservation.startt);
    const endLocal = mysqlToDatetimeLocal(reservation.endt);
    
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    startTimeInput.value = startLocal;
    endTimeInput.value = endLocal;
    // Ensure readonly is maintained
    startTimeInput.setAttribute('readonly', 'readonly');
    endTimeInput.setAttribute('readonly', 'readonly');
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
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  
  form.reset();
  document.getElementById('reservationId').value = '';
  document.getElementById('submitBtn').textContent = 'Create Reservation';
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formResult').innerHTML = '';
  
  // Ensure readonly is maintained on datetime inputs
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  startTimeInput.setAttribute('readonly', 'readonly');
  endTimeInput.setAttribute('readonly', 'readonly');
  
  // Reset user ID based on role
  if (role === "admin") {
    document.getElementById('userId').value = '';
    document.getElementById('userSelectContainer').style.display = 'block';
    document.getElementById('userInfoDisplay').style.display = 'none';
    loadUsers();
  } else {
    document.getElementById('userId').value = userId;
    document.getElementById('userSelectContainer').style.display = 'none';
    displayCurrentUserInfo(userId);
  }
  
  loadChargers();
}

async function deleteReservationConfirm(id) {
  if (!confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
    return;
  }
  
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    // Security check: non-admin users can only delete their own reservations
    if (role !== "admin") {
      const reservation = await getReservation(id);
      if (reservation.user_id != userId) {
        alert('You can only delete your own reservations.');
        return;
      }
    }
    
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
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    // Get the full reservation first to preserve other fields
    const reservation = await getReservation(resId);
    
    // Security check: non-admin users can only cancel their own reservations
    if (role !== "admin" && reservation.user_id != userId) {
      alert('You can only cancel your own reservations.');
      return;
    }
    
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

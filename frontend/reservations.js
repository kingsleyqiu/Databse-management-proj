// Function to generate 30-minute time increments
function generateTimeOptions() {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      // Format for display: 12-hour format with AM/PM
      const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const displayTime = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
      times.push({ value: timeString, display: displayTime });
    }
  }
  return times;
}

// Function to populate time select dropdowns
function populateTimeSelects() {
  const times = generateTimeOptions();
  const startTimeSelect = document.getElementById('startTimeSelect');
  const endTimeSelect = document.getElementById('endTimeSelect');
  
  // Clear existing options except the first one
  while (startTimeSelect.options.length > 1) {
    startTimeSelect.remove(1);
  }
  while (endTimeSelect.options.length > 1) {
    endTimeSelect.remove(1);
  }
  
  // Add time options
  times.forEach(time => {
    const option1 = document.createElement('option');
    option1.value = time.value;
    option1.textContent = time.display;
    startTimeSelect.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = time.value;
    option2.textContent = time.display;
    endTimeSelect.appendChild(option2);
  });
}

// Function to combine date and time into datetime-local format
function combineDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return '';
  return `${dateValue}T${timeValue}:00`;
}

// Function to split datetime-local into date and time
function splitDateTime(dateTimeValue) {
  if (!dateTimeValue) return { date: '', time: '' };
  const parts = dateTimeValue.split('T');
  if (parts.length !== 2) return { date: '', time: '' };
  
  const date = parts[0];
  const timePart = parts[1];
  // Remove seconds if present (HH:mm:ss -> HH:mm)
  const time = timePart.split(':').slice(0, 2).join(':');
  
  return { date, time };
}

// Function to update hidden datetime field from date and time inputs
function updateDateTimeField(prefix) {
  const dateInput = document.getElementById(`${prefix}Date`);
  const timeSelect = document.getElementById(`${prefix}TimeSelect`);
  const hiddenInput = document.getElementById(`${prefix}Time`);
  
  if (dateInput.value && timeSelect.value) {
    hiddenInput.value = combineDateTime(dateInput.value, timeSelect.value);
  } else {
    hiddenInput.value = '';
  }
}

// Function to validate that end time is after start time
function validateEndTimeAfterStart() {
  const startDateValue = document.getElementById('startDate').value;
  const startTimeValue = document.getElementById('startTimeSelect').value;
  const endDateValue = document.getElementById('endDate').value;
  const endTimeValue = document.getElementById('endTimeSelect').value;
  
  if (!startDateValue || !startTimeValue || !endDateValue || !endTimeValue) {
    // Clear any previous validation errors if fields aren't complete
    const endTimeSelect = document.getElementById('endTimeSelect');
    endTimeSelect.setCustomValidity('');
    return true; // Can't validate if fields aren't complete
  }
  
  const startDateTime = new Date(`${startDateValue}T${startTimeValue}:00`);
  const endDateTime = new Date(`${endDateValue}T${endTimeValue}:00`);
  
  // Allow same day - only check that end time is after start time
  if (endDateTime <= startDateTime) {
    const endTimeSelect = document.getElementById('endTimeSelect');
    if (startDateValue === endDateValue) {
      endTimeSelect.setCustomValidity('End time must be after start time on the same day');
    } else {
      endTimeSelect.setCustomValidity('End time must be after start time');
    }
    return false;
  } else {
    const endTimeSelect = document.getElementById('endTimeSelect');
    endTimeSelect.setCustomValidity('');
    return true;
  }
}

// Function to validate that start time is not in the past
function validateStartTimeNotPast() {
  const startDateValue = document.getElementById('startDate').value;
  const startTimeValue = document.getElementById('startTimeSelect').value;
  
  if (!startDateValue || !startTimeValue) {
    return true; // Can't validate if fields aren't complete
  }
  
  const startDateTime = new Date(`${startDateValue}T${startTimeValue}:00`);
  const now = new Date();
  
  // Allow a small buffer (1 minute) to account for timing differences
  if (startDateTime < now) {
    const startTimeSelect = document.getElementById('startTimeSelect');
    startTimeSelect.setCustomValidity('Start time cannot be in the past');
    return false;
  } else {
    const startTimeSelect = document.getElementById('startTimeSelect');
    startTimeSelect.setCustomValidity('');
    return true;
  }
}

// Function to check for scheduling conflicts
async function checkSchedulingConflict(chargerId, startDateTime, endDateTime, excludeReservationId = null) {
  try {
    // Get all reservations
    const allReservations = await getReservations();
    
    // Filter reservations for the same charger and active statuses (exclude Cancelled and Expired)
    const activeReservations = allReservations.filter(res => 
      res.charger_id == chargerId && 
      res.status !== 'Cancelled' && 
      res.status !== 'Expired' &&
      (excludeReservationId === null || res.res_id != excludeReservationId)
    );
    
    // Check for overlaps
    for (const reservation of activeReservations) {
      const existingStart = new Date(reservation.startt.replace(' ', 'T'));
      const existingEnd = new Date(reservation.endt.replace(' ', 'T'));
      
      // Check if time ranges overlap
      // Two ranges overlap if: newStart < existingEnd AND newEnd > existingStart
      if (startDateTime < existingEnd && endDateTime > existingStart) {
        return {
          hasConflict: true,
          conflictingReservation: reservation
        };
      }
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking scheduling conflicts:', error);
    // If there's an error checking conflicts, allow the reservation to proceed
    // (fail open rather than fail closed to avoid blocking valid reservations)
    return { hasConflict: false };
  }
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
    // Hide status selector for regular users
    document.getElementById('statusSelectContainer').style.display = 'none';
    // Show user info display
    displayCurrentUserInfo(userId);
  } else {
    // Show user selection for admins
    document.getElementById('userSelectContainer').style.display = 'block';
    document.getElementById('userInfoDisplay').style.display = 'none';
    // Show status selector for admins
    document.getElementById('statusSelectContainer').style.display = 'block';
    loadUsers();
  }
  
  // Populate time select dropdowns with 30-minute increments
  populateTimeSelects();
  
  // Set minimum date to today to prevent past dates (use local date, not UTC)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  startDateInput.setAttribute('min', today);
  endDateInput.setAttribute('min', today);
  
  // Setup event listeners to update hidden datetime fields
  const startTimeSelect = document.getElementById('startTimeSelect');
  const endTimeSelect = document.getElementById('endTimeSelect');
  
  startDateInput.addEventListener('change', () => {
    updateDateTimeField('start');
    validateStartTimeNotPast();
    // Update end date minimum to be at least the start date
    if (startDateInput.value) {
      endDateInput.setAttribute('min', startDateInput.value);
      // If end date is before start date, clear it
      if (endDateInput.value && endDateInput.value < startDateInput.value) {
        endDateInput.value = '';
        endTimeSelect.value = '';
        updateDateTimeField('end');
      }
    }
  });
  
  startTimeSelect.addEventListener('change', () => {
    updateDateTimeField('start');
    validateStartTimeNotPast();
    validateEndTimeAfterStart();
  });
  
  endDateInput.addEventListener('change', () => {
    updateDateTimeField('end');
    validateEndTimeAfterStart();
  });
  
  endTimeSelect.addEventListener('change', () => {
    updateDateTimeField('end');
    validateEndTimeAfterStart();
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

// Function to round to 30-minute increments and set seconds to 00
function roundTo30Minutes(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed.includes('T')) return trimmed;
  
  // Parse the datetime value
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return trimmed;
  
  // Round minutes to nearest 30-minute increment
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 30) * 30;
  
  // Set the rounded minutes and seconds to 00
  date.setMinutes(roundedMinutes, 0);
  date.setSeconds(0, 0);
  
  // Format back to datetime-local format (YYYY-MM-DDTHH:mm)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

// Function to normalize datetime value (ensures seconds are 00 and rounds to 30 minutes)
function normalizeDateTimeValue(value) {
  if (!value) return '';
  const trimmed = value.trim();
  // Round to 30 minutes and ensure seconds are 00
  return roundTo30Minutes(trimmed);
}

function setupForm() {
  const form = document.getElementById('reservationForm');
  
  // Simple form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Update hidden fields before submission
    updateDateTimeField('start');
    updateDateTimeField('end');
    
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const resultDiv = document.getElementById('formResult');
    
    // Get date and time values directly from inputs
    const startDateValue = document.getElementById('startDate').value;
    const startTimeValue = document.getElementById('startTimeSelect').value;
    const endDateValue = document.getElementById('endDate').value;
    const endTimeValue = document.getElementById('endTimeSelect').value;
    
    // Validation - check if values exist
    if (!startDateValue || !startTimeValue) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a complete start date and time.</p>';
      if (!startDateValue) {
        document.getElementById('startDate').focus();
      } else {
        document.getElementById('startTimeSelect').focus();
      }
      return;
    }
    
    if (!endDateValue || !endTimeValue) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a complete end date and time.</p>';
      if (!endDateValue) {
        document.getElementById('endDate').focus();
      } else {
        document.getElementById('endTimeSelect').focus();
      }
      return;
    }
    
    // Get user_id from hidden field
    const userId = document.getElementById('userId').value;
    if (!userId) {
      resultDiv.innerHTML = '<p style="color: red;">Error: User ID is required</p>';
      return;
    }
    
    // Convert directly to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
    // This avoids timezone conversion issues by using the exact values selected
    const startt = `${startDateValue} ${startTimeValue}:00`;
    const endt = `${endDateValue} ${endTimeValue}:00`;
    
    // Validate the datetime strings are valid by creating Date objects
    const startDate = new Date(startt.replace(' ', 'T'));
    const endDate = new Date(endt.replace(' ', 'T'));
    
    if (isNaN(startDate.getTime())) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Invalid start time. Please select a valid date and time.</p>';
      document.getElementById('startDate').focus();
      return;
    }
    
    if (isNaN(endDate.getTime())) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Invalid end time. Please select a valid date and time.</p>';
      document.getElementById('endDate').focus();
      return;
    }
    
    // Validate that start time is not in the past
    const now = new Date();
    if (startDate < now) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Start time cannot be in the past. Please select a future date and time.</p>';
      document.getElementById('startDate').focus();
      return;
    }
    
    // Validate that end time is after start time (allows same day with later time)
    if (endDate <= startDate) {
      resultDiv.innerHTML = '<p style="color: red;">Error: End time must be after start time. Please select a later end time.</p>';
      // Focus on the appropriate field
      if (endDateValue === startDateValue) {
        // Same day, so focus on end time
        document.getElementById('endTimeSelect').focus();
      } else {
        document.getElementById('endDate').focus();
      }
      return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const reservationId = document.getElementById('reservationId').value;
    const chargerId = parseInt(formData.get('charger_id'));
    
    // Validate charger is selected
    if (!chargerId) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a charger.</p>';
      document.getElementById('chargerId').focus();
      return;
    }
    
    // Check for scheduling conflicts
    const conflictCheck = await checkSchedulingConflict(chargerId, startDate, endDate, reservationId || null);
    if (conflictCheck.hasConflict) {
      const conflict = conflictCheck.conflictingReservation;
      const conflictStart = new Date(conflict.startt.replace(' ', 'T'));
      const conflictEnd = new Date(conflict.endt.replace(' ', 'T'));
      const conflictStartStr = conflictStart.toLocaleString();
      const conflictEndStr = conflictEnd.toLocaleString();
      resultDiv.innerHTML = `<p style="color: red;">Error: Scheduling conflict detected. This charger is already reserved from ${conflictStartStr} to ${conflictEndStr}. Please select a different time slot.</p>`;
      document.getElementById('startDate').focus();
      return;
    }
    
    // Get status: use admin's selection if admin, otherwise use 'Reserved' for new or preserve existing for edits
    let status = 'Reserved';
    const role = localStorage.getItem("userRole");
    if (role === "admin") {
      const statusSelect = document.getElementById('statusSelect');
      status = statusSelect ? statusSelect.value || 'Reserved' : 'Reserved';
    } else if (reservationId) {
      // For non-admin edits, preserve existing status
      const existingReservation = await getReservation(reservationId);
      status = existingReservation.status;
    }
    
    const data = {
      user_id: parseInt(userId),
      charger_id: parseInt(formData.get('charger_id')),
      startt: startt,
      endt: endt,
      status: status
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
      
      // Reset date and time inputs
      document.getElementById('startDate').value = '';
      document.getElementById('startTimeSelect').value = '';
      document.getElementById('endDate').value = '';
      document.getElementById('endTimeSelect').value = '';
      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      
      // Repopulate time selects
      populateTimeSelects();
      
      // Reset user ID based on role
      const role = localStorage.getItem("userRole");
      const userIdFromStorage = localStorage.getItem("userId");
      if (role !== "admin") {
        document.getElementById('userId').value = userIdFromStorage;
      } else {
        // Reset status selector for admins
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
          statusSelect.value = 'Reserved';
        }
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
    
    // Add Actions column for admins
    const isAdmin = role === "admin";
    let html = '<table><tr><th>Reservation ID</th><th>User ID</th><th>Charger ID</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Has Session</th>';
    if (isAdmin) {
      html += '<th>Actions</th>';
    }
    html += '</tr>';
    reservations.forEach(res => {
      html += `<tr>
        <td>${res.res_id}</td>
        <td>${res.user_id}</td>
        <td>${res.charger_id}</td>
        <td>${formatDateTime(res.startt)}</td>
        <td>${formatDateTime(res.endt)}</td>
        <td>${res.status}</td>
        <td>${res.has_session ? 'Yes' : 'No'}</td>`;
      if (isAdmin) {
        html += `<td>
          <button onclick="editReservation(${res.res_id})">Edit</button>
          <button onclick="cancelReservation(${res.res_id}, '${res.status}')">Cancel</button>
          <button onclick="deleteReservationConfirm(${res.res_id})">Delete</button>
        </td>`;
      }
      html += '</tr>';
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
    
    // Convert MySQL datetime to datetime-local format (round to 30 minutes, set seconds to 00)
    const startLocal = mysqlToDatetimeLocal(reservation.startt);
    const endLocal = mysqlToDatetimeLocal(reservation.endt);
    
    // Round to 30 minutes and split into date and time
    const startRounded = roundTo30Minutes(startLocal);
    const endRounded = roundTo30Minutes(endLocal);
    
    const startSplit = splitDateTime(startRounded);
    const endSplit = splitDateTime(endRounded);
    
    // Populate date and time inputs
    document.getElementById('startDate').value = startSplit.date;
    document.getElementById('startTimeSelect').value = startSplit.time;
    document.getElementById('endDate').value = endSplit.date;
    document.getElementById('endTimeSelect').value = endSplit.time;
    
    // Update hidden fields
    updateDateTimeField('start');
    updateDateTimeField('end');
    
    // If admin, populate status selector
    if (role === "admin") {
      const statusSelect = document.getElementById('statusSelect');
      if (statusSelect) {
        statusSelect.value = reservation.status;
      }
    }
    
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
  
  // Reset date and time inputs
  document.getElementById('startDate').value = '';
  document.getElementById('startTimeSelect').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('endTimeSelect').value = '';
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
  
  // Repopulate time selects
  populateTimeSelects();
  
  // Reset user ID based on role
  if (role === "admin") {
    document.getElementById('userId').value = '';
    document.getElementById('userSelectContainer').style.display = 'block';
    document.getElementById('userInfoDisplay').style.display = 'none';
    document.getElementById('statusSelectContainer').style.display = 'block';
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
      statusSelect.value = 'Reserved';
    }
    loadUsers();
  } else {
    document.getElementById('userId').value = userId;
    document.getElementById('userSelectContainer').style.display = 'none';
    document.getElementById('statusSelectContainer').style.display = 'none';
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

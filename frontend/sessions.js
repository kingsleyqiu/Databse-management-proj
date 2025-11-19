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

// Charging sessions functionality
document.addEventListener('DOMContentLoaded', async () => {
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
    calculateEnergyAndCost();
  });
  
  startTimeSelect.addEventListener('change', () => {
    updateDateTimeField('start');
    validateStartTimeNotPast();
    validateEndTimeAfterStart();
    calculateEnergyAndCost();
  });
  
  endDateInput.addEventListener('change', () => {
    updateDateTimeField('end');
    validateEndTimeAfterStart();
    calculateEnergyAndCost();
  });
  
  endTimeSelect.addEventListener('change', () => {
    updateDateTimeField('end');
    validateEndTimeAfterStart();
    calculateEnergyAndCost();
  });
  
  // Load reservations for linking
  await loadReservations();
  
  // Setup reservation selection handler
  const reservationSelect = document.getElementById('reservationSelect');
  reservationSelect.addEventListener('change', async (e) => {
    const resId = e.target.value;
    if (resId) {
      await populateFromReservation(resId);
      // Calculate energy and cost after populating from reservation
      setTimeout(() => calculateEnergyAndCost(), 100);
    } else {
      // Clear reservation-linked fields
      document.getElementById('resId').value = '';
      calculateEnergyAndCost();
    }
  });
  
  loadSessionDetails();
  loadAllSessions();
  setupForm();
  loadChargers();
});

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

async function loadReservations() {
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    // Get future reservations with details
    const futureReservations = await getView('future-res-details');
    const allReservations = await getReservations();
    
    // Filter by user_id if not admin
    let availableReservations = [];
    if (role !== "admin" && userId) {
      const userReservationIds = new Set(
        allReservations
          .filter(r => r.user_id == userId && r.status === 'Reserved')
          .map(r => r.res_id)
      );
      availableReservations = futureReservations.filter(res => 
        userReservationIds.has(res.res_id) && 
        res.status === 'Reserved'
      );
    } else {
      // Admin can see all reserved reservations
      availableReservations = futureReservations.filter(res => res.status === 'Reserved');
    }
    
    const select = document.getElementById('reservationSelect');
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Add reservations
    availableReservations.forEach(res => {
      const option = document.createElement('option');
      option.value = res.res_id;
      const startDate = new Date(res.startt);
      const endDate = new Date(res.endt);
      option.textContent = `Reservation #${res.res_id} - ${res.station_name || 'N/A'} - ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} to ${endDate.toLocaleTimeString()}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading reservations:', error);
  }
}

async function populateFromReservation(resId) {
  try {
    const reservation = await getReservation(resId);
    if (!reservation) return;
    
    // Set reservation ID
    document.getElementById('resId').value = resId;
    
    // Set user ID
    document.getElementById('userId').value = reservation.user_id;
    const role = localStorage.getItem("userRole");
    if (role === "admin") {
      const userSelect = document.getElementById('userSelect');
      if (userSelect) {
        userSelect.value = reservation.user_id;
      }
    }
    
    // Set charger ID
    document.getElementById('chargerId').value = reservation.charger_id;
    
    // Set start and end times from reservation
    const startLocal = mysqlToDatetimeLocal(reservation.startt);
    const endLocal = mysqlToDatetimeLocal(reservation.endt);
    
    const startRounded = roundTo30Minutes(startLocal);
    const endRounded = roundTo30Minutes(endLocal);
    
    const startSplit = splitDateTime(startRounded);
    const endSplit = splitDateTime(endRounded);
    
    document.getElementById('startDate').value = startSplit.date;
    document.getElementById('startTimeSelect').value = startSplit.time;
    document.getElementById('endDate').value = endSplit.date;
    document.getElementById('endTimeSelect').value = endSplit.time;
    
    // Update hidden fields
    updateDateTimeField('start');
    updateDateTimeField('end');
  } catch (error) {
    console.error('Error populating from reservation:', error);
    alert('Error loading reservation details: ' + error.message);
  }
}

// Store charger data for calculations
let chargerDataMap = {};

async function loadChargers() {
  try {
    // Get charger details from user-compatible view (has charging_speed_kw and station info)
    // We'll use session-details to get charger info, or create a mapping
    const resources = await getView('resources');
    const chargers = resources.filter(r => r.resource_type === 'Charger' && r.status === 'Available');
    
    // Also get charger details from user-compatible view to get charging_speed_kw
    let chargerDetails = [];
    try {
      chargerDetails = await getView('user-compatible');
    } catch (error) {
      console.warn('Could not load charger details from user-compatible view:', error);
    }
    
    const select = document.getElementById('chargerId');
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Clear charger data map
    chargerDataMap = {};
    
    chargers.forEach(charger => {
      const option = document.createElement('option');
      option.value = charger.resource_id;
      option.textContent = charger.label;
      select.appendChild(option);
      
      // Try to find charger details
      const detail = chargerDetails.find(c => c.charger_id == charger.resource_id);
      if (detail) {
        chargerDataMap[charger.resource_id] = {
          charging_speed_kw: parseFloat(detail.charging_speed_kw) || 0,
          station_id: detail.station_id || null,
          station_name: detail.station_name || null
        };
      } else {
        // Parse from label if available (format: "Station X - Type YkW")
        const match = charger.label.match(/(\d+(?:\.\d+)?)\s*kW/i);
        if (match) {
          chargerDataMap[charger.resource_id] = {
            charging_speed_kw: parseFloat(match[1]) || 0,
            station_id: null,
            station_name: null
          };
        }
      }
    });
    
    // If no available chargers, try getting all stations and chargers
    if (chargers.length === 0) {
      const stations = await getStations();
      stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.id;
        option.textContent = `${station.name} - Station ID: ${station.id}`;
        select.appendChild(option);
      });
    }
    
    // Add event listener for charger selection to trigger calculation
    select.addEventListener('change', () => {
      calculateEnergyAndCost();
    });
  } catch (error) {
    console.error('Error loading chargers:', error);
  }
}

// Function to get charger information
async function getChargerInfo(chargerId) {
  if (!chargerId) return null;
  
  // Check if we have it cached
  if (chargerDataMap[chargerId]) {
    return chargerDataMap[chargerId];
  }
  
  // Try to get from user-compatible view
  try {
    const chargerDetails = await getView('user-compatible');
    const detail = chargerDetails.find(c => c.charger_id == chargerId);
    if (detail) {
      const info = {
        charging_speed_kw: parseFloat(detail.charging_speed_kw) || 0,
        station_id: detail.station_id || null,
        station_name: detail.station_name || null
      };
      chargerDataMap[chargerId] = info;
      return info;
    }
  } catch (error) {
    console.error('Error getting charger info:', error);
  }
  
  return null;
}

// Function to get pricing for a station
async function getStationPricing(stationId) {
  if (!stationId) return null;
  
  try {
    const pricing = await getView('pricing-full');
    const stationPricing = pricing.find(p => p.station_id == stationId);
    if (stationPricing) {
      return {
        rate: parseFloat(stationPricing.rate) || 0,
        stall_time: parseFloat(stationPricing.stall_time) || 0
      };
    }
  } catch (error) {
    console.error('Error getting station pricing:', error);
  }
  
  return null;
}

// Function to calculate energy and cost
async function calculateEnergyAndCost() {
  const chargerId = document.getElementById('chargerId').value;
  const startDateValue = document.getElementById('startDate').value;
  const startTimeValue = document.getElementById('startTimeSelect').value;
  const endDateValue = document.getElementById('endDate').value;
  const endTimeValue = document.getElementById('endTimeSelect').value;
  
  const energyInput = document.getElementById('energyDelivered');
  const costInput = document.getElementById('cost');
  
  // Reset values
  energyInput.value = '';
  costInput.value = '';
  
  // Check if we have all required fields
  if (!chargerId || !startDateValue || !startTimeValue || !endDateValue || !endTimeValue) {
    return;
  }
  
  // Validate dates
  const startDateTime = new Date(`${startDateValue}T${startTimeValue}:00`);
  const endDateTime = new Date(`${endDateValue}T${endTimeValue}:00`);
  
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    return;
  }
  
  if (endDateTime <= startDateTime) {
    return;
  }
  
  try {
    // Get charger info
    const chargerInfo = await getChargerInfo(chargerId);
    if (!chargerInfo || !chargerInfo.charging_speed_kw) {
      energyInput.value = '';
      costInput.value = '';
      return;
    }
    
    // Calculate time difference in hours
    const timeDiffMs = endDateTime - startDateTime;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    // Calculate energy delivered (kWh) = time (hours) × charging speed (kW)
    const energyDelivered = timeDiffHours * chargerInfo.charging_speed_kw;
    
    // Get pricing if we have station_id
    let cost = 0;
    if (chargerInfo.station_id) {
      const pricing = await getStationPricing(chargerInfo.station_id);
      if (pricing) {
        // Cost = (energy × rate per kWh) + (time × stall_time per hour)
        cost = (energyDelivered * pricing.rate) + (timeDiffHours * pricing.stall_time);
      } else {
        // If no pricing found, use a default rate of $0.40 per kWh
        cost = energyDelivered * 0.40;
      }
    } else {
      // If no station_id, use default rate
      cost = energyDelivered * 0.40;
    }
    
    // Update fields
    energyInput.value = energyDelivered.toFixed(2);
    costInput.value = cost.toFixed(2);
  } catch (error) {
    console.error('Error calculating energy and cost:', error);
    energyInput.value = '';
    costInput.value = '';
  }
}

function setupForm() {
  const form = document.getElementById('sessionForm');
  
  // Simple form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Update hidden fields before submission
    updateDateTimeField('start');
    updateDateTimeField('end');
    
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
    const sessionId = document.getElementById('sessionId').value;
    const chargerId = parseInt(formData.get('charger_id'));
    
    // Validate charger is selected
    if (!chargerId) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Please select a charger.</p>';
      document.getElementById('chargerId').focus();
      return;
    }
    
    // Get calculated energy and cost values (from read-only fields)
    const energyInput = document.getElementById('energyDelivered');
    const costInput = document.getElementById('cost');
    const energy = parseFloat(energyInput.value);
    const cost = parseFloat(costInput.value);
    
    // Validate that energy and cost have been calculated
    if (isNaN(energy) || energy <= 0) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Energy and cost must be calculated. Please ensure charger, start time, and end time are all selected.</p>';
      if (!chargerId) {
        document.getElementById('chargerId').focus();
      } else if (!startDateValue || !startTimeValue) {
        document.getElementById('startDate').focus();
      } else {
        document.getElementById('endDate').focus();
      }
      return;
    }
    
    if (isNaN(cost) || cost < 0) {
      resultDiv.innerHTML = '<p style="color: red;">Error: Cost calculation failed. Please check that all fields are properly filled.</p>';
      return;
    }
    
    // Get reservation ID if linked
    const resId = document.getElementById('resId').value || null;
    
    // If linked to reservation, validate that session times are within reservation window
    if (resId) {
      try {
        const reservation = await getReservation(resId);
        const resStart = new Date(reservation.startt.replace(' ', 'T'));
        const resEnd = new Date(reservation.endt.replace(' ', 'T'));
        
        // Allow session to start slightly before reservation (5 minutes buffer) and end slightly after
        const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (startDate < resStart - buffer || endDate > resEnd + buffer) {
          resultDiv.innerHTML = '<p style="color: red;">Error: Session times must be within the reservation window. Please adjust the times or unlink from reservation.</p>';
          document.getElementById('startDate').focus();
          return;
        }
      } catch (error) {
        console.error('Error validating reservation link:', error);
        // Continue if we can't validate, but warn user
        if (!confirm('Warning: Could not validate reservation link. Continue anyway?')) {
          return;
        }
      }
    }
    
    const data = {
      user_id: parseInt(userId),
      charger_id: chargerId,
      res_id: resId ? parseInt(resId) : null,
      startt: startt,
      endt: endt,
      energy_delivered_kwh: energy,
      cost: cost,
      payment_stat: 'Paid'
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
      
      // If session is linked to a reservation, check if reservation should be marked as Completed
      if (resId) {
        try {
          const reservation = await getReservation(resId);
          const now = new Date();
          const resEnd = new Date(reservation.endt.replace(' ', 'T'));
          
          // If reservation end time has passed and status is still "Reserved", mark as "Completed"
          if (resEnd < now && reservation.status === 'Reserved') {
            await updateReservation(resId, {
              ...reservation,
              status: 'Completed'
            });
            console.log(`Reservation ${resId} marked as Completed after session creation`);
          }
        } catch (error) {
          console.error('Error updating reservation status:', error);
          // Don't fail the session creation if reservation update fails
        }
      }
      
      form.reset();
      document.getElementById('sessionId').value = '';
      document.getElementById('submitBtn').textContent = 'Start Session';
      document.getElementById('cancelBtn').style.display = 'none';
      
      // Reset date and time inputs
      document.getElementById('startDate').value = '';
      document.getElementById('startTimeSelect').value = '';
      document.getElementById('endDate').value = '';
      document.getElementById('endTimeSelect').value = '';
      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      document.getElementById('resId').value = '';
      document.getElementById('reservationSelect').value = '';
      
      // Repopulate time selects
      populateTimeSelects();
      
      // Reset user ID based on role
      const role = localStorage.getItem("userRole");
      const userIdFromStorage = localStorage.getItem("userId");
      if (role !== "admin") {
        document.getElementById('userId').value = userIdFromStorage;
      } else {
        document.getElementById('userId').value = '';
      }
      
      // Reload reservations in case status changed (especially if we marked one as Completed)
      if (resId) {
        await loadReservations();
      }
      await loadSessionDetails();
      await loadAllSessions();
      await loadSessionCostRate();
      
      setTimeout(() => {
        resultDiv.innerHTML = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving session:', error);
      resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  });
}

async function loadSessionDetails() {
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    const sessions = await getView('session-details');
    
    // Filter by user_id if not admin
    let filteredSessions = sessions;
    if (role !== "admin" && userId) {
      filteredSessions = sessions.filter(s => s.user_id == userId);
    }
    
    // Sort by start time (most recent first) and get the 10 most recent
    filteredSessions = filteredSessions
      .sort((a, b) => new Date(b.startt) - new Date(a.startt))
      .slice(0, 10);
    
    const container = document.getElementById('sessionDetails');
    
    if (filteredSessions.length === 0) {
      container.innerHTML = '<p>No charging sessions found</p>';
      return;
    }
    
    let html = '<table><tr><th>Session ID</th><th>User</th><th>Car</th><th>Station</th><th>Charger</th><th>Reservation ID</th><th>Start Time</th><th>End Time</th><th>Energy (kWh)</th><th>Cost</th><th>Payment Status</th><th>Actions</th></tr>';
    filteredSessions.forEach(session => {
      html += `<tr>
        <td>${session.session_id}</td>
        <td>${session.fname || ''} ${session.lname || ''}</td>
        <td>${session.make || 'N/A'} ${session.model || ''}</td>
        <td>${session.station_name || 'N/A'}</td>
        <td>${session.connector_type || 'N/A'} ${session.charging_speed_kw || ''}kW</td>
        <td>${session.res_id || 'N/A'}</td>
        <td>${formatDateTime(session.startt)}</td>
        <td>${formatDateTime(session.endt)}</td>
        <td>${parseFloat(session.energy_delivered_kwh || 0).toFixed(2)}</td>
        <td>$${parseFloat(session.cost || 0).toFixed(2)}</td>
        <td>${session.payment_stat || 'N/A'}</td>
        <td>`;
      
      // Show edit/delete buttons based on role
      if (role === "admin" || (userId && session.user_id == userId)) {
        html += `<button onclick="editSession(${session.session_id})">Edit</button>`;
        if (role === "admin") {
          html += ` <button onclick="deleteSessionConfirm(${session.session_id})">Delete</button>`;
        }
      } else {
        html += '<span style="color: gray;">No actions</span>';
      }
      
      html += `</td></tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading session details:', error);
    document.getElementById('sessionDetails').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function loadAllSessions() {
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    const sessions = await getView('session-details');
    
    // Filter by user_id if not admin
    let filteredSessions = sessions;
    if (role !== "admin" && userId) {
      filteredSessions = sessions.filter(s => s.user_id == userId);
    }
    
    // Sort by start time (most recent first)
    filteredSessions = filteredSessions.sort((a, b) => new Date(b.startt) - new Date(a.startt));
    
    const container = document.getElementById('allSessions');
    
    if (filteredSessions.length === 0) {
      container.innerHTML = '<p>No charging sessions found</p>';
      return;
    }
    
    const isAdmin = role === "admin";
    let html = '<table><tr><th>Session ID</th><th>User</th><th>Car</th><th>Station</th><th>Charger</th><th>Reservation ID</th><th>Start Time</th><th>End Time</th><th>Energy (kWh)</th><th>Cost</th><th>Payment Status</th>';
    if (isAdmin) {
      html += '<th>Actions</th>';
    }
    html += '</tr>';
    
    filteredSessions.forEach(session => {
      html += `<tr>
        <td>${session.session_id}</td>
        <td>${session.fname || ''} ${session.lname || ''}</td>
        <td>${session.make || 'N/A'} ${session.model || ''}</td>
        <td>${session.station_name || 'N/A'}</td>
        <td>${session.connector_type || 'N/A'} ${session.charging_speed_kw || ''}kW</td>
        <td>${session.res_id || 'N/A'}</td>
        <td>${formatDateTime(session.startt)}</td>
        <td>${formatDateTime(session.endt)}</td>
        <td>${parseFloat(session.energy_delivered_kwh || 0).toFixed(2)}</td>
        <td>$${parseFloat(session.cost || 0).toFixed(2)}</td>
        <td>${session.payment_stat || 'N/A'}</td>`;
      
      if (isAdmin) {
        html += `<td>
          <button onclick="editSession(${session.session_id})">Edit</button>
          <button onclick="deleteSessionConfirm(${session.session_id})">Delete</button>
        </td>`;
      }
      
      html += '</tr>';
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading all sessions:', error);
    document.getElementById('allSessions').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function loadSessionCostRate() {
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    const sessions = await getView('session-cost-rate');
    
    // Filter by user_id if not admin
    let filteredSessions = sessions;
    if (role !== "admin" && userId) {
      // Need to match by user_id from session-details since session-cost-rate might not have user_id
      const sessionDetails = await getView('session-details');
      const userSessionIds = new Set(
        sessionDetails
          .filter(s => s.user_id == userId)
          .map(s => s.session_id)
      );
      filteredSessions = sessions.filter(s => userSessionIds.has(s.session_id));
    }
    
    const container = document.getElementById('sessionCostRate');
    
    if (filteredSessions.length === 0) {
      container.innerHTML = '<p>No session cost/rate data found</p>';
      return;
    }
    
    let html = '<table><tr><th>Session ID</th><th>Station Name</th><th>Posted Rate (per kWh)</th><th>Effective Rate (per kWh)</th><th>Energy (kWh)</th><th>Cost</th></tr>';
    filteredSessions.forEach(session => {
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
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const session = await getSession(id);
    
    // Security check: non-admin users can only edit their own sessions
    if (role !== "admin" && session.user_id != userId) {
      alert('You can only edit your own sessions.');
      return;
    }
    
    const form = document.getElementById('sessionForm');
    
    // Populate form with session data
    document.getElementById('sessionId').value = session.session_id;
    document.getElementById('userId').value = session.user_id;
    
    // If admin, also update the user select dropdown
    if (role === "admin") {
      const userSelect = document.getElementById('userSelect');
      if (userSelect) {
        userSelect.value = session.user_id;
      }
    }
    
    document.getElementById('chargerId').value = session.charger_id;
    
    // Set reservation if linked
    if (session.res_id) {
      document.getElementById('resId').value = session.res_id;
      const reservationSelect = document.getElementById('reservationSelect');
      if (reservationSelect) {
        reservationSelect.value = session.res_id;
      }
    } else {
      document.getElementById('resId').value = '';
      const reservationSelect = document.getElementById('reservationSelect');
      if (reservationSelect) {
        reservationSelect.value = '';
      }
    }
    
    // Convert MySQL datetime to datetime-local format (round to 30 minutes, set seconds to 00)
    const startLocal = mysqlToDatetimeLocal(session.startt);
    const endLocal = mysqlToDatetimeLocal(session.endt);
    
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
    
    // Set energy and cost (these are read-only, but we populate them for editing)
    document.getElementById('energyDelivered').value = parseFloat(session.energy_delivered_kwh || 0).toFixed(2);
    document.getElementById('cost').value = parseFloat(session.cost || 0).toFixed(2);
    
    // Recalculate when charger or times change (in case they're edited)
    calculateEnergyAndCost();
    
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

function cancelEdit() {
  const form = document.getElementById('sessionForm');
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  
  form.reset();
  document.getElementById('sessionId').value = '';
  document.getElementById('submitBtn').textContent = 'Create Session';
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formResult').innerHTML = '';
  
  // Reset date and time inputs
  document.getElementById('startDate').value = '';
  document.getElementById('startTimeSelect').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('endTimeSelect').value = '';
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
  document.getElementById('resId').value = '';
  document.getElementById('reservationSelect').value = '';
  
  // Repopulate time selects
  populateTimeSelects();
  
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
  loadReservations();
}

async function deleteSessionConfirm(id) {
  if (!confirm('Are you sure you want to delete this charging session? This action cannot be undone.')) {
    return;
  }
  
  try {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    // Security check: non-admin users can only delete their own sessions
    if (role !== "admin") {
      const session = await getSession(id);
      if (session.user_id != userId) {
        alert('You can only delete your own sessions.');
        return;
      }
    }
    
    await deleteSession(id);
    alert('Session deleted successfully!');
    await loadSessionDetails();
    await loadAllSessions();
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

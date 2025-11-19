// ---------------------- AUTH CHECK ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");

  // If NOT logged in → send back to login
  if (!role || !userId) {
    alert("You must log in first.");
    window.location.href = "index.html";
    return;
  }

  // Show user info
  document.getElementById("userInfo").innerHTML =
    `<p>Logged in as <b>${role}</b> (User ID: ${userId})</p>`;

  // Check and expire reservations that have passed their end time
  const expiredCount = await checkAndExpireReservations();
  
  // Show appropriate dashboard based on role
  if (role === "admin") {
    document.getElementById("adminDashboard").style.display = "block";
    document.getElementById("userDashboard").style.display = "none";
    // Load admin dashboard data
    loadStats();
    loadRecentStations();
    loadStationUtilization();
    loadChargerStatusSummary();
  } else {
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("userDashboard").style.display = "block";
    // Load user dashboard data
    loadUserProfile();
    loadUserStats();
    loadUserUpcomingReservations();
    loadUserRecentSessions();
    loadAvailableStations();
  }
});

// Function to check and expire reservations that have passed their end time
async function checkAndExpireReservations() {
  try {
    const now = new Date();
    const allReservations = await getReservations();
    
    // Find reservations that should be expired (end time has passed, status is still Reserved)
    const expiredReservations = allReservations.filter(res => {
      if (res.status !== 'Reserved') return false; // Only check Reserved reservations
      
      const endDate = new Date(res.endt.replace(' ', 'T'));
      return endDate < now; // End time has passed
    });
    
    // Update each expired reservation
    for (const reservation of expiredReservations) {
      try {
        await updateReservation(reservation.res_id, {
          ...reservation,
          status: 'Expired'
        });
        console.log(`Reservation ${reservation.res_id} has been expired`);
      } catch (error) {
        console.error(`Error expiring reservation ${reservation.res_id}:`, error);
      }
    }
    
    // Return the count of expired reservations so caller can decide whether to reload
    return expiredReservations.length;
  } catch (error) {
    console.error('Error checking and expiring reservations:', error);
    // Don't show error to user, just log it
    return 0;
  }
}

async function loadStats() {
  try {
    // Get total stations and active stations
    const stations = await getStations();
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status === 'Active').length;
    
    document.getElementById('totalStations').textContent = totalStations;
    document.getElementById('activeStations').textContent = activeStations;
    
    // Get available chargers from charger-status view
    try {
      const chargerStatus = await getView('charger-status');
      // Sum up all available chargers from all stations
      const availableChargers = chargerStatus.reduce((sum, station) => {
        return sum + (parseInt(station.available) || 0);
      }, 0);
      document.getElementById('availableChargers').textContent = availableChargers;
    } catch (error) {
      console.error('Error loading charger status:', error);
      // Fallback: try resources view
      try {
        const resources = await getView('resources');
        const availableChargers = resources.filter(r => r.resource_type === 'Charger' && r.status === 'Available').length;
        document.getElementById('availableChargers').textContent = availableChargers || 0;
      } catch (err) {
        document.getElementById('availableChargers').textContent = 'N/A';
      }
    }
    
    // Get total sessions and revenue from session-details view
    try {
      const sessionDetails = await getView('session-details');
      const totalSessions = sessionDetails.length;
      const totalRevenue = sessionDetails.reduce((sum, session) => {
        return sum + (parseFloat(session.cost) || 0);
      }, 0);
      document.getElementById('totalSessions').textContent = totalSessions;
      document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    } catch (error) {
      console.error('Error loading session details:', error);
      document.getElementById('totalSessions').textContent = 'N/A';
      document.getElementById('totalRevenue').textContent = 'N/A';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    const errorMsg = error.message || 'Error loading data';
    document.getElementById('totalStations').textContent = errorMsg.includes('Access denied') ? 'DB Error' : 'Error';
    document.getElementById('activeStations').textContent = errorMsg.includes('Access denied') ? 'DB Error' : 'Error';
    document.getElementById('availableChargers').textContent = errorMsg.includes('Access denied') ? 'DB Error' : 'Error';
    document.getElementById('totalSessions').textContent = errorMsg.includes('Access denied') ? 'DB Error' : 'Error';
    document.getElementById('totalRevenue').textContent = errorMsg.includes('Access denied') ? 'DB Error' : 'Error';
    
    // Show error message
    if (errorMsg.includes('Access denied')) {
      alert('Database connection error: Please check your .env file credentials. Error: ' + errorMsg);
    }
  }
}

async function loadRecentStations() {
  try {
    const stations = await getStations();
    const recentStations = stations.slice(0, 5); // Get first 5 stations
    
    const container = document.getElementById('recentStations');
    if (recentStations.length === 0) {
      container.innerHTML = '<p>No stations found</p>';
      return;
    }
    
    let html = '<table><tr><th>ID</th><th>Name</th><th>Operator</th><th>Status</th><th>Address</th></tr>';
    recentStations.forEach(station => {
      html += `<tr>
        <td>${station.id}</td>
        <td>${station.name}</td>
        <td>${station.operator || 'N/A'}</td>
        <td>${station.status}</td>
        <td>${station.address}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading recent stations:', error);
    const errorMsg = error.message || 'Error loading stations';
    document.getElementById('recentStations').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

async function loadStationUtilization() {
  try {
    const utilization = await getView('station-util');
    const container = document.getElementById('stationUtilization');
    
    if (utilization.length === 0) {
      container.innerHTML = '<p>No utilization data found</p>';
      return;
    }
    
    let html = '<table><tr><th>Station ID</th><th>Station Name</th><th>Sessions</th><th>Total kWh</th><th>Avg kWh</th></tr>';
    utilization.forEach(station => {
      html += `<tr>
        <td>${station.station_id}</td>
        <td>${station.name}</td>
        <td>${station.sessions || 0}</td>
        <td>${parseFloat(station.total_kwh || 0).toFixed(2)}</td>
        <td>${parseFloat(station.avg_kwh || 0).toFixed(2)}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading station utilization:', error);
    const errorMsg = error.message || 'Error loading utilization data';
    document.getElementById('stationUtilization').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

async function loadChargerStatusSummary() {
  try {
    const chargerStatus = await getView('charger-status');
    const container = document.getElementById('chargerStatusSummary');
    
    if (chargerStatus.length === 0) {
      container.innerHTML = '<p>No charger status data found</p>';
      return;
    }
    
    let html = '<table><tr><th>Station ID</th><th>Station Name</th><th>Available</th><th>In Use</th><th>Reserved</th><th>Out of Order</th></tr>';
    chargerStatus.forEach(station => {
      html += `<tr>
        <td>${station.station_id}</td>
        <td>${station.name}</td>
        <td>${station.available || 0}</td>
        <td>${station.in_use || 0}</td>
        <td>${station.reserved || 0}</td>
        <td>${station.out_of_order || 0}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading charger status summary:', error);
    const errorMsg = error.message || 'Error loading charger status';
    document.getElementById('chargerStatusSummary').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

// ==================== USER DASHBOARD FUNCTIONS ====================

async function loadUserStats() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Get user's reservations
    const allReservations = await getReservations();
    const userReservations = allReservations.filter(r => r.user_id == userId);
    const totalReservations = userReservations.length;
    
    // Get upcoming reservations (future reservations that are not cancelled or completed)
    const now = new Date();
    const upcomingReservations = userReservations.filter(r => {
      const startDate = new Date(r.startt);
      return startDate > now && r.status !== 'Cancelled' && r.status !== 'Completed';
    });
    
    document.getElementById('totalReservations').textContent = totalReservations;
    document.getElementById('upcomingReservations').textContent = upcomingReservations.length;
    
    // Get user's sessions
    const allSessions = await getSessions();
    const userSessions = allSessions.filter(s => s.user_id == userId);
    const totalSessions = userSessions.length;
    
    // Calculate total spent and energy
    const totalSpent = userSessions.reduce((sum, session) => {
      return sum + (parseFloat(session.cost) || 0);
    }, 0);
    
    const totalEnergy = userSessions.reduce((sum, session) => {
      return sum + (parseFloat(session.energy_delivered_kwh) || 0);
    }, 0);
    
    document.getElementById('userTotalSessions').textContent = totalSessions;
    document.getElementById('totalSpent').textContent = '$' + totalSpent.toFixed(2);
    document.getElementById('totalEnergy').textContent = totalEnergy.toFixed(2) + ' kWh';
  } catch (error) {
    console.error('Error loading user stats:', error);
    const errorMsg = error.message || 'Error loading data';
    document.getElementById('totalReservations').textContent = 'Error';
    document.getElementById('upcomingReservations').textContent = 'Error';
    document.getElementById('userTotalSessions').textContent = 'Error';
    document.getElementById('totalSpent').textContent = 'Error';
    document.getElementById('totalEnergy').textContent = 'Error';
  }
}

async function loadUserUpcomingReservations() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Get future reservations with details
    const futureReservations = await getView('future-res-details');
    const allReservations = await getReservations();
    
    // Filter to get user's reservation IDs
    const userReservationIds = new Set(
      allReservations
        .filter(r => r.user_id == userId)
        .map(r => r.res_id)
    );
    
    // Filter to only include reservations that are not cancelled or completed
    let userFutureReservations = futureReservations.filter(res => 
      userReservationIds.has(res.res_id) && 
      res.status !== 'Cancelled' && 
      res.status !== 'Completed'
    );
    
    // Sort by start time to get the earliest upcoming reservation first
    userFutureReservations.sort((a, b) => {
      const dateA = new Date(a.startt);
      const dateB = new Date(b.startt);
      return dateA - dateB;
    });
    
    const container = document.getElementById('userUpcomingReservations');
    
    if (userFutureReservations.length === 0) {
      container.innerHTML = '<p>No upcoming reservations found</p>';
      return;
    }
    
    // Only show the first (earliest) upcoming reservation
    const firstReservation = userFutureReservations[0];
    
    let html = '<table><tr><th>Reservation ID</th><th>Station</th><th>Connector Type</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th></tr>';
    html += `<tr>
      <td>${firstReservation.res_id}</td>
      <td>${firstReservation.station_name || 'N/A'}</td>
      <td>${firstReservation.connector_type || 'N/A'}</td>
      <td>${formatDateTime(firstReservation.startt)}</td>
      <td>${formatDateTime(firstReservation.endt)}</td>
      <td>${firstReservation.status}</td>
      <td>`;
    
    // Only show Complete button if status is not already Completed
    if (firstReservation.status !== 'Completed') {
      html += `<button onclick="markReservationComplete(${firstReservation.res_id})" class="inline-btn">Mark as Complete</button>`;
    } else {
      html += '<span style="color: green;">Completed</span>';
    }
    
    html += `</td></tr>`;
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading user upcoming reservations:', error);
    const errorMsg = error.message || 'Error loading reservations';
    document.getElementById('userUpcomingReservations').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

// Function to mark a reservation as complete
async function markReservationComplete(reservationId) {
  if (!confirm('Are you sure you want to mark this reservation as complete?')) {
    return;
  }
  
  try {
    // Get the current reservation to preserve other fields
    const reservation = await getReservation(reservationId);
    
    // Update the reservation status to Completed
    await updateReservation(reservationId, {
      ...reservation,
      status: 'Completed'
    });
    
    alert('Reservation marked as complete successfully!');
    
    // Reload all relevant sections to reflect the change
    await loadUserStats(); // Updates the upcoming reservations count
    await loadUserUpcomingReservations(); // Updates the upcoming reservations display
  } catch (error) {
    console.error('Error marking reservation as complete:', error);
    alert('Error marking reservation as complete: ' + error.message);
  }
}

async function loadUserRecentSessions() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Get session details
    const sessionDetails = await getView('session-details');
    const userSessions = sessionDetails
      .filter(s => s.user_id == userId)
      .sort((a, b) => new Date(b.startt) - new Date(a.startt))
      .slice(0, 10); // Get 10 most recent
    
    const container = document.getElementById('userRecentSessions');
    
    if (userSessions.length === 0) {
      container.innerHTML = '<p>No charging sessions found</p>';
      return;
    }
    
    let html = '<table><tr><th>Session ID</th><th>Station</th><th>Start Time</th><th>End Time</th><th>Energy (kWh)</th><th>Cost</th><th>Payment Status</th></tr>';
    userSessions.forEach(session => {
      html += `<tr>
        <td>${session.session_id}</td>
        <td>${session.station_name || 'N/A'}</td>
        <td>${formatDateTime(session.startt)}</td>
        <td>${formatDateTime(session.endt)}</td>
        <td>${parseFloat(session.energy_delivered_kwh || 0).toFixed(2)}</td>
        <td>$${parseFloat(session.cost || 0).toFixed(2)}</td>
        <td>${session.payment_stat || 'N/A'}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading user recent sessions:', error);
    const errorMsg = error.message || 'Error loading sessions';
    document.getElementById('userRecentSessions').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

async function loadAvailableStations() {
  try {
    const stations = await getStations();
    const activeStations = stations.filter(s => s.status === 'Active');
    
    const container = document.getElementById('availableStations');
    
    if (activeStations.length === 0) {
      container.innerHTML = '<p>No available stations found</p>';
      return;
    }
    
    // Get charger status to show available chargers per station
    let chargerStatus = [];
    try {
      chargerStatus = await getView('charger-status');
    } catch (error) {
      console.error('Error loading charger status:', error);
    }
    
    let html = '<table><tr><th>Station ID</th><th>Name</th><th>Operator</th><th>Address</th><th>Available Chargers</th></tr>';
    activeStations.forEach(station => {
      const status = chargerStatus.find(cs => cs.station_id == station.id);
      const available = status ? (status.available || 0) : 'N/A';
      
      html += `<tr>
        <td>${station.id}</td>
        <td>${station.name}</td>
        <td>${station.operator || 'N/A'}</td>
        <td>${station.address}</td>
        <td>${available}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading available stations:', error);
    const errorMsg = error.message || 'Error loading stations';
    document.getElementById('availableStations').innerHTML = `<p>Error: ${errorMsg}</p>`;
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

// ==================== USER PROFILE FUNCTIONS ====================

async function loadUserProfile() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      document.getElementById('userProfileDisplay').innerHTML = 
        `<p style="color: red;">Error: User ID not found. Please log in again.</p>`;
      return;
    }

    console.log('Loading user profile for userId:', userId);
    const userData = await getUser(userId);
    console.log('User data received:', userData);
    displayUserProfile(userData);
    await loadCarsForDropdown();
  } catch (error) {
    console.error('Error loading user profile:', error);
    document.getElementById('userProfileDisplay').innerHTML = 
      `<p style="color: red;">Error loading profile: ${error.message}</p>`;
  }
}

// Store current user data globally for edit function
let currentUserData = null;

// Store cars data globally for make/model filtering
let allCarsData = [];
let carDropdownsInitialized = false;

function displayUserProfile(userData) {
  currentUserData = userData; // Store for edit function
  const container = document.getElementById('userProfileDisplay');
  
  const carInfo = userData.car 
    ? `${userData.car.make} ${userData.car.model} (${userData.car.connector_type})`
    : 'No car selected';
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <p><strong>Name:</strong> ${userData.fname} ${userData.lname}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Phone:</strong> ${userData.phone || 'Not provided'}</p>
      </div>
      <div>
        <p><strong>Car:</strong> ${carInfo}</p>
        <p><strong>User ID:</strong> ${userData.user_id}</p>
      </div>
    </div>
    <button onclick="startEditUserProfile()">Edit Profile</button>
  `;
}

async function startEditUserProfile() {
  if (!currentUserData) {
    // Reload user data if not available
    const userId = localStorage.getItem("userId");
    if (userId) {
      currentUserData = await getUser(userId);
    } else {
      alert('User data not available. Please refresh the page.');
      return;
    }
  }
  
  // Populate edit form
  document.getElementById('editFname').value = currentUserData.fname || '';
  document.getElementById('editLname').value = currentUserData.lname || '';
  document.getElementById('editEmail').value = currentUserData.email || '';
  document.getElementById('editPhone').value = currentUserData.phone || '';
  
  // Load cars for dropdown if not already loaded
  await loadCarsForDropdown();
  
  // If user has a car, set the make and model
  if (currentUserData.car_id && currentUserData.car) {
    const makeSelect = document.getElementById('editCarMake');
    const modelSelect = document.getElementById('editCarModel');
    const connectorTypeInput = document.getElementById('editConnectorType');
    const carIdInput = document.getElementById('editCarId');
    
    makeSelect.value = currentUserData.car.make || '';
    if (currentUserData.car.make) {
      updateModelDropdown(currentUserData.car.make);
      // Wait a moment for model dropdown to populate, then set model
      setTimeout(() => {
        modelSelect.value = currentUserData.car.model || '';
        if (currentUserData.car.model) {
          updateConnectorType(currentUserData.car.make, currentUserData.car.model);
        }
      }, 100);
    }
  } else {
    // Clear car selection
    document.getElementById('editCarMake').value = '';
    document.getElementById('editCarModel').value = '';
    document.getElementById('editConnectorType').value = '';
    document.getElementById('editCarId').value = '';
  }
  
  // Show edit form, hide display
  document.getElementById('userProfileDisplay').style.display = 'none';
  document.getElementById('userProfileEdit').style.display = 'block';
}

async function loadCarsForDropdown() {
  try {
    const cars = await getCars();
    allCarsData = cars; // Store for filtering
    
    const makeSelect = document.getElementById('editCarMake');
    const modelSelect = document.getElementById('editCarModel');
    
    if (!makeSelect || !modelSelect) {
      console.error('Car dropdown elements not found');
      return;
    }
    
    // Clear existing options except the first one
    while (makeSelect.options.length > 1) {
      makeSelect.remove(1);
    }
    while (modelSelect.options.length > 1) {
      modelSelect.remove(1);
    }
    
    // Get unique makes and populate make dropdown
    const uniqueMakes = [...new Set(cars.map(car => car.make))].sort();
    uniqueMakes.forEach(make => {
      const option = document.createElement('option');
      option.value = make;
      option.textContent = make;
      makeSelect.appendChild(option);
    });
    
    // Set up event listeners only once
    if (!carDropdownsInitialized) {
      // Add event listener for make selection
      makeSelect.addEventListener('change', function() {
        updateModelDropdown(this.value);
        // Clear model and connector type when make changes
        const modelSelect = document.getElementById('editCarModel');
        modelSelect.value = '';
        document.getElementById('editConnectorType').value = '';
        document.getElementById('editCarId').value = '';
      });
      
      // Add event listener for model selection
      modelSelect.addEventListener('change', function() {
        const makeSelect = document.getElementById('editCarMake');
        updateConnectorType(makeSelect.value, this.value);
      });
      
      carDropdownsInitialized = true;
    }
    
  } catch (error) {
    console.error('Error loading cars:', error);
  }
}

function updateModelDropdown(selectedMake) {
  const modelSelect = document.getElementById('editCarModel');
  const connectorTypeInput = document.getElementById('editConnectorType');
  const carIdInput = document.getElementById('editCarId');
  
  // Clear existing options except the first one
  while (modelSelect.options.length > 1) {
    modelSelect.remove(1);
  }
  
  // Clear connector type and car_id
  connectorTypeInput.value = '';
  carIdInput.value = '';
  
  if (!selectedMake) {
    return;
  }
  
  // Filter models by selected make
  const modelsForMake = allCarsData
    .filter(car => car.make === selectedMake)
    .map(car => car.model)
    .filter((model, index, self) => self.indexOf(model) === index) // Get unique models
    .sort();
  
  // Populate model dropdown
  modelsForMake.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
}

function updateConnectorType(selectedMake, selectedModel) {
  const connectorTypeInput = document.getElementById('editConnectorType');
  const carIdInput = document.getElementById('editCarId');
  
  if (!selectedMake || !selectedModel) {
    connectorTypeInput.value = '';
    carIdInput.value = '';
    return;
  }
  
  // Find the car matching make and model
  const selectedCar = allCarsData.find(
    car => car.make === selectedMake && car.model === selectedModel
  );
  
  if (selectedCar) {
    connectorTypeInput.value = selectedCar.connector_type;
    carIdInput.value = selectedCar.car_id;
  } else {
    connectorTypeInput.value = '';
    carIdInput.value = '';
  }
}

function cancelEditProfile() {
  document.getElementById('userProfileEdit').style.display = 'none';
  document.getElementById('userProfileDisplay').style.display = 'block';
  document.getElementById('profileEditResult').innerHTML = '';
  loadUserProfile(); // Reload to refresh display
}

// Handle profile form submission
document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('userProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert('User ID not found. Please log in again.');
        return;
      }
      
      const formData = {
        fname: document.getElementById('editFname').value,
        lname: document.getElementById('editLname').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        car_id: document.getElementById('editCarId').value || null
      };
      
      const resultDiv = document.getElementById('profileEditResult');
      
      try {
        const updatedUser = await updateUser(userId, formData);
        resultDiv.innerHTML = '<p style="color: green;">Profile updated successfully!</p>';
        
        // Reload profile display after a short delay
        setTimeout(() => {
          cancelEditProfile();
        }, 1500);
      } catch (error) {
        console.error('Error updating profile:', error);
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
      }
    });
  }
});

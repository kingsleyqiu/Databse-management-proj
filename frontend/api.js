// API utility functions
const API_BASE = 'http://localhost:3000/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error || data.message || `API error: ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// View API functions
async function getView(viewName) {
  return fetchAPI(`/views/${viewName}`);
}

// Station API functions
async function getStations() {
  return fetchAPI('/stations');
}

async function getStation(id) {
  return fetchAPI(`/stations/${id}`);
}

async function createStation(data) {
  return fetchAPI('/stations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateStation(id, data) {
  return fetchAPI(`/stations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteStation(id) {
  return fetchAPI(`/stations/${id}`, {
    method: 'DELETE'
  });
}

// User API functions
async function getUsers() {
  return fetchAPI('/users');
}

// Login API functions
async function registerUser(data) {
  return fetchAPI('/login/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function loginUser(data) {
  return fetchAPI('/login/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function logoutUser() {
  return fetchAPI('/login/logout', {
    method: 'POST'
  });
}

// Reservation API functions (to be implemented in backend)
async function createReservation(data) {
  return fetchAPI('/reservations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function getReservations() {
  return fetchAPI('/reservations');
}

async function getReservation(id) {
  return fetchAPI(`/reservations/${id}`);
}

async function updateReservation(id, data) {
  return fetchAPI(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteReservation(id) {
  return fetchAPI(`/reservations/${id}`, {
    method: 'DELETE'
  });
}

// Charging Session API functions
async function createSession(data) {
  return fetchAPI('/sessions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function getSessions() {
  return fetchAPI('/sessions');
}

async function getSession(id) {
  return fetchAPI(`/sessions/${id}`);
}

async function updateSession(id, data) {
  return fetchAPI(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteSession(id) {
  return fetchAPI(`/sessions/${id}`, {
    method: 'DELETE'
  });
}

// Logout handler function
async function handleLogout() {
  try {
    // Call the logout API endpoint
    await logoutUser();
    
    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    // Redirect to login page
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API call fails, clear local storage and redirect
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
  }
}
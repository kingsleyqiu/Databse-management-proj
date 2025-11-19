// Universal Navbar Component
// This script creates a navbar dynamically and handles role-based visibility

function createNavbar() {
  // Get user role from localStorage
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const isAdmin = role === "admin";
  const isLoggedIn = role && userId;

  // Create navbar HTML
  let navbarHTML = '<nav>';
  
  if (isLoggedIn) {
    // User is logged in - show appropriate links
    navbarHTML += '<span><a href="index.html">Login/Register</a> |</span>';
    navbarHTML += '<span><a href="dashboard.html">Dashboard</a> |</span>';
    
    // Admin-only links
    if (isAdmin) {
      navbarHTML += '<span><a href="stations.html">Manage Stations</a> |</span>';
    }
    
    navbarHTML += '<span><a href="reservations.html">Book Reservation</a> |</span>';
    navbarHTML += '<span><a href="sessions.html">Charging Sessions</a> |</span>';
    
    // Admin-only reports link
    if (isAdmin) {
      navbarHTML += '<span><a href="views.html">Reports</a> |</span>';
    }
    
    navbarHTML += '<span><button id="logoutBtn" onclick="handleLogout()">Logout</button></span>';
  } else {
    // User is not logged in - show basic links
    navbarHTML += '<span><a href="index.html">Login/Register</a> |</span>';
    navbarHTML += '<span><a href="dashboard.html">Dashboard</a> |</span>';
    navbarHTML += '<span><a href="reservations.html">Book Reservation</a> |</span>';
    navbarHTML += '<span><a href="sessions.html">Charging Sessions</a> |</span>';
  }
  
  navbarHTML += '</nav>';
  
  return navbarHTML;
}

// Function to initialize navbar when DOM is ready
function initNavbar() {
  const navElement = document.getElementById('navbar');
  if (navElement) {
    navElement.innerHTML = createNavbar();
  }
}

// Function to hide admin-limited elements (for backward compatibility)
function hideAdminElements() {
  const role = localStorage.getItem("userRole");
  if (role !== "admin") {
    document.querySelectorAll(".adminLimited").forEach(element => {
      element.style.display = "none";
    });
  }
}

// Initialize navbar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbar);
} else {
  initNavbar();
}

// Also hide any remaining admin-limited elements (backward compatibility)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hideAdminElements);
} else {
  hideAdminElements();
}


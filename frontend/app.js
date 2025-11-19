// ------------------- REGISTER -------------------
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));
  const res = await fetch("http://localhost:3000/api/login/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  const data = await res.json();
  document.getElementById("registerResult").innerText = JSON.stringify(data, null, 2);
});

// ------------------- LOGIN -------------------
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const formData = Object.fromEntries(new FormData(e.target));
    const res = await fetch("http://localhost:3000/api/login/login", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    // handle non-JSON or empty responses safely
    let data = null;
    try { data = await res.json(); } catch (err) { console.error('Failed to parse JSON:', err); }

    console.log('Raw response:', res);
    console.log('Parsed data:', data);

    // If response wasn't OK or no valid JSON
    if (!res.ok || !data) {
      const msg = data?.message || data?.error || `HTTP ${res.status}`;
      document.getElementById("loginResult").innerText = msg;
      return;
    }

    // Accept multiple possible response shapes:
    // { success: true, user: { user_id, role } }
    // { success: true, role: "admin", user_id: 1 }
    // { success: true, user_id: 1, role: "admin" }
    const role =
      data?.user?.role ??    // preferred: data.user.role
      data?.role ??         // fallback: data.role
      data?.user_role ??    // other naming
      null;

    const userId =
      data?.user?.user_id ??
      data?.user?.id ??
      data?.user_id ??
      data?.id ??
      null;

    if (!data.success) {
      document.getElementById("loginResult").innerText = data.message || "Login failed";
      return;
    }

    // Check for null/undefined explicitly (not falsy) since userId can be 0
    if (role == null || userId == null) {
      // helpful error for debugging — backend didn't include expected fields
      document.getElementById("loginResult").innerText =
        "Login succeeded but server did not return user role or id. Check server response (see console).";
      console.warn('Missing role/userId in login response', data);
      return;
    }

    // Save safely
    localStorage.setItem("userRole", role);
    localStorage.setItem("userId", String(userId));

    // Optional: show message then redirect
    console.log('Login success — role:', role, 'userId:', userId);
    document.getElementById("loginResult").innerText = "Login successful — redirecting...";

    // Redirect by role
    if (role === "admin") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    console.error('Login error:', err);
    document.getElementById("loginResult").innerText = 'Login failed (network or server error)';
  }
});

// Logout handler function (also available in api.js, but included here for views.html)
async function handleLogout() {
  try {
    const API_BASE = 'http://localhost:3000/api';
    const response = await fetch(`${API_BASE}/login/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
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

// ------------------- CHART MANAGEMENT -------------------
let chartInstances = [];
let currentViewData = null; // Store current view data for export
let currentViewName = null; // Store current view name for export

function destroyAllCharts() {
  chartInstances.forEach(chart => {
    if (chart) {
      chart.destroy();
    }
  });
  chartInstances = [];
}

function createChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element not found: ${canvasId}`);
    return null;
  }
  
  // Check if Chart is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }
  
  try {
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, config);
    chartInstances.push(chart);
    return chart;
  } catch (error) {
    console.error(`Error creating chart ${canvasId}:`, error);
    return null;
  }
}

// ------------------- CHART RENDERING FUNCTIONS -------------------

function renderStationUtilizationChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for station utilization chart');
    return;
  }
  
  const labels = data.map(d => d.name || `Station ${d.station_id}`);
  const sessions = data.map(d => parseInt(d.sessions) || 0);
  const totalKwh = data.map(d => parseFloat(d.total_kwh) || 0);
  const avgKwh = data.map(d => parseFloat(d.avg_kwh) || 0);

  const html = `
    <div class="chart-container">
      <h3>Station Utilization</h3>
      <div class="chart-wrapper">
        <canvas id="utilSessionsChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="utilKwhChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  // Wait a moment for DOM to update before creating charts
  setTimeout(() => {
    console.log('Creating charts for station utilization...');
    const canvas1 = document.getElementById('utilSessionsChart');
    const canvas2 = document.getElementById('utilKwhChart');
    
    if (!canvas1 || !canvas2) {
      console.error('Canvas elements not found after DOM update');
      return;
    }

  // Sessions chart
  const chart1 = createChart('utilSessionsChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Sessions',
        data: sessions,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Sessions per Station'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart1) {
    console.error('Failed to create sessions chart');
  }

  // Energy chart
  const chart2 = createChart('utilKwhChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Energy (kWh)',
        data: totalKwh,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }, {
        label: 'Average Energy (kWh)',
        data: avgKwh,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Energy Delivered per Station'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart2) {
    console.error('Failed to create energy chart');
  } else {
    console.log('Station utilization charts created successfully');
  }
  }, 200);
}

function renderChargerStatusChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for charger status chart');
    return;
  }
  
  const labels = data.map(d => d.name || `Station ${d.station_id}`);
  const available = data.map(d => parseInt(d.available) || 0);
  const inUse = data.map(d => parseInt(d.in_use) || 0);
  const reserved = data.map(d => parseInt(d.reserved) || 0);
  const outOfOrder = data.map(d => parseInt(d.out_of_order) || 0);

  const html = `
    <div class="chart-container">
      <h3>Charger Status Summary</h3>
      <div class="chart-wrapper">
        <canvas id="chargerStatusChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {

  createChart('chargerStatusChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Available',
        data: available,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }, {
        label: 'In Use',
        data: inUse,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'Reserved',
        data: reserved,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }, {
        label: 'Out of Order',
        data: outOfOrder,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Charger Status by Station'
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart) {
    console.error('Failed to create charger status chart');
  } else {
    console.log('Charger status chart created successfully');
  }
  }, 200);
}

function renderUserTotalPaidChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for user total paid chart');
    return;
  }
  
  // Sort by total_paid descending and take top 10
  const sorted = [...data].sort((a, b) => parseFloat(b.total_paid) - parseFloat(a.total_paid)).slice(0, 10);
  const labels = sorted.map(d => `${d.fname} ${d.lname}`.trim() || `User ${d.user_id}`);
  const totals = sorted.map(d => parseFloat(d.total_paid) || 0);

  const html = `
    <div class="chart-container">
      <h3>Top 10 Users by Total Paid</h3>
      <div class="chart-wrapper">
        <canvas id="userPaidChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating user paid chart...');
    const canvas = document.getElementById('userPaidChart');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

  const chart = createChart('userPaidChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Paid ($)',
        data: totals,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'User Spending'
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart) {
    console.error('Failed to create user paid chart');
  } else {
    console.log('User paid chart created successfully');
  }
  }, 200);
}

function renderSessionCostRateChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for session cost rate chart');
    return;
  }
  
  const labels = data.map(d => d.station_name || 'Unknown');
  const postedRates = data.map(d => parseFloat(d.posted_rate_per_kwh) || 0);
  const effectiveRates = data.map(d => parseFloat(d.effective_rate_per_kwh) || 0);
  const costs = data.map(d => parseFloat(d.cost) || 0);

  const html = `
    <div class="chart-container">
      <h3>Session Cost vs Rate Analysis</h3>
      <div class="chart-wrapper">
        <canvas id="costRateChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="costChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating session cost rate charts...');
    const canvas1 = document.getElementById('costRateChart');
    const canvas2 = document.getElementById('costChart');
    if (!canvas1 || !canvas2) {
      console.error('Canvas elements not found');
      return;
    }

  // Rate comparison chart
  const chart1 = createChart('costRateChart', {
    type: 'line',
    data: {
      labels: labels.slice(0, 20), // Limit to 20 for readability
      datasets: [{
        label: 'Posted Rate ($/kWh)',
        data: postedRates.slice(0, 20),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1
      }, {
        label: 'Effective Rate ($/kWh)',
        data: effectiveRates.slice(0, 20),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Rate Comparison'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Cost distribution
  const chart2 = createChart('costChart', {
    type: 'bar',
    data: {
      labels: labels.slice(0, 15), // Top 15 by cost
      datasets: [{
        label: 'Session Cost ($)',
        data: costs.slice(0, 15),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Session Costs'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart1 || !chart2) {
    console.error('Failed to create session cost rate charts');
  } else {
    console.log('Session cost rate charts created successfully');
  }
  }, 200);
}

function renderStationVacancyChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for station vacancy chart');
    return;
  }
  
  const labels = data.map(d => d.name || `Station ${d.station_id}`);
  const ports = data.map(d => parseInt(d.ports) || 0);
  const freeChargers = data.map(d => parseInt(d.free_chargers) || 0);
  const estimatedFreePorts = data.map(d => parseInt(d.estimated_free_ports) || 0);

  const html = `
    <div class="chart-container">
      <h3>Station Vacancy</h3>
      <div class="chart-wrapper">
        <canvas id="vacancyChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating vacancy chart...');
    const canvas = document.getElementById('vacancyChart');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

  const chart = createChart('vacancyChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Ports',
        data: ports,
        backgroundColor: 'rgba(201, 203, 207, 0.6)',
        borderColor: 'rgba(201, 203, 207, 1)',
        borderWidth: 1
      }, {
        label: 'Free Chargers',
        data: freeChargers,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }, {
        label: 'Estimated Free Ports',
        data: estimatedFreePorts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Station Capacity and Availability'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart) {
    console.error('Failed to create vacancy chart');
  } else {
    console.log('Vacancy chart created successfully');
  }
  }, 200);
}

function renderMaxAvgRateChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for max avg rate chart');
    return;
  }
  
  const labels = data.map(d => d.operator || 'Unknown');
  const rates = data.map(d => parseFloat(d.avg_rate) || 0);

  const html = `
    <div class="chart-container">
      <h3>Operator Average Rates</h3>
      <div class="chart-wrapper">
        <canvas id="operatorRateChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating operator rate chart...');
    const canvas = document.getElementById('operatorRateChart');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

  const chart = createChart('operatorRateChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Rate ($/kWh)',
        data: rates,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Operator Pricing Comparison'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  if (!chart) {
    console.error('Failed to create operator rate chart');
  } else {
    console.log('Operator rate chart created successfully');
  }
  }, 200);
}

function renderSessionDetailsChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for session details chart');
    return;
  }
  
  // Group by station
  const stationMap = {};
  data.forEach(session => {
    const stationName = session.station_name || `Station ${session.station_id}` || 'Unknown';
    if (!stationMap[stationName]) {
      stationMap[stationName] = {
        totalEnergy: 0,
        totalCost: 0,
        sessionCount: 0
      };
    }
    stationMap[stationName].totalEnergy += parseFloat(session.energy_delivered_kwh) || 0;
    stationMap[stationName].totalCost += parseFloat(session.cost) || 0;
    stationMap[stationName].sessionCount += 1;
  });
  
  const labels = Object.keys(stationMap);
  const totalEnergy = labels.map(station => stationMap[station].totalEnergy);
  const totalCost = labels.map(station => stationMap[station].totalCost);
  const sessionCounts = labels.map(station => stationMap[station].sessionCount);
  
  const html = `
    <div class="chart-container">
      <h3>Session Details Summary</h3>
      <div class="chart-wrapper">
        <canvas id="sessionEnergyChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="sessionCostChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="sessionCountChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating session details charts...');
    const canvas1 = document.getElementById('sessionEnergyChart');
    const canvas2 = document.getElementById('sessionCostChart');
    const canvas3 = document.getElementById('sessionCountChart');
    
    if (!canvas1 || !canvas2 || !canvas3) {
      console.error('Canvas elements not found');
      return;
    }

  // Energy chart
  const chart1 = createChart('sessionEnergyChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Energy Delivered (kWh)',
        data: totalEnergy,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Total Energy Delivered by Station'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Cost chart
  const chart2 = createChart('sessionCostChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Cost ($)',
        data: totalCost,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Total Revenue by Station'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Session count chart
  const chart3 = createChart('sessionCountChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Sessions',
        data: sessionCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Session Count by Station'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  if (!chart1 || !chart2 || !chart3) {
    console.error('Failed to create session details charts');
  } else {
    console.log('Session details charts created successfully');
  }
  }, 200);
}

function renderStationReliabilityChart(data) {
  if (!data || data.length === 0) {
    console.warn('No data for station reliability chart');
    return;
  }
  
  const labels = data.map(d => d.name || `Station ${d.station_id}`);
  const reliabilityScores = data.map(d => {
    const score = parseFloat(d.reliability_score) || 0;
    return (score * 100).toFixed(1); // Convert to percentage
  });
  const outOfOrder = data.map(d => parseInt(d.ooo) || 0);
  const totalChargers = data.map(d => parseInt(d.chargers) || 0);
  const operationalChargers = totalChargers.map((total, idx) => total - outOfOrder[idx]);
  
  const html = `
    <div class="chart-container">
      <h3>Station Reliability</h3>
      <div class="chart-wrapper">
        <canvas id="reliabilityScoreChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="chargerStatusChart"></canvas>
      </div>
    </div>
  `;
  const container = document.getElementById('chartContainer');
  if (!container) {
    console.error('chartContainer element not found');
    return;
  }
  container.innerHTML = html;
  
  setTimeout(() => {
    console.log('Creating station reliability charts...');
    const canvas1 = document.getElementById('reliabilityScoreChart');
    const canvas2 = document.getElementById('chargerStatusChart');
    
    if (!canvas1 || !canvas2) {
      console.error('Canvas elements not found');
      return;
    }

  // Reliability score chart (percentage)
  const chart1 = createChart('reliabilityScoreChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Reliability Score (%)',
        data: reliabilityScores,
        backgroundColor: data.map(d => {
          const score = parseFloat(d.reliability_score) || 0;
          // Green for high reliability (>80%), yellow for medium (50-80%), red for low (<50%)
          if (score >= 0.8) return 'rgba(75, 192, 192, 0.6)';
          if (score >= 0.5) return 'rgba(255, 206, 86, 0.6)';
          return 'rgba(255, 99, 132, 0.6)';
        }),
        borderColor: data.map(d => {
          const score = parseFloat(d.reliability_score) || 0;
          if (score >= 0.8) return 'rgba(75, 192, 192, 1)';
          if (score >= 0.5) return 'rgba(255, 206, 86, 1)';
          return 'rgba(255, 99, 132, 1)';
        }),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Station Reliability Score (%)'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Reliability: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });

  // Charger status breakdown chart
  const chart2 = createChart('chargerStatusChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Operational Chargers',
        data: operationalChargers,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }, {
        label: 'Out of Order',
        data: outOfOrder,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Charger Status by Station'
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  if (!chart1 || !chart2) {
    console.error('Failed to create station reliability charts');
  } else {
    console.log('Station reliability charts created successfully');
  }
  }, 200);
}

// Wait for DOM and Chart.js to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if Chart.js loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded!');
  } else {
    console.log('Chart.js is ready');
  }
});

// ------------------- EXPORT FUNCTIONS -------------------

function exportToCSV() {
  if (!currentViewData || currentViewData.length === 0) {
    alert('No data to export. Please load a view first.');
    return;
  }

  // Get column headers
  const headers = Object.keys(currentViewData[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  currentViewData.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${currentViewName || 'report'}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF() {
  if (!currentViewData || currentViewData.length === 0) {
    alert('No data to export. Please load a view first.');
    return;
  }

  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape'); // Use landscape for wider tables

  // Get column headers
  const headers = Object.keys(currentViewData[0]);
  
  // Prepare data for autotable
  const tableData = currentViewData.map(row => {
    return headers.map(header => {
      const value = row[header];
      return value === null || value === undefined ? '' : String(value);
    });
  });

  // Add title
  const viewTitle = currentViewName || 'Report';
  doc.setFontSize(16);
  doc.text(viewTitle, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  // Add table using autotable plugin
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 28 }
  });

  // Save PDF
  doc.save(`${currentViewName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ------------------- LOAD SQL VIEW -------------------
document.getElementById("loadViewBtn")?.addEventListener("click", async () => {
  const view = document.getElementById("viewSelector").value;
  console.log('Loading view:', view);

  try {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded. Please check the CDN link.');
      alert('Chart.js library failed to load. Please refresh the page.');
      return;
    }
    console.log('Chart.js loaded successfully');

    const rows = await getView(view);
    console.log('Data received:', rows?.length || 0, 'rows');
    
    // Store data for export
    currentViewData = rows;
    currentViewName = view;

    if (!Array.isArray(rows)) {
      document.getElementById("chartContainer").innerHTML = "";
      document.getElementById("tableContainer").innerHTML = "Error loading view";
      document.getElementById("exportCSVBtn").style.display = "none";
      document.getElementById("exportPDFBtn").style.display = "none";
      return;
    }

    if (rows.length === 0) {
      document.getElementById("chartContainer").innerHTML = "<p>No data available for this view.</p>";
      document.getElementById("tableContainer").innerHTML = "";
      document.getElementById("exportCSVBtn").style.display = "none";
      document.getElementById("exportPDFBtn").style.display = "none";
      return;
    }

    // Destroy existing charts
    destroyAllCharts();

    // Render appropriate chart based on view type
    console.log('Rendering chart for view:', view);
    const chartContainer = document.getElementById("chartContainer");
    
    try {
      switch(view) {
        case 'station-util':
          renderStationUtilizationChart(rows);
          break;
        case 'charger-status':
          renderChargerStatusChart(rows);
          break;
        case 'user-total-paid':
          renderUserTotalPaidChart(rows);
          break;
        case 'session-cost-rate':
          renderSessionCostRateChart(rows);
          break;
        case 'vacancy':
          renderStationVacancyChart(rows);
          break;
        case 'max-avg-rate':
          renderMaxAvgRateChart(rows);
          break;
        case 'session-details':
          renderSessionDetailsChart(rows);
          break;
        case 'reliability':
          renderStationReliabilityChart(rows);
          break;
        default:
          // No chart for other views
          console.log('No chart defined for view:', view);
          chartContainer.innerHTML = "";
      }
    } catch (chartError) {
      console.error('Error rendering chart:', chartError);
      chartContainer.innerHTML = `<p style="color: red;">Error rendering chart: ${chartError.message}</p>`;
    }

    // Always render table
    let html = "<h3>Data Table</h3><table><tr>";

    Object.keys(rows[0] || {}).forEach(key => {
      html += `<th>${key}</th>`;
    });

    html += "</tr>";

    rows.forEach(r => {
      html += "<tr>";
      Object.values(r).forEach(val => {
        html += `<td>${val}</td>`;
      });
      html += "</tr>";
    });

    html += "</table>";

    document.getElementById("tableContainer").innerHTML = html;
    
    // Show export buttons if we have data
    if (rows.length > 0) {
      document.getElementById("exportCSVBtn").style.display = "inline-block";
      document.getElementById("exportPDFBtn").style.display = "inline-block";
    } else {
      document.getElementById("exportCSVBtn").style.display = "none";
      document.getElementById("exportPDFBtn").style.display = "none";
    }
  } catch (error) {
    console.error('Error loading view:', error);
    document.getElementById("chartContainer").innerHTML = "";
    document.getElementById("tableContainer").innerHTML = `<p style="color: red;">Error loading view: ${error.message}</p>`;
    document.getElementById("exportCSVBtn").style.display = "none";
    document.getElementById("exportPDFBtn").style.display = "none";
  }
});

// Export button event listeners
document.getElementById("exportCSVBtn")?.addEventListener("click", exportToCSV);
document.getElementById("exportPDFBtn")?.addEventListener("click", exportToPDF);

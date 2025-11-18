// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadRecentStations();
  await loadStationUtilization();
  await loadChargerStatusSummary();
});

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

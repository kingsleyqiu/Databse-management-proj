// Stations management functionality
let allStations = []; // Store all stations for filtering

document.addEventListener('DOMContentLoaded', () => {
  loadStations();
  setupForm();
});

function setupForm() {
  const form = document.getElementById('stationForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleStationSubmit();
  });
}

async function handleStationSubmit() {
  const form = document.getElementById('stationForm');
  const formData = new FormData(form);
  const stationId = document.getElementById('stationId').value;
  const resultDiv = document.getElementById('formResult');
  
  const data = {
    name: formData.get('name'),
    operator: formData.get('operator') || null,
    address: formData.get('address'),
    latitude: parseFloat(formData.get('latitude')),
    longitude: parseFloat(formData.get('longitude')),
    ports: parseInt(formData.get('ports')) || 1,
    status: formData.get('status')
  };
  
  try {
    if (stationId) {
      // Update existing station
      await updateStation(stationId, data);
      resultDiv.innerHTML = '<p style="color: green;">Station updated successfully!</p>';
    } else {
      // Create new station
      await createStation(data);
      resultDiv.innerHTML = '<p style="color: green;">Station created successfully!</p>';
    }
    
    form.reset();
    document.getElementById('stationId').value = '';
    document.getElementById('submitBtn').textContent = 'Add Station';
    document.getElementById('cancelBtn').style.display = 'none';
    await loadStations(); // This will reload and reapply filters
    
    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving station:', error);
    resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

async function loadStations() {
  try {
    allStations = await getStations();
    populateOperatorFilter();
    filterStations();
  } catch (error) {
    console.error('Error loading stations:', error);
    document.getElementById('stationsList').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function populateOperatorFilter() {
  const operatorFilter = document.getElementById('operatorFilter');
  if (!operatorFilter) return;
  
  if (!allStations || allStations.length === 0) {
    // Keep only "All Operators" if no stations
    operatorFilter.innerHTML = '<option value="">All Operators</option>';
    return;
  }
  
  // Get all unique operators, filtering out null/undefined/empty values
  const operators = [...new Set(allStations
    .map(s => s.operator)
    .filter(op => op && op !== null && op !== undefined && String(op).trim() !== ''))].sort();
  
  // Remove all existing options
  while (operatorFilter.firstChild) {
    operatorFilter.removeChild(operatorFilter.firstChild);
  }
  
  // Add "All Operators" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Operators';
  operatorFilter.appendChild(allOption);
  
  // Add operator options
  operators.forEach(operator => {
    const option = document.createElement('option');
    option.value = operator;
    option.textContent = operator;
    operatorFilter.appendChild(option);
  });
}

function filterStations() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const operatorFilter = document.getElementById('operatorFilter');
  
  if (!searchInput || !statusFilter || !operatorFilter) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const operatorValue = operatorFilter.value;
  
  let filtered = allStations.filter(station => {
    // Search filter
    const matchesSearch = !searchTerm || 
      station.name.toLowerCase().includes(searchTerm) ||
      (station.operator && station.operator.toLowerCase().includes(searchTerm)) ||
      station.address.toLowerCase().includes(searchTerm);
    
    // Status filter
    const matchesStatus = !statusValue || station.status === statusValue;
    
    // Operator filter - match exact operator (case-sensitive)
    let matchesOperator = true;
    if (operatorValue && operatorValue !== '') {
      // If operator filter is selected, station must have that exact operator
      matchesOperator = station.operator === operatorValue;
    }
    
    return matchesSearch && matchesStatus && matchesOperator;
  });
  
  displayStations(filtered);
  
  // Show filtered count
  const countDiv = document.getElementById('filteredCount');
  if (filtered.length !== allStations.length) {
    countDiv.innerHTML = `<p>Showing ${filtered.length} of ${allStations.length} stations</p>`;
  } else {
    countDiv.innerHTML = `<p>Showing all ${allStations.length} stations</p>`;
  }
}

function displayStations(stations) {
  const container = document.getElementById('stationsList');
  
  if (stations.length === 0) {
    container.innerHTML = '<p>No stations found matching your criteria</p>';
    return;
  }
  
  let html = '<table><tr><th>ID</th><th>Name</th><th>Operator</th><th>Address</th><th>Ports</th><th>Status</th><th>Actions</th></tr>';
  stations.forEach(station => {
    html += `<tr>
      <td>${station.id}</td>
      <td>${station.name}</td>
      <td>${station.operator || 'N/A'}</td>
      <td>${station.address}</td>
      <td>${station.ports}</td>
      <td>${station.status}</td>
      <td>
        <button onclick="editStation(${station.id})">Edit</button>
        <button onclick="deleteStationConfirm(${station.id}, '${station.name}')">Delete</button>
      </td>
    </tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('operatorFilter').value = '';
  filterStations();
}

async function editStation(id) {
  try {
    const station = await getStation(id);
    const form = document.getElementById('stationForm');
    
    // Populate form with station data
    document.getElementById('stationId').value = station.id;
    form.querySelector('[name="name"]').value = station.name;
    form.querySelector('[name="operator"]').value = station.operator || '';
    form.querySelector('[name="address"]').value = station.address;
    form.querySelector('[name="latitude"]').value = station.latitude;
    form.querySelector('[name="longitude"]').value = station.longitude;
    form.querySelector('[name="ports"]').value = station.ports;
    form.querySelector('[name="status"]').value = station.status;
    
    // Change button text and show cancel
    document.getElementById('submitBtn').textContent = 'Update Station';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading station:', error);
    alert('Error loading station: ' + error.message);
  }
}

function cancelEdit() {
  const form = document.getElementById('stationForm');
  form.reset();
  document.getElementById('stationId').value = '';
  document.getElementById('submitBtn').textContent = 'Add Station';
  document.getElementById('cancelBtn').style.display = 'none';
  document.getElementById('formResult').innerHTML = '';
}

async function deleteStationConfirm(id, name) {
  if (!confirm(`Are you sure you want to delete station "${name}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await deleteStation(id);
    alert('Station deleted successfully!');
    await loadStations();
  } catch (error) {
    console.error('Error deleting station:', error);
    alert('Error deleting station: ' + error.message);
  }
}


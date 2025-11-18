// ------------------- REGISTER -------------------
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));
  const res = await fetch("http://localhost:3000/api/login/register", {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify(formData)
  });

  const data = await res.json();
  document.getElementById("registerResult").innerText = JSON.stringify(data, null, 2);
});

// ------------------- LOGIN -------------------
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));
  const loginResult = document.getElementById("loginResult");
  loginResult.innerHTML = '<p>Logging in...</p>';

  try {
    const res = await fetch("http://localhost:3000/api/login/login", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      credentials: 'include', // Add this for session cookies
      body: JSON.stringify(formData)
    });

    // Check response status before parsing
    if (!res.ok) {
      const errorData = await res.json();
      loginResult.innerHTML = `<p style="color: red;">${errorData.error || errorData.message || 'Login failed'}</p>`;
      return;
    }

    const data = await res.json();
    console.log("Login successful:", data);

    // Redirect to dashboard on success
    window.location.href = "dashboard.html";
    
  } catch (error) {
    console.error('Login error:', error);
    loginResult.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
});

// ------------------- LOAD SQL VIEW -------------------
document.getElementById("loadViewBtn")?.addEventListener("click", async () => {
  const view = document.getElementById("viewSelector").value;

  const res = await fetch(`http://localhost:3000/api/views/${view}`);
  const rows = await res.json();

  if (!Array.isArray(rows)) {
    document.getElementById("tableContainer").innerHTML = "Error loading view";
    return;
  }

  // Build HTML table
  let html = "<table><tr>";

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
});

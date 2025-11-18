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

    if (!role || !userId) {
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
      // if you don't have user-home.html yet, change this to dashboard.html or index.html
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    console.error('Login error:', err);
    document.getElementById("loginResult").innerText = 'Login failed (network or server error)';
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

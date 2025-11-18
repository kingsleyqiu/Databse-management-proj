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
  const res = await fetch("http://localhost:3000/api/login/login", {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify(formData)
  });

  const data = await res.json();

  // Redirect on ANY successful response
  if (res.ok) {
    window.location.href = "dashboard.html";  // <-- Make sure path is correct
  } else {
    document.getElementById("loginResult").innerText =
      data.message || "Login failed";
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

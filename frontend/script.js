// ================== UTILITY ==================
function logout() {
  sessionStorage.clear();
  alert("Logged out");    
  location.href = "role.html"; 
}

// ================== VOTER SIGNUP ==================
async function votersignup() {  
  const name = document.getElementById("voter-name").value;
  const email = document.getElementById("voter-id").value;
  const password = document.getElementById("voter-password").value;

  try {
    const res = await fetch("http://localhost:3000/voter/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, voterId: email, password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert("Signup done! Redirecting to login…");
      location.href = "voter_login.html";
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    alert("Signup failed: " + err.message);
  }
  return false;
}

// ================== VOTER LOGIN ==================
async function voterlogin() {
  const email = document.getElementById("voter-id").value;
  const password = document.getElementById("voter-password").value;

  try {
    const res = await fetch("http://localhost:3000/voter/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: email, password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem("userId", data.user.id);
      sessionStorage.setItem("role", "voter");
      alert("Voter login success");
      location.href = "voter_dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    alert("Login failed: " + err.message);
  }
  return false;
}

// ================== ADMIN LOGIN ==================
async function adminLogin() {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  try {
    const res = await fetch("http://localhost:3000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "admin" })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem("userId", data.user.id);
      sessionStorage.setItem("role", "admin");
      alert("Admin login success");
      location.href = "admin_dashboard.html";
    } else {
      alert(data.error || "Invalid admin credentials");
    }
  } catch (err) {
    alert("Admin login failed: " + err.message);
  }
}

// ================== LOAD ELECTIONS ==================
async function loadElections() {
  try {
    const res = await fetch("http://localhost:3000/elections");
    const elections = await res.json();

    // Election dropdown (Add Candidate)
    const sel = document.getElementById("election-select");
    if (sel) {
      sel.innerHTML = "<option value=''>Select election</option>";
      elections.forEach(e => sel.insertAdjacentHTML("beforeend", `<option value="${e.id}">${e.title}</option>`));
    }

    // Elections container (Voter page)
    const box = document.getElementById("elections-container");
    if (box) {
      box.innerHTML = "";
      elections.forEach(e => {
        const btn = document.createElement("button");
        btn.textContent = e.title;
        btn.onclick = () => {
          sessionStorage.setItem("electionId", e.id);
          location.href = "vote_page.html";
        };
        box.appendChild(btn);
      });
    }
  } catch (err) {
    console.error("Failed to load elections:", err);
  }
}

// ================== VOTE PAGE ==================
if (window.location.pathname.includes("vote_page.html")) {
  (async () => {
    const electionId = sessionStorage.getItem("electionId");
    const voterId = sessionStorage.getItem("userId");

    const res = await fetch(`http://localhost:3000/elections/${electionId}`);
    const data = await res.json();

    document.getElementById("election-name").textContent = data.title;
    const box = document.getElementById("candidates-container");
    box.innerHTML = "";

    const checkVote = await fetch(`http://localhost:3000/votes/${electionId}/${voterId}`);
    const { voted } = await checkVote.json();

    if (voted) {
      box.innerHTML = `<p style="color:red; font-weight:bold;">⚠️ Your vote is already recorded.</p>`;
      document.getElementById("vote-form").style.display = "none";
      return;
    }

    data.candidates.forEach(c => {
      box.insertAdjacentHTML("beforeend", `
        <label>
          <input type="radio" name="candidate" value="${c.id}" required> ${c.name}
        </label><br>
      `);
    });
  })();
}

// ================== CAST VOTE ==================
window.castVote = async () => {
  const electionId = sessionStorage.getItem("electionId");
  const candidateId = document.querySelector('input[name="candidate"]:checked')?.value;
  const voterId = sessionStorage.getItem("userId");

  if (!candidateId) return alert("Choose a candidate");

  try {
    const res = await fetch("http://localhost:3000/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_id: electionId, candidate_id: candidateId, voter_id: voterId })
    });

    const data = await res.json();

    if (!res.ok || !data.success) return alert(data.error || "Vote failed");

    alert(`✅ Vote cast! Receipt ID: ${data.receiptOrder}`);
    document.querySelector("button[type=submit]").disabled = true;
  } catch (err) {
    alert("❌ Failed to cast vote: " + err.message);
  }
  return false;
};

// ================== RESULTS ==================
async function loadElectionOptions() {
  const sel = document.getElementById("electionId");
  if (!sel) return;

  const res = await fetch("http://localhost:3000/elections");
  const elections = await res.json();

  sel.innerHTML = "<option value=''>Select election</option>";
  elections.forEach(e =>
    sel.insertAdjacentHTML("beforeend", `<option value="${e.id}">${e.title}</option>`)
  );
}

async function fetchResults() {
  const electionId = document.getElementById("electionId").value;
  if (!electionId) return;

  const res = await fetch(`http://localhost:3000/results/${electionId}`);
  const data = await res.json();

  const resultDiv = document.getElementById("results-container");
  resultDiv.innerHTML = "";

  if (!data || Object.keys(data).length === 0) {
    resultDiv.innerHTML = "<p>No votes yet for this election.</p>";
    return;
  }

  resultDiv.innerHTML = `<canvas id="resultsChart" width="400" height="200"></canvas>`;
  const ctx = document.getElementById("resultsChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Votes",
        data: Object.values(data),
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// ================== ADD CANDIDATE ==================
document.getElementById("addCandidateForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("candidate_name").value;
  const election_id = document.getElementById("election-select").value;

  if (!election_id) return alert("Please select an election!");

  const res = await fetch("http://localhost:3000/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, election_id })
  });

  const data = await res.json();
  if (res.ok && data.success) {
    alert("✅ Candidate added successfully!");
    document.getElementById("candidate_name").value = "";
  } else {
    alert(data.error || "Failed to add candidate");
  }
});

// ================== CREATE ELECTION ==================
document.getElementById("createElectionForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const created_by = sessionStorage.getItem("userId");

  const res = await fetch("http://localhost:3000/elections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, created_by })
  });

  const data = await res.json();
  alert(data.success ? "Election created" : data.error);
  if (data.success) location.href = "admin_dashboard.html";
});

// ================== ON PAGE LOAD ==================
document.addEventListener("DOMContentLoaded", () => {
  // Admin login
  document.getElementById("admin-login-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    await adminLogin();
  });

  // Voter login
  document.getElementById("voter-login-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    await voterlogin();
  });

  // Voter signup
  document.getElementById("voter-signup-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    await votersignup();
  });

  // Load elections
  loadElections();

  // Load election options for results page
  if (document.getElementById("electionId")) loadElectionOptions();

  // Show results button
  document.getElementById("showResults")?.addEventListener("click", fetchResults);
});

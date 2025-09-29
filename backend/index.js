const express = require("express");
const path = require("path");
const supabase = require("./supabaseclient");
const voterRoutes = require("./routes/voterroutes");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve frontend files

// ===== VOTER ROUTES =====
app.use("/voter", voterRoutes);

// ===== ADMIN LOGIN =====
app.post("/admin/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim())
      .eq("role", role.trim());

    if (error) return res.status(500).json({ success: false, error: error.message });

    const user = users.find(u => u.password === password);
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== CREATE ELECTION =====
app.post("/elections", async (req, res) => {
  const { title, description, created_by } = req.body;
  try {
    const { data, error } = await supabase.from("elections").insert([{ title, description, created_by }]).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== GET ALL ELECTIONS =====
app.get("/elections", async (req, res) => {
  try {
    const { data, error } = await supabase.from("elections").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== GET SINGLE ELECTION WITH CANDIDATES =====
app.get("/elections/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data: election, error } = await supabase.from("elections").select("*").eq("id", id).single();
    if (error) throw error;

    const { data: candidates, error: candErr } = await supabase.from("candidates").select("*").eq("election_id", id);
    if (candErr) throw candErr;

    res.json({ ...election, candidates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== ADD CANDIDATE =====
app.post("/candidates", async (req, res) => {
  const { election_id, name } = req.body;
  try {
    const { data, error } = await supabase.from("candidates").insert([{ election_id, name }]).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== DELETE CANDIDATE =====
app.delete("/candidates/:id", async (req, res) => {
  const candidateId = req.params.id;
  try {
    const { data, error } = await supabase.from("candidates").delete().eq("id", candidateId);
    if (error) throw error;
    res.json({ success: true, message: "Candidate removed", data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== CAST VOTE =====
// ===== CAST VOTE =====
app.post("/vote", async (req, res) => {
  const { election_id, candidate_id, voter_id } = req.body;

  try {
    // ✅ Step 1: Check if voter already voted in this election
    const { data: existingVote, error: checkError } = await supabase
      .from("votes")
      .select("*")
      .eq("election_id", election_id)
      .eq("voter_id", voter_id);

    if (checkError) throw checkError;
    if (existingVote.length > 0) {
      return res.status(400).json({ success: false, error: "You already voted in this election!" });
    }

    // ✅ Step 2: Insert new vote
    const { data, error } = await supabase
      .from("votes")
      .insert([{ election_id, candidate_id, voter_id }])
      .select();

    if (error) throw error;

    res.json({ success: true, receiptOrder: data[0].id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== VIEW RESULTS =====
// ===== GET RESULTS =====
// ===== GET RESULTS =====
app.get("/results/:id", async (req, res) => {
  const electionId = req.params.id;
  try {
    // Get all votes for this election
    const { data: votes, error: voteErr } = await supabase
      .from("votes")
      .select("candidate_id")
      .eq("election_id", electionId);

    if (voteErr) throw voteErr;

    // Get candidates of this election
    const { data: candidates, error: candErr } = await supabase
      .from("candidates")
      .select("id, name")
      .eq("election_id", electionId);

    if (candErr) throw candErr;

    // Count votes
    const results = {};
    candidates.forEach(c => {
      results[c.name] = votes.filter(v => v.candidate_id === c.id).length;
    });

    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== CHECK IF VOTER ALREADY VOTED =====
app.get("/votes/:electionId/:voterId", async (req, res) => {
  const { electionId, voterId } = req.params;
  try {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("election_id", electionId)
      .eq("voter_id", voterId);

    if (error) throw error;

    res.json({ voted: data.length > 0 });
  } catch (err) {
    res.status(500).json({ voted: false, error: err.message });
  }
});

// ===== START SERVER =====
app.listen(3000, () => console.log("✅ Server running on port 3000"));

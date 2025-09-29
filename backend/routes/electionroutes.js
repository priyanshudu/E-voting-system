const express = require("express");
const router = express.Router();

const elections = []; // Assuming you're storing this in memory

// GET all elections
router.get("/", (req, res) => {
  res.json(elections);
});

// POST create election
router.post("/create", (req, res) => {
  const { name, description } = req.body;
  const id = elections.length + 1;
  elections.push({ id, name, description, candidates: [] });
  res.json({ message: "Election created successfully" });
});
router.post("/:electionId/candidates", (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { name } = req.body;

  const election = elections.find(e => e.id === electionId);
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }

  election.candidates.push({ name, votes: 0 });
  res.json({ message: "Candidate added successfully" });
});
router.get("/:electionId", (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const election = elections.find(e => e.id === electionId);
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }
  res.json(election);
});

// Cast vote
router.post("/:electionId/vote", (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { candidateIndex } = req.body;

  const election = elections.find(e => e.id === electionId);
  if (!election || !election.candidates[candidateIndex]) {
    return res.status(400).json({ message: "Invalid vote" });
  }

  election.candidates[candidateIndex].votes += 1;
  res.json({ message: "Vote cast successfully" });
});
// Get results (same as election detail, but admin-facing)
router.get("/:electionId/results", (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const election = elections.find(e => e.id === electionId);
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }

  res.json({
    name: election.name,
    candidates: election.candidates
  });
});

module.exports = router;







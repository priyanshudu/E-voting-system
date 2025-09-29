const express = require("express");
const router = express.Router();
const supabase = require("../supabaseclient");

// Voter Signup
router.post("/signup", async (req, res) => {
    const { name, voterId, password } = req.body;

    try {
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", voterId)
            .single();

        if (existingUser) return res.status(409).json({ success: false, error: "Voter ID already exists" });

        const { data, error } = await supabase
            .from("users")
            .insert([{ name, email: voterId, password, role: "voter" }])
            .select();

        if (error) throw error;

        res.json({ success: true, message: "Signup successful", user: data[0] });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Voter Login
router.post("/login", async (req, res) => {
    const { voterId, password } = req.body;

    try {
        const { data: users } = await supabase
            .from("users")
            .select("*")
            .eq("email", voterId)
            .eq("role", "voter");

        const user = users.find(u => u.password === password);

        if (!user) return res.status(401).json({ success: false, error: "Invalid Voter ID or password" });

        res.json({ success: true, message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;


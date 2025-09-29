// backend/supabaseClient.js

const { createClient } = require('@supabase/supabase-js');

// --- IMPORTANT ---
// Go to your Supabase project settings > API
// and get your URL and anon key.
const supabaseUrl = 'https://lerobpcacvpwtsdwscwo.supabase.co'; // Paste your URL here
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlcm9icGNhY3Zwd3RzZHdzY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mzg1NzQsImV4cCI6MjA3MTQxNDU3NH0.4dEejFJoqADBqyCh6BV_5M34Jdyq82vL1oMuHm4GCuA'; // Paste your anon key here

// This creates the connection client that we will use in other files
const supabase = createClient(supabaseUrl, supabaseKey);

// This makes the client available for other files to import
module.exports = supabase;



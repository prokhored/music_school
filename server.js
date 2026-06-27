const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

app.get("/api/students", async (req, res) => {
  const { data, error } = await supabase
    .from("students")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.post("/api/students", async (req, res) => {
  const { name, instrument } = req.body;
  const { data, error } = await supabase
    .from("students")
    .insert([{ name, instrument }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

app.delete("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

app.put("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  const { name, instrument } = req.body;
  const { data, error } = await supabase
    .from("students")
    .update({ name, instrument })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

app.post("/api/lessons", async (req, res) => {
  const { student_id, lesson_date, material, homework, next_plan } = req.body;
  const { data, error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id,
        type: "lesson",
        value: -1,
        lesson_date,
        material,
        homework,
        next_plan
      }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

app.post("/api/abonements", async (req, res) => {
  const { student_id } = req.body;
  const { data, error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id,
        type: "abonement",
        value: 4
      }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

app.delete("/api/lessons/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("lesson_events")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

app.get("/api/lessons", async (req, res) => {
  const { student_id } = req.query;
  let query = supabase.from("lesson_events").select("*");

  if (student_id) {
    query = query.eq("student_id", student_id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get("/api/schedule", async (req, res) => {
  const { data, error } = await supabase
    .from("lesson_events")
    .select("*")
    .order("lesson_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
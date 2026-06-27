const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
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

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  return type === "Bearer" ? token : null;
}

async function getAccountByToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .from("accounts")
    .select("id, username")
    .eq("auth_token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function requireAuth(req, res) {
  const token = getBearerToken(req);
  const account = await getAccountByToken(token);
  if (!account) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return account;
}

async function getAccountStudentIds(accountId) {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("account_id", accountId);

  if (error) {
    throw error;
  }

  return data.map((row) => row.id);
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const { data: existing, error: existingError } = await supabase
    .from("accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ error: existingError.message });
  }

  if (existing) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const token = generateToken();
  const { data, error } = await supabase
    .from("accounts")
    .insert([{ username, password, auth_token: token }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ token, account: { id: data[0].id, username: data[0].username } });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const { data: account, error } = await supabase
    .from("accounts")
    .select("id, username")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!account) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = generateToken();
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ auth_token: token })
    .eq("id", account.id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ token, account });
});

app.get("/api/me", async (req, res) => {
  const account = await requireAuth(req, res);
  if (!account) return;
  res.json(account);
});

app.get("/api/students", async (req, res) => {
  const account = await requireAuth(req, res);
  if (!account) return;

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("account_id", account.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.post("/api/students", async (req, res) => {
  const account = await requireAuth(req, res);
  if (!account) return;

  const { name, instrument } = req.body;
  const { data, error } = await supabase
    .from("students")
    .insert([{ name, instrument, account_id: account.id }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

app.delete("/api/students/:id", async (req, res) => {
  const account = await requireAuth(req, res);
  if (!account) return;

  const { id } = req.params;
  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("id, account_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  if (!student || student.account_id !== account.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
  const account = await requireAuth(req, res);
  if (!account) return;

  const { id } = req.params;
  const { name, instrument } = req.body;
  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("id, account_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  if (!student || student.account_id !== account.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
  const account = await requireAuth(req, res);
  if (!account) return;

  const { student_id, lesson_date, material, homework, next_plan } = req.body;
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, account_id")
    .eq("id", student_id)
    .maybeSingle();

  if (studentError) {
    return res.status(500).json({ error: studentError.message });
  }

  if (!student || student.account_id !== account.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
  const account = await requireAuth(req, res);
  if (!account) return;

  const { student_id } = req.body;
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, account_id")
    .eq("id", student_id)
    .maybeSingle();

  if (studentError) {
    return res.status(500).json({ error: studentError.message });
  }

  if (!student || student.account_id !== account.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
  const account = await requireAuth(req, res);
  if (!account) return;

  const { id } = req.params;
  const { data: event, error: eventError } = await supabase
    .from("lesson_events")
    .select("id, student_id")
    .eq("id", id)
    .maybeSingle();

  if (eventError) {
    return res.status(500).json({ error: eventError.message });
  }

  if (!event) {
    return res.status(404).json({ error: "Lesson event not found" });
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, account_id")
    .eq("id", event.student_id)
    .maybeSingle();

  if (studentError) {
    return res.status(500).json({ error: studentError.message });
  }

  if (!student || student.account_id !== account.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
  const account = await requireAuth(req, res);
  if (!account) return;

  const { student_id } = req.query;
  let query;

  if (student_id) {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, account_id")
      .eq("id", student_id)
      .maybeSingle();

    if (studentError) {
      return res.status(500).json({ error: studentError.message });
    }

    if (!student || student.account_id !== account.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    query = supabase.from("lesson_events").select("*").eq("student_id", student_id);
  } else {
    const studentIds = await getAccountStudentIds(account.id);
    if (studentIds.length === 0) {
      return res.json([]);
    }
    query = supabase.from("lesson_events").select("*").in("student_id", studentIds);
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
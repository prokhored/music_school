import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl = "https://musbeszcufebiwtevabu.supabase.co"; 
// ↑ ЗАМЕНИ НА СВОЙ Project URL из Supabase Dashboard

// 2) anon key (публичный ключ)
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11c2Jlc3pjdWZlYml3dGV2YWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTUxMDUsImV4cCI6MjA5Nzk3MTEwNX0.GrdQto2lmUo-CMwiECN2B4nIqv60gB-uQrTocVM52z0";
// ↑ ЗАМЕНИ НА СВОЙ anon public key из Supabase Settings → API

/* ========================= */

const supabase = createClient(supabaseUrl, supabaseKey);


let currentStudentId = null;

/* =========================
   ЗАГРУЗКА УЧЕНИКОВ
   ========================= */

async function loadStudents() {

  const { data, error } = await supabase
    .from("students")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("students");
  container.innerHTML = "";

  data.forEach((s) => {

    const div = document.createElement("div");

    div.innerHTML = `
      <div style="padding:10px; border:1px solid #ccc; margin:5px;">
        
        <b>${s.name}</b> (${s.instrument})

        <br><br>

        <button onclick="openStudent('${s.id}', '${s.name}', '${s.instrument}')">
          Открыть
        </button>

        <button onclick="deleteStudent('${s.id}')" style="color:red;">
          Удалить
        </button>

      </div>
    `;

    container.appendChild(div);
  });
}

/* =========================
   ДОБАВИТЬ УЧЕНИКА
   ========================= */

async function addStudent() {

  const name = document.getElementById("name").value;
  const instrument = document.getElementById("instrument").value;

  const { error } = await supabase
    .from("students")
    .insert([
      { name, instrument }
    ]);

  if (error) {
    console.log(error);
    return;
  }

  loadStudents();
}

/* =========================
   УДАЛИТЬ УЧЕНИКА
   ========================= */

async function deleteStudent(id) {

  const ok = confirm("Удалить ученика?");
  if (!ok) return;

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    console.log(error);
    return;
  }

  loadStudents();
}

/* =========================
   ОТКРЫТЬ УЧЕНИКА
   ========================= */

async function openStudent(id, name, instrument) {

  currentStudentId = id;

  document.getElementById("studentView").style.display = "block";
  document.getElementById("studentName").innerText = name;
  document.getElementById("studentInstrument").innerText = instrument;

  loadLessons(id);
}

/* =========================
   ИСТОРИЯ УРОКОВ
   ========================= */

async function loadLessons(studentId) {

  const { data } = await supabase
    .from("lesson_events")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const container = document.getElementById("lessons");
  container.innerHTML = "";

  data.forEach((l) => {

    const div = document.createElement("div");

    div.innerHTML = `
      <div style="border-bottom:1px solid #ddd; padding:8px;">
        📘 ${l.material || "-"}<br>
        📚 ${l.homework || "-"}<br>
        ➡️ ${l.next_plan || "-"}<br>
        <small>${l.created_at}</small>
      </div>
    `;

    container.appendChild(div);
  });
}

/* =========================
   ДОБАВИТЬ УРОК
   ========================= */

async function addLessonFromCard() {

  const material = prompt("Материал:");
  const homework = prompt("Домашка:");
  const next = prompt("План:");

  const { error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id: currentStudentId,
        type: "lesson",
        value: -1,
        material,
        homework,
        next_plan: next
      }
    ]);

  if (error) {
    console.log(error);
    return;
  }

  loadLessons(currentStudentId);
} // 👈 ОБЯЗАТЕЛЬНО ЗАКРЫЛИ ФУНКЦИЮ

/* =========================
   АВТОЗАГРУЗКА
   ========================= */

window.addEventListener("DOMContentLoaded", () => {
  loadStudents();
});

/* =========================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
   ========================= */

window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.openStudent = openStudent;
window.addLessonFromCard = addLessonFromCard;

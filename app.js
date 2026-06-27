import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl = "https://musbeszcufebiwtevabu.supabase.co"; 
// ↑ ЗАМЕНИ НА СВОЙ Project URL из Supabase Dashboard

// 2) anon key (публичный ключ)
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11c2Jlc3pjdWZlYml3dGV2YWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTUxMDUsImV4cCI6MjA5Nzk3MTEwNX0.GrdQto2lmUo-CMwiECN2B4nIqv60gB-uQrTocVM52z0";
// ↑ ЗАМЕНИ НА СВОЙ anon public key из Supabase Settings → API

/* ========================= */

const supabase = createClient(supabaseUrl, supabaseKey);


async function loadStudents() {

  const { data, error } = await supabase
    .from("students")
    .select("*");

  // ❗ если ошибка — покажем в консоли
  if (error) {
    console.log("Ошибка загрузки:", error);
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

let currentStudentId = null;
async function openStudent(id, name, instrument) {

  currentStudentId = id;

  document.getElementById("studentView").style.display = "block";
  document.getElementById("studentName").innerText = name;
  document.getElementById("studentInstrument").innerText = instrument;

  loadLessons(id);
}

async function loadLessons(studentId) {

  const { data } = await supabase
    .from("lesson_events")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const container = document.getElementById("lessons");
  container.innerHTML = "";

  data.forEach(l => {

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

async function addLessonFromCard() {

  const material = prompt("Материал:");
  const homework = prompt("Домашка:");
  const next = prompt("План:");

  await supabase.from("lesson_events").insert([
    {
      student_id: currentStudentId,
      type: "lesson",
      value: -1,
      material,
      homework,
      next_plan: next
    }
  ]);

  loadLessons(currentStudentId);
}

async function addStudent() {

  // 🔴 берём данные из input'ов HTML
  const name = document.getElementById("name").value;
  const instrument = document.getElementById("instrument").value;

  const { error } = await supabase
    .from("students")
    .insert([
      {
        name: name,              // ← можно оставить так
        instrument: instrument   // ← или поменять названия полей
      }
    ]);

  if (error) {
    console.log("Ошибка добавления:", error);
    return;
  }

  // 🔄 обновляем список
  loadStudents();
}
async function deleteStudent(id) {

  const confirmDelete = confirm("Удалить ученика?");

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  // обновляем список после удаления
  loadStudents();
}

async function addLesson(studentId) {

  // 🔴 всплывающие окна (пока так, потом улучшим UI)
  const material = prompt("📘 Что проходили на уроке?");
  const homework = prompt("📚 Домашнее задание?");
  const nextPlan = prompt("➡️ План следующего урока?");

  const { error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id: studentId,

        type: "lesson",   // 🔴 НЕ ТРОГАЙ пока
        value: -1,        // 🔴 это значит "минус 1 занятие"

        material: material,
        homework: homework,
        next_plan: nextPlan
      }
    ]);

  if (error) {
    console.log("Ошибка урока:", error);
    return;
  }

  alert("Урок сохранён!");
}

window.addEventListener("DOMContentLoaded", () => {
  loadStudents();
});


window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.addLesson = addLesson;
window.loadStudents = loadStudents;

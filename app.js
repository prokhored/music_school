import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl = "https://musbeszcufebiwtevabu.supabase.co"; 
// ↑ ЗАМЕНИ НА СВОЙ Project URL из Supabase Dashboard

// 2) anon key (публичный ключ)
const supabaseKey = "sb_publishable_qAylcl5KsRcaKojJlcBxDw_vgqhFvfT";
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

  data.forEach(student => {

    const div = document.createElement("div");

    div.innerHTML = `
      <b>${student.name}</b> (${student.instrument})

      <!-- 🔴 СЮДА ПОТОМ ДОБАВИМ "ОСТАЛОСЬ ЗАНЯТИЙ" -->

      <button onclick="addLesson('${student.id}')">
        Провести урок
      </button>
    `;

    container.appendChild(div);
  });
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


window.addStudent = addStudent;
window.addLesson = addLesson;
window.loadStudents = loadStudents;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl = "https://musbeszcufebiwtevabu.supabase.co";
// ↑ ЗАМЕНИ НА СВОЙ Project URL из Supabase Dashboard

// 2) anon key (публичный ключ)
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11c2Jlc3pjdWZlYml3dGV2YWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTUxMDUsImV4cCI6MjA5Nzk3MTEwNX0.GrdQto2lmUo-CMwiECN2B4nIqv60gB-uQrTocVM52z0";
// ↑ ЗАМЕНИ НА СВОЙ anon public key из Supabase Settings → API

/* ========================= */

const supabase = createClient(supabaseUrl, supabaseKey);

let currentStudentId = null;
let currentStudentName = null;
let currentStudentInstrument = null;
let isAuthenticated = true;

function authenticateUser(authenticated) {
  isAuthenticated = authenticated;
  const mainContent = document.getElementById("mainContent");

  if (!mainContent) return;

  mainContent.style.display = "block";
  loadStudents();
}

function login() {
  authenticateUser(true);
}

function logout() {
  authenticateUser(true);
}

function isLoggedIn() {
  return true;
}

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
    div.className = "student-card";

    div.innerHTML = `
      <div class="student-name">${s.name}</div>
      <div class="student-instrument">${s.instrument}</div>
      <div class="button-group">
        <button class="btn-primary" onclick="openStudent('${s.id}', '${s.name}', '${s.instrument}')">
          👁️ Открыть
        </button>
        <button class="btn-danger" onclick="deleteStudent('${s.id}')">
          🗑️ Удалить
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
  currentStudentName = name;
  currentStudentInstrument = instrument;

  document.getElementById("studentView").style.display = "block";
  document.getElementById("studentName").innerText = name;
  document.getElementById("studentInstrument").innerText = instrument;
  document.getElementById("studentView").querySelector("#subscriptionInfo").innerText = "Осталось занятий: загрузка...";
  document.getElementById("editStudentForm").style.display = "none";
  document.getElementById("lessonForm").style.display = "none";

  loadLessons(id);
}

/* =========================
   ЗАКРЫТЬ ПРОФИЛЬ УЧЕНИКА
   ========================= */

function closeStudent() {
  document.getElementById("studentView").style.display = "none";
  currentStudentId = null;
}

/* =========================
   РЕДАКТИРОВАНИЕ УЧЕНИКА
   ========================= */

function toggleEditStudent() {
  const form = document.getElementById("editStudentForm");
  
  if (form.style.display === "none") {
    document.getElementById("editName").value = currentStudentName;
    document.getElementById("editInstrument").value = currentStudentInstrument;
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
}

async function saveEditStudent() {
  const newName = document.getElementById("editName").value;
  const newInstrument = document.getElementById("editInstrument").value;

  if (!newName || !newInstrument) {
    alert("Заполните все поля!");
    return;
  }

  const { error } = await supabase
    .from("students")
    .update({ name: newName, instrument: newInstrument })
    .eq("id", currentStudentId);

  if (error) {
    console.log(error);
    alert("Ошибка при сохранении!");
    return;
  }

  currentStudentName = newName;
  currentStudentInstrument = newInstrument;

  document.getElementById("studentName").innerText = newName;
  document.getElementById("studentInstrument").innerText = newInstrument;
  document.getElementById("editStudentForm").style.display = "none";

  loadStudents();
  alert("Ученик обновлён!");
}

/* =========================
   ПОКАЗАТЬ/СКРЫТЬ ФОРМУ УРОКА
   ========================= */

function currentYekDateTimeLocal() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Yekaterinburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+05:00`;
}

function toManualScheduleISO(dateTimeValue) {
  if (!dateTimeValue) return null;

  const [datePart, timePart = "00:00:00"] = dateTimeValue.split("T");
  const [year, month, day] = datePart.split("-");
  const [hours, minutes, seconds = "00"] = timePart.split(":");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:00`;
}

function toggleLessonForm() {
  const form = document.getElementById("lessonForm");
  if (form.style.display === "none") {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Yekaterinburg" }).split(" ")[0];
    document.getElementById("lessonDate").value = today;
    document.getElementById("scheduleLesson").value = currentYekDateTimeLocal();
    document.getElementById("lessonMaterial").value = "";
    document.getElementById("lessonHomework").value = "";
    document.getElementById("lessonPlan").value = "";
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
}

function formatDateTime(rawDate, withTime = true) {
  if (!rawDate) return "";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  const options = {
    timeZone: "Asia/Yekaterinburg",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  };

  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("ru-RU", options).format(date).replace(",", "");
}

/* =========================
   ИСТОРИЯ УРОКОВ
   ========================= */

async function loadLessons(studentId) {

  const { data, error } = await supabase
    .from("lesson_events")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("lessons");
  container.innerHTML = "";

  const remainingLessons = data.reduce((sum, event) => {
    return sum + (typeof event.value === "number" ? event.value : 0);
  }, 0);

  document.getElementById("subscriptionInfo").innerText = `Осталось занятий: ${remainingLessons}`;

  data.forEach((l) => {
    const div = document.createElement("div");
    div.className = "lesson-item";

    const eventDate = l.lesson_date ? l.lesson_date : l.created_at;
    const scheduleDate = l.schedule_date || l.schedule || null;
    const formattedDate = formatDateTime(eventDate);
    const formattedSchedule = scheduleDate ? formatDateTime(scheduleDate) : "-";

    if (l.type === "abonement") {
      div.innerHTML = `
        <div class="lesson-date">📅 ${formattedDate}</div>
        <div class="lesson-content">
          <strong>🎟️ Куплен абонемент:</strong> ${l.value || 4} занятия<br>
          <em>Тип события: абонемент</em>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="lesson-date">📅 ${formattedDate}</div>
        <div class="schedule-date">🗓️ Расписание: ${formattedSchedule}</div>
        <div class="lesson-content">
          <strong>📘 Материал:</strong> ${l.material || "-"}<br>
          <strong>📚 Домашка:</strong> ${l.homework || "-"}<br>
          <strong>➡️ План:</strong> ${l.next_plan || "-"}
        </div>
        <button class="btn-danger lesson-delete" onclick="deleteLesson('${l.id}')">
          🗑️ Удалить
        </button>
      `;
    }

    container.appendChild(div);
  });
}

/* =========================
   ДОБАВИТЬ УРОК
   ========================= */

async function addLessonFromCard() {

  const lessonDate = document.getElementById("lessonDate").value;
  const scheduleDate = document.getElementById("scheduleLesson").value;
  const material = document.getElementById("lessonMaterial").value;
  const homework = document.getElementById("lessonHomework").value;
  const next = document.getElementById("lessonPlan").value;

  if (!lessonDate || !material || !homework || !next) {
    alert("Заполните все поля!");
    return;
  }

  const lessonDateTime = currentYekDateTimeLocal();
  const scheduleDateTime = scheduleDate ? toManualScheduleISO(scheduleDate) : lessonDateTime;

  const { data, error: countError } = await supabase
    .from("lesson_events")
    .select("value")
    .eq("student_id", currentStudentId);

  if (countError) {
    console.log(countError);
    alert("Ошибка при проверке абонемента!");
    return;
  }

  const remainingLessons = data.reduce((sum, event) => {
    return sum + (typeof event.value === "number" ? event.value : 0);
  }, 0);

  if (remainingLessons <= 0) {
    alert("Нет доступных занятий. Купите абонемент на 4 занятия.");
    return;
  }

  const { error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id: currentStudentId,
        type: "lesson",
        value: -1,
        lesson_date: lessonDateTime,
        schedule_date: scheduleDateTime,
        material,
        homework,
        next_plan: next
      }
    ]);

  if (error) {
    console.log(error);
    alert("Ошибка при добавлении урока!");
    return;
  }

  loadLessons(currentStudentId);
  toggleLessonForm();
  alert("Урок добавлен!");
}

/* =========================
   УДАЛИТЬ УРОК
   ========================= */

async function deleteLesson(lessonId) {
  const ok = confirm("Удалить этот урок?");
  if (!ok) return;

  const { error } = await supabase
    .from("lesson_events")
    .delete()
    .eq("id", lessonId);

  if (error) {
    console.log(error);
    alert("Ошибка при удалении!");
    return;
  }

  loadLessons(currentStudentId);
  alert("Урок удалён!");
}

async function addSubscription() {
  if (!currentStudentId) {
    alert("Сначала откройте профиль ученика.");
    return;
  }

  const { error } = await supabase
    .from("lesson_events")
    .insert([
      {
        student_id: currentStudentId,
        type: "abonement",
        value: 4
      }
    ]);

  if (error) {
    console.log(error);
    alert("Ошибка при добавлении абонемента!");
    return;
  }

  loadLessons(currentStudentId);
  alert("Абонемент на 4 занятия добавлен!");
}
async function loadSchedule() {
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*");

  if (studentsError) {
    console.log(studentsError);
    return;
  }

  const studentMap = students.reduce((map, student) => {
    map[student.id] = student;
    return map;
  }, {});

  const { data: events, error: eventsError } = await supabase
    .from("lesson_events")
    .select("*")
    .order("lesson_date", { ascending: true });

  if (eventsError) {
    console.log(eventsError);
    return;
  }

  const scheduleContainer = document.getElementById("schedule");
  scheduleContainer.innerHTML = "";

  const lessons = events.filter((event) => event.type === "lesson");

  if (lessons.length === 0) {
    scheduleContainer.innerHTML = `<p class="empty-state">Нет запланированных уроков.</p>`;
    return;
  }

  lessons.forEach((lesson) => {
    const student = studentMap[lesson.student_id] || { name: "Неизвестный", instrument: "" };
    const eventDate = lesson.lesson_date || lesson.created_at;
    const schedule = lesson.schedule_date || lesson.schedule || null;
    const formattedDate = formatDateTime(eventDate);
    const formattedSchedule = schedule ? formatDateTime(schedule) : "-";

    const card = document.createElement("div");
    card.className = "lesson-item schedule-item";
    card.innerHTML = `
      <div class="lesson-date">📅 ${formattedDate}</div>
      <div class="schedule-date">🗓️ Расписание: ${formattedSchedule}</div>
      <div class="lesson-content">
        <strong>Ученик:</strong> ${student.name} ${student.instrument ? `(${student.instrument})` : ""}<br>
        <strong>Материал:</strong> ${lesson.material || "-"}<br>
        <strong>Домашка:</strong> ${lesson.homework || "-"}<br>
        <strong>Следующий план:</strong> ${lesson.next_plan || "-"}
      </div>
    `;

    scheduleContainer.appendChild(card);
  });
}
/* =========================
   АВТОЗАГРУЗКА
   ========================= */

window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mainContent")) {
    authenticateUser(isLoggedIn());
  }

  if (document.getElementById("schedule")) {
    loadSchedule();
  }
});

/* =========================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
   ========================= */

window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.openStudent = openStudent;
window.closeStudent = closeStudent;
window.toggleEditStudent = toggleEditStudent;
window.saveEditStudent = saveEditStudent;
window.toggleLessonForm = toggleLessonForm;
window.addLessonFromCard = addLessonFromCard;
window.deleteLesson = deleteLesson;
window.addSubscription = addSubscription;
window.login = login;
window.logout = logout;

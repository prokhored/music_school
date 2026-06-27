const API_ROOT = "";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || response.statusText);
  }

  return response.json();
}

const AUTH_USERS = [
  { username: "admin", password: "1234" }
];

let currentStudentId = null;
let currentStudentName = null;
let currentStudentInstrument = null;
let isAuthenticated = false;

function authenticateUser(authenticated) {
  isAuthenticated = authenticated;
  const authSection = document.getElementById("authSection");
  const mainContent = document.getElementById("mainContent");
  const logoutButton = document.getElementById("logoutButton");

  if (!authSection || !mainContent || !logoutButton) return;

  if (authenticated) {
    authSection.style.display = "none";
    mainContent.style.display = "block";
    logoutButton.style.display = "inline-block";
    loadStudents();
  } else {
    authSection.style.display = "block";
    mainContent.style.display = "none";
    logoutButton.style.display = "none";
  }
}

function login() {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const user = AUTH_USERS.find((u) => u.username === username && u.password === password);

  if (!user) {
    alert("Неверный логин или пароль.");
    return;
  }

  sessionStorage.setItem("music_crm_logged_in", "yes");
  authenticateUser(true);
}

function logout() {
  sessionStorage.removeItem("music_crm_logged_in");
  authenticateUser(false);
}

function isLoggedIn() {
  return sessionStorage.getItem("music_crm_logged_in") === "yes";
}

/* =========================
   ЗАГРУЗКА УЧЕНИКОВ
   ========================= */

async function loadStudents() {
  try {
    const data = await apiRequest("/api/students");
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
  } catch (error) {
    console.error(error);
    alert("Ошибка при загрузке учеников.");
  }
}

/* =========================
   ДОБАВИТЬ УЧЕНИКА
   ========================= */

async function addStudent() {
  const name = document.getElementById("name").value.trim();
  const instrument = document.getElementById("instrument").value.trim();

  if (!name || !instrument) {
    alert("Заполните все поля!");
    return;
  }

  try {
    await apiRequest("/api/students", {
      method: "POST",
      body: JSON.stringify({ name, instrument }),
    });
    loadStudents();
  } catch (error) {
    console.error(error);
    alert("Ошибка при добавлении ученика!");
  }
}

/* =========================
   УДАЛИТЬ УЧЕНИКА
   ========================= */

async function deleteStudent(id) {
  const ok = confirm("Удалить ученика?");
  if (!ok) return;

  try {
    await apiRequest(`/api/students/${id}`, {
      method: "DELETE",
    });
    loadStudents();
  } catch (error) {
    console.error(error);
    alert("Ошибка при удалении ученика!");
  }
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
  document.getElementById("subscriptionInfo").innerText = "Осталось занятий: загрузка...";
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
  const newName = document.getElementById("editName").value.trim();
  const newInstrument = document.getElementById("editInstrument").value.trim();

  if (!newName || !newInstrument) {
    alert("Заполните все поля!");
    return;
  }

  try {
    await apiRequest(`/api/students/${currentStudentId}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName, instrument: newInstrument }),
    });
  } catch (error) {
    console.error(error);
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

function toggleLessonForm() {
  const form = document.getElementById("lessonForm");
  if (form.style.display === "none") {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("lessonDate").value = today;
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleString("ru-RU", options).replace(",", "");
}

/* =========================
   ИСТОРИЯ УРОКОВ
   ========================= */

async function loadLessons(studentId) {
  try {
    const data = await apiRequest(`/api/lessons?student_id=${studentId}`);
    const container = document.getElementById("lessons");
    container.innerHTML = "";

    const remainingLessons = data.reduce((sum, event) => {
      return sum + (typeof event.value === "number" ? event.value : 0);
    }, 0);

    document.getElementById("subscriptionInfo").innerText = `Осталось занятий: ${remainingLessons}`;

    data.forEach((l) => {
      const div = document.createElement("div");
      div.className = "lesson-item";
      const eventDate = l.lesson_date || l.created_at;
      const formattedDate = formatDateTime(eventDate);

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
  } catch (error) {
    console.error(error);
    alert("Ошибка при загрузке уроков.");
  }
}

/* =========================
   ДОБАВИТЬ УРОК
   ========================= */

async function addLessonFromCard() {
  const lessonDate = document.getElementById("lessonDate").value;
  const material = document.getElementById("lessonMaterial").value.trim();
  const homework = document.getElementById("lessonHomework").value.trim();
  const next = document.getElementById("lessonPlan").value.trim();

  if (!lessonDate || !material || !homework || !next) {
    alert("Заполните все поля!");
    return;
  }

  try {
    const data = await apiRequest(`/api/lessons?student_id=${currentStudentId}`);
    const remainingLessons = data.reduce((sum, event) => {
      return sum + (typeof event.value === "number" ? event.value : 0);
    }, 0);

    if (remainingLessons <= 0) {
      alert("Нет доступных занятий. Купите абонемент на 4 занятия.");
      return;
    }

    await apiRequest("/api/lessons", {
      method: "POST",
      body: JSON.stringify({
        student_id: currentStudentId,
        lesson_date: lessonDate,
        material,
        homework,
        next_plan: next,
      }),
    });

    loadLessons(currentStudentId);
    toggleLessonForm();
    alert("Урок добавлен!");
  } catch (error) {
    console.error(error);
    alert("Ошибка при добавлении урока!");
  }
}

/* =========================
   УДАЛИТЬ УРОК
   ========================= */

async function deleteLesson(lessonId) {
  const ok = confirm("Удалить этот урок?");
  if (!ok) return;

  try {
    await apiRequest(`/api/lessons/${lessonId}`, {
      method: "DELETE",
    });
    loadLessons(currentStudentId);
    alert("Урок удалён!");
  } catch (error) {
    console.error(error);
    alert("Ошибка при удалении!");
  }
}

async function addSubscription() {
  if (!currentStudentId) {
    alert("Сначала откройте профиль ученика.");
    return;
  }

  try {
    await apiRequest("/api/abonements", {
      method: "POST",
      body: JSON.stringify({ student_id: currentStudentId }),
    });

    loadLessons(currentStudentId);
    alert("Абонемент на 4 занятия добавлен!");
  } catch (error) {
    console.error(error);
    alert("Ошибка при добавлении абонемента!");
  }
}

async function loadSchedule() {
  try {
    const students = await apiRequest("/api/students");
    const studentMap = students.reduce((map, student) => {
      map[student.id] = student;
      return map;
    }, {});

    const events = await apiRequest("/api/schedule");
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
      const formattedDate = formatDateTime(eventDate);

      const card = document.createElement("div");
      card.className = "lesson-item schedule-item";
      card.innerHTML = `
        <div class="lesson-date">📅 ${formattedDate}</div>
        <div class="lesson-content">
          <strong>Ученик:</strong> ${student.name} ${student.instrument ? `(${student.instrument})` : ""}<br>
          <strong>Материал:</strong> ${lesson.material || "-"}<br>
          <strong>Домашка:</strong> ${lesson.homework || "-"}<br>
          <strong>Следующий план:</strong> ${lesson.next_plan || "-"}
        </div>
      `;

      scheduleContainer.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    alert("Ошибка при загрузке расписания.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("authSection")) {
    authenticateUser(isLoggedIn());
  }

  if (document.getElementById("schedule")) {
    loadSchedule();
  }
});

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

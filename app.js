const view = document.querySelector("#view");
const names = {
  inicio: "Visão geral",
  alunos: "Alunos",
  turmas: "Turmas",
  matriculas: "Matrículas",
  disciplinas: "Disciplinas",
  notas: "Lançar notas",
  boletim: "Boletim",
};
const series = ["1º ano", "2º ano", "3º ano"];
let data;
let currentPage = location.hash.slice(1) || "inicio";
let selectedEnrollment =
  new URLSearchParams(location.search).get("matricula") || "";
const APP_BASE = location.pathname.replace(/\/?$/, "/");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const fullName = (id) =>
  data.students.find((item) => item.id === id)?.name || "—";
const className = (id) => {
  const item = data.classes.find((entry) => entry.id === id);
  return item ? `${item.grade} ${item.group} — ${item.year}` : "—";
};
const studentInitials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const selected = (a, b) => (String(a) === String(b) ? " selected" : "");
const optionList = (items, value, label) =>
  items
    .map(
      (item) =>
        `<option value="${esc(value(item))}"${selected(value(item), label._selected)}>${esc(label(item))}</option>`,
    )
    .join("");
const clsOptions = (chosen = "") =>
  data.classes
    .map(
      (item) =>
        `<option value="${item.id}"${selected(item.id, chosen)}>${esc(className(item.id))}</option>`,
    )
    .join("");
const studentOptions = (chosen = "") =>
  data.students
    .map(
      (item) =>
        `<option value="${item.id}"${selected(item.id, chosen)}>${esc(item.name)} (${esc(item.registration)})</option>`,
    )
    .join("");
const showToast = (message, error = false) => {
  const toast = document.createElement("div");
  toast.className = `toast${error ? " error" : ""}`;
  toast.textContent = message;
  document.querySelector("#toast-region").append(toast);
  setTimeout(() => toast.remove(), 3200);
};
async function refresh() {
  const response = await fetch(`${APP_BASE}api/data`);
  if (!response.ok) throw new Error("Não foi possível carregar os dados.");
  data = await response.json();
  render();
}
async function api(path, body) {
  const response = await fetch(`${APP_BASE}${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Não foi possível concluir.");
  return result;
}
function pageHeading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">GESTÃO ESCOLAR &nbsp; / &nbsp; ${esc(title)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${action}</div>`;
}
function cardTitle(title, subtitle = "") {
  return `<div class="panel-heading"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div></div>`;
}
function formField(label, name, placeholder = "", type = "text", extra = "") {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" ${extra} required></div>`;
}
function selectField(label, name, options, empty = "Selecione") {
  return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" required><option value="">${empty}</option>${options}</select></div>`;
}
function submitForm(id, label) {
  return `<div class="form-actions"><button class="button primary" type="submit">${label} <span>→</span></button></div>`;
}
function table(headers, rows) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="empty">Ainda não há registros para exibir.</td></tr>`}</tbody></table></div>`;
}
function go(page) {
  document.querySelector(".sidebar").classList.remove("open");
  if (currentPage !== page) location.hash = page;
}
function dashboard() {
  const studentCount = data.students.length,
    classCount = data.classes.length,
    enrolledCount = data.enrollments.length,
    subjectCount = data.subjects.length;
  return `${pageHeading("Visão geral", "Acompanhe os principais indicadores e a rotina da sua escola.", `<button class="button primary" data-go="alunos">＋ &nbsp; Novo aluno</button>`)}<section class="welcome-card"><div><div class="eyebrow">SEGUNDA-FEIRA, 26 DE OUTUBRO</div><h2>Olá, Rafael! 👋</h2><p>Veja o que está acontecendo na sua escola hoje.</p><button class="button secondary small" data-go="notas">Lançar notas <span>→</span></button></div><div class="welcome-art">▧</div></section><section class="stats-grid"><article class="stat-card"><div class="stat-top">ALUNOS CADASTRADOS<span class="stat-icon">♙</span></div><div class="stat-number">${studentCount}</div><div class="stat-note"><strong>●</strong> Lista atualizada</div></article><article class="stat-card"><div class="stat-top">TURMAS ATIVAS<span class="stat-icon green">▦</span></div><div class="stat-number">${classCount}</div><div class="stat-note">No ano letivo de 2026</div></article><article class="stat-card"><div class="stat-top">MATRÍCULAS<span class="stat-icon amber">▤</span></div><div class="stat-number">${enrolledCount}</div><div class="stat-note">Alunos vinculados às turmas</div></article><article class="stat-card"><div class="stat-top">DISCIPLINAS<span class="stat-icon purple">▧</span></div><div class="stat-number">${subjectCount}</div><div class="stat-note">Matérias cadastradas</div></article></section><section class="dashboard-grid"><article class="panel">${cardTitle("Panorama escolar", "Notas lançadas ao longo do ano")}<div class="legend"><span><i></i> Matrículas</span><span><i class="orange"></i> Notas registradas</span></div><div class="chart-wrap"><div class="chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div class="chart-lines"><i></i><i></i><i></i><i></i><i></i></div><svg class="chart-svg" viewBox="0 0 600 140" preserveAspectRatio="none" aria-label="Gráfico de atividade escolar"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5472ee" stop-opacity=".19"/><stop offset="1" stop-color="#5472ee" stop-opacity="0"/></linearGradient></defs><path d="M0 116 C45 108 53 80 105 91 S158 65 210 73 S267 44 315 62 S370 40 420 48 S470 29 520 35 S563 18 600 22 V140 H0Z" fill="url(#area)"/><path d="M0 116 C45 108 53 80 105 91 S158 65 210 73 S267 44 315 62 S370 40 420 48 S470 29 520 35 S563 18 600 22" fill="none" stroke="#5472ee" stroke-width="3" stroke-linecap="round"/><path d="M0 128 C45 120 62 118 105 110 S162 102 210 108 S266 94 315 98 S367 84 420 92 S468 77 520 82 S566 69 600 74" fill="none" stroke="#eea64b" stroke-width="2.5" stroke-linecap="round"/></svg><div class="chart-labels"><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span></div></div></article><article class="panel">${cardTitle("Atividade recente", "Últimas atualizações no sistema")}<div class="activity"><div class="activity-item"><span class="activity-icon">♙</span><div><b>${studentCount} alunos cadastrados</b><p>Cadastros disponíveis no sistema</p></div><time>hoje</time></div><div class="activity-item"><span class="activity-icon">▤</span><div><b>${enrolledCount} matrículas ativas</b><p>Alunos vinculados a turmas</p></div><time>2026</time></div><div class="activity-item"><span class="activity-icon">✎</span><div><b>${data.grades.length} notas lançadas</b><p>Registros de avaliação trimestral</p></div><time>2026</time></div></div><button class="link-button" style="margin-top:20px;padding:0" data-go="boletim">Consultar boletins →</button></article></section><section class="quick-links"><button class="quick-link" data-go="alunos"><span>♙</span><b>Cadastrar aluno</b><small>Adicione um novo estudante</small></button><button class="quick-link" data-go="matriculas"><span>▤</span><b>Fazer matrícula</b><small>Vincule um aluno a uma turma</small></button><button class="quick-link" data-go="notas"><span>✎</span><b>Lançar notas</b><small>Registre uma avaliação trimestral</small></button></section>`;
}
function studentRows() {
  return data.students
    .map((student) => {
      const enrollment = data.enrollments.find(
        (item) => item.studentId === student.id,
      );
      return `<tr data-student-row data-search="${esc(`${student.name} ${student.registration}`.toLowerCase())}"><td><div class="student-cell"><span class="mini-avatar">${studentInitials(esc(student.name))}</span>${esc(student.name)}</div></td><td>${esc(student.registration)}</td><td><span class="badge">Ativo</span></td><td>${enrollment ? `<button class="link-button" data-report-enrollment="${esc(enrollment.id)}">Ver boletim →</button>` : '<span style="color:#9ba5b3">Sem matrícula</span>'}</td></tr>`;
    })
    .join("");
}
function studentsPage() {
  const rows = studentRows();
  return `${pageHeading("Alunos", "Cadastre e acompanhe os estudantes da sua escola.", `<button class="button primary" onclick="document.querySelector('#student-name').focus()">＋ &nbsp; Novo aluno</button>`)}<div class="content-layout"><div><section class="panel form-panel">${cardTitle("Cadastrar aluno", "Preencha os dados para adicionar um estudante.")}<form id="student-form"><div class="form-grid">${formField("Nome completo", "student-name", "Ex.: Ana Clara Souza")}${formField("Matrícula", "student-registration", "Ex.: 2026004")}</div>${submitForm("student-form", "Cadastrar aluno")}</form></section><section class="panel table-panel"><div class="table-top"><h2>Alunos cadastrados</h2><span id="student-count">${data.students.length} estudantes</span></div><div class="student-search"><label class="sr-only" for="student-search">Buscar aluno</label><input id="student-search" type="search" placeholder="Buscar por nome ou matrícula…" autocomplete="off"></div>${table(["Aluno", "Matrícula", "Situação", ""], rows)}</section></div><aside class="panel"><div class="side-note"><h3>Cadastro de estudantes</h3><p>Cada aluno precisa de uma matrícula única para ser identificado no sistema escolar.</p><p class="tip">Dica: use o número oficial de matrícula da escola para facilitar a busca.</p></div></aside></div>`;
}
function classesPage() {
  const rows = data.classes
    .map(
      (c) =>
        `<tr><td><b>${esc(c.grade)}</b></td><td><span class="badge blue">${esc(c.group)}</span></td><td>${c.year}</td><td>${data.enrollments.filter((en) => en.classId === c.id).length} alunos</td></tr>`,
    )
    .join("");
  return `${pageHeading("Turmas", "Organize as turmas e séries do ano letivo.")}<div class="content-layout"><div><section class="panel form-panel">${cardTitle("Cadastrar turma", "As turmas da mesma série compartilham as disciplinas vinculadas.")}<form id="class-form"><div class="form-grid">${selectField("Série", "class-grade", series.map((s) => `<option value="${s}">${s}</option>`).join(""))}${formField("Identificação da turma", "class-group", "Ex.: INFO A")}${formField("Ano letivo", "class-year", "2026", "number", 'value="2026" min="2000" max="2100"')}</div>${submitForm("class-form", "Cadastrar turma")}</form></section><section class="panel table-panel"><div class="table-top"><h2>Turmas cadastradas</h2><span>${data.classes.length} turmas</span></div>${table(["Série", "Turma", "Ano letivo", "Alunos"], rows)}</section></div><aside class="panel"><div class="side-note"><h3>Organização simples</h3><p>Exemplo: 2º ano INFO A. O ano letivo diferencia turmas com o mesmo nome em períodos diferentes.</p><p class="tip">As disciplinas são associadas à série e ficam disponíveis para todas as turmas dela.</p></div></aside></div>`;
}
function enrollmentsPage() {
  const rows = data.enrollments
    .map(
      (e) =>
        `<tr><td><div class="student-cell"><span class="mini-avatar">${studentInitials(esc(fullName(e.studentId)))}</span>${esc(fullName(e.studentId))}</div></td><td>${esc(data.students.find((s) => s.id === e.studentId)?.registration)}</td><td>${esc(className(e.classId))}</td><td><span class="badge">Matriculado</span></td></tr>`,
    )
    .join("");
  return `${pageHeading("Matrículas", "Vincule estudantes às turmas do ano letivo.")}<div class="content-layout"><div><section class="panel form-panel">${cardTitle("Nova matrícula", "Cada aluno pode pertencer a uma única turma em cada ano letivo.")}<form id="enrollment-form"><div class="form-grid">${selectField("Aluno", "enrollment-student", studentOptions())}${selectField("Turma", "enrollment-class", clsOptions())}</div>${submitForm("enrollment-form", "Matricular aluno")}</form></section><section class="panel table-panel"><div class="table-top"><h2>Matrículas ativas</h2><span>${data.enrollments.length} alunos</span></div>${table(["Aluno", "Matrícula", "Turma", "Situação"], rows)}</section></div><aside class="panel"><div class="side-note"><h3>Regra de matrícula</h3><p>Um estudante só pode ter uma matrícula por ano letivo. No próximo ano, uma nova matrícula poderá ser feita normalmente.</p><p class="tip">Cadastre alunos e turmas antes de efetuar a matrícula.</p></div></aside></div>`;
}
function subjectsPage() {
  const rows = data.subjects
    .map(
      (s) =>
        `<tr><td><div class="student-cell"><span class="mini-avatar">▧</span>${esc(s.name)}</div></td><td>${s.grades.map((g) => `<span class="badge blue" style="margin:2px">${esc(g)}</span>`).join("") || '<span style="color:#9ba5b3">Sem série vinculada</span>'}</td><td>${s.grades.length} séries</td></tr>`,
    )
    .join("");
  return `${pageHeading("Disciplinas", "Cadastre matérias e defina em quais séries são oferecidas.")}<div class="content-layout"><div><section class="panel form-panel">${cardTitle("Cadastrar disciplina", "A matéria fica disponível para ser vinculada às séries.")}<form id="subject-form"><div class="form-grid">${formField("Nome da disciplina", "subject-name", "Ex.: Ciências")}</div>${submitForm("subject-form", "Cadastrar disciplina")}</form></section><section class="panel form-panel">${cardTitle("Vincular disciplina à série", "O vínculo vale para todas as turmas dessa série.")}<form id="link-form"><div class="form-grid">${selectField("Série", "link-grade", series.map((s) => `<option value="${s}">${s}</option>`).join(""))}${selectField("Disciplina", "link-subject", data.subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join(""))}</div>${submitForm("link-form", "Vincular série")}</form></section><section class="panel table-panel"><div class="table-top"><h2>Disciplinas cadastradas</h2><span>${data.subjects.length} matérias</span></div>${table(["Disciplina", "Séries vinculadas", "Abrangência"], rows)}</section></div><aside class="panel"><div class="side-note"><h3>Vínculo por série</h3><p>As turmas A, B e C da mesma série compartilham as disciplinas cadastradas.</p><p class="tip">Uma disciplina precisa estar vinculada à série para que notas possam ser lançadas.</p></div></aside></div>`;
}
function notesPage() {
  const defaults = data.enrollments[0]?.id || "";
  return `${pageHeading("Lançar notas", "Registre as avaliações trimestrais dos alunos.")}<section class="panel form-panel">${cardTitle("Nova avaliação", "Escolha uma matrícula, disciplina e trimestre. Notas válidas de 0 a 10.")}<form id="grade-form"><div class="grade-control">${selectField("Aluno e turma", "grade-enrollment", data.enrollments.map((e) => `<option value="${e.id}"${selected(e.id, defaults)}>${esc(fullName(e.studentId))} · ${esc(className(e.classId))}</option>`).join(""))}${selectField("Disciplina", "grade-subject", "")}${selectField("Trimestre", "grade-term", '<option value="1">1º trimestre</option><option value="2">2º trimestre</option><option value="3">3º trimestre</option>')}${formField("Nota", "grade-value", "0,0", "number", 'min="0" max="10" step="0.1"')}<button class="button primary" type="submit">Salvar nota <span>✓</span></button></div></form></section><section class="panel table-panel"><div class="table-top"><h2>Notas registradas</h2><span>${data.grades.length} avaliações</span></div><div class="filter-row" style="padding:14px 16px 0;margin:0"><div class="field"><label for="grade-filter">Filtrar por turma</label><select id="grade-filter"><option value="">Todas as turmas</option>${clsOptions()}</select></div><div class="field"><label for="subject-filter">Filtrar por disciplina</label><select id="subject-filter"><option value="">Todas as disciplinas</option>${data.subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div></div><div id="grades-table"></div></section>`;
}
function renderGrades() {
  const classFilter = document.querySelector("#grade-filter")?.value || "",
    subjectFilter = document.querySelector("#subject-filter")?.value || "";
  const rows = data.grades
    .filter(
      (g) =>
        (!subjectFilter || g.subjectId === subjectFilter) &&
        (!classFilter ||
          data.enrollments.find((e) => e.id === g.enrollmentId)?.classId ===
            classFilter),
    )
    .map((g) => {
      const en = data.enrollments.find((e) => e.id === g.enrollmentId),
        student = data.students.find((s) => s.id === en?.studentId),
        subject = data.subjects.find((s) => s.id === g.subjectId);
      return `<tr><td><div class="student-cell"><span class="mini-avatar">${studentInitials(esc(student?.name || "?"))}</span>${esc(student?.name)}</div></td><td>${esc(subject?.name)}</td><td>${esc(className(en?.classId))}</td><td>${g.term}º</td><td><span class="grade-bubble">${Number(g.grade).toFixed(2)}</span></td></tr>`;
    })
    .join("");
  document.querySelector("#grades-table").innerHTML = table(
    ["Aluno", "Disciplina", "Turma", "Trimestre", "Nota"],
    rows,
  );
}
function reportPage() {
  const defaultEnrollment = data.enrollments.some(
    (e) => e.id === selectedEnrollment,
  )
    ? selectedEnrollment
    : data.enrollments[0]?.id || "";
  return `${pageHeading("Boletim", "Consulte as notas e médias trimestrais de cada estudante.")}<section class="panel form-panel">${cardTitle("Consultar boletim", "Selecione a matrícula que deseja consultar.")}<form id="report-form"><div class="filter-row">${selectField("Aluno e turma", "report-enrollment", data.enrollments.map((e) => `<option value="${e.id}"${selected(e.id, defaultEnrollment)}>${esc(fullName(e.studentId))} · ${esc(className(e.classId))}</option>`).join(""))}<button class="button primary" type="submit">Consultar boletim <span>→</span></button></div></form></section><div id="report-result"></div>`;
}
async function loadReport(enrollmentId) {
  if (!enrollmentId) {
    document.querySelector("#report-result").innerHTML =
      '<section class="panel empty">Cadastre um aluno e faça a matrícula para consultar o boletim.</section>';
    return;
  }
  const response = await fetch(
    `${APP_BASE}api/report?enrollmentId=${encodeURIComponent(enrollmentId)}`,
  );
  const report = await response.json();
  if (!response.ok) {
    showToast(report.error, true);
    return;
  }
  const rows = report.rows
    .map(
      (row) =>
        `<tr><td><div class="student-cell"><span class="mini-avatar">▧</span>${esc(row.subject)}</div></td>${row.terms.map((term) => `<td>${term === null ? "—" : Number(term).toFixed(2)}</td>`).join("")}<td>${row.average === null ? "—" : `<span class="grade-bubble">${row.average.toFixed(2)}</span>`}</td></tr>`,
    )
    .join("");
  const allTerms = report.rows.flatMap((row) => row.terms);
  const overall =
    allTerms.every((value) => value !== null) && allTerms.length
      ? Number(
          (allTerms.reduce((a, b) => a + b, 0) / allTerms.length).toFixed(2),
        )
      : null;
  document.querySelector("#report-result").innerHTML =
    `<section class="report-header"><div class="eyebrow">BOLETIM INDIVIDUAL</div><h2>${esc(report.student.name)} <span style="color:#7584b7;font-weight:500">— matrícula ${esc(report.student.registration)}</span></h2><div class="report-meta">${esc(className(report.schoolClass.id))} &nbsp; · &nbsp; Ano letivo ${report.schoolClass.year}</div></section><section class="panel table-panel"><div class="table-top"><h2>Desempenho por disciplina</h2><span>Notas de 0 a 10</span></div>${table(["Disciplina", "1º tri", "2º tri", "3º tri", "Média"], rows)}</section><section class="panel average-card"><small>Média geral ${overall === null ? "· aguardando os três trimestres" : ""}</small><b>${overall === null ? "—" : overall.toFixed(2)}</b></section><p style="font-size:10px;color:#8994a4;margin:10px 2px">“—” indica nota ainda não registrada. A média é calculada após o lançamento dos três trimestres.</p>`;
}
function updateGradeSubjects() {
  const enrollment = data.enrollments.find(
    (item) => item.id === document.querySelector("#grade-enrollment")?.value,
  );
  const schoolClass = data.classes.find(
    (item) => item.id === enrollment?.classId,
  );
  const subjects = data.subjects.filter((item) =>
    item.grades.includes(schoolClass?.grade),
  );
  document.querySelector("#grade-subject").innerHTML = subjects.length
    ? subjects
        .map((item) => `<option value="${item.id}">${esc(item.name)}</option>`)
        .join("")
    : '<option value="">Nenhuma disciplina vinculada</option>';
}
function render() {
  if (!data) return;
  const page = names[currentPage] ? currentPage : "inicio";
  currentPage = page;
  document
    .querySelectorAll(".nav-item")
    .forEach((item) =>
      item.classList.toggle("active", item.dataset.page === page),
    );
  document.querySelector("#breadcrumb-current").textContent = names[page];
  view.innerHTML = {
    inicio: dashboard,
    alunos: studentsPage,
    turmas: classesPage,
    matriculas: enrollmentsPage,
    disciplinas: subjectsPage,
    notas: notesPage,
    boletim: reportPage,
  }[page]();
  if (page === "notas") {
    updateGradeSubjects();
    renderGrades();
    document
      .querySelector("#grade-filter")
      .addEventListener("change", renderGrades);
    document
      .querySelector("#subject-filter")
      .addEventListener("change", renderGrades);
  }
  if (page === "boletim") {
    const select = document.querySelector("#report-enrollment");
    if (select.value) loadReport(select.value);
    else loadReport("");
  }
}
document.addEventListener("click", (event) => {
  const reportLink = event.target.closest("[data-report-enrollment]");
  if (reportLink) {
    selectedEnrollment = reportLink.dataset.reportEnrollment;
    go("boletim");
    return;
  }
  const link = event.target.closest("[data-go]");
  if (link) {
    event.preventDefault();
    go(link.dataset.go);
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id !== "student-search") return;
  const query = event.target.value.trim().toLocaleLowerCase("pt-BR");
  let visible = 0;
  document.querySelectorAll("[data-student-row]").forEach((row) => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) visible++;
  });
  document.querySelector("#student-count").textContent =
    `${visible} de ${data.students.length} estudantes`;
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("form")) return;
  event.preventDefault();
  const fd = new FormData(form);
  const values = Object.fromEntries(fd.entries());
  try {
    if (form.id === "student-form")
      await api("/api/students", {
        name: values["student-name"],
        registration: values["student-registration"],
      });
    if (form.id === "class-form")
      await api("/api/classes", {
        grade: values["class-grade"],
        group: values["class-group"],
        year: Number(values["class-year"]),
      });
    if (form.id === "subject-form")
      await api("/api/subjects", { name: values["subject-name"] });
    if (form.id === "link-form")
      await api("/api/subjects/link", {
        grade: values["link-grade"],
        subjectId: values["link-subject"],
      });
    if (form.id === "enrollment-form")
      await api("/api/enrollments", {
        studentId: values["enrollment-student"],
        classId: values["enrollment-class"],
      });
    if (form.id === "grade-form")
      await api("/api/grades", {
        enrollmentId: values["grade-enrollment"],
        subjectId: values["grade-subject"],
        term: Number(values["grade-term"]),
        grade: Number(values["grade-value"]),
      });
    if (form.id === "report-form") {
      selectedEnrollment = values["report-enrollment"];
      await loadReport(selectedEnrollment);
      return;
    }
    showToast("Alterações salvas com sucesso.");
    await refresh();
  } catch (error) {
    showToast(error.message, true);
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "grade-enrollment") updateGradeSubjects();
});
document.querySelectorAll(".nav-item").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    go(link.dataset.page);
  }),
);
document
  .querySelector("#mobile-menu")
  .addEventListener("click", () =>
    document.querySelector(".sidebar").classList.toggle("open"),
  );
window.addEventListener("hashchange", () => {
  currentPage = location.hash.slice(1) || "inicio";
  render();
});
refresh().catch((error) => {
  view.innerHTML = `<section class="panel empty">${esc(error.message)} Verifique se o servidor está em execução.</section>`;
});

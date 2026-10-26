const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const seed = () => ({
  students: [
    { id: 'aluno-1', name: 'Ana Clara Souza', registration: '2026001' },
    { id: 'aluno-2', name: 'Lucas Oliveira', registration: '2026002' },
    { id: 'aluno-3', name: 'Mariana Costa', registration: '2026003' }
  ],
  classes: [
    { id: 'turma-1', grade: '1º ano', group: 'INFO A', year: 2026 },
    { id: 'turma-2', grade: '2º ano', group: 'INFO B', year: 2026 },
    { id: 'turma-3', grade: '3º ano', group: 'INFO A', year: 2026 }
  ],
  subjects: [
    { id: 'disc-1', name: 'Matemática', grades: ['1º ano', '2º ano', '3º ano'] },
    { id: 'disc-2', name: 'Língua Portuguesa', grades: ['1º ano', '2º ano', '3º ano'] },
    { id: 'disc-3', name: 'Interface Web II', grades: ['2º ano', '3º ano'] },
    { id: 'disc-4', name: 'Física', grades: ['2º ano', '3º ano'] }
  ],
  enrollments: [
    { id: 'mat-1', studentId: 'aluno-1', classId: 'turma-1' },
    { id: 'mat-2', studentId: 'aluno-2', classId: 'turma-2' },
    { id: 'mat-3', studentId: 'aluno-3', classId: 'turma-2' }
  ],
  grades: [
    { id: 'nota-1', enrollmentId: 'mat-2', subjectId: 'disc-1', term: 1, grade: 8.5 },
    { id: 'nota-2', enrollmentId: 'mat-2', subjectId: 'disc-3', term: 1, grade: 9 },
    { id: 'nota-3', enrollmentId: 'mat-3', subjectId: 'disc-1', term: 1, grade: 7 },
    { id: 'nota-4', enrollmentId: 'mat-3', subjectId: 'disc-4', term: 1, grade: 6.5 }
  ]
});

function createServer(dataFile = path.join(__dirname, 'data.json')) {
  function load() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const initial = seed(); save(initial); return initial;
    }
  }
  function save(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    const temp = `${dataFile}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data, null, 2));
    fs.renameSync(temp, dataFile);
  }
  const json = (res, status, value) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/data') return json(res, 200, load());
    if (req.method === 'GET' && url.pathname === '/api/report') {
      const data = load();
      const enrollment = data.enrollments.find(item => item.id === url.searchParams.get('enrollmentId'));
      if (!enrollment) return json(res, 404, { error: 'Matrícula não encontrada.' });
      const schoolClass = data.classes.find(item => item.id === enrollment.classId);
      const rows = data.subjects.filter(subject => subject.grades.includes(schoolClass.grade)).map(subject => {
        const terms = [1, 2, 3].map(term => data.grades.find(item => item.enrollmentId === enrollment.id && item.subjectId === subject.id && item.term === term)?.grade ?? null);
        const average = terms.every(value => value !== null) ? Number((terms.reduce((sum, value) => sum + value, 0) / 3).toFixed(2)) : null;
        return { subjectId: subject.id, subject: subject.name, terms, average };
      });
      return json(res, 200, { student: data.students.find(item => item.id === enrollment.studentId), schoolClass, enrollment, rows });
    }
    if (req.method.startsWith('POST') && url.pathname.startsWith('/api/')) {
      let body;
      try { let raw = ''; for await (const chunk of req) raw += chunk; body = JSON.parse(raw || '{}'); }
      catch { return json(res, 400, { error: 'Envie dados JSON válidos.' }); }
      const data = load();
      const text = value => typeof value === 'string' ? value.trim() : '';
      const id = () => crypto.randomUUID();
      if (url.pathname === '/api/students') {
        const name = text(body.name), registration = text(body.registration);
        if (!name || !registration) return json(res, 400, { error: 'Informe nome e matrícula.' });
        if (data.students.some(item => item.registration.toLowerCase() === registration.toLowerCase())) return json(res, 400, { error: 'Essa matrícula já está cadastrada.' });
        const student = { id: id(), name, registration }; data.students.push(student); save(data); return json(res, 201, student);
      }
      if (url.pathname === '/api/classes') {
        const grade = text(body.grade), group = text(body.group), year = Number(body.year);
        if (!grade || !group || !Number.isInteger(year) || year < 2000 || year > 2100) return json(res, 400, { error: 'Informe série, turma e ano letivo válido.' });
        if (data.classes.some(item => item.grade === grade && item.group.toLowerCase() === group.toLowerCase() && item.year === year)) return json(res, 400, { error: 'Essa turma já existe neste ano letivo.' });
        const schoolClass = { id: id(), grade, group, year }; data.classes.push(schoolClass); save(data); return json(res, 201, schoolClass);
      }
      if (url.pathname === '/api/subjects') {
        const name = text(body.name);
        if (!name) return json(res, 400, { error: 'Informe o nome da disciplina.' });
        if (data.subjects.some(item => item.name.toLowerCase() === name.toLowerCase())) return json(res, 400, { error: 'Essa disciplina já está cadastrada.' });
        const subject = { id: id(), name, grades: [] }; data.subjects.push(subject); save(data); return json(res, 201, subject);
      }
      if (url.pathname === '/api/subjects/link') {
        const subject = data.subjects.find(item => item.id === body.subjectId);
        if (!subject || !text(body.grade)) return json(res, 400, { error: 'Selecione uma disciplina e uma série.' });
        if (!subject.grades.includes(body.grade)) subject.grades.push(body.grade);
        save(data); return json(res, 200, subject);
      }
      if (url.pathname === '/api/enrollments') {
        const student = data.students.find(item => item.id === body.studentId), schoolClass = data.classes.find(item => item.id === body.classId);
        if (!student || !schoolClass) return json(res, 400, { error: 'Selecione um aluno e uma turma.' });
        const existing = data.enrollments.find(item => item.studentId === student.id && data.classes.find(c => c.id === item.classId)?.year === schoolClass.year);
        if (existing) return json(res, 400, { error: 'Este aluno já possui matrícula neste ano letivo.' });
        const enrollment = { id: id(), studentId: student.id, classId: schoolClass.id }; data.enrollments.push(enrollment); save(data); return json(res, 201, enrollment);
      }
      if (url.pathname === '/api/grades') {
        const enrollment = data.enrollments.find(item => item.id === body.enrollmentId);
        const subject = data.subjects.find(item => item.id === body.subjectId);
        const term = Number(body.term), grade = Number(body.grade);
        const schoolClass = enrollment && data.classes.find(item => item.id === enrollment.classId);
        if (!enrollment || !subject || !subject.grades.includes(schoolClass.grade) || ![1, 2, 3].includes(term) || !Number.isFinite(grade) || grade < 0 || grade > 10) return json(res, 400, { error: 'Confira aluno, disciplina, trimestre e nota (0 a 10).' });
        let saved = data.grades.find(item => item.enrollmentId === enrollment.id && item.subjectId === subject.id && item.term === term);
        if (saved) saved.grade = grade;
        else { saved = { id: id(), enrollmentId: enrollment.id, subjectId: subject.id, term, grade }; data.grades.push(saved); }
        save(data); return json(res, 201, saved);
      }
    }
    if (req.method === 'GET') {
      const root = path.resolve(__dirname);
      const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      const file = path.resolve(root, requested);
      if (!file.startsWith(root + path.sep)) return json(res, 403, { error: 'Acesso negado.' });
      fs.readFile(file, (error, content) => {
        if (error) { res.writeHead(404); return res.end('Não encontrado'); }
        const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html';
        res.writeHead(200, { 'content-type': `${type}; charset=utf-8` }); res.end(content);
      });
      return;
    }
    json(res, 404, { error: 'Rota não encontrada.' });
  });
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, '0.0.0.0', () => console.log(`Sistema de Boletins disponível em http://localhost:${port}`));
}
module.exports = { createServer };

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
const fs = require('node:fs');
const path = require('node:path');

async function withServer(run) {
  const dir = fs.mkdtempSync(path.join(__dirname, '..', '.test-data-'));
  const server = createServer(path.join(dir, 'data.json'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base); } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
}

async function request(base, url, method = 'GET', body) {
  const response = await fetch(base + url, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  return { response, data: await response.json() };
}

test('API inicia com dados escolares de exemplo e retorna as áreas do sistema', async () => {
  await withServer(async base => {
    const { response, data } = await request(base, '/api/data');
    assert.equal(response.status, 200);
    assert.ok(data.students.length > 0);
    assert.ok(data.classes.length > 0);
    assert.ok(Array.isArray(data.subjects));
  });
});

test('cadastro de estudante valida os campos e persiste os dados', async () => {
  await withServer(async base => {
    const bad = await request(base, '/api/students', 'POST', { name: '', registration: '' });
    assert.equal(bad.response.status, 400);
    const created = await request(base, '/api/students', 'POST', { name: 'Ana Lima', registration: '2026999' });
    assert.equal(created.response.status, 201);
    assert.equal(created.data.name, 'Ana Lima');
    assert.ok(created.data.id);
    const { data } = await request(base, '/api/data');
    assert.ok(data.students.some(student => student.registration === '2026999'));
  });
});

test('cadastro, vínculo por série e matrícula validam as regras escolares', async () => {
  await withServer(async base => {
    const { data } = await request(base, '/api/data');
    const student = await request(base, '/api/students', 'POST', { name: 'Pedro Alves', registration: '2026998' });
    const schoolClass = await request(base, '/api/classes', 'POST', { grade: '1º ano', group: 'INFO C', year: 2026 });
    const subject = await request(base, '/api/subjects', 'POST', { name: 'Ciências' });
    assert.equal(student.response.status, 201);
    assert.equal(schoolClass.response.status, 201);
    assert.equal(subject.response.status, 201);
    const link = await request(base, '/api/subjects/link', 'POST', { grade: '1º ano', subjectId: subject.data.id });
    assert.equal(link.response.status, 200);
    const enrollment = await request(base, '/api/enrollments', 'POST', { studentId: student.data.id, classId: schoolClass.data.id });
    assert.equal(enrollment.response.status, 201);
    const duplicate = await request(base, '/api/enrollments', 'POST', { studentId: student.data.id, classId: data.classes[0].id });
    assert.equal(duplicate.response.status, 400);
  });
});

test('aplicação pode ser montada em um caminho com token e bloqueia caminhos fora dele', async () => {
  const dir = fs.mkdtempSync(path.join(__dirname, '..', '.test-data-'));
  const server = createServer(path.join(dir, 'data.json'), { basePath: '/boletim/secreto' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const allowed = await fetch(base + '/boletim/secreto/api/data');
    const denied = await fetch(base + '/api/data');
    const page = await fetch(base + '/boletim/secreto/');
    assert.equal(allowed.status, 200);
    assert.equal(denied.status, 404);
    assert.equal(page.status, 200);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('nota é limitada a 0–10 e boletim calcula média apenas com trimestres registrados', async () => {
  await withServer(async base => {
    const { data } = await request(base, '/api/data');
    const enrollment = data.enrollments[0];
    const subjectId = data.subjects[0].id;
    const invalid = await request(base, '/api/grades', 'POST', { enrollmentId: enrollment.id, subjectId, term: 1, grade: 11 });
    assert.equal(invalid.response.status, 400);
    const saved = await request(base, '/api/grades', 'POST', { enrollmentId: enrollment.id, subjectId, term: 1, grade: 8.5 });
    assert.equal(saved.response.status, 201);
    const report = await request(base, `/api/report?enrollmentId=${enrollment.id}`);
    assert.equal(report.response.status, 200);
    assert.equal(report.data.rows.find(row => row.subjectId === subjectId).terms[0], 8.5);
    assert.equal(report.data.rows.find(row => row.subjectId === subjectId).average, null);
  });
});

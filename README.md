# Sistema de Boletins

Aplicação escolar simples em HTML, CSS e Node.js puro (sem dependências externas). A interface segue as referências do repositório e organiza cadastro de alunos, turmas, matrículas, disciplinas, lançamento de notas e consulta de boletins.

## Executar

Requer Node.js 18 ou superior.

```bash
npm start
```

Acesse http://localhost:3000. Os dados iniciais de demonstração são criados automaticamente em `data.json` na primeira execução. Esse arquivo fica local e guarda os cadastros e notas em JSON.

## Funcionalidades

- Cadastro de estudantes e turmas com validação de campos e matrícula única.
- Cadastro de disciplinas e vínculo por série, compartilhado entre as turmas da série.
- Matrícula de aluno em uma única turma por ano letivo.
- Lançamento e atualização de notas de 0 a 10 por trimestre.
- Boletim individual com notas por trimestre e médias após os três lançamentos.
- Layout responsivo com painel inicial, indicadores e navegação por áreas.

## Testes

```bash
npm test
```

A aplicação usa os módulos nativos do Node.js no modo JSON. Para usar MySQL, instale as dependências com `npm ci`, crie uma base e aplique `schema.sql` como administrador; configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` e `MYSQL_PASSWORD` no ambiente da aplicação. A conta da aplicação precisa apenas de `SELECT`, `INSERT` e `UPDATE` em `app_state`; o sistema não executa DDL durante a inicialização. `BASE_PATH` opcional monta a interface em um caminho prefixado, e `PORT` define a porta local.

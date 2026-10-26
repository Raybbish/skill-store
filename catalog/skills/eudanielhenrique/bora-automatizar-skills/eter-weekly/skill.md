# /eter-weekly — Relatório Semanal

Você está agora em **modo weekly**. Você lê o estado de todos os clientes ativos do Eter CRM e gera um resumo semanal para Daniel: o que avançou, o que está travado, o que precisa de ação.

## Quando usar

- Toda segunda-feira de manhã antes de começar o dia
- Antes de calls de check-in com múltiplos clientes
- Quando quiser ver o "estado da consultoria" de forma consolidada

## Como ler os dados

```bash
cd E:/dev/eter-crm
npx tsx -e "
const { PrismaClient } = require('.prisma/client/default');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
async function run() {
  const apps = await prisma.application.findMany({
    where: { status: { not: 'REJECTED' } },
    orderBy: { updatedAt: 'desc' },
    include: {
      notes: { orderBy: { createdAt: 'desc' }, take: 3 },
      roadmapItems: { orderBy: [{ week: 'asc' }, { createdAt: 'asc' }] }
    }
  });
  console.log(JSON.stringify(apps, null, 2));
  await pool.end();
}
run();
"
```

## O que gerar

```
WEEKLY ETER — semana de [data]
━━━━━━━━━━━━━━━━━━━━━━━━━

CLIENTES ATIVOS ([N])

[Para cada cliente em IN_PROGRESS:]
━ [Nome] — [negócio]
  Semana [X]/6 · [X tarefas feitas] de [Y total]
  Última nota: "[trecho da nota mais recente]"
  Status: ✅ No ritmo / ⚠️ Atrasado / ❓ Sem atualização

[Para clientes em CONTACTED:]
━ [Nome] — aguardando resposta há [X dias]

[Para clientes em NEW:]
━ [Nome] — nova aplicação há [X dias] [sem contato ainda]

━━━━━━━━━━━━━━━━━━━━━━━━━

ATENÇÃO IMEDIATA
• [Item mais urgente]
• [Item 2]

AGENDA SUGERIDA PARA A SEMANA
Seg: [ação]
Ter: [ação]
...

━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Cálculo de progresso do roadmap

- Tarefas com `status: DONE` / total de tarefas = progresso
- Semana atual = estimativa baseada em quando o cliente entrou em IN_PROGRESS

### Critérios de alerta

- **Atrasado:** semana estimada > semana com mais tarefas feitas
- **Sem atualização:** último `updatedAt` ou nota há mais de 5 dias
- **Nova sem contato:** status NEW há mais de 2 dias

## Regras

- Máximo 1 página de output
- Priorizar clientes em andamento (IN_PROGRESS) no topo
- Sugestão de agenda só para a semana atual — não projetar meses
- Tom: ferramenta de trabalho do Daniel, não relatório formal
- Se não houver clientes ativos, dizer isso diretamente e mostrar o que está no pipeline

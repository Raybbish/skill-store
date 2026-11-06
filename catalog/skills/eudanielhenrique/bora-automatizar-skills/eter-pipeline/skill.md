# /eter-pipeline — Visão do Pipeline

Você está agora em **modo pipeline**. Você lê o estado atual de todas as aplicações do Eter CRM e entrega uma visão clara de quem está em cada estágio, o que está parado e qual é o próximo movimento.

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
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { notes: true, roadmapItems: true } },
      notes: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });
  console.log(JSON.stringify(apps, null, 2));
  await pool.end();
}
run();
"
```

## O que gerar

### 1. Snapshot do pipeline

```
PIPELINE — [data]
━━━━━━━━━━━━━━━━━━━━━━━━━

NOVA (N aplicações)
• [Nome] — [negócio resumido] — [X dias atrás]
• ...

CONTACTADO (N)
• [Nome] — [X dias desde o contato] — [última nota se houver]
• ...

EM ANDAMENTO (N)
• [Nome] — semana [X]/6 — [última nota]
• ...

CONCLUÍDO (N)
• [Nome] — [data conclusão]

STANDBY (N)
• [Nome] — [motivo se souber]
━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Alertas de atenção

Listar automaticamente:
- **Parado há mais de 3 dias em NOVA** — precisa de contato
- **Parado há mais de 5 dias em CONTACTADO** — precisa de follow-up
- **Em andamento sem nota nos últimos 7 dias** — pode estar perdendo tração
- **Proposta enviada (se marcado) sem resposta** — follow-up necessário

### 3. Próximos movimentos sugeridos

Para cada alerta, sugerir ação específica:
```
AÇÕES PRIORITÁRIAS
1. [Nome] — em NOVA há 5 dias → entrar em contato hoje
2. [Nome] — sem nota em 8 dias → checar progresso
```

## Regras

- Ordem por urgência (parado há mais tempo primeiro)
- Dias calculados a partir de `createdAt` ou `updatedAt`
- Se não houver dados suficientes para calcular tempo parado, marcar com [?]
- Tom: dashboard de trabalho, não relatório formal
- Máximo de 1 página de output

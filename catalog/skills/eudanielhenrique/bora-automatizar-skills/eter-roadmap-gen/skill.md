# /eter-roadmap-gen — Gerador de Roadmap Personalizado

Você está agora em **modo roadmap**. Dado um cliente, você gera um roadmap de 6 semanas detalhado e personalizado — mais rico que o template automático do CRM.

## Contexto

O CRM tem um botão "Sugerir roadmap" que usa templates pré-definidos. Este skill gera algo melhor: um roadmap customizado que leva em conta o negócio específico, as ferramentas que o cliente já usa, e o processo-alvo.

## Como obter dados do cliente

```bash
cd E:/dev/eter-crm
npx tsx -e "
const { PrismaClient } = require('.prisma/client/default');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
prisma.application.findUnique({ where: { id: 'ID_AQUI' } }).then(a => { console.log(JSON.stringify(a, null, 2)); pool.end(); });
"
```

## O que gerar

### Estrutura por semana

Para cada uma das 6 semanas, definir:
- **Título da semana** (ex: "Mapear e documentar o processo atual")
- **2-3 tarefas específicas** com descrição clara
- **Entregável da semana** — o que o cliente deve ter ao final
- **Ferramentas envolvidas** — baseado no que o cliente já usa

### Princípios do roadmap

1. **Semana 1:** Diagnóstico e mapeamento — nunca automatizar sem entender primeiro
2. **Semana 2:** Configurar e testar ambiente (ferramentas, credenciais, fluxo manual)
3. **Semana 3-4:** Construir a automação — primeiro simples, depois sofisticado
4. **Semana 5:** Testar com dados reais, ajustar
5. **Semana 6:** Documentar, treinar equipe (se houver), handoff

### Regras de geração

- **Específico:** mencionar as ferramentas reais que o cliente usa
- **Progressivo:** cada semana constrói na anterior
- **Realizável:** o cliente é quem executa — não pode ser muito técnico sem suporte
- **Sem semanas vazias:** toda semana tem entregável claro

### Perguntas para refinar (se dados faltarem)

Se não houver informações suficientes:
- "Quais ferramentas você usa no processo hoje?"
- "Tem alguém na equipe que pode ajudar a implementar?"
- "Qual o volume? (quantas vezes por dia/semana esse processo acontece)"
- "Já tentou automatizar alguma parte? O que não funcionou?"

## Output

Gerar o roadmap em formato que pode ser copiado direto para o CRM (lista de tarefas por semana) OU em formato narrativo para compartilhar com o cliente.

Se o usuário quiser salvar no CRM:
```bash
# Para cada tarefa, rodar:
cd E:/dev/eter-crm
# Criar tarefas via servidor Next.js ou direto no banco via npx tsx
```

## Regras

- Nunca criar roadmap genérico — sempre referência o processo específico do cliente
- Se a dor não foi bem identificada, avisar antes de gerar
- Máximo 3 tarefas por semana (foco)
- Tom: prático e direto — como um plano de trabalho real

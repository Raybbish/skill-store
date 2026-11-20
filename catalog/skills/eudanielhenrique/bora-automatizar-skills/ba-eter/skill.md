---
name: ba-eter
description: Hub orquestrador do Eter — consultoria done-for-you de automacao para pequenos negocios. Lista todas as skills disponíveis, o fluxo completo do pipeline (lead → qualificacao → call → escopo → proposta → onboarding → acompanhamento → conclusao) e quando invocar cada sub-skill. Use quando nao souber por onde comecar ou precisar de uma visao geral do que fazer com um cliente.
---

# /ba-eter — Hub Eter

Você está agora no **hub do Eter**. Este skill orienta o fluxo completo de trabalho da consultoria — do lead que chegou até o cliente que terminou as 6 semanas.

---

## O que é o Eter

Eter é uma consultoria **done-for-you** de automação operacional para pequenos negócios (R$30k–R$500k/mês). O dono aprende a automatizar a própria operação em 6 semanas com suporte direto do Daniel.

**Não é:**
- SaaS / produto
- Curso / treinamento
- Done-with-you (o cliente executa) — é done-for-you (a Eter constrói, entrega e capacita)

**É:**
- Briefing → escopo → construção → garantia 30 dias
- 5 vagas por mês, envolvimento direto do fundador

---

## Pipeline completo

```
NOVA → CONTACTADO → EM ANDAMENTO → CONCLUÍDO
              ↓
          STANDBY (desqualificado)
```

| Status | O que significa |
|---|---|
| `NEW` | Formulário preenchido, Daniel ainda não analisou |
| `CONTACTED` | Daniel entrou em contato, aguardando call |
| `IN_PROGRESS` | Cliente ativo — rodando as 6 semanas |
| `COMPLETED` | Concluído |
| `REJECTED` | Desqualificado — vai para standby |

---

## Skills disponíveis e quando usar

### `/eter-briefing` — Briefing pré-reunião
**Quando:** antes de qualquer call com o cliente (discovery ou check-in)
**O que faz:** lê o CRM, gera resumo executivo de 1 página com negócio, dor, qualificação e perguntas para a call. Salva automaticamente no painel admin.
**Input:** ID do cliente ou nome
**Output:** documento de briefing salvo no painel + veredicto de qualificação

---

### `/eter-pipeline` — Visão do pipeline
**Quando:** qualquer momento que precisar de uma foto do estado atual de todos os clientes
**O que faz:** lê todo o CRM e gera snapshot por status, alertas de clientes parados e próximas ações prioritárias
**Input:** nenhum (lê tudo)
**Output:** dashboard texto com pipeline + alertas + agenda sugerida

---

### `/eter-scope` — Escopo técnico pós-call
**Quando:** após a call de briefing, antes de gerar a proposta
**O que faz:** lê respostas do formulário + anotações da call e desenha a solução técnica — módulos, stack (n8n/Make, Evolution API/Z-API, GPT-4o, Typebot, etc.), integrações, dependências, fora do escopo e estimativa de complexidade/prazo
**Input:** ID do cliente — precisa de `callNotes` preenchido no painel
**Output:** documento ESCOPO TÉCNICO pronto para alimentar a proposta

---

### `/eter-proposta` — Proposta comercial
**Quando:** após call de discovery qualificada + escopo definido
**O que faz:** gera proposta comercial completa (contexto, o que resolve, como funciona, benefícios, investimento placeholder, próximo passo). Versão WhatsApp (400 palavras) ou PDF formal.
**Input:** ID do cliente ou dados do escopo
**Output:** proposta em texto/markdown pronta para enviar

---

### `/eter-roadmap-gen` — Roadmap personalizado
**Quando:** cliente assinou e entrou em `IN_PROGRESS` — no início das 6 semanas
**O que faz:** gera roadmap de 6 semanas customizado ao negócio e processo-alvo — mais rico que o template automático do CRM. Cada semana tem título, tarefas específicas, entregável e ferramentas.
**Input:** ID do cliente
**Output:** roadmap por semana pronto para copiar no CRM ou compartilhar com o cliente

---

### `/eter-weekly` — Relatório semanal
**Quando:** toda segunda-feira, ou antes de calls de check-in com múltiplos clientes
**O que faz:** lê todos os clientes ativos e gera relatório com progresso, alertas (parado, sem atualização, atrasado) e agenda sugerida para a semana
**Input:** nenhum (lê todos os IN_PROGRESS e pipeline)
**Output:** weekly 1 página com status de cada cliente + ações prioritárias

---

## Fluxo cronológico recomendado

```
1. Lead chega (NEW)
   → /eter-pipeline para ver o pipeline atual

2. Antes da call de discovery
   → /eter-briefing [ID] para preparar

3. Após a call (preencher callNotes no painel admin)
   → /eter-scope [ID] para desenhar a solução técnica

4. Proposta
   → /eter-proposta [ID] com base no escopo

5. Cliente fecha → status IN_PROGRESS
   → /eter-roadmap-gen [ID] para criar o plano das 6 semanas

6. Toda segunda
   → /eter-weekly para ver o estado geral

7. Revisão de pipeline a qualquer momento
   → /eter-pipeline
```

---

## Dados do CRM — acesso rápido

**Listar todos os clientes:**
```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, name, \"companyName\", status, \"createdAt\" FROM \"Application\" ORDER BY \"createdAt\" DESC LIMIT 20')
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); });
"
```

**Buscar cliente por ID:**
```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT * FROM \"Application\" WHERE id = \$1', ['ID_AQUI'])
  .then(r => { console.log(JSON.stringify(r.rows[0], null, 2)); pool.end(); });
"
```

---

## ICP e qualificação rápida

**Perfil ideal:**
- Dono de negócio, 1–20 funcionários
- Receita R$30k–R$500k/mês
- Processo repetitivo claramente identificado
- Decisor de investimento (ou acesso direto)
- Já tentou resolver de alguma forma (consciência do problema)
- Investimento disponível mínimo: R$3k

**Desqualifica:**
- Não é decisor e não tem acesso a quem decide
- Receita < R$15k/mês
- Negócio sem processos repetitivos
- Investimento < R$3k
- Expectativa de "faz tudo por mim sem me envolver"

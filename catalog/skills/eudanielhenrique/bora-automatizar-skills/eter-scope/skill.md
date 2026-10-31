---
name: eter-scope
description: Dado um cliente do Eter CRM (ID ou nome), le as respostas do formulario e as anotacoes da call para desenhar a solucao tecnica — o que construir, quais ferramentas usar, integracoes necessarias, o que fica fora do escopo e estimativa de complexidade e prazo. Use apos a call de briefing, antes de /eter-proposta.
---

# /eter-scope — Desenho Tecnico da Solucao

Voce esta agora no **modo escopo tecnico**. Dado um cliente do Eter CRM, le as respostas do formulario e as anotacoes da call para desenhar o que sera construido: solucao, ferramentas, integracoes e estimativa. O output alimenta diretamente o `/eter-proposta`.

## Contexto do produto

A Eter constroi automacoes e agentes de IA sob medida para pequenos negocios. Modelo done-for-you: briefing → desenho → construcao → garantia 30 dias.

O que a Eter constroi:
- Fluxos de atendimento automatizados (WhatsApp, Instagram, e-mail)
- Agentes de IA com contexto do negocio do cliente
- Integracoes entre sistemas que hoje nao conversam
- Pipelines operacionais (lead → proposta → cobranca → entrega → confirmacao)

O que a Eter **nao** constroi:
- Sites ou apps sem relacao com automacao de processo
- Manutencao de sistemas que ela nao construiu
- Consultoria de estrategia sem entrega tecnica

---

## Passo 1 — Buscar dados do cliente

Se tiver o ID:

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

Se nao tiver o ID, lista os recentes:

```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, name, \"companyName\", status, \"createdAt\" FROM \"Application\" ORDER BY \"createdAt\" DESC LIMIT 10')
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); });
"
```

**Campos em ordem de prioridade para o escopo:**

| Campo | O que revela |
|---|---|
| callNotes | O que o cliente disse na call — prioridade maxima |
| hatedTask | A dor central: o processo a automatizar |
| consequence | O resultado esperado: define o que e sucesso |
| business | Contexto do negocio: nicho e modelo operacional |
| prevAttempt | O que tentou antes: revela stack atual implicita |
| monthlyRevenue | Volume de operacao: justifica complexidade |
| teamSize | Quem executa hoje: impacta onde a automacao entra |

Se callNotes estiver vazio, avise e ofereca seguir so pelo formulario — mas o escopo ficara incompleto.

---

## Passo 2 — Mapear o processo atual

Antes de propor qualquer coisa, reconstruir o processo passo a passo como acontece hoje:

1. **Ponto de entrada** — por onde chega a informacao? (WhatsApp pessoal, DM, formulario, presenca fisica, ligacao)
2. **Passos manuais** — o que alguem faz a mao, em que ordem, com que ferramenta
3. **Gargalos** — onde perde tempo, onde erra, onde esquece
4. **Ponto de saida** — qual e o resultado final quando funciona bem

Exemplo: "Paciente manda WhatsApp → recepcionista ve quando pode → verifica Google Calendar → confirma → lembra de ligar no dia anterior quando lembra → paciente nao aparece"

Esse mapa deixa claro **onde** a automacao entra e **o que** ela substitui.

---

## Passo 3 — Desenhar a solucao

### Categorias de solucao

**Atendimento e qualificacao**
- Chatbot com IA no WhatsApp: classifica intencao, responde duvidas, coleta dados, aciona humano
- Roteamento por especialidade, produto ou perfil do cliente

**Agendamento e confirmacao**
- Integracao Google Calendar / Calendly via API
- Confirmacao automatica 24-48h antes por WhatsApp ou e-mail
- Cancelamento e reagendamento sem intervencao humana

**Proposta e orcamento**
- Geracao automatica de PDF a partir de formulario ou mensagem
- Envio por WhatsApp com link de aceite e notificacao de visualizacao

**Follow-up e cobranca**
- Sequencia automatica pos-visita, pos-proposta ou pos-entrega
- Regua de cobranca com link de pagamento e escalada para humano
- Reengajamento de leads frios

**Operacao interna**
- Sincronizacao entre sistemas (CRM, ERP, planilha, banco)
- Relatorio automatico gerado e enviado por WhatsApp/e-mail
- Pipeline visual unificando multiplos canais de entrada

**Agente de IA com contexto**
- Acesso a base de dados do negocio (estoque, pedidos, clientes, historico)
- Responde perguntas, atualiza dados e executa acoes por linguagem natural
- Memoria de conversa e handoff para humano com contexto completo

### Stack — criterios de escolha

| Camada | Quando usar |
|---|---|
| n8n (self-hosted) | Cliente tem servidor ou aceita Docker — controle total, sem custo por execucao |
| Make.com | Cliente quer zero infra — setup mais rapido, custo variavel por operacao |
| Evolution API | Volume alto de WhatsApp — sem custo por mensagem, mais controle |
| Z-API / WPPConnect | Volume baixo ou agilidade de setup — custo mensal por conexao |
| Typebot | Fluxo conversacional com estado — mais simples que Voiceflow |
| Voiceflow | Agente de IA complexo com multiplos contextos |
| OpenAI GPT-4o | Raciocinio e linguagem natural — default |
| GPT-4o-mini | Classificacao e tarefas repetitivas — mais barato |
| Supabase / PostgreSQL | Dados estruturados com volume real |
| Airtable / Google Sheets | Base de dados leve — cliente ja conhece |
| Resend / SendGrid | E-mail transacional |
| Mercado Pago / Pagar.me | Pagamento — cliente provavelmente ja tem conta |

**Regra geral:** priorizar o que o cliente ja usa. Integrar e sempre melhor que migrar.

---

## Passo 4 — Documento de escopo

```
ESCOPO TECNICO — [Nome / Empresa]
[Data]

RESUMO
[1-2 frases: o que sera construido e qual e o resultado esperado]

O PROCESSO HOJE
[Passo a passo atual com os problemas de cada etapa marcados]

O PROCESSO COM A AUTOMACAO
[Mesmo fluxo reescrito — o que muda em cada etapa]

O QUE SERA CONSTRUIDO

  Modulo 1 — [Nome curto]
  [O que faz, em 2-3 frases]
  Ferramentas: [lista]

  Modulo 2 — [...]

INTEGRACOES
- [Sistema A] <-> [Sistema B]: [para que]
- [Sistema C]: acesso [leitura / escrita] para [que]

DEPENDENCIAS DO CLIENTE
- [ ] Acesso a [sistema / API key / conta]
- [ ] Definicao de [regra de negocio que so ele conhece]
- [ ] Aprovacao de [conteudo / mensagem / fluxo]

FORA DO ESCOPO
- [O que nao entra e por que]

ESTIMATIVA
Complexidade: [Pequena / Media / Grande]
Prazo: [N semanas]
Faixa de investimento: [R$X a R$Y]

RISCOS
- [O que pode travar e como mitigar]

PROXIMO PASSO
[/eter-proposta / confirmar stack com o cliente / outra acao]
```

**Referencia de complexidade:**

| Nivel | O que caracteriza | Prazo tipico |
|---|---|---|
| Pequena | 1 fluxo, 1-2 integracoes, sem IA | 2-4 semanas |
| Media | 2-3 modulos, 3-5 integracoes, IA simples | 4-8 semanas |
| Grande | Multiplos modulos, agente de IA, 6+ integracoes | 8+ semanas |

---

## Passo 5 — Salvar como nota no CRM (opcional)

Perguntar ao Daniel se quer salvar antes de fechar:

```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const content = 'COLE_O_ESCOPO_AQUI';
const applicationId = 'ID_DO_CLIENTE';
pool.query(
  'INSERT INTO \"Note\" (id, content, \"applicationId\", \"createdAt\") VALUES (gen_random_uuid()::text, \$1, \$2, NOW())',
  [content, applicationId]
).then(() => { console.log('Escopo salvo como nota.'); pool.end(); });
"
```

---

## Regras

- **Nunca invente ferramentas ou integracoes** sem evidencia nas respostas ou notas. Se incerto, marque com [?].
- **Se callNotes estiver vazio**, avise antes de continuar — escopo so pelo formulario pode gerar modulos errados.
- **O escopo e interno.** Nunca vai pro cliente. O que vai pro cliente e a proposta do `/eter-proposta`.
- **Priorizar o que o cliente ja usa.** Integrar e melhor que migrar.
- **Fora do escopo e tao importante quanto o escopo.** Definir limites agora evita cobranças depois.
- **O prazo estimado nao inclui tempo de aprovacao do cliente.** So o tempo de construcao da Eter.

---
name: ba-integracoes
description: Conecta um cliente Bora Automatizar (via Eter) a ferramentas que ele já usa — Sheets, ClickUp, Notion, Trello, Stripe, Shopify, Calendly, RD Station, Pipedrive, webhook genérico — e orquestra fluxos entre elas. Use quando o briefing do cliente apontar um CRM/ERP/planilha existente para conectar, quando pedir "manda um alerta no Slack/Discord/Telegram quando X acontecer", "cria task automática", "consolida pedido/pagamento em um lugar só", ou "isso precisa rodar 24/7 num servidor". Não cobre WhatsApp — isso é o sistema próprio do Bora Automatizar.
allowed-tools: Read Write Bash
user-invocable: true
---

# /ba-integracoes — Conectar sistemas existentes do cliente

Você está agora em **modo integração**. O cliente do Eter já tem alguma ferramenta rodando (CRM, planilha, e-commerce, agenda) e o trabalho é conectar essa ferramenta ao fluxo automatizado — não substituí-la.

**WhatsApp fica fora deste pacote.** O Bora Automatizar já tem sistema próprio para isso — não reconstrua aqui. Alertas internos (time, sócios) usam `notificacoes/` (Slack/Discord/Telegram).

## Como decidir o que usar

| Cenário do briefing | Use |
|---|---|
| "Registra lead em algum lugar" e não tem CRM | `google-sheets/` |
| "Já uso RD Station" (CRM mais comum em PME BR) | `rd-station/` |
| "Já uso Pipedrive" | `pipedrive/` |
| "Organizar tasks do time" | `clickup/` (completo) ou `trello/` (simples) |
| "Wiki / base de conhecimento" | `notion/` |
| "Cobrança / assinatura mensal" | `stripe/` |
| "Loja online" | `shopify/` |
| "Agendamento de reunião pública" | `calendly/` |
| "Ferramenta que não está na lista" | `webhook-generico/` |
| "Notificar time/sócios de evento" (não é o cliente final) | `notificacoes/` (Slack/Discord/Telegram) |
| "Precisa combinar 2+ integrações num pipeline" | `orquestrador/` — YAML com etapas, retry, condição |
| "Isso precisa rodar sozinho, sempre" | `deploy/` — Docker Compose + Coolify |

## Como trabalhar

1. **Leia o briefing do cliente** — qual ferramenta ele já usa hoje (se usa).
2. **Abra o `README.md` da subpasta correspondente** — cada integração MCP (Sheets/ClickUp/Notion/Trello) tem `mcp-config.json` pronto pra colar; cada integração via API (Stripe/Shopify/Calendly/RD/Pipedrive) tem cliente Python + `exemplos.md`/`funcoes-prontas.md`.
3. **Se o fluxo cruza 2+ integrações** (ex: Shopify → Slack → alerta se pedido grande), monte ou adapte um YAML em `orquestrador/fluxos/` — tem 4 prontos pra usar de referência.
4. **Antes de considerar pronto**, rode `python orquestrador/smoke_test.py` com as credenciais do cliente configuradas — valida que cada integração habilitada responde.
5. **Se o cliente quer isso rodando 24/7** (não só sob demanda no Claude Code), suba com `deploy/` — `INSTALACAO-COOLIFY.md` tem o passo a passo guiado.

## Segurança

- Tokens só em `~/.credentials/` (fora do git). Nunca hardcoded.
- Webhook sempre com secret HMAC validado — sem assinatura válida, 401.
- HTTPS em qualquer endpoint público.
- Escopo mínimo por integração (ex: Stripe Restricted Key, não Secret Key).

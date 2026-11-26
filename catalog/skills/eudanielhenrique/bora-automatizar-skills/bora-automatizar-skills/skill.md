# bora-automatizar-skills (v1.8)

Skills operacionais para o Claude Code: utilitários Bora Automatizar (Firestore, design system, propostas, monitoramento, integrações, controle operacional) e suite completa do Eter CRM (pipeline, briefing, escopo, proposta, roadmap, weekly).

## Skills disponíveis

### Utilitários Bora Automatizar

- `/ba-firestore-backup` — Exporta collections do Firestore para um arquivo JSON local
- `/ba-firestore-restore` — Restaura dados no Firestore a partir de um arquivo JSON de backup
- `/ba-designer-system` — Aplica o design system real do Bora Automatizar em 3 modos (Landing Page, Sistema/App, Oferta/Produto)
- `/ba-proposta-comercial` — Gera proposta comercial em HTML single-file no padrão visual Bora Automatizar
- `/ba-oferta-produtizada` — Gera landing page de oferta produtizada (escassez, cases, FAQ) no padrão visual mais recente da marca
- `/ba-monitoramento-equipe` — Boletim diário/semanal de equipe de WhatsApp (TPR, heatmap, palavras críticas, distribuição de carga)
- `/ba-integracoes` — Conecta o cliente Eter a sistemas que ele já usa (Sheets, ClickUp, Notion, Trello, Stripe, Shopify, Calendly, RD Station, Pipedrive, webhook genérico) + orquestrador de fluxos + deploy
- `/ba-controle-operacional` — Substitui a planilha do cliente Eter por controle via CSV + linguagem natural (financeiro, estoque, vendas, clientes, fornecedores, tarefas, funcionários, projetos, relatório mensal, dashboard)
- `/ba-init` — Início de projeto (escolhe stack, estrutura, segurança day-1) ou documentação contínua (CHANGELOG.md/ARCHITECTURE.md/ROADMAP.md), dependendo se o projeto já existe ou não

### Eter CRM

- `/ba-eter` — **Hub:** fluxo completo do pipeline Eter + quando invocar cada sub-skill. Começa aqui quando não souber por onde ir.
- `/eter-briefing` — Gera briefing pré-reunião com qualificação e salva automaticamente no painel admin
- `/eter-pipeline` — Snapshot do pipeline completo com alertas de clientes parados e próximas ações
- `/eter-scope` — Escopo técnico pós-call: módulos, stack, integrações, fora do escopo e estimativa de prazo
- `/eter-proposta` — Proposta comercial (versão WhatsApp ou PDF formal)
- `/eter-roadmap-gen` — Roadmap 6 semanas personalizado ao cliente (mais rico que o template do CRM)
- `/eter-weekly` — Relatório semanal de todos os clientes ativos com alertas e agenda sugerida

Cada skill tem seu próprio SKILL.md na subpasta.

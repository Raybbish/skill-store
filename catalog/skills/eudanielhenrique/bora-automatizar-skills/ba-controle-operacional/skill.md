---
name: ba-controle-operacional
description: Substitui a planilha de um cliente Eter por controle operacional via CSV + linguagem natural — financeiro, estoque, vendas, clientes/CRM, fornecedores, tarefas, funcionários, projetos, relatório mensal e dashboard rápido. Use quando o briefing do cliente mostrar que ele roda no Excel/Google Sheets sem sistema, quando pedir "registra essa venda", "quanto vendi esse mês", "o que tá acabando no estoque", "conta vencendo", "fechamento mensal", "raio-X do negócio agora". Serve operações de 1 a ~30 pessoas.
allowed-tools: Read Write Edit Bash
user-invocable: true
---

# /ba-controle-operacional — Backend de dados pro cliente sem sistema

Você está agora em **modo controller operacional**. O cliente do Eter não tem CRM/ERP — roda em planilha, ou pior, na cabeça do dono. O trabalho aqui é ser esse sistema: ler/atualizar CSVs conforme o cliente (ou o time do Bora Automatizar operando por ele) narra o que aconteceu, e responder perguntas de negócio sob demanda.

## As 10 áreas — cada uma tem seu próprio guia detalhado

| # | Área | Arquivo | Cobre |
|---|---|---|---|
| 01 | Financeiro | `areas/01-controle-financeiro/SKILL.md` | Caixa, contas a pagar/receber, fluxo de caixa, vencimentos |
| 02 | Estoque | `areas/02-controle-estoque/SKILL.md` | Saldo, alerta de mínimo, valor em estoque, curva ABC |
| 03 | Vendas | `areas/03-controle-vendas/SKILL.md` | Registro, comissões, metas, top vendedor/produto/cliente |
| 04 | Clientes | `areas/04-controle-clientes/SKILL.md` | CRM: cadastro, interações, follow-up, recência, segmentação |
| 05 | Fornecedores | `areas/05-controle-fornecedores/SKILL.md` | Cadastro, histórico, comparativo de preço, confiabilidade |
| 06 | Tarefas | `areas/06-controle-tarefas/SKILL.md` | Todo com prazo, prioridade, responsável, lista do dia |
| 07 | Funcionários | `areas/07-controle-funcionarios/SKILL.md` | Ponto, banco de horas, férias, cálculo gerencial de salário |
| 08 | Projetos | `areas/08-controle-projetos/SKILL.md` | Etapas, marcos, atraso, % conclusão, saúde do portfólio |
| 09 | Relatório mensal | `areas/09-relatorio-mensal/SKILL.md` | Fechamento mensal cruzando todas as outras áreas |
| 10 | Dashboard rápido | `areas/10-dashboard-rapido/SKILL.md` | Snapshot textual: saúde do negócio em 5 segundos |

## Como trabalhar

1. **Identifique a área** pelo que o usuário pediu (ver tabela acima).
2. **Leia o `SKILL.md` daquela área** — cada uma já tem a estrutura exata dos CSVs, os cálculos e os formatos de resposta esperados.
3. **Localize os CSVs do cliente** — vivem numa pasta dedicada do cliente (não neste repo). Se é o primeiro uso, copie o esqueleto de `templates/` correspondente.
4. **Peça vertical do cliente antes de customizar categorias** — clínica, distribuidora e estúdio de design têm categorias de financeiro/estoque diferentes. `NEGOCIO-EXEMPLO.md` mostra uma loja fictícia rodando 3 meses inteiros, útil como referência de ritmo.
5. Pra fechar mês ou dar visão geral rápida, use as áreas 09 e 10 — elas cruzam dados das outras 8.

## Entrega pro cliente (modelo Eter)

Isso normalmente **não roda dentro deste repo** — é entregue rodando no ambiente do próprio cliente (pasta dedicada + `.claude/skills/`). `INSTALACAO.md` tem o passo a passo de 15 minutos pra subir isso do zero num projeto novo; `PRIMEIRO-DIA.md` é o roteiro do que registrar no dia 1.

## O que isso não cobre

- Sem interface visual — é texto + CSV.
- Sem multi-usuário com permissão (mais de 1 pessoa via Git dá, mas conflito se 2 editarem ao mesmo tempo).
- Sem NF-e nem obrigação fiscal — isso ainda é ERP/contador.
- Se o cliente já tem CRM/ERP de verdade (RD Station, Pipedrive, Stripe...), use `/ba-integracoes` em vez de migrar ele pra CSV.

---
name: controle-projetos
description: Acompanha projetos com etapas, marcos, prazos planejados vs reais. Identifica atrasos, calcula % de conclusao, gera saude do portfolio e cruza com tarefas e clientes.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Projetos

Voce coordena projetos: pra cliente externo (entrega de servico) ou interno (campanha, lancamento, melhoria). Foco: visibilidade do que esta atrasando, antes de virar problema.

## Arquivos

### projetos/projetos.csv
```
id,nome,cliente,responsavel,data_inicio,data_fim_planejada,data_fim_real,status,valor_contrato,observacoes
```
- `cliente`: nome do cliente externo OU `interno` pra projetos internos
- `status`: `planejado`, `em_andamento`, `em_risco`, `bloqueado`, `concluido`, `cancelado`

### projetos/etapas.csv
```
id,projeto_id,etapa,ordem,responsavel,data_inicio_planejada,data_fim_planejada,data_fim_real,status
```
- `ordem`: 1, 2, 3... unica dentro do projeto
- `status`: `nao_iniciada`, `em_andamento`, `bloqueada`, `concluida`, `cancelada`

## Operacoes

### 1. Criar projeto

1. Gera `id` (`PR001`...)
2. Pede: nome, cliente (ou interno), responsavel principal, datas, valor (se externo)
3. **Pergunta as etapas** — projeto sem etapas e impossivel de acompanhar
4. Para cada etapa: ordem, responsavel, prazos planejados
5. `status` default: `planejado`

### 2. Adicionar etapa apos criacao

Permite, mas avisa: ordem deve ser unica e fim_planejada deve ser <= fim do projeto.

### 3. Marcar etapa como concluida

1. Status: `concluida`
2. `data_fim_real` = hoje
3. **Calcula automatico:** atrasou? quanto? (data_fim_real - data_fim_planejada)
4. Se TODAS etapas concluidas, oferece marcar projeto como `concluido`

### 4. % de conclusao

```
etapas_concluidas / total_etapas * 100
```

Variante ponderada (se as etapas tem peso diferente, futuro): por enquanto, simples.

### 5. Saude do projeto

Calcula automatico cruzando datas:

```
Saude — PR001 (Campanha Junina)

Cliente: interno
Responsavel: Marcelo
Inicio: 2026-04-01 | Prazo: 2026-06-15

Etapas: 4 total | 0 concluidas | 1 em andamento | 3 nao iniciadas
% concluido: 0%

Tempo decorrido: 0% do prazo
Tempo restante: 75 dias

Status calculado: PLANEJADO (no prazo)
```

```
Saude — PR002 (Troca foto site)

Cliente: interno
Responsavel: Pedro

Etapas: 2 | 1 concluida (50%) | 1 em andamento

Tempo decorrido: 60% do prazo (24 dias usados de 39)
% concluido: 50%

Status calculado: EM RISCO ⚠️
  Conclusao real (50%) abaixo do esperado (60%) — atraso provavel
  Etapa atual (Edicao + upload) tem 4 dias pra terminar — pace insuficiente
  
Recomendacao:
  - Reagendar prazo OU
  - Realocar recurso pra acelerar OU
  - Cortar escopo
```

Logica do status calculado:
- `% concluido > 110% do tempo decorrido`: ADIANTADO
- `90-110%`: NO PRAZO
- `70-89%`: EM RISCO
- `< 70%`: ATRASADO

### 6. Saude do portfolio

Lista todos os projetos `em_andamento` ordenados por risco:

```
Portfolio — 2026-02-15

| ID    | Nome              | %    | Prazo decorrido | Status      | Observacao         |
| PR002 | Troca foto site   | 50%  | 60%             | EM RISCO    | Atrasou 1 etapa    |
| PR001 | Camp Junina       | 0%   | 0%              | PLANEJADO   | Comeca 2026-04-01  |
| PR003 | Loja Estilo SP    | 100% | 95%             | CONCLUIDO   | Entregue 2026-02-08|
```

### 7. Proximos marcos

Etapas com data_fim_planejada nos proximos 7 dias:

```
Proximos marcos (7 dias)

! ET006 — PR002/Edicao + upload — Pedro — vence 2026-02-28
> ET010 — PR004/Briefing cliente X — Marcelo — vence 2026-03-04
```

### 8. Atrasos (etapas)

`data_fim_planejada < hoje E status NOT IN (concluida, cancelada)`:

```
Etapas atrasadas

! ET006 — PR002 — Edicao + upload (Pedro) — atraso 3 dias
! ET003 — PR005 — Aprovacao cliente (cliente XPTO) — atraso 8 dias [BLOQUEADA - aguardando cliente]
```

### 9. Margem do projeto (se for externo)

```
Margem — PR003 (Loja Estilo SP)

Valor contrato:       R$ 2.100,00
Custo direto:         R$ 1.260,00 (60%)  ← vem de compras + horas
Margem bruta:         R$ 840,00 (40%)
Status: CONCLUIDO

Detalhamento de custo:
  Compras (P0008 - tecidos lote especial):  R$ 1.180,00
  Horas (Pedro 4h x R$ 50):                 R$ 200,00 (estimado)  
  Outros:                                   R$ 0,00
```

## Regras invioláveis

| Regra | Por que |
|---|---|
| Toda etapa tem responsavel + prazo | Sem isso, nao da pra acompanhar |
| `ordem` unica por projeto | Sequencia logica |
| Projeto so vira `concluido` quando todas etapas estao concluidas/canceladas | Inconsistencia |
| Etapa atrasada acima de X% do prazo dela: vira `bloqueada` automatico (com aviso) | Forca acao |
| Status segue regra de saude calculada | Subjetividade gera erro |

## Erros comuns

1. **Projeto sem etapas**: vira "fica feito sabe-se la quando"
2. **Etapas sem prazo**: nao tem como medir saude
3. **Cliente externo sem valor de contrato**: nao calcula margem
4. **Status do projeto nunca atualizado**: portfolio vira mentira
5. **Marcar etapa como concluida sem data real**: relatorio de prazo medio fica errado

## Integracao

- `controle-tarefas`: tarefas podem ser etapas detalhadas
- `controle-clientes`: cliente externo virou projeto? linkar
- `controle-fornecedores`: compras especificas pro projeto entram no custo
- `relatorio-mensal`: projetos concluidos no mes, atrasos, margem media
- `dashboard-rapido`: portfolio em risco

## Exemplos

| Pedido | Acao |
|---|---|
| "Cria projeto Campanha Junina, prazo 2026-06-15, R$ 8k, 4 etapas" | Cria PR + etapas |
| "Como ta o projeto da Loja Estilo SP?" | Saude do projeto |
| "Marca a etapa de briefing como concluida" | Atualiza status + data |
| "Resumo do portfolio" | Tabela todos projetos ativos |
| "O que vence essa semana?" | Lista marcos proximos |
| "Margem da PR003?" | Calcula custo vs contrato |
| "Bloqueia ET003, esperando cliente aprovar" | Status + motivo |

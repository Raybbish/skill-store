---
name: controle-tarefas
description: Gerencia tarefas com prazo, prioridade, responsavel e projeto vinculado. Lista do dia, atrasadas, por pessoa e por projeto. Gera planejamento semanal automatico.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Tarefas

Voce mantem o backlog operacional da equipe. Foco: nada importante cair no esquecimento, ninguem com sobrecarga invisivel.

## Arquivo

### tarefas/tarefas.csv
```
id,titulo,descricao,responsavel,prioridade,prazo,status,projeto,data_criacao,data_conclusao
```
- `id`: `T0001`...
- `prioridade`: `baixa`, `media`, `alta`, `urgente`
- `status`: `pendente`, `em_andamento`, `bloqueada`, `concluida`, `cancelada`
- `projeto`: opcional, vincula com `projetos.csv` (nome ou id)

## Operacoes

### 1. Criar tarefa

1. Gera `id` sequencial
2. **Exige responsavel** — sem isso, recusa: "Quem fica com essa tarefa?"
3. **Exige prazo** — se nao informado, sugere baseado em prioridade:
   - urgente: hoje ou ate amanha
   - alta: ate 3 dias
   - media: ate 7 dias
   - baixa: 14+ dias
4. `data_criacao` = hoje
5. `status` default = `pendente`

### 2. Mudar status

Usuario: "Marca a T0042 como em andamento" / "Conclui a T0042" / "Bloqueia T0042"

- `pendente → em_andamento`: registra que comecou
- `em_andamento → concluida`: preenche `data_conclusao` = hoje
- `qualquer → bloqueada`: **exige motivo** — adiciona em `descricao` com data
- `qualquer → cancelada`: confirma com usuario antes

### 3. Listar do dia

```
Hoje — 2026-02-15

URGENTE (1):
  ! T0027 — Cobrar Loja Estilo SP (Marcelo) — vence hoje

ALTA (2):
  > T0021 — Refazer foto SP-P (Pedro) — vence amanha
  > T0024 — Conferir extrato Itau (Ana) — vence em 2 dias

ATRASADAS (3):
  ! T0015 — Atualizar tabela de medidas (Maria) — atrasada 5 dias
  ! T0018 — Resp email novo cliente (Joana) — atrasada 3 dias
  ! T0019 — Pedir orcamento Embalagens BR (Marcelo) — atrasada 1 dia
```

### 4. Por pessoa

```
Carga atual — Maria

Em andamento (2):
  > T0015 — Atualizar tabela de medidas — vence 2026-02-10 (atrasada 5d)
  > T0023 — Postar lancamento BH — vence 2026-02-20

Pendentes (4):
  > T0028 — Responder pedido revenda — vence 2026-02-18 (alta)
  > T0029 — Reagendar visita estudio — vence 2026-02-22 (media)
  > T0031 — Atualizar bio Insta — vence 2026-02-25 (baixa)
  > T0033 — Brainstorm Junina — vence 2026-03-01 (media)

Total: 6 tarefas em aberto
Risco: 1 atrasada — recomenda ajustar prazo OU repassar T0015
```

### 5. Por projeto

Filtra por `projeto`. Mostra todas em aberto + concluidas.

### 6. Atrasadas

`prazo` < hoje E `status` not in (concluida, cancelada).

Ordena por dias de atraso.

### 7. Sugestao de redistribuicao

Quando 1 pessoa tem > N tarefas urgentes/altas em aberto:

```
Atencao: Maria tem 5 tarefas urgentes/altas. 
Sugestao:
  - T0015 (atrasada 5d) pode ir pra Joana?
  - T0029 (media) pode reagendar pra semana que vem?
```

### 8. Planejamento semanal

Toda segunda, ao pedir "semana":

```
Semana de 16/02 a 22/02

Por pessoa:
  Maria   — 4 tarefas (carga normal)
  Joana   — 2 tarefas (pode pegar mais)
  Pedro   — 6 tarefas (sobrecarga, redistribuir 1?)
  Marcelo — 3 tarefas
  Ana     — 1 tarefa

Bloqueadas (precisam acao):
  ! T0011 — Aguardando aprovacao do contador (Marcelo)
  ! T0017 — Aguardando resposta TecidoCo (Marcelo)
```

## Regras invioláveis

| Regra | Por que |
|---|---|
| Sempre tem responsavel | Sem dono, ninguem faz |
| Sempre tem prazo | Sem prazo, fica eterno |
| Bloqueada exige motivo | Senao vira "cemiterio de tarefas" |
| `id` nunca repete | Auditoria |
| Concluida nunca volta a `pendente` | Se precisa, abre tarefa nova |

## Erros comuns

1. **Tarefa sem responsavel claro**: "todo mundo" significa "ninguem"
2. **Prazo "indefinido"**: tarefa morre na lista
3. **Bloqueada sem motivo**: ninguem sabe o que destrava
4. **Concluir e nunca registrar `data_conclusao`**: relatorio de produtividade fica errado

## Integracao

- `controle-projetos`: tarefa pode ser uma etapa do projeto
- `controle-clientes`: follow-up de cliente pode virar tarefa
- `dashboard-rapido`: tarefas vencendo hoje, atrasadas, por responsavel
- `relatorio-mensal`: numero de tarefas concluidas no mes, tempo medio de conclusao

## Exemplos reais

| Pedido | Acao |
|---|---|
| "Adiciona tarefa pra Pedro refazer foto SP-P ate sexta, alta" | Cria T000X |
| "O que tenho pra hoje?" | Lista responsavel = usuario, prazo = hoje |
| "O que ta atrasado?" | Lista prazo < hoje |
| "Tarefas da Maria" | Filtra responsavel |
| "Conclui T0021" | Muda status + data_conclusao |
| "Bloqueia T0017, esperando o TecidoCo responder" | Muda + motivo |
| "Como ta o projeto Junina?" | Filtra projeto Junina + mostra status das tarefas |
| "Planejamento da semana" | Sumario por pessoa + alertas |

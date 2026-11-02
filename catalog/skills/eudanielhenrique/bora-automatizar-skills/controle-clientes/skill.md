---
name: controle-clientes
description: CRM em CSV. Cadastra clientes, registra interacoes com follow-up, identifica inativos, calcula recencia/frequencia/valor (RFV), segmenta por origem, ticket e comportamento.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Clientes (CRM)

Voce mantem o CRM do usuario com foco em: nao perder oportunidade de follow-up + reativar quem sumiu + entender quem vale ouro.

## Arquivos

### clientes/clientes.csv
```
id,nome,email,telefone,empresa,status,origem,data_cadastro,cidade,estado,observacoes
```
- `id`: sequencial `C001` (nunca reusa)
- `status`: `lead`, `prospect`, `ativo`, `inativo`, `perdido`
- `origem`: `instagram`, `indicacao`, `site`, `linkedin`, `meta_ads`, `google_ads`, `evento`, `outro`

### clientes/interacoes.csv
```
data,cliente_id,tipo,canal,resumo,proximo_passo,data_proximo_passo,responsavel
```
- `tipo`: `primeiro_contato`, `descoberta`, `proposta`, `objecao`, `venda`, `pos_venda`, `reclamacao`, `reativacao`
- `canal`: `whatsapp`, `email`, `instagram_dm`, `linkedin`, `telefone`, `presencial`, `zoom`, `meet`

## Status: ciclo de vida

```
lead → prospect → ativo → (segue) ativo
                       ↘ (sumiu 90+ dias) inativo
                       ↘ (cancelou/foi pra concorrente) perdido
inativo → ativo (reativacao bem sucedida)
inativo → perdido (deu sinal claro de que nao volta)
```

## Operacoes

### 1. Cadastrar cliente

1. **Antes de cadastrar, busque duplicata** por email + telefone + nome aproximado
2. Se achou similar (Levenshtein < 3 no nome OU email igual OU telefone igual): pergunta "achei C048 - Carla Mendes - mesmo cliente?"
3. Gera `id` sequencial
4. `status` default = `lead`
5. `data_cadastro` = data atual

### 2. Registrar interacao

1. Adiciona linha em `interacoes.csv`
2. Se `proximo_passo` foi informado, marca `data_proximo_passo` (default: 7 dias se nao especificou)
3. Atualiza `status` do cliente se a interacao indicar:
   - Tipo `proposta` ou `descoberta` profunda → `prospect`
   - Tipo `venda` → `ativo`
   - Tipo `reclamacao` grave → adiciona observacao no cadastro

### 3. Listar follow-ups pendentes

Filtra `interacoes.csv` por:
- `data_proximo_passo` <= hoje
- Nao existe interacao posterior pro mesmo cliente

Ordena por `data_proximo_passo` (mais atrasada primeiro).

```
Follow-ups pendentes (5)

! Carla Mendes (C001) — agendado pra 2026-02-10 (5 dias atrasado)
  Proximo passo: Mandar tabela de medidas
  Ultimo contato: 2026-02-05 - whatsapp

! Loja Estilo SP (C048) — agendado pra 2026-02-12 (3 dias atrasado)
  Proximo passo: Mandar proposta atacado
  Ultimo contato: 2026-02-08 - zoom

> Joao Silva (C002) — agendado pra hoje
  ...
```

### 4. Identificar inativos

Cliente `ativo` que:
- Nao tem venda nos ultimos 90 dias (cruza com `vendas.csv` por nome ou email)
- OU nao tem interacao nos ultimos 60 dias

Saida com sugestao de qual abordagem (depende do quanto sumiu):

- 30-60 dias: "Olha so, e voce?" (toque leve)
- 60-120 dias: "Tem desconto especial pra voce voltar"
- 120+ dias: muda status pra `inativo` automaticamente

### 5. Ficha do cliente

Pega cliente_id e mostra:

```
Carla Mendes (C001)
Status: ativo • Origem: instagram • Cliente desde: 2026-01-12
email: carla@email.com • tel: 11 98888-1234

Resumo de compras:
  Total gasto: R$ 1.498,30
  Numero de compras: 5
  Ticket medio: R$ 299,66
  Ultima compra: 2026-02-05 (V0098)
  Recencia: 10 dias

Ultimas 3 interacoes:
  2026-02-05 - venda - whatsapp - "Comprou Recife G x2 + Salvador G x1"
  2026-01-25 - pos_venda - whatsapp - "Elogiou qualidade. Pediu sugestao de tamanho"
  2026-01-13 - venda - whatsapp - "Comprou Recife G x3"

Proximo passo agendado: nenhum
```

### 6. Analise RFV (Recencia, Frequencia, Valor)

Top 20 clientes em uma matriz simples:

```
Cliente              | Recencia (dias) | Compras | Valor (R$) | Score
Loja Estilo SP       | 5               | 3       | 4.200,00   | A+
Carla Mendes         | 10              | 5       | 1.498,30   | A
Joao Silva           | 28              | 2       | 199,80     | B
...
```

Score:
- A+: top 10% de valor + recencia < 30 dias
- A: top 25% de valor
- B: meio
- C: bottom 50% ou recencia > 90 dias

### 7. Segmentar por origem

```
Origem      | Clientes | Vendas | Valor   | LTV medio
indicacao   | 12       | 38     | R$ 8.4k | R$ 700
instagram   | 23       | 45     | R$ 9.2k | R$ 400
linkedin    | 4        | 15     | R$ 7.5k | R$ 1.875 ← canal mais valioso por cliente
site        | 18       | 23     | R$ 4.6k | R$ 256
```

### 8. Aniversariantes

Se tiver `data_aniversario` no observacoes ou em campo extra: lista do mes pra acao de relacionamento.

## Regras invioláveis

| Regra | Por que |
|---|---|
| `id` nunca se repete | Identificador unico |
| Email e telefone sao chaves de duplicata | Bagunca grande |
| Toda interacao com `proximo_passo` deve ter `data_proximo_passo` | Sem data, follow-up se perde |
| Status muda explicitamente | Nao fica de dois mundos |
| Inativos sao detectados, nao decididos | 90+ dias sem compra/contato → automatico |

## Erros comuns

1. **Cadastrar mesmo cliente 2x com nome ligeiramente diferente**: virou bagunca pra sempre
2. **Esquecer follow-up agendado**: oportunidade perdida (esse e o motivo principal de existir essa skill)
3. **Status descolado da realidade**: cliente cancelou ha 6 meses mas continua "ativo"
4. **Origem em branco**: relatorio fica inutil — *exija* origem na hora do cadastro

## Integracao

- `controle-vendas`: cliente novo? cria primeiro aqui
- `relatorio-mensal`: novos clientes do mes, ativos, inativos, top 5
- `dashboard-rapido`: follow-ups pendentes hoje, top 3
- `controle-tarefas`: follow-up agendado pode virar tarefa

## Exemplos reais (Camisa BR)

| Pedido | Acao |
|---|---|
| "Falei com a Carla, ela quer ver tabela de medidas, mando ate quarta" | Interacao tipo descoberta + proximo passo + data |
| "Quem eu preciso retornar essa semana?" | Filtra follow-ups com data_proximo_passo nessa faixa |
| "Quem nao compra ha 60 dias?" | Cruza vendas + clientes ativos |
| "Carla acabou de virar cliente" | Status: lead → ativo |
| "Cliente perdido pra concorrente — Pedro Almeida" | Status: → perdido + observacao "foi pra X" |
| "Quem sao meus 10 melhores clientes?" | RFV ranking |
| "Manda mensagem pros 5 inativos top valor" | Lista 5 + sugere texto de reativacao |

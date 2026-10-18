---
name: controle-vendas
description: Registra vendas, calcula comissoes por regra de meta, acompanha metas mensais, gera rankings (vendedor, produto, cliente), forecast e analise de canais.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Vendas

Voce e o responsavel pela gestao comercial. Trabalha com:

- `vendas/vendas.csv` — registro de cada venda (linha por item vendido)
- `vendas/metas.csv` — metas mensais por vendedor

## Estrutura

### vendas/vendas.csv
```
data,numero_venda,cliente,vendedor,sku,quantidade,valor_unitario,valor_total,forma_pagamento,status,canal,observacao
```
- `numero_venda`: sequencial (`V0001`, `V0002`...) — sempre o mesmo numero pra mesma venda, mesmo se tem varios itens (varias linhas com o mesmo numero)
- `valor_total`: SEMPRE recalcule = `quantidade * valor_unitario`. Nunca confie no que vem
- `status`: `pago`, `em_aberto`, `cancelada`, `parcialmente_pago`
- `canal`: `site`, `whatsapp`, `instagram`, `presencial`, `atacado`, `marketplace`

### vendas/metas.csv
```
mes,vendedor,meta_valor,comissao_percentual_ate_meta,comissao_percentual_acima
```
- `mes`: `YYYY-MM`
- Comissao escalonada: ate atingir a meta = X%, valor que excede = Y%

## Operacoes

### 1. Registrar venda nova

Usuario: "Maria vendeu 3 camisetas Recife G pra Carla por 49,90 cada, recebeu no pix"

1. Gera `numero_venda` novo (le o ultimo do CSV, +1)
2. Verifica se cliente existe — se nao, sugere cadastrar via skill `controle-clientes`
3. Verifica se SKU existe — se nao, recusa
4. Calcula `valor_total = quantidade * valor_unitario`
5. Adiciona linha em `vendas.csv`
6. Se `status = pago`: gera entrada em `caixa.csv` com `referencia = V0001` (skill `controle-financeiro`)
7. Se `status = em_aberto`: cria conta a receber (`AR000X`) com vencimento sugerido
8. Baixa estoque (skill `controle-estoque`)
9. Confirma saida humana: "V0001 registrada — Carla Mendes — REC-G x3 — R$ 149,70 — pago via pix. Estoque REC-G: 22 → 19. Saldo de caixa: R$ Y."

### 2. Cancelar venda

1. Atualiza `status = cancelada` (NUNCA apaga linha)
2. Devolve estoque (gera entrada com observacao "cancelamento V0001")
3. Se ja tinha entrado no caixa, gera saida com `categoria = estorno_venda`
4. Adiciona observacao no campo `observacao`

### 3. Atualizar status

Pago em parcelas:
- `parcialmente_pago` ate quitar
- Cada parcela gera entrada em caixa com referencia "V0001 parcela 1/3"

### 4. Calcular comissao

Formula:

```
mes = YYYY-MM do vendedor
total_pago = soma de valor_total das vendas pagas do vendedor no mes
meta = metas.csv[mes][vendedor].meta_valor
ate_meta_pct = ...comissao_percentual_ate_meta / 100
acima_pct = ...comissao_percentual_acima / 100

if total_pago <= meta:
    comissao = total_pago * ate_meta_pct
else:
    comissao = (meta * ate_meta_pct) + ((total_pago - meta) * acima_pct)
```

**Vendas canceladas NAO entram. Em aberto NAO entram. So `pago`.**

### 5. Acompanhar meta (durante o mes)

```
Meta de Maria — Fevereiro/2026

Meta: R$ 18.000
Realizado (pagas): R$ 12.430 (69%)
Em aberto: R$ 2.150 (12%)
Faltam: R$ 5.570
Dias restantes: 9
Pace necessario: R$ 619/dia (vs. R$ 444/dia ate agora)

Status: VAI BATER se mantiver pace, mas precisa acelerar
```

### 6. Top vendedores (mes ou periodo)

Tabela com:
- Vendedor
- Numero de vendas
- Valor total
- Ticket medio
- % da meta
- Comissao do periodo

### 7. Top produtos

Por valor total OU quantidade. Mostra:
- SKU + nome
- Quantidade vendida
- Valor total
- % do faturamento

### 8. Top clientes

Cuidado: junta varias linhas com mesmo cliente.

```
| Cliente             | Compras | Valor total | Ticket medio |
| Loja Estilo SP      | 3       | R$ 4.200    | R$ 1.400     |
| Carla Mendes        | 5       | R$ 1.498    | R$ 299,60    |
```

### 9. Analise por canal

Mostra faturamento e ticket medio por canal. Util pra decidir investimento de marketing.

```
Canal       | Vendas | Valor    | Ticket | % total
site        | 89     | R$ 21.4k | R$ 240 | 56%
atacado     | 8      | R$ 12.6k | R$ 1.575| 33%
whatsapp    | 22     | R$ 3.5k  | R$ 159 | 9%
instagram   | 6      | R$ 800   | R$ 133 | 2%
```

### 10. Forecast simples

Pega vendas dos ultimos 3 meses, tira a media, sugere projecao do mes atual baseado em pace ate agora.

## Regras invioláveis

| Regra | Por que |
|---|---|
| `numero_venda` nunca se repete | Identificador unico |
| Recalcular sempre `valor_total` | Erro humano em digitacao |
| Cancelada nao entra em comissao nem em faturamento | Definicao |
| Toda venda paga gera caixa | Senao saldo desbate |
| Toda venda baixa estoque | Senao estoque desbate |

## Outputs

### Top vendedores do mes
```
Top vendedores — Fevereiro/2026

# | Vendedor | Vendas | Valor    | Ticket | % meta | Comissao
1 | Maria    | 78     | R$ 21.3k | R$ 273 | 178%   | R$ 695
2 | Joana    | 51     | R$ 13.7k | R$ 269 | 137%   | R$ 485
3 | Marcelo  | 13     | R$ 3.4k  | R$ 261 | -      | -

Total time: R$ 38.4k em 142 vendas (ticket medio R$ 270)
```

### Comissao detalhada
```
Comissao Maria — Fevereiro/2026

Vendas pagas: 78 vendas, R$ 21.350
Meta: R$ 18.000

Comissao escalonada:
  Sobre meta:  R$ 18.000 x 3% = R$ 540
  Sobre extra: R$ 3.350 x 5%  = R$ 167,50
  
Total a pagar: R$ 707,50
```

## Erros comuns

1. **Esquecer de marcar venda como paga**: comissao fica errada
2. **Cliente novo cadastrado em todo lugar com nome diferente**: usar skill clientes pra normalizar
3. **Registrar valor errado**: confirma com usuario antes de gravar valores acima de R$ 1.000
4. **Calcular comissao incluindo em aberto**: hipotese, nao realizado

## Integracao

- `controle-clientes`: cliente novo? cadastra primeiro
- `controle-estoque`: baixa estoque automatica
- `controle-financeiro`: cria entrada/conta a receber
- `relatorio-mensal`: top everything, faturamento, ticket
- `dashboard-rapido`: vendas hoje + mes ate agora

## Exemplos reais

| Pedido | Acao |
|---|---|
| "Maria vendeu 3 Recife G pra Carla, R$ 49,90, pix" | Cria V0001 + baixa estoque + entrada caixa |
| "Quanto a Maria vendeu em fevereiro?" | Soma pagas do mes |
| "Comissao da Maria fev?" | Aplica regra escalonada |
| "Top 5 produtos do mes" | Agrupa por sku |
| "Cliente comprou e nao pagou ainda" | status = em_aberto + AR + nao gera caixa |
| "Cancela V0001, foi devolvido" | status = cancelada + estoque + estorno caixa |

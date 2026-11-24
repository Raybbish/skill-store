---
name: controle-estoque
description: Controla estoque em CSV. Registra entrada e saida, calcula saldo, alerta produtos abaixo do minimo, gera curva ABC, calcula valor em estoque e identifica giro lento.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Estoque

Voce gerencia o estoque do usuario em dois arquivos.

## Arquivos

### estoque/produtos.csv (cadastro + saldo atual)
```
sku,nome,categoria,unidade,saldo_atual,estoque_minimo,custo_unitario,preco_venda,fornecedor_principal,status
```
- `sku`: identificador unico (ex: `REC-G`, `CAM-PR-P`). Letras maiusculas, hifen, sem espaco
- `unidade`: `un`, `kg`, `m`, `cx`
- `saldo_atual`: numero inteiro (ou decimal se unidade for kg/m)
- `estoque_minimo`: alerta dispara quando saldo fica abaixo
- `custo_unitario`: o que voce pagou por unidade na ultima compra
- `preco_venda`: preco de tabela
- `fornecedor_principal`: id do fornecedor (cruzar com `fornecedores.csv`)
- `status`: `ativo`, `inativo`, `descontinuado`

### estoque/movimentacoes.csv (historico)
```
data,sku,tipo,quantidade,saldo_apos,observacao,referencia
```
- `tipo`: `entrada`, `saida`, `ajuste`
- `saldo_apos`: o saldo do produto apos essa movimentacao (rastreabilidade)
- `referencia`: id da venda, compra ou ajuste

## Operacoes que voce faz

### 1. Cadastrar produto novo

1. Verifica se o `sku` ja existe — se sim, recusa e avisa
2. Adiciona em `produtos.csv` com `saldo_atual = 0` e `status = ativo`
3. Sugere ja registrar uma entrada se ja tem estoque fisico

### 2. Registrar entrada

1. Atualiza `saldo_atual` do SKU em `produtos.csv` (+= quantidade)
2. Atualiza `custo_unitario` se a entrada vier com novo custo (preco mais recente vence)
3. Adiciona linha em `movimentacoes.csv` com `tipo = entrada`, `saldo_apos` calculado
4. Reporta novo saldo

### 3. Registrar saida

1. Verifica se `saldo_atual >= quantidade`
   - Se nao, **avisa em vermelho** e pergunta: "Saldo de SKU e X, voce quer registrar mesmo assim (ficaria negativo) ou ajustar quantidade?"
2. Atualiza `saldo_atual` (-= quantidade)
3. Adiciona linha em `movimentacoes.csv` com `tipo = saida`
4. **Se novo saldo ficou abaixo do minimo, alerta sem precisar pedir**

### 4. Ajuste de inventario

Apos contagem fisica:

1. Para cada SKU com diferenca: registra `tipo = ajuste`, `quantidade` = diferenca (pode ser negativa)
2. Atualiza `saldo_atual`
3. Gera relatorio de ajustes com valor financeiro (sumiu R$ X em estoque)

### 5. Listar abaixo do minimo

```
SELECT * FROM produtos WHERE saldo_atual < estoque_minimo AND status = 'ativo'
```

Saida em tabela ordenada do mais critico (saldo/minimo crescente).

### 6. Curva ABC

Cruzando com `vendas/vendas.csv`:

- A: top 20% dos SKUs que somam ~80% do faturamento
- B: proximos 30% que somam ~15%
- C: ~50% que somam ~5%

Saida com lista por categoria + recomendacao: "atencao em A (estoque + foco), revisar C (descontinuar?)".

### 7. Valor em estoque

```
SUM(saldo_atual * custo_unitario) WHERE status = 'ativo'
```

Tambem mostra valor a preco de venda (potencial de receita).

### 8. Giro lento

SKUs que nao tiveram saida nos ultimos N dias (default 60). Recomenda promocao ou descontinuar.

### 9. Lista de reposicao

Combina:
- Abaixo do minimo
- Tendencia de venda (vendas dos ultimos 30 dias / 30)
- Sugere: "comprar X unidades pra cobrir os proximos 30 dias com folga"

## Regras invioláveis

| Regra | Por que |
|---|---|
| `sku` nunca se repete | Identificador unico |
| Nao apagar movimentacao | Trilha de auditoria. Para corrigir, lance ajuste |
| Toda saida deveria ter referencia (venda ou perda) | Rastreabilidade |
| Saldo negativo: sempre confirmar com usuario | Quase sempre e erro de digitacao |
| `saldo_apos` precisa bater com `produtos.csv` | Inconsistencia indica bug |

## Outputs

### Listar abaixo do minimo
```
Produtos abaixo do minimo (4)

| SKU    | Nome              | Saldo | Min  | % | Sugestao   |
|--------|-------------------|-------|------|---|------------|
| FLO-M  | Camiseta Floripa M| 3     | 10   | 30%| Comprar 30 |
| SAL-G  | Camiseta Salvador G| 4    | 10   | 40%| Comprar 25 |
| ...    | ...               | ...   | ...  | ...| ...        |

Acao recomendada: pedir reposicao com fornecedor F001 (TecidoCo).
```

### Valor em estoque
```
Inventario — 2026-02-15

Quantidade total: 412 unidades
Valor a custo:    R$ 7.416,00
Valor a venda:    R$ 20.558,80
Margem total:     R$ 13.142,80 (177% sobre custo)

Top 5 SKUs por valor:
1. REC-G — 19 un — R$ 342 (custo) / R$ 948 (venda)
2. ...
```

### Curva ABC (mes anterior)
```
Curva ABC — Janeiro/2026

Classe A (8 SKUs - 27%) somam 81% do faturamento:
  REC-G, FLO-M, SAL-G, SP-P, RJ-M, BH-M, BSB-G, POA-M

Classe B (9 SKUs - 30%) somam 14% do faturamento:
  ...

Classe C (13 SKUs - 43%) somam 5% do faturamento:
  ...

Recomendacoes:
- 3 SKUs da classe C nao venderam nada nos ultimos 60 dias: considerar descontinuar
- 2 SKUs da classe A ficaram abaixo do minimo no mes: revisar `estoque_minimo` pra cima
```

## Erros que voce evita

1. **Cadastrar SKU duplicado com nome diferente**: virou bagunca
2. **Registrar saida sem baixar saldo**: dado inconsistente
3. **Confundir `unidade`**: 1 caixa de 12 unidades nao e a mesma coisa que 12 unidades
4. **Atualizar `custo_unitario` sem registrar entrada**: perde historico
5. **Categorizar produto novo sem categoria**: relatorio fica ruim depois

## Integracao com outras skills

- `controle-vendas`: quando uma venda e registrada, voce baixa estoque (via referencia da venda)
- `controle-fornecedores`: quando uma compra entra como entregue, voce sugere registrar entrada no estoque
- `relatorio-mensal`: exporta valor em estoque (final do mes), giro, top produtos
- `dashboard-rapido`: lista produtos abaixo do minimo

## Exemplos reais

| Pedido | Acao |
|---|---|
| "Entrou 50 camisetas Recife G da TecidoCo" | +50 em REC-G + linha em mov com ref P0001 |
| "Vendi 3 Recife G" | -3 (alerta se ficar abaixo do min) |
| "Quanto tenho de cada produto?" | Tabela completa com saldo |
| "O que ta acabando?" | Lista abaixo do minimo + sugestao de quanto comprar |
| "Fiz contagem, REC-G tem 17 mas o sistema diz 19" | Lanca ajuste -2 com observacao "ajuste contagem 2026-02-15" |
| "Quais produtos nao vendem ha mais de 60 dias?" | Cruza movimentacoes + sugere acao |

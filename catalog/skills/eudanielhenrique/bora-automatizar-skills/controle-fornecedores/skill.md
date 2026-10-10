---
name: controle-fornecedores
description: Cadastra fornecedores, registra compras, compara precos historicos, calcula confiabilidade de prazo, alerta entregas pendentes e cruza com contas a pagar.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Fornecedores

Voce gerencia o relacionamento com fornecedores: quem entrega no prazo, quem cobra mais barato, o que esta em transito, o que ja vence essa semana.

## Arquivos

### fornecedores/fornecedores.csv
```
id,nome,cnpj,contato,email,telefone,categoria,prazo_pagamento_dias,prazo_entrega_dias,observacoes,status
```

### fornecedores/compras.csv
```
data,numero_compra,fornecedor_id,descricao,quantidade,valor_unitario,valor_total,prazo_pagamento,status_pagamento,status_entrega,data_entrega_real
```
- `numero_compra`: `P0001`, `P0002`...
- `prazo_pagamento`: data calculada (data + prazo_pagamento_dias)
- `status_pagamento`: `em_aberto`, `pago`, `atrasado`, `cancelado`
- `status_entrega`: `aguardando`, `em_transito`, `entregue`, `atrasada`, `extraviada`

## Operacoes

### 1. Cadastrar fornecedor

1. Verifica duplicata (CNPJ ou nome)
2. Gera `id` (`F001`...)
3. Define prazos default (30 dias pagamento, 7 dias entrega) — usuario pode mudar
4. Status default: `ativo`

### 2. Registrar compra

1. Gera `numero_compra` sequencial
2. Calcula `prazo_pagamento` = data_compra + prazo_pagamento_dias do fornecedor
3. Calcula `valor_total` = quantidade * valor_unitario
4. Status default: `status_pagamento = em_aberto`, `status_entrega = aguardando`
5. **Sugere ao usuario:**
   - Criar conta a pagar correspondente (skill `controle-financeiro`)
6. Confirma: "P0001 — TecidoCo — 100 un tecido — R$ 1.250 — vence 2026-02-07. Crio a conta a pagar?"

### 3. Marcar entrega como recebida

1. Atualiza `status_entrega = entregue`
2. Preenche `data_entrega_real`
3. **Sugere ao usuario:**
   - Registrar entrada no estoque (skill `controle-estoque`)
4. Calcula se foi no prazo: data_entrega_real <= data_compra + prazo_entrega_dias
5. Se atrasou, registra na observacao do fornecedor (alimenta confiabilidade)

### 4. Marcar pagamento

1. Atualiza `status_pagamento = pago`
2. Aciona skill `controle-financeiro` pra marcar a conta a pagar como paga + entrada negativa em caixa

### 5. Comparar precos historicos

Pra um produto/descricao similar, lista todas as compras com fornecedor e preco unitario, ordenado do mais barato pro mais caro:

```
Comparativo: "tecido algodao branco"

Fornecedor       | Ult. compra | Qtd | Unit   | Total    | Total das ultimas 6m
TecidoCo (F001)  | 2026-01-08  | 100 | R$ 12,50| R$ 1.250 | R$ 4.380 (3 compras)
TextilSP (F005)  | 2025-12-15  | 80  | R$ 13,80| R$ 1.104 | R$ 1.104 (1 compra)
TecidosMG (F008) | 2025-11-20  | 100 | R$ 14,00| R$ 1.400 | R$ 1.400 (1 compra)

Mais barato: TecidoCo (R$ 12,50/un — economia de R$ 130 no lote de 100 vs. mais caro)
```

### 6. Confiabilidade de fornecedor

Pra cada fornecedor com 3+ compras:

```
% no prazo = compras_no_prazo / total_compras * 100
% atraso curto (1-3 dias) = ...
% atraso grave (4+ dias) = ...
% extravios = ...
```

Saida em ranking:

```
Confiabilidade dos fornecedores

| Fornecedor | Compras | No prazo | Atraso 1-3d | Atraso 4+d | Score |
| F001       | 12      | 92%      | 8%          | 0%         | A     |
| F002       | 8       | 75%      | 12%         | 13%        | B     |
| F008       | 4       | 50%      | 25%         | 25%        | C ← evitar |
```

### 7. Listar entregas pendentes

```
Em transito (3)

! P0003 — Embalagens BR — 100 caixas — esperado 2026-01-25 (5 dias atrasado, contatar Roberto)
> P0007 — TecidoCo — 200 un tecido — esperado 2026-02-15 (em 8 dias)
> P0009 — EstamparArte — 30 estampas — esperado 2026-02-18 (em 11 dias)
```

### 8. Listar pagamentos a fazer

Por urgencia (data_pagamento <= hoje + 7):

```
Pagamentos da semana

! P0003 — Embalagens BR — R$ 250 — venceu ontem (atrasado)
> P0001 — TecidoCo — R$ 1.250 — vence em 3 dias
```

### 9. Volume por fornecedor (mes ou periodo)

```
Volume — Janeiro/2026

| Fornecedor    | Compras | Valor    | % do total |
| TecidoCo      | 4       | R$ 4.800 | 62%        |
| EstamparArte  | 3       | R$ 1.200 | 16%        |
| Embalagens BR | 2       | R$ 500   | 6%         |
| Outros        | 5       | R$ 1.250 | 16%        |
```

### 10. Alerta de concentracao

Se 1 fornecedor representa > 60% do volume: avisa risco de dependencia.
Se 1 fornecedor caiu pra C: sugere diversificar.

## Regras invioláveis

| Regra | Por que |
|---|---|
| `id` nunca repete | Identificador unico |
| `numero_compra` sequencial | Auditoria |
| Toda compra registrada deve ter status_pagamento + status_entrega | Saber o que esta vivo |
| Cancelar compra: status = cancelado, nao apagar | Trilha |
| Atualizar custo_unitario do produto deve vir de uma entrada de compra | Senao perde a logica |

## Erros comuns

1. **Cadastrar fornecedor 2x com nome ligeiramente diferente**: confiabilidade fica errada
2. **Marcar entregue sem registrar entrada no estoque**: estoque desbate
3. **Marcar pago sem gerar saida no caixa**: caixa desbate
4. **Atrasos nao registrados**: confiabilidade fica enviesada (parece que todo mundo entrega no prazo)

## Integracao

- `controle-financeiro`: criar conta a pagar ao registrar compra; pagar gera saida no caixa
- `controle-estoque`: registrar entrega gera entrada no estoque
- `relatorio-mensal`: top fornecedores por volume + alertas de confiabilidade
- `dashboard-rapido`: entregas em transito + pagamentos da semana

## Exemplos reais

| Pedido | Acao |
|---|---|
| "Comprei 100m de tecido da TecidoCo, R$ 12,50/m" | Cria P000X + sugere conta a pagar |
| "Chegou o pedido P0003" | Atualiza entrega + sugere registrar entrada estoque |
| "Paguei a TecidoCo, P0001" | Atualiza pagamento + saida caixa |
| "Quem e mais barato em tecido?" | Comparativo historico |
| "TecidoCo e confiavel?" | Calcula % no prazo |
| "O que ta atrasado pra chegar?" | Lista entregas pendentes vencidas |
| "Que pago essa semana?" | Lista por urgencia |
| "Volume comprado em janeiro" | Agrupa por fornecedor |

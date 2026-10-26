---
name: relatorio-mensal
description: Gera fechamento mensal completo cruzando todas as outras skills. Compara com mes anterior, identifica tendencias, lista pontos de atencao e produz arquivo markdown reutilizavel.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Relatorio Mensal

Voce gera o fechamento mensal — o mais importante artefato gerado por esse pacote. Cruza dados de **todas** as outras skills e produz UM arquivo markdown que o usuario le em 5 minutos pra tomar decisao do mes seguinte.

## Arquivos lidos

- `financeiro/caixa.csv` + `contas-a-pagar.csv` + `contas-a-receber.csv`
- `vendas/vendas.csv` + `metas.csv`
- `estoque/produtos.csv` + `movimentacoes.csv`
- `clientes/clientes.csv` + `interacoes.csv`
- `fornecedores/fornecedores.csv` + `compras.csv`
- `funcionarios/funcionarios.csv` + `ponto.csv` (folha gerencial)
- `tarefas/tarefas.csv`
- `projetos/projetos.csv` + `etapas.csv`
- `relatorios/relatorio-{mes-anterior}.md` (pra comparativo)

## Arquivo gerado

`relatorios/relatorio-YYYY-MM.md`

## Estrutura completa do relatorio

```markdown
# Relatorio mensal — {Mes/Ano em portugues}

Gerado em {DATA} • {DD dias completos do mes}

## 1. Resumo executivo (3 linhas)

{1 linha: o que aconteceu de melhor}
{1 linha: o que aconteceu de pior}
{1 linha: a decisao mais importante a tomar}

## 2. Resumo financeiro

| Indicador           | Mes        | Anterior   | Variacao |
|---------------------|------------|------------|----------|
| Entradas no caixa   | R$ X       | R$ Y       | +/-Z%    |
| Saidas no caixa     | R$ X       | R$ Y       | +/-Z%    |
| Resultado           | R$ X       | R$ Y       | +/-Z%    |
| Saldo no fim do mes | R$ X       | R$ Y       | +/-Z%    |

### 2.1 Entradas por categoria
| Categoria  | Valor | % do total |
| ...                              |

### 2.2 Saidas por categoria
| Categoria  | Valor | % do total |
| fornecedor | R$ X  | XX%        |
| salario    | R$ X  | XX%        |
| imposto    | R$ X  | XX%        |
| pro_labore | R$ X  | XX%        |
| outros     | R$ X  | XX%        |

### 2.3 Em aberto (snapshot do ultimo dia)
- A receber: R$ X (N contas)
- A pagar:   R$ X (N contas)
- Capital de giro: R$ X (a receber - a pagar)

## 3. Vendas

| Indicador        | Mes   | Anterior | Variacao |
|------------------|-------|----------|----------|
| Faturamento      | R$ X  | R$ Y     | +/-Z%    |
| Numero de vendas | N     | M        | +/-Z%    |
| Ticket medio     | R$ X  | R$ Y     | +/-Z%    |
| Cancelamentos    | N     | M        |          |

### 3.1 Vendedores
| # | Vendedor | Vendas | Valor | % meta | Comissao |

### 3.2 Top 10 produtos
| # | SKU | Nome | Quantidade | Valor | % faturamento |

### 3.3 Top 10 clientes
| # | Cliente | Compras | Valor | Ticket medio |

### 3.4 Por canal
| Canal | Vendas | Valor | Ticket | % do total |

## 4. Estoque

- Valor total em estoque (custo): R$ X
- Valor total em estoque (venda): R$ X
- Produtos abaixo do minimo no fim do mes: N

### 4.1 Top 5 mais vendidos do mes (por quantidade)
{lista}

### 4.2 Giro lento — sem venda nos ultimos 60 dias
{lista — sugestao: promocao ou descontinuar}

### 4.3 Curva ABC do mes
{breve — A: X SKUs / 80% faturamento, etc.}

## 5. Clientes

- Novos clientes no mes: N
- Clientes ativos no fim do mes: N
- Clientes que viraram inativos esse mes: N
- Reativacoes (de inativo pra ativo): N

### 5.1 Origens dos novos clientes
| Origem | Novos | Conversao em compra |

## 6. Fornecedores

- Volume comprado: R$ X
- Numero de compras: N

### 6.1 Top 5 fornecedores por volume
{tabela}

### 6.2 Atrasos no mes
{lista — qual fornecedor, quanto tempo}

## 7. Equipe

- Custo total folha (gerencial): R$ X
- Total de horas trabalhadas: H
- Total de horas extras: H
- Faltas: H
- Aniversariantes do proximo mes: {nomes}
- Ferias agendadas no proximo mes: {nomes + datas}

## 8. Operacao

### 8.1 Tarefas
- Concluidas no mes: N
- Atrasadas no fim do mes: N
- Tempo medio de conclusao: D dias

### 8.2 Projetos
- Em andamento no fim do mes: N
- Concluidos no mes: N
- Em risco: N (lista nomes)
- Margem media projetos concluidos: X%

## 9. Pontos de atencao

{2 a 5 alertas baseados nos dados — nao inventar, vir do analitico}

Exemplos do que pode aparecer aqui:
- Queda de faturamento de X%, motivada provavelmente por Y
- Cliente W esta em vias de virar inativo (recencia 80 dias)
- Fornecedor Z teve 2 atrasos em 4 entregas — checar
- Margem do projeto V abaixo da media — ver custos
- Maria bateu 178% da meta — meta da Maria deveria subir

## 10. Recomendacoes pro proximo mes

{3 acoes concretas baseadas no relatorio — nao genericas}

Exemplos:
1. Aumentar estoque minimo de FLO-M de 10 pra 25 (faltou estoque por 8 dias)
2. Mandar campanha de reativacao pros 12 clientes que viraram inativos
3. Reagendar projeto PR002 que ja esta em risco

---

*Comparativos sao com o mes imediatamente anterior. Quando nao houver mes anterior, mostrar "primeiro mes".*
```

## Operacoes

### 1. Gerar relatorio do mes

Quando usuario disser "fecha janeiro", "gera relatorio do mes passado", "fechamento mensal":

1. Identifica o mes alvo (default: mes anterior se ja virou dia 1+; senao confirma)
2. Le todos os arquivos
3. Calcula tudo
4. **Antes de gravar**, mostra preview da secao 1 + 9 + 10 (executivo + atencao + recomendacoes) e pergunta: "Gero o arquivo completo?"
5. Grava em `relatorios/relatorio-YYYY-MM.md`
6. Informa caminho

### 2. Comparar dois meses

Sem precisar gerar relatorio novo:

```
Comparativo: Janeiro vs Fevereiro 2026

Vendas: R$ 38.4k → R$ 42.2k (+9.8%)
Ticket medio: R$ 270 → R$ 267 (-1.1%)
Novos clientes: 23 → 31 (+34.8%)
Custo de fornecedor: R$ 12.5k → R$ 11.2k (-10.4%)

Mudanca relevante: cresceu venda mas baixou ticket — mais cliente, gastando menos cada
```

### 3. Tendencia (3+ meses)

Quando o usuario tem 3 ou mais relatorios mensais, gera linha do tempo de indicadores chave:

```
Faturamento ultimos 6 meses

Set: R$ 28k
Out: R$ 32k (+14%)
Nov: R$ 35k (+9%)
Dez: R$ 41k (+17%) ← natal
Jan: R$ 38k (-7%)
Fev: R$ 42k (+11%)

Tendencia: alta consistente. Crescimento medio mensal: +9%
```

## Regras invioláveis

| Regra | Por que |
|---|---|
| Nunca inventar dado | Se faltar arquivo, escreve "sem dados" |
| Comparativo so se houver mes anterior | Senao primeiro mes — declarado |
| Pontos de atencao saem dos dados, nao do achismo | Cada um precisa de evidencia citavel |
| Recomendacoes sao especificas, nao genericas | "Vender mais" nao serve |
| Relatorio gerado nao se altera depois | Se erro, gera relatorio novo com correcao explicada |

## Erros comuns

1. **Genericar pontos de atencao**: cada item precisa de numero
2. **Esquecer de cruzar**: relatorio que so tem financeiro perde valor
3. **Nao olhar o que ficou em aberto**: capital de giro e indicador chave
4. **Nao comparar com o mes anterior**: entao nao tem como saber tendencia

## Integracao

- Le tudo de todas as outras skills
- Salva em `relatorios/` versionado por Git
- `dashboard-rapido` e a versao instantanea — esse aqui e formal

## Exemplos

| Pedido | Acao |
|---|---|
| "Fecha janeiro" | Gera `relatorios/relatorio-2026-01.md` |
| "Fechamento do mes" (dia 1+) | Mes imediatamente anterior |
| "Compara dezembro com janeiro" | Comparativo direto sem novo arquivo |
| "Tendencia dos ultimos 6 meses" | Le todos os relatorios + sumario |
| "O que mais mudou de janeiro pra fevereiro?" | Diff focado |

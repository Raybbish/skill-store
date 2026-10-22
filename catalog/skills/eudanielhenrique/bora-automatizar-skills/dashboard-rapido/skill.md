---
name: dashboard-rapido
description: Snapshot textual instantaneo do estado do negocio. Le todos os dados, monta painel em 1 mensagem com os indicadores que importam. Read-only. Resposta em ate 5 segundos.
allowed-tools: Read Grep Bash
user-invocable: true
---

# Dashboard Rapido

Voce e o "abrir o sistema e olhar". Em 1 mensagem, o usuario ve o estado do negocio. **Nao altera arquivo nenhum** — so le e formata.

Esse e a skill que o dono vai usar mais vezes (varias por dia). Tem que ser rapida, util, e mostrar exatamente o que importa pra ele tomar decisao.

## Quando voce e acionado

Frases curtas que disparam:
- `dashboard`
- `como ta?`
- `resumo`
- `como ta o negocio?`
- `snapshot`
- `painel`
- `estado atual`

## Arquivos lidos

- `financeiro/caixa.csv`
- `financeiro/contas-a-pagar.csv`
- `financeiro/contas-a-receber.csv`
- `vendas/vendas.csv`
- `vendas/metas.csv`
- `estoque/produtos.csv`
- `clientes/interacoes.csv`
- `tarefas/tarefas.csv`
- `projetos/projetos.csv`
- `funcionarios/ferias.csv`
- `fornecedores/compras.csv` (pra pegar entregas em transito)

## Layout (template fixo)

```
╔══════════════════════════════════════════════════════════╗
║  DASHBOARD — DD/MM/YYYY HH:MM                            ║
╚══════════════════════════════════════════════════════════╝

💰 CAIXA
  Saldo:              R$ XX.XXX,XX
  Hoje:               +R$ X.XXX (entradas) -R$ X.XXX (saidas)
  Mes ate agora:      +R$ XX.XXX (resultado liquido)

📅 PROXIMOS 7 DIAS
  A receber:          R$ X.XXX (N contas)
  A pagar:            R$ X.XXX (N contas)
    !  Atrasadas:     R$ X.XXX (N contas)
    
🛒 VENDAS
  Hoje:               N vendas — R$ X.XXX
  Mes:                N vendas — R$ XX.XXX
  vs. mes anterior:   +/-XX%
  Pace pro mes:       R$ XX.XXX (projecao se mantiver)
  
  Top vendedor:       Maria — R$ XX.XXX (XX% da meta)
  Top produto:        REC-G (XX un)

📦 ESTOQUE
  Valor (custo):      R$ XX.XXX
  Abaixo do minimo:   N
    ! FLO-M (3/10)
    ! SAL-G (4/10)
  Em transito:        N pedidos chegando

👥 CLIENTES
  Follow-ups hoje:    N pendentes
    > Carla Mendes
    > Loja Estilo SP
  Inativos novos:     N (que cruzaram 90 dias sem compra)
  Top cliente do mes: XPTO (R$ X.XXX)

✅ TAREFAS
  Hoje:               N
  Atrasadas:          N (! XX)
  Urgentes:           N
  Bloqueadas:         N

📊 PROJETOS
  Em andamento:       N
  Em risco:           N (! XX)
  Marcos essa sem.:   N

👤 EQUIPE
  Aniversariantes essa semana: {nomes ou "—"}
  Ferias proximas (30d):       {nome — datas ou "—"}

🚨 ALERTAS (max 3, mais criticos)
  ! Saldo de caixa cobre menos de 30 dias de operacao
  ! Conta TecidoCo R$ 1.800 vence em 2 dias
  ! Projeto PR002 (Foto site) em risco — atraso provavel
```

## Logica de cada secao

### 💰 CAIXA
- Saldo = soma entradas - saidas em `caixa.csv`
- "Hoje" = data = hoje
- "Mes ate agora" = data >= primeiro dia do mes corrente

### 📅 PROXIMOS 7 DIAS
- A receber: `contas-a-receber.csv` com vencimento entre hoje e hoje+6, status em_aberto
- A pagar: idem em `contas-a-pagar.csv`
- Atrasadas: vencimento < hoje, em_aberto

### 🛒 VENDAS
- Hoje: vendas pagas com data = hoje
- Mes: vendas pagas com data >= primeiro dia do mes
- vs mes anterior: comparativo de mesmo periodo (1 a hoje vs 1 a mesmo dia mes anterior)
- Pace projetado: (faturamento do mes ate hoje / dias decorridos) * dias do mes
- Top vendedor: mais vendas pagas no mes
- % meta: acumulado / meta de `metas.csv` deste mes

### 📦 ESTOQUE
- Valor (custo) = sum(saldo_atual * custo_unitario) WHERE status=ativo
- Abaixo do minimo = saldo < minimo (lista os 3-5 piores)
- Em transito = compras com status_entrega in (aguardando, em_transito)

### 👥 CLIENTES
- Follow-ups hoje: interacoes com data_proximo_passo <= hoje, sem interacao posterior
- Inativos novos: clientes ativos cuja ultima compra cruzou 90 dias HOJE (nao toda a base — so os que viraram hoje)
- Top cliente do mes: maior soma de vendas

### ✅ TAREFAS
- Hoje: prazo = hoje, status not in (concluida, cancelada)
- Atrasadas: prazo < hoje, status not in (concluida, cancelada)
- Urgentes: prioridade = urgente, status not in (concluida, cancelada)
- Bloqueadas: status = bloqueada

### 📊 PROJETOS
- Em andamento: status = em_andamento
- Em risco: status calculado = EM_RISCO ou ATRASADO (regra do controle-projetos)
- Marcos essa semana: etapas com data_fim_planejada nos proximos 7 dias

### 👤 EQUIPE
- Aniversariantes: data_admissao com mes/dia nos proximos 7 dias
- Ferias proximas: ferias com inicio_ferias nos proximos 30 dias

### 🚨 ALERTAS
**Maximo 3.** Criterios pra entrar (priorizados):

1. Saldo cobre menos de 30 dias de operacao (saldo / saidas medias diarias)
2. Conta a pagar atrasada acima de R$ 500
3. Projeto em risco proximo do prazo
4. Cliente top atrasou pagamento
5. Estoque critico de produto top de venda
6. Vendedor < 50% da meta com < 7 dias do mes

## Regras invioláveis

| Regra | Por que |
|---|---|
| READ-ONLY | Nunca edita, escreve, apaga |
| Resposta em UMA mensagem | Sem cortar |
| Maximo 3 alertas | Mais que isso vira ruido |
| Numero formato BR (`R$ 1.500,00`, `12,5%`) | Padrao do publico |
| Se arquivo nao existe, mostra `—` na secao | Nao quebra |
| Se nao tiver dado historico (mes anterior), mostra `—` na variacao | Honesto |

## Performance

- Esse skill roda muito. Le rapido, calcula rapido, formata rapido.
- Nao buscar arquivos enormes inteiros se voce so precisa de filtro recente — use grep com data corrente

## Erros comuns

1. **Demorar mais de 10 segundos**: usuario perde paciencia
2. **Mostrar TUDO**: o ponto e o que importa, nao o que existe
3. **Alertar coisa pequena**: alerta serio = atencao serio
4. **Esquecer formato BR**: numero americano confunde

## Exemplos

| Pedido | Acao |
|---|---|
| `dashboard` | Layout completo |
| `como ta?` | Layout completo |
| `painel` | Layout completo |
| `como ta o caixa?` | So a secao caixa expandida |
| `como ta a Maria?` | So vendedora especifica do mes |

## Diferenca do `relatorio-mensal`

| Dashboard | Relatorio mensal |
|---|---|
| Estado **atual** | Fechamento do **mes** |
| Read-only | Gera arquivo |
| Em segundos | Em alguns segundos |
| Usado varias vezes ao dia | 1x por mes |
| Sem comparativo profundo | Comparativos completos |
| Maximo 3 alertas | Pontos de atencao detalhados |

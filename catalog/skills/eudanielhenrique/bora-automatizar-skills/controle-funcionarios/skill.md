---
name: controle-funcionarios
description: Cadastro de funcionarios, ponto, banco de horas, ferias e calculo gerencial de salario do mes. NAO e folha oficial, e gestao interna pre-folha.
allowed-tools: Read Grep Bash Edit Write
user-invocable: true
---

# Controle de Funcionarios

Voce mantem o registro gerencial da equipe: quem trabalha, quanto trabalhou, quando vai sair de ferias, quanto recebe. **Isso nao substitui contador/folha oficial** — e a camada gerencial pra dono saber o que ta acontecendo.

## Arquivos

### funcionarios/funcionarios.csv
```
id,nome,cargo,salario_base,data_admissao,carga_horaria_diaria,vinculo,pix,status
```
- `vinculo`: `clt`, `pj`, `mei`, `estagio`, `freelance`
- `carga_horaria_diaria`: 8 (default), 6, 4

### funcionarios/ponto.csv
```
data,funcionario_id,entrada,saida_almoco,volta_almoco,saida,horas_trabalhadas,observacao
```
- Horas em formato `HH:MM`
- `horas_trabalhadas`: calcular = (saida - entrada) - (volta - saida_almoco)

### funcionarios/ferias.csv
```
funcionario_id,periodo_aquisitivo_inicio,periodo_aquisitivo_fim,inicio_ferias,fim_ferias,dias,status
```
- `status`: `nao_agendada`, `agendada`, `em_curso`, `concluida`

## Operacoes

### 1. Cadastrar funcionario

1. Gera `id` (`E001`...)
2. Pede vinculo, cargo, salario base, data de admissao, carga horaria
3. Calcula automaticamente o `periodo_aquisitivo_inicio` (data_admissao) e `periodo_aquisitivo_fim` (data_admissao + 12 meses) — registra em `ferias.csv` com status `nao_agendada`

### 2. Registrar ponto

1. Calcula `horas_trabalhadas` automaticamente
2. Se houve hora extra (> carga_horaria_diaria), avisa
3. Se houve falta nao justificada, avisa
4. Permite observacao livre (home office, atestado, etc.)

### 3. Banco de horas (acumulado)

Pra um funcionario num periodo:

```
Banco de horas Maria — Fevereiro/2026

Carga prevista (16 dias uteis x 8h): 128h
Trabalhado:                          138h
Saldo:                              +10h

Detalhamento:
  Horas extras: 12h
  Faltas/horas a menos: 2h
  Saldo liquido: 10h positivas
```

### 4. Calcular salario do mes (gerencial)

```
Salario Maria — Fevereiro/2026

Salario base CLT:               R$ 2.500,00

Adicionais:
+ Horas extras (12h x 50%):     R$ 215,42  (= 12 x salario_base/220 x 1,5)
+ Comissao do mes:              R$ 707,50  (vem da skill controle-vendas)

Descontos gerenciais (informativos, NAO oficiais):
- Faltas (2h):                  R$ 22,73   (= 2 x salario_base/220)
- INSS estimado (~11%):         R$ 270,00  ← CONFERIR COM CONTADOR
- IRRF estimado:                R$ 0,00    ← CONFERIR COM CONTADOR

Liquido estimado:               R$ 3.130,19

⚠️ Este e calculo gerencial. A folha oficial e do contador.
```

### 5. Lista de aniversariantes / tempo de casa

Aniversario de empresa (data_admissao):

```
Tempo de casa — Fevereiro/2026

| Funcionario  | Admissao    | Tempo       | Status              |
| Maria Silva  | 2024-03-01  | 1a 11m      | Faz aniversario em 14d |
| Joana Souza  | 2024-08-15  | 1a 6m       |                     |
| Pedro Lima   | 2025-02-01  | 1a 0m       | Aniversario hoje! 🎉 |
```

### 6. Ferias — agendar

1. Verifica `periodo_aquisitivo_fim` ja venceu
2. Verifica nao tem ferias futura agendada nessa janela
3. Sugere periodo (30 dias inteiros ou parcelado)
4. Adiciona em `ferias.csv` com status `agendada`

### 7. Ferias — quem precisa tirar

```
Ferias vencidas/proximas

! Joana Souza — periodo aquisitivo venceu em 2025-08-14 (sem ferias agendadas — risco de dobra)
> Maria Silva — agendada 2026-03-01 a 2026-03-30 (ok)
> Pedro Lima — vence em 2026-01-31 (agendar nos proximos 60 dias)
```

### 8. Folha consolidada do mes

Soma do que vai sair do caixa em pagamentos pra pessoal:

```
Custo total folha — Fevereiro/2026

| Funcionario | Vinculo | Base    | Extras  | Comissao | Total    |
| Maria       | clt     | 2.500   | 215,42  | 707,50   | 3.422,92 |
| Joana       | clt     | 2.500   | 0       | 485,00   | 2.985,00 |
| Pedro       | pj      | 3.800   | 0       | -        | 3.800,00 |
| TOTAL                                                  9.207,92 |

⚠️ Custos patronais CLT (FGTS, INSS patronal, vale, etc.) nao incluidos. Conferir com contador.
```

## Regras invioláveis

| Regra | Por que |
|---|---|
| `id` nunca repete | Auditoria |
| Salario base e PIX so visiveis quando solicitado explicitamente | Privacidade |
| Calculo de salario sempre marcado como gerencial | Nao e folha oficial — confusao da problema |
| Ferias respeitam periodo aquisitivo | Lei |
| Falta sem motivo desconta proporcional | Padrao gerencial |

## Erros comuns

1. **Tratar calculo gerencial como folha real**: tem que avisar sempre
2. **Esquecer de marcar ferias como `agendada`**: dobra o periodo aquisitivo (caro)
3. **Hora extra sem registro de motivo**: vira moeda de barganha sem controle
4. **Nao registrar dia de atestado/folga**: parece falta

## Integracao

- `controle-vendas`: comissao alimenta o calculo de salario
- `controle-financeiro`: folha vai virar saidas no caixa quando paga
- `relatorio-mensal`: custo de folha do mes
- `dashboard-rapido`: aniversariantes, ferias proximas, banco de horas

## Exemplos

| Pedido | Acao |
|---|---|
| "Maria entrou 8h, almoco 12-13h, saiu 17h" | Registra ponto, 8h trabalhadas |
| "Quanto a Maria recebe esse mes?" | Calcula gerencial com avisos |
| "Quem ta sem ferias agendadas?" | Cruza ferias.csv |
| "Agendar ferias da Maria 1-30 marco" | Adiciona linha em ferias.csv |
| "Custo de folha de fevereiro" | Soma todos |
| "Banco de horas da Joana" | Soma horas extras vs faltas no mes |

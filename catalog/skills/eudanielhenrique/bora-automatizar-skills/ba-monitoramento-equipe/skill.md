---
name: ba-monitoramento-equipe
description: Monitora atendentes do WhatsApp em tempo real e gera boletim diário/semanal da equipe. Use quando o usuário pedir para "ver como tá a equipe", "saber quem tá demorando", "ranking de tempo de resposta", "quem deixou cliente esperando", "boletim", "raio-X do time", "TPR", "SLA da equipe" ou "analisar semana". Aceita CSV padrão, export .txt do WhatsApp Business e JSON da Zappfy.
allowed-tools: Read Write Bash
user-invocable: true
---

# Skill — Monitoramento de Equipe

Lê o histórico de mensagens do WhatsApp da operação e devolve:

1. **Boletim diário** — quem tá online, ranking de TPR, paradas, mensagens críticas, distribuição de carga, próximos passos.
2. **Análise semanal** — sparkline diário por atendente, heatmap de demanda hora×dia, SLA por janela horária, comparativo 7d vs 7d anteriores, alertas de tendência.

Desenhado para **operações com 2+ atendentes** dividindo um número (ou mais) de WhatsApp — o caso típico de um projeto Bora Automatizar que entrega automação de atendimento pra um cliente.

## O que diferencia essa skill

- **Mediana, não média** — um pico de 3h não envenena o TPR de quem teve 90% das respostas em 2min.
- **Detecta palavras críticas** — "cancelar", "lixo", "concorrente", "urgente" — e marca a conversa parada com tag inline.
- **SLA por janela** — separa o que aconteceu em horário comercial (9-18 dia útil) do resto.
- **Distribuição real de carga** — quem efetivamente pegou a primeira mensagem de cada novo cliente (e não só quem respondeu mais).
- **Heatmap ASCII** — pico de demanda em dia/hora, útil pra escalar turno.
- **Alerta de tendência** — se um atendente piorou ≥50% na 2ª metade da semana, você vê isso antes do cliente reclamar.
- **Aceita 3 formatos de input** — CSV, .txt do WhatsApp Business, JSON da Zappfy. Tem conversor pra cada um.
- **Fecha o ciclo** — script de envio Zappfy já incluído. Cron pronto.

## Quando usar

- **Gestor de manhã:** rodar `analisar_semana` antes da reunião semanal.
- **Gestor meio-dia / final de tarde:** rodar `analisar_equipe` (boletim do dia).
- **Pós-evento (lançamento, campanha):** rodar comparativo dia-D vs dia-comum, ver onde o time gargalou.
- **Projeto Éter / oferta produtizada:** quando o escopo do projeto inclui monitoramento de time de atendimento, esta skill é o ponto de partida — não construa do zero.

## Estrutura

```
ba-monitoramento-equipe/
├── SKILL.md
├── scripts/
│   ├── analisar_equipe.py     ← boletim do dia (até o "agora")
│   └── analisar_semana.py     ← análise rolling 7d/14d (tendência)
├── conversores/
│   ├── converter_whatsapp_export.py  ← .txt export → CSV
│   └── converter_zappfy.py           ← JSON Zappfy API → CSV
├── envio/
│   └── enviar_boletim.py      ← manda o resultado no seu privado
├── exemplos/
│   ├── conversas-exemplo.csv          ← 1 dia (~36 msgs)
│   ├── conversas-14dias.csv           ← 14 dias (~227 msgs), pra testar semanal
│   ├── whatsapp-export-exemplo.txt    ← formato real do WhatsApp Business
│   └── vips-exemplo.txt
└── PLANO-IMPLEMENTACAO.md     ← plano 14 dias pra subir em produção
```

## Formato de input

### Opção 1 — CSV padrão (recomendado)

```csv
data_hora,atendente,cliente,direcao,mensagem
2026-05-24 09:12:03,,Pedro Fulano,recebida,"Bom dia, queria saber preço"
2026-05-24 09:14:47,Joao,Pedro Fulano,enviada,"Oi Pedro! Vou te passar agora"
```

### Opção 2 — Export .txt do WhatsApp Business

```
[24/05/2026, 09:12:03] Pedro Fulano: Bom dia, queria saber preço
[24/05/2026, 09:14:47] Joao Atendente: Oi Pedro! Vou te passar agora
```

Converta com:
```bash
python conversores/converter_whatsapp_export.py chat.txt \
    --atendentes "Joao Atendente,Maria Atendente,Ana Atendente" \
    --saida conversas.csv
```

### Opção 3 — API Zappfy (JSON)

```bash
# salva resposta da API em mensagens.json e converte
python conversores/converter_zappfy.py --arquivo mensagens.json --saida conversas.csv

# OU puxa direto da API
python conversores/converter_zappfy.py \
    --url https://api.zappfy.io --token $ZAPPFY_TOKEN --dias 1 \
    --saida conversas.csv
```

## Passos de execução

### Rodando o boletim diário

1. **Garanta o CSV.** Se você só tem export do WhatsApp ou JSON da Zappfy, rode o conversor antes.
2. **Rode:**
   ```bash
   python scripts/analisar_equipe.py conversas.csv \
       --vip vips.txt \
       --horario-corte 18:00
   ```
3. **Leia o output.** O boletim tem 7 seções em ordem: Online → Ranking TPR → Volume → Paradas → Mensagens Críticas → Distribuição → Pontos de Atenção → Próximos Passos.
4. **Envie pro privado do gestor** (opcional, mas é o ponto):
   ```bash
   python scripts/analisar_equipe.py conversas.csv --vip vips.txt | \
       python envio/enviar_boletim.py
   ```

### Rodando a análise semanal

```bash
python scripts/analisar_semana.py conversas.csv

# customizando o horário comercial (default 09:00-18:00)
python scripts/analisar_semana.py conversas.csv --horario-comercial 08:30-18:30

# filtrando período
python scripts/analisar_semana.py conversas.csv --inicio 2026-05-11 --fim 2026-05-24
```

A análise semanal:
- **Sparkline por atendente** mostra TPR dia a dia em 8 níveis (▁▂▃▄▅▆▇█).
- **Heatmap** revela pico de demanda fora do horário comercial — se o pico bate às 20h, o cliente precisa de plantão.
- **Comparativo 7d vs 7d** mostra se a operação tá melhorando, piorando ou estável.
- **Alertas de tendência** disparam se algum atendente piorou ≥50% na 2ª metade da janela.

## Métricas calculadas

| Métrica | Definição | Benchmark BR 2026 |
|---|---|---|
| **Status online** | Tempo desde a última mensagem enviada | ✅ <15min ⚠️ 15min-2h ❌ >2h |
| **TPR mediano** | Mediana do tempo entre recebida e primeira resposta | 🥇 <5min 🥈 5-15min 🥉 15-60min ❌ >60min |
| **Taxa de resposta** | respondidas / recebidas | Saudável >80%, alvo >90% |
| **Conversas paradas** | Cliente mandou >30min atrás, sem resposta | Alvo: zero >2h |
| **Distribuição de primeiras** | % das conversas novas que cada atendente pegou | Idealmente próximo a 1/N |
| **SLA comercial** | TPR e taxa em horário comercial | TPR <10min, taxa >85% |
| **SLA fora** | TPR e taxa fora do horário | TPR <30min OU mensagem automática |

## Restrições — o que a skill NUNCA faz

- **Nunca envia mensagem ao cliente.** Só pro gestor (privado).
- **Nunca inventa atendente** que não apareceu no arquivo. Omite e sinaliza.
- **Nunca acusa atendente.** Descreve o dado, deixa a interpretação com o gestor.
- **Nunca expõe boletim em grupo.** O boletim é pro privado do gestor — mostrar em grupo desmoraliza.

## Ao entregar como parte de um projeto de cliente (Éter)

Se essa skill for parte do escopo entregue a um cliente da Éter (ver `/ba-oferta-produtizada` e `/ba-proposta-comercial`), adapte antes de entregar:
- `--horario-comercial` pro horário real do nicho do cliente.
- `KEYWORDS_CRITICAS` em `analisar_equipe.py` pros termos do nicho (ex: clínica → "alergia"; e-commerce → "não chegou").
- O cron de `PLANO-IMPLEMENTACAO.md` pro fluxo de dados real do cliente (export manual, Zappfy, ou Cloud API).
- Nunca entregue com nomes de exemplo (`Joao Atendente`, `Maria Atendente`) — troque pelos atendentes reais do cliente antes do handoff.

## Combinações poderosas

```
Toda quinta 17h: rode analisar_semana e mande o resumo no privado do gestor.
Se algum atendente piorou >50%, sinalize pra abrir um 1:1 na sexta.
```

```
Diariamente 18h: rode analisar_equipe + envie no privado.
Se houver mensagem crítica de cancelamento sem resposta, dispare alerta
URGENTE.
```

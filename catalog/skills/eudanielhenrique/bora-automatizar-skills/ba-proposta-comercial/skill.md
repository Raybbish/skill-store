---
name: ba-proposta-comercial
description: Gera uma proposta comercial em HTML single-file no padrão visual Bora Automatizar (mesmo design system do modo Landing Page de /ba-designer-system) — hero escuro, boas-vindas assinada, escopo em tabela, cronograma em timeline, investimento em banner + detalhe por fase + parcelamento, itens inclusos, CTA final com WhatsApp/e-mail. Use quando o usuário pedir uma proposta comercial, orçamento formal ou apresentação de projeto/cliente pra fechar negócio.
---

# /ba-proposta-comercial — Gerador de Proposta Comercial

Você está agora no **modo proposta comercial**. Seu trabalho é produzir um arquivo HTML único, pronto pra enviar por link ou anexo, no padrão visual do Bora Automatizar — reaproveitando um template comprovado, não desenhando do zero.

## Princípio central

O CSS deste template é o mesmo do modo **Landing Page** de `/ba-designer-system` (Sora, `#0060F0`, botões pill, `section-title` 45px/400, animação reveal fade+blur+slide). Não mude cor, tipografia, radius ou animação — isso é identidade de marca, não estilo desta proposta específica. O que varia por proposta é **conteúdo e quais seções opcionais entram**.

Números (valor total, parcelas, datas, contato) vão pro documento que o cliente lê pra decidir se fecha negócio. Errar aqui custa dinheiro ou credibilidade — nunca invente um valor que não foi confirmado.

## O que você faz

### 1. Colete as informações do projeto

Se o usuário já deu tudo isso na mensagem, não pergunte de novo — extraia. Se faltar algo crítico (valor, prazo, contato), pergunte antes de gerar o arquivo. Nunca preencha `{{PLACEHOLDER}}` com valor inventado.

**Identificação**
- Nome do cliente (pessoa ou empresa) e nome do projeto
- Quem assina a proposta (nome + cargo — padrão: Daniel Henrique, CEO e Fundador · Bora Automatizar)
- Prazo total, data de validade da proposta, número de entregas/módulos

**Hero + boas-vindas**
- Título do projeto (pode quebrar em `<br>`, ex: `Plataforma<br>Mão na Massa`)
- Subtítulo de uma frase (o que será entregue, em alto nível)
- Saudação (ex: `Boas-<br>vindas,<br>Osias.`) e 3–5 parágrafos de contexto — por que esse projeto importa, o que torna especial, o que a proposta cobre

**Cases (opcional)** — só inclua se houver prova social real e específica pra esse cliente/nicho (outro cliente parecido que vocês já atenderam). Nunca invente um case. Por card: setor/tag, nome do cliente, problema ("antes"), solução em uma frase ("depois"), citação em 1ª pessoa. Tipicamente 2 cases, grid de 2 colunas.

**Como funciona (opcional)** — só inclua se houver um modelo de negócio, fluxo ou mecânica nova que vale explicar antes do escopo técnico (ex: marketplace com pagamento por lead). Se é um trabalho de dev direto, pule esta seção inteira.

**Escopo** — lista de entregas: nome curto, descrição de 1–2 frases, tags de tecnologia/categoria (1–3 por linha)

**Cronograma** — fases com: semanas (ex: "Sem. 1–4"), label da fase ("Fase 1"), título, descrição (pode ter `<strong>` pra destacar a entrega final da fase), duração

**Investimento**
- Valor total
- Quebra por fase: valor de cada fase (deve somar o total), nota de entrega, lista de itens inclusos naquela fase
- Parcelamento: percentual + quando é cobrado + valor em R$ de cada parcela (deve somar 100% e o valor total)

**Infra (opcional)** — só inclua se o cliente paga custos de terceiros diretamente (hosting, domínio, taxa de loja de apps, gateway de pagamento), separado do seu honorário. Se não há esse tipo de custo, pule a seção.

**Incluído** — 6 a 8 itens (número par, a seção é grid de 2 colunas) com emoji, título curto, descrição de 1 frase

**Contato**
- WhatsApp: número em formato E.164 sem `+` (ex: `5527999594959`) pro link `wa.me`, e formatado pra exibição (ex: `(27) 99959-4959`)
- E-mail
- Mensagem pré-preenchida do WhatsApp e assunto/corpo do e-mail — devem ir URL-encoded no `href`

### 2. Leia o template desta skill

O arquivo `template.html` (nesta mesma pasta) é a base — HTML + CSS completos com placeholders `{{ASSIM}}` e comentários marcando blocos repetíveis (`REPETIR ...`) e seções opcionais. Leia-o antes de escrever qualquer coisa.

### 3. Gere o HTML final

- Copie o template e substitua os placeholders pelo conteúdo real.
- Para blocos marcados "REPETIR", duplique o bloco quantas vezes forem necessárias (uma linha de escopo por entrega, um `.tl-item` por fase, um `.ic` por fase de investimento, um `.pay-item` por parcela, um `.inc-item` por item incluso).
- Remova por completo as seções `#cases`, `#how` e/ou `#infra` se não se aplicarem — não deixe seção vazia ou com placeholder sem preencher.
- No último `.tl-item` do cronograma, remova a `.tl-line` (a linha vertical não deve continuar depois do último ponto).
- Gere o link do WhatsApp e o `mailto:` com URL-encoding correto no texto da mensagem/assunto/corpo.
- Não copie as tabelas markdown deste SKILL.md pro HTML — elas são só a checklist de coleta.

### 4. Confirme os números críticos

Antes de considerar pronto, mostre um resumo pro usuário conferir:
```
PROPOSTA GERADA
Cliente:        <nome>
Projeto:        <nome>
Valor total:    R$ <total>
Parcelamento:   <pct1>% + <pct2>% [+ <pct3>%] = <soma valores>
Prazo:          <prazo total>
Válida até:     <data>
Contato:        <whatsapp> · <email>
Arquivo:        <caminho salvo>
```
Se a soma das parcelas não bater com o valor total, ou a soma das fases de investimento não bater com o total, avise antes de finalizar — não deixe passar.

### 5. Salve o arquivo

Nome sugerido: `proposta-comercial-{slug-do-cliente-ou-projeto}.html`, na raiz do projeto atual ou onde o usuário indicar. Arquivo único, sem dependências além da fonte Google Fonts (Sora) já referenciada no `<head>`.

## Regras

- Nunca altere paleta, tipografia, radius ou animação do template — é a mesma identidade do modo Landing Page de `/ba-designer-system`.
- Nunca deixe um `{{PLACEHOLDER}}` no arquivo final — se faltar informação, pergunte, não invente.
- Seções "Cases", "Como funciona" e "Infraestrutura" são opcionais — inclua só quando fizer sentido pro projeto real.
- Case sem prova social real é pior que não ter case — nunca invente cliente, número ou citação.
- Confira que soma das fases de investimento = valor total, e soma das parcelas = valor total, antes de finalizar.
- Link do WhatsApp sempre com número em E.164 sem `+` e mensagem URL-encoded.
- Se o usuário pedir uma proposta pra um cliente/produto fora do Bora Automatizar, confirme se a identidade visual ainda é essa antes de aplicar — a marca é específica do Bora Automatizar.

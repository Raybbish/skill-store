---
name: ba-oferta-produtizada
description: Gera uma landing page de oferta produtizada em HTML single-file no padrão visual Bora Automatizar mais recente (modo Oferta/Produto de /ba-designer-system — azul #173CE0, fundo quase-preto, tipografia editorial peso 400) — hero com escassez, exemplos de serviço, cases reais, processo em etapas, prova social do founder, condições da oferta, FAQ. Use quando o usuário pedir uma landing page de oferta/produto com vagas limitadas, diferente de uma proposta pra um cliente específico (isso é /ba-proposta-comercial).
---

# /ba-oferta-produtizada — Gerador de Oferta Produtizada

Você está agora no **modo oferta produtizada**. Seu trabalho é produzir um arquivo HTML único, pronto pra publicar, no padrão visual mais recente do Bora Automatizar (mesma identidade do Projeto Éter) — reaproveitando um template real, não desenhando do zero.

## Quando usar esta skill vs `/ba-proposta-comercial`

| Se é... | Use |
|---|---|
| Landing de produto/oferta nova, com vagas limitadas, vendendo pra qualquer visitante | **Esta skill** |
| Proposta fechada pra 1 cliente específico já engajado, com escopo e valor definidos | `/ba-proposta-comercial` |

## Princípio central

O CSS/tokens deste template são o modo **Oferta/Produto** de `/ba-designer-system` (azul `#173CE0`, fundo `#060608`, Inter peso 400 mesmo em headings grandes, tracking aberto em labels). Não mude cor, peso tipográfico ou radius — isso é identidade de marca desta geração específica. Não confunda com o azul `#0060F0`/Sora bold do modo Landing Page (site institucional antigo) — são gerações visuais diferentes, não misture.

## Lição de um bug real

A página de referência (Projeto Éter, ao vivo em produção) tinha placeholders não preenchidos publicados — `[Bio curta do founder]`, `[X anos construindo...]` — visíveis pra leads reais aplicando pra vaga. **Nunca deixe um `{{PLACEHOLDER}}` no arquivo final.** Se a informação não foi dada, pergunte antes de gerar — não suba o arquivo incompleto torcendo pra alguém preencher depois. Isso vale especialmente pra seção de prova social do founder, que é a mais fácil de deixar pra depois e a mais visível quando fica errada.

## O que você faz

### 1. Colete as informações da oferta

Se o usuário já deu tudo isso, não pergunte de novo — extraia. Se faltar algo crítico (o que é a oferta, escassez, contato/link de aplicação), pergunte antes de gerar.

**Identificação**
- Nome da oferta/produto e empresa
- Descrição meta (1 frase, pra SEO/compartilhamento)

**Hero**
- Escassez: número de vagas + mês/prazo (ex: "5 vagas em Agosto")
- Título (pode ter `<br>`)
- Subtítulo de uma frase
- Texto dos 2 CTAs (primário = ação principal, secundário = "ver como funciona"/"ver exemplos")
- Mockup visual (opcional) — só inclua se houver algo real pra mostrar (screenshot, preview, mini-simulação de produto). Sem isso, remova o bloco `.hero-mockup`.

**Exemplos de serviço** — 3–4 cards curtos ilustrando "o que dá pra construir" (não são cases reais, são possibilidades)

**Cases reais (opcional)** — mesma regra da `/ba-proposta-comercial`: setor, cliente, problema, solução em 1 frase, citação em 1ª pessoa. Nunca invente. Sem case real aplicável, remova a seção.

**Como funciona** — processo em 4–5 passos numerados (nome do passo + descrição curta)

**Por que confiar (founder/empresa)**
- Nome e cargo de quem assina a credibilidade
- 1–2 estatísticas curtas (anos de operação, projetos entregues, etc. — reais, não estimadas)
- Bio de 2–4 frases — **obrigatória, nunca deixe em branco ou com placeholder** (ver "Lição de um bug real" acima)

**Oferta / condições**
- Número de vagas + data limite
- Justificativa da escassez (por que é limitado — agenda, capacidade real, não "estratégia de marketing")
- Link de aplicação (formulário, WhatsApp, calendário — o que for usado)
- Lista do que quem for selecionado recebe (3–6 itens)

**FAQ** — perguntas reais que leads costumam fazer (preço, prazo, requisito técnico, o que acontece depois, segurança de dados) — 5–8 perguntas

**Rodapé** — nome da empresa, links de política de privacidade/termos (se existirem), ano

### 2. Leia o template desta skill

`template.html` (nesta pasta) é a base — Tailwind via CDN com tokens da marca configurados inline (`tailwind.config`), placeholders `{{ASSIM}}`, comentários marcando blocos repetíveis (`REPETIR ...`) e seções opcionais.

### 3. Gere o HTML final

- Copie o template e substitua os placeholders pelo conteúdo real.
- Duplique blocos "REPETIR" conforme a quantidade real de itens (exemplos, cases, passos, condições, FAQ).
- Remova por completo `#cases` e/ou `.hero-mockup` se não se aplicarem.
- Não invente estatística, case ou bio — se faltar, pergunte.

### 4. Confirme antes de publicar

```
OFERTA GERADA
Produto/Empresa:  <nome>
Vagas:            <N> até <data>
Founder/bio:      preenchido? (nunca deixe placeholder)
Cases incluídos:  <N> (ou "nenhum — seção removida")
Link aplicação:   <url>
Arquivo:          <caminho salvo>
```

### 5. Salve o arquivo

Nome sugerido: `oferta-{slug-do-produto}.html`, onde o usuário indicar. Arquivo único — depende só de Google Fonts e do Tailwind CDN (`cdn.tailwindcss.com`), sem build step.

## Regras

- Nunca altere azul (`#173CE0`), fundo (`#060608`) ou o peso 400 constante da tipografia — é a identidade da geração mais recente da marca, extraída do site real.
- Nunca deixe `{{PLACEHOLDER}}` publicado — em especial na seção do founder (foi um bug real, ver acima).
- Cases exigem prova social real — sem case real aplicável, remova a seção inteira.
- A justificativa da escassez deve ser real (capacidade/agenda), nunca apresentada como truque de marketing no próprio texto.
- Se o pedido for pra outro cliente/produto fora do Bora Automatizar, confirme se essa identidade visual ainda se aplica antes de usar o template.

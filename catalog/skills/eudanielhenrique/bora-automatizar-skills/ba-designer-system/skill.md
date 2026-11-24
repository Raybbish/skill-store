---
name: ba-designer-system
description: Aplica a identidade visual do Bora Automatizar em três modos — Landing Page (tokens extraídos do Elementor da home real, geração de marca 2025/2026, azul #0060F0), Sistema/App (base desenhada para sidebar, tabelas e dashboards de ferramentas internas) e Oferta/Produto (tokens extraídos do site Next.js/Tailwind do Projeto Éter, geração mais recente da marca, azul #173CE0, tipografia mais editorial). Use ao construir ou restilizar qualquer produto do Bora Automatizar; confirme o modo antes de aplicar — os três são incompatíveis entre si.
---

# /ba-designer-system — Design System Bora Automatizar

Você está agora no **modo design system Bora Automatizar**. Essa skill tem três seções estruturalmente incompatíveis entre si — **não misture**. Identifique qual se aplica antes de escrever qualquer CSS.

## Qual modo usar

| Se o projeto é...                                                    | Use            |
| --------------------------------------------------------------------- | -------------- |
| Site institucional, landing page, página de campanha, proposta comercial (geração WordPress/Elementor) | **Landing Page** |
| Ferramenta interna, painel admin, SaaS com sidebar/tabelas/dashboards, CRUD | **Sistema/App**  |
| Oferta produtizada, landing de produto novo, projeto Next.js/Tailwind (geração mais recente da marca) | **Oferta/Produto** |

Se não estiver óbvio, pergunte — em especial entre Landing Page e Oferta/Produto, que são duas gerações visuais diferentes da mesma empresa e **usam azuis diferentes** (`#0060F0` vs `#173CE0`). Aplicar H1 de 75px ou botão pill numa tabela densa de dados, ou misturar os dois azuis num mesmo projeto, é o erro que gerou essa separação — não repita.

## Princípio central

Os tokens de **Landing Page** e **Oferta/Produto** são fonte da verdade — extraídos direto de sites reais em produção, não estimados. Não arredonde, não "melhore", não substitua por valor parecido.

Os tokens de **Sistema/App** são uma base desenhada, não extraída — não existe hoje um painel/admin real do Bora Automatizar pra extrair de lá. Eles reaproveitam a identidade de marca do modo Landing Page (cor primária, tipografia) mas a estrutura, escala e paleta neutra foram desenhadas do zero para densidade de dados. Trate como ponto de partida sólido, não como valor imutável.

Se um token que você precisa não está listado em nenhum dos três modos, sinalize que está extrapolando — não invente como se fosse extraído.

**Sobre as duas gerações de marca:** Landing Page (home WordPress/Elementor) e Oferta/Produto (Projeto Éter, Next.js/Tailwind) são identidades visuais **distintas**, não variações uma da outra — azul diferente, tipografia diferente, peso diferente. Isso não é inconsistência a corrigir: são produtos/momentos diferentes da mesma empresa. Não funda os dois nem tente "harmonizar" — pergunte qual geração o projeto atual deve seguir.

---

# Modo Landing Page (extraído — fonte da verdade)

Para site institucional, páginas de campanha, propostas comerciais.

## Tipografia

| Elemento           | Fonte                      | Tamanho | Peso    | Observação                            |
| ------------------ | --------------------------- | ------- | ------- | ------------------------------------- |
| H1 hero            | Sora                        | 75px    | 600     | line-height 85px, letter-spacing -2px |
| H2 seções          | Sora                        | 45px    | **400** | line-height 60px, letter-spacing -1px |
| Subtítulo hero     | Sora                        | 19px    | 300     | line-height 1.7em                     |
| Corpo / descrições | Sora                        | 14–16px | 400     | —                                     |
| Botões             | Neue Haas Grotesk Text Pro  | 18px    | 500     | —                                     |
| Labels / badges    | Sora                        | 11–13px | 600     | uppercase, letter-spacing 2px         |
| FAQ heading        | Sora                        | 94px    | 400     | azul #0060F0, decorativo              |

**Erro comum a evitar:** peso 600 nos H2 de seção. A home usa 400 — peso 600 deixa a página pesada, com cara de "landing page de infoproduto".

## Cores

| Uso                          | Cor                             |
| ----------------------------- | -------------------------------- |
| Azul badge / overlay           | `#0060F0C9`                      |
| Fundo seção clara A             | `#F5F5F7`                        |
| Fundo seção clara B             | `#FFFFFF`                        |
| Fundo hero / CTA escuro          | herdado do tema (dark)           |
| Texto principal                 | `#000000`                        |
| Texto secundário                | `#666666` / `#888888`            |
| Texto hero                      | `#FFFFFF`                        |
| Texto hero secundário           | `#FFFFFFB3`                      |

## Botões

```
Primário:
  background: #0060F0
  border-radius: 50px (pill)
  font: Neue Haas Grotesk Text Pro, 500, 17–18px
  padding: 20px 40–50px

Secundário:
  background: transparent
  border: 2px solid #FFFFFF (em fundo escuro) ou #CCCCCC (em fundo claro)
  border-radius: 50px (pill)
  font: Neue Haas Grotesk Text Pro, 500, 17–18px
```

## Estrutura de seções

Padrão obrigatório — toda página nova segue essa sequência:

1. **Hero escuro** — dark bg, H1 branco 75px, badge azul, 2 botões pill
2. **Seção #F5F5F7** — H2 45px peso 400, cards/conteúdo
3. **Seção #FFFFFF** — alternância
4. **Seção destaque** — fundo `#0060F0` para momento de conversão (ex: preços, LGPD)
5. **CTA final** — dark bg, heading 52–64px, 2 botões

## Animação de entrada

```css
selector {
  opacity: 0;
  filter: blur(7px);
  transform: translate(0px, 80px);
  animation: showFromBottom 0.5s ease forwards;
}

@keyframes showFromBottom {
  from { opacity: 0; filter: blur(7px); transform: translate(0px, 80px); }
  to   { opacity: 1; filter: blur(0);   transform: translate(0, 0); }
}
```

## Regras — Landing Page

- Fonte da verdade são os valores extraídos do Elementor real — nunca estime ou aproxime.
- Peso 600 em H2 de seção é proibido — sempre 400.
- Botões sempre pill (`border-radius: 50px`), nunca cantos retos ou levemente arredondados.

---

# Modo Sistema/App (desenhado — base para ferramentas internas)

Para painéis internos, SaaS com sidebar/tabelas/dashboards, qualquer CRUD. Dark-first, densidade de dados acima de impacto visual. Pill e escala tipográfica de hero **não pertencem aqui**.

## Paleta neutra (dark-first)

| Uso                        | Cor       |
| --------------------------- | --------- |
| Fundo base (app shell)      | `#0B0D12` |
| Fundo surface (sidebar, card) | `#12151B` |
| Fundo elevado (modal, dropdown, popover) | `#181C24` |
| Borda / hairline            | `#22262F` |
| Borda hover                 | `#2E333D` |
| Texto primário               | `#F5F5F7` |
| Texto secundário             | `#8A8F99` |
| Texto terciário / disabled   | `#565B66` |

Tema claro (se necessário): inverta usando `#FFFFFF`/`#F5F5F7`/`#EDEEF1` como base/surface/elevado e `#000000`/`#666666`/`#9AA0AA` como texto — mas dark é o padrão, só desvie com justificativa.

## Tipografia (escala de UI, não de hero)

| Elemento              | Tamanho | Peso | Observação                          |
| ---------------------- | ------- | ---- | ------------------------------------ |
| Título de página        | 24px    | 600  | —                                    |
| Título de seção/card     | 16–18px | 600  | —                                    |
| Header de tabela          | 12px    | 600  | uppercase, letter-spacing 1px, texto secundário |
| Corpo / célula            | 13–14px | 400  | —                                    |
| Número de dashboard (stat)| 32–40px | 600  | tabular-nums                         |
| Label de sidebar           | 13px    | 500  | —                                    |
| Caption / micro            | 11px    | 500  | texto terciário                      |

## Sidebar

```
width: 264px expandida / 72px colapsada (ícone só)
background: fundo surface (#12151B)
item:
  height: 40px, radius 8px, padding 0 12px
  ícone 18–20px + label 13px/500
  hover: bg neutro sutil (borda hairline em opacidade baixa)
  ativo: bg rgba(0,96,240,0.12) + texto/ícone #0060F0
label de seção (grupo de nav):
  uppercase, 11px/600, letter-spacing 1px, texto terciário
  padding-top 20px antes de novo grupo
```

## Tabelas

```
row height: 44px padrão (36px denso, 52px confortável — expor como opção, não fixar)
header: sticky, bg surface, border-bottom 1px hairline, label uppercase 12px/600
cell: 13–14px/400, padding 12px 16px
divisor entre linhas: border-bottom hairline — não zebra por padrão
  (zebra é aceitável em tabelas muito longas: bg surface alternado, nunca cor de marca)
hover de linha: bg neutro sutil
números: tabular-nums, alinhados à direita
ações de linha: aparecem no hover, alinhadas à direita
estado vazio / loading: obrigatório — nunca renderizar tabela em branco sem feedback
```

## Dashboards

```
grid: 12 colunas, gap 20–24px
stat tile:
  bg surface, radius 12px, border 1px hairline, padding 20–24px
  label uppercase pequeno no topo (12px/600, texto secundário)
  número grande abaixo (32–40px/600, tabular-nums)
  delta (seta + %) com cor semântica — verde/vermelho para positivo/negativo,
    NUNCA #0060F0 pra delta (azul é ação/marca, não status)
card de conteúdo: radius 12–16px, bg surface, border 1px hairline
gráficos: seguir a skill `dataviz` para paleta, formas e acessibilidade —
  #0060F0 como cor primária de série, não reinventar paleta aqui
```

## Botões (Sistema/App)

```
Primário:
  background: #0060F0
  border-radius: 8px
  font: Sora, 500, 14px
  padding: 8px 16px

Secundário:
  background: transparent
  border: 1px solid borda hairline
  border-radius: 8px
  font: Sora, 500, 14px

Destrutivo:
  background: transparent (borda/texto vermelho semântico) — mesma geometria do secundário
```

## Regras — Sistema/App

- Nunca use pill (`border-radius: 50px`) em UI de sistema — radius 6–8px em botões, 12–16px em cards.
- Nunca use a escala tipográfica de hero (75px, 45px) aqui — o teto é ~40px, reservado a números de dashboard.
- Azul `#0060F0` é ação e marca — não use como cor de status (sucesso/erro/aviso têm paleta semântica própria, fora desta skill).
- Tabela sem estado vazio/loading é bug de UX, não detalhe.
- Se o projeto pedir tema claro, inverta a paleta neutra mas mantenha `#0060F0` como está — não escureça/clareie a cor de marca.

---

# Modo Oferta/Produto (extraído — Projeto Éter, geração mais recente)

Para ofertas produtizadas, landing pages de produto novo, qualquer projeto Next.js/Tailwind que deva seguir a direção visual mais atual da marca. Fonte: inspecionado ao vivo em `boraautomatizar.com.br/eter` (Next.js + Tailwind v4 + tokens shadcn, ago/2026) — se o site evoluir, reconfira antes de tratar como definitivo.

**Diferença fundamental do modo Landing Page:** peso tipográfico sempre 400 (normal), inclusive em headings grandes — nunca 600/700. É deliberadamente mais quieto e editorial, o oposto do hero bold do modo Landing Page. E o azul de marca aqui é `#173CE0`, não `#0060F0` — não misture os dois.

## Stack e fontes

Projeto real usa Tailwind v4 (tokens `--radius-*`, `--text-*`, `--font-weight-*` do tema default) + fontes customizadas via `next/font`. Se o projeto de destino não usa Tailwind, traduza os valores pra CSS puro mas mantenha os números.

| Papel               | Stack de fonte                                                  |
| -------------------- | ----------------------------------------------------------------- |
| Display / headings (declarado) | `"Baflion Sans", Inter Tight, Inter, system-ui, sans-serif`        |
| Headings (uso real observado) | **Inter**, peso 400, `tracking-tight` (-0.025em a -0.03em)       |
| Serif editorial (raro/decorativo) | `"De Floria", Playfair Display, Instrument Serif, Georgia, serif` |
| Mono                  | Geist Mono                                                         |

## Cores

| Uso                          | Valor                          |
| ------------------------------ | --------------------------------- |
| Fundo base                     | `#060608` (quase-preto, não `#000`) |
| Fundo card / painel             | `#0d0d0f` / `#0d0d11`             |
| Azul de marca (primary)         | `#173CE0`                         |
| Botão primário sólido           | fundo branco, texto `#173CE0` ou preto |
| Botão primário "shiny" (hero/CTA de destaque) | gradiente animado azul→branco→azul, ver Botões |
| Texto primário                  | branco 100%                       |
| Texto secundário                | `white/85`, `white/78`, `white/72` |
| Texto terciário                 | `white/58`, `white/55`, `white/50` |
| Texto quaternário / meta         | `white/45`, `white/40`, `white/30` |
| Borda hairline (cards)           | `white/10`                        |
| Borda hairline (badges/botão secundário) | `white/[0.08]`             |
| Status positivo                  | `emerald-300`/`emerald-400`, fundo a 15% opacidade |
| Status neutro/info               | `blue-300`/`blue-400`, fundo a 15% opacidade |
| Selection                        | fundo `#173CE0`, texto branco     |

## Tipografia

| Elemento          | Tamanho                        | Peso | Observação                              |
| ------------------ | --------------------------------- | ---- | ----------------------------------------- |
| Hero title          | `clamp(2.5rem, 5vw, 64px)`         | 400  | line-height 1.08, tracking -0.03em       |
| Section title        | 30px → 48px (`text-3xl md:text-5xl`) | 400  | tracking tight                            |
| Subtítulo hero        | 16–18px                            | 400  | —                                          |
| Corpo                  | 14–15px                            | 400  | —                                          |
| Badge / label uppercase | 12px (`text-xs`)                  | 400  | tracking **0.18em–0.24em** (bem mais aberto que o modo Landing Page) |

## Botões

```
Primário sólido (uso mais comum):
  background: #FFFFFF
  color: #173CE0 (sobre fundo escuro) ou #000000
  border-radius: full (pill)
  padding: 14px 28px

Primário "shiny" (CTA de maior destaque — hero, oferta):
  background: linear-gradient(110deg, #1d4ed8 0%, #2563eb 25%, #60a5fa 42%,
              #fff 50%, #60a5fa 58%, #2563eb 75%, #1d4ed8 100%) animado (brilho passando, 3.5s loop)
  border: 1px solid #ffffff40
  box-shadow: 0 0 24px #2563eb73 (hover: 0 0 35px #3b82f6bf)
  border-radius: full (pill)
  padding assimétrico que expande no hover, revelando um ícone (seta) do lado

Secundário (ghost):
  background: white/[0.03]
  border: 1px solid white/[0.08]
  color: white
  border-radius: full (pill)
```

## Badges

```
rounded-full, bg-white/15, border border-white/25, texto branco, text-xs
ou (mais discreto)
rounded-full, bg-white/[0.03], border border-white/[0.08], texto white/85, text-xs
```

## Cards

```
border-radius: 12px (rounded-xl) para cards de conteúdo, 8px (rounded-lg) para mockups pequenos
border: 1px solid white/10
background: #0d0d0f
padding: 16px em mockups/preview, mais generoso (24–32px) em cards de conteúdo
```

## Regras — Oferta/Produto

- Peso tipográfico é sempre 400 — nunca 600/700 em heading, mesmo em títulos grandes. Contraria diretamente a regra do modo Landing Page (que usa 600 no H1).
- Fundo é `#060608`, não `#000000` — sutil mas real, não reuse o `--black` do modo Landing Page.
- Azul de marca aqui é `#173CE0` — nunca `#0060F0` neste modo, e vice-versa no modo Landing Page.
- Tracking de labels uppercase é relativo (em `em`), não fixo em px como no modo Landing Page — proporcionalmente mais aberto.
- Se o site evoluir, os tokens aqui podem ficar desatualizados — antes de um projeto grande, reconfira ao vivo em vez de confiar cegamente nesta tabela.

---

## Como aplicar num projeto

1. **Confirme o modo** (Landing Page vs Sistema/App vs Oferta/Produto) antes de escrever qualquer token — são incompatíveis entre si, e os dois modos "de marketing" usam azuis diferentes.
2. **Identifique a stack** (CSS puro, Tailwind, CSS-in-JS, design tokens de outro sistema) e traduza os tokens pro formato certo — variáveis CSS, `tailwind.config`, tema de componentes. Não copie tabelas markdown pro código.
3. **Landing Page:** siga a hierarquia tipográfica e a estrutura de seções à risca — são extraídas, não interpretáveis.
4. **Sistema/App:** use a base como ponto de partida — ajuste densidade (row height, padding) ao produto real, mas mantenha cor de marca, tipografia Sora e a ausência de pill.
5. **Oferta/Produto:** siga o peso 400 constante e o azul `#173CE0` à risca — é a assinatura visual desta geração, junto com o fundo quase-preto.
6. **Confirme que é o projeto certo** — essa identidade é do Bora Automatizar especificamente. Se o usuário pede "aquele design que a gente usa" em outro cliente/produto, confirme antes de aplicar. Se for pro Bora Automatizar mas não estiver claro qual geração, pergunte.

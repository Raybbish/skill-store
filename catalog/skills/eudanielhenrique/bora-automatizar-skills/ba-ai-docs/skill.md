---
name: ba-ai-docs
description: Gera a suíte canônica de documentação para IAs e LLMs (padrão /llms.txt, llms-full.txt, company.txt, integrations.txt, compare.txt) e implementa o componente dropdown acessível "Docs de IA" no rodapé de qualquer projeto Bora Automatizar (Next.js, PHP, Vanilla HTML). Use para otimizar produtos para Generative Engine Optimization (GEO), agentes de IA, buscas contextuais (Perplexity, ChatGPT, Claude) e visibilidade programática de ecossistema.
allowed-tools: Read Write Edit Bash Grep Glob
user-invocable: true
---

# /ba-ai-docs — Documentação para IAs & Dropdown "Docs de IA"

Você está agora no **modo documentação para IAs**. Esse skill padroniza a interface pública de contexto de qualquer produto da Bora Automatizar para agentes autônomos, sistemas RAG e LLMs de busca (ChatGPT Search, Perplexity, Claude, Gemini), baseado no padrão `/llms.txt` e na referência de produção vista em `soceo.ai`.

A skill resolve dois problemas fundamentais de **Generative Engine Optimization (GEO)**:
1. **Contexto limpo e estruturado para IAs:** Modelos de linguagem não devem navegar por páginas HTML poluídas de scripts, estilos e tags visuais para adivinhar regras de negócio, rotas e APIs. Eles consomem arquivos de texto plano puros (`.txt`), concisos e densos em informação.
2. **Descoberta humana e de robôs:** Uma tag canônica no `<head>` (`rel="alternate" type="text/plain"`) somada a um widget elegante e acessível no rodapé ("Docs de IA") garante que tanto robôs de indexação quanto usuários técnicos encontrem a documentação instantaneamente.

---

## A Suíte dos 5 Arquivos de IA

Todos os arquivos devem ser publicados na raiz pública do servidor (ex: `/public/` no Next.js/Vite ou raiz pública em PHP/Apache) com extensão `.txt`:

| Arquivo | Papel e Conteúdo | Padrão / Inspiração |
|---|---|---|
| `/llms.txt` | **Manifesto e Índice Mestre**. Resumo conciso de uma página da plataforma, metadados (domínio, idioma, categoria, contato), rotas públicas primárias e ponteiros markdown para os demais arquivos. | [llmstxt.org](https://llmstxt.org/) |
| `/llms-full.txt` | **Bíblia Técnica e Operacional**. Tese completa, público-alvo, personas, regras de negócio de ponta a ponta, arquitetura, fluxos, modelos de dados, segurança/CSP, recursos White-Label e FAQ operacional. | Especificação detalhada de produto |
| `/company.txt` | **Empresa, Visão e Governança**. Perfil institucional, fundador, ecossistema Bora Automatizar, modelo comercial e de precificação, conformidade jurídica (LGPD, termos) e canais oficiais. | Governança corporativa para IAs |
| `/integrations.txt` | **Catálogo de Conectores e APIs**. Protocolos de comunicação, webhooks, integrações ativas (WhatsApp, Gateways de Pagamento, CRMs, Web Push, impressoras térmicas) e requisitos técnicos. | Catálogo de ecossistema |
| `/compare.txt` | **Matriz de Diferenciação de Mercado**. Comparativo objetivo do produto vs. concorrentes diretos, ferramentas legadas ou soluções genéricas, demonstrando diferenciais técnicos e de custo. | Posicionamento competitivo |

---

## Lições Reais e Regras Inegociáveis

1. **Servir como Texto Plano Puro (`text/plain`):**
   - Os arquivos são arquivos `.txt` estáticos.
   - O servidor web (Apache, Nginx, Cloudflare) **deve** entregar o header `Content-Type: text/plain; charset=UTF-8`.
   - Se o projeto usa roteamento dinâmico (ex: `.htaccess` com rewrite de tudo para `index.php`), certifique-se de que regras de exceção para arquivos estáticos existentes (`RewriteCond %{REQUEST_FILENAME} -f`) precedam o rewrite geral.

2. **Fidelidade Radical — Nunca Inventar Informação:**
   - **Não invente recursos que a aplicação não possui.** Se a plataforma suporta PIX e Mercado Pago, não escreva que suporta Stripe ou Bitcoin.
   - **Nunca deixe placeholders:** Termos como `[inserir e-mail]`, `{{DOMINIO}}` ou `TODO` são inaceitáveis. Extraia do código/git existente ou pergunte ao fundador.

3. **Tag de Descoberta Automática no `<head>`:**
   Em todos os layouts HTML que carregam o cabeçalho global, deve constar a tag:
   ```html
   <link rel="alternate" type="text/plain" href="https://seu-dominio.com.br/llms.txt" title="Contexto do [Nome do Produto] para sistemas de IA">
   ```

4. **Acessibilidade e Usabilidade do Widget:**
   - O botão do rodapé utiliza `aria-expanded="false"` / `"true"` e `aria-controls="lgp-ai-docs-panel"`.
   - O painel abre para cima (`bottom: calc(100% + 10px)` ou `bottom-full mb-2`).
   - Deve fechar ao clicar fora, ao perder o foco (`focusout`) e ao pressionar a tecla `Escape`.
   - Deve respeitar o modo escuro (`[data-theme="dark"]` ou classe `dark`).
   - Deve respeitar restrições de CSP (usar script com `nonce` onde CSP estrita estiver ativa).

---

## Como Trabalhar

### 1. Investigação Inicial do Projeto

Antes de redigir qualquer arquivo, inspecione a aplicação atual:
```bash
# 1. Identificar stack e manifestos
ls -la package.json composer.json Dockerfile 2>/dev/null

# 2. Investigar rotas e módulos
find . -maxdepth 3 -type d -not -path '*/.*' -not -path '*node_modules*'

# 3. Descobrir nome de marca, domínios e configurações
grep -rn "brand_name\|APP_NAME\|NEXT_PUBLIC_APP_NAME" . 2>/dev/null | head -n 10
```

Colete:
- Nome oficial da marca / produto.
- Domínio de produção canônico.
- Principais funcionalidades e módulos.
- Integrações existentes no código.
- Modelo de precificação ou modelo de negócio (SaaS, taxa zero, white-label, etc.).
- Contato público ou e-mail de suporte.

---

### 2. Geração dos 5 Arquivos de Texto

Escreva os 5 arquivos na pasta pública do projeto seguindo a estrutura padrão abaixo.

#### A. `llms.txt` (Índice Mestre)
```markdown
# [Nome do Produto] — índice oficial para IAs

> [Descrição executiva de uma frase explicando exatamente o que o produto é, para quem serve e qual seu diferencial].

- Domínio canônico: https://[dominio]
- Categoria: [Categoria de Software / SaaS / Plataforma]
- Idioma: pt-BR
- Revisado em: [AAAA-MM-DD]

## Contato público

- [contato@[dominio]](mailto:contato@[dominio])
- Suporte Técnico: [Canal oficial / Plataforma]

## Documentos especializados

- [Visão Geral Completa](https://[dominio]/llms-full.txt): Perfil abrangente do produto, tese, personas, arquitetura e fluxos.
- [Empresa e Governança](https://[dominio]/company.txt): Dados institucionais, liderança, modelo de negócio e conformidade LGPD.
- [Catálogo de Integrações](https://[dominio]/integrations.txt): APIs, WhatsApp, gateways de pagamento e conectores.
- [Comparativo de Mercado](https://[dominio]/compare.txt): Comparação direta contra concorrentes tradicionais e alternativas.

## Principais rotas públicas

- [/](https://[dominio]/): [Descrição da página inicial]
- [/catalogo](https://[dominio]/catalogo): [Descrição]
- [/painel](https://[dominio]/painel): [Descrição]
```

#### B. `llms-full.txt` (Bíblia Técnica e Operacional)
Deve conter:
- **Tese do Produto**: A dor real do mercado e por que a solução foi criada.
- **Público-Alvo e Casos de Uso**: Perfis de clientes atendidos.
- **Fluxos Operacionais de Ponta a Ponta**: Passo a passo de como o usuário final e o operador utilizam o sistema.
- **Arquitetura Técnica**: Stack de backend, frontend, banco de dados, storage, segurança e caching.
- **Recursos White-Label e Customização**: Como marcas personalizadas, cores e subdomínios operam.
- **Segurança, Privacidade e CSP**: Headers de segurança, isolamento multi-tenant, sanitização.
- **FAQ para Agentes de IA**: Respostas objetivas para dúvidas frequentes que modelos de linguagem costumam receber sobre o produto.

#### C. `company.txt` (Empresa, Visão e Governança)
Deve conter:
- Nome empresarial / marca.
- Ecossistema (ex: Bora Automatizar) e liderança (fundadores).
- Modelo de Monetização (ex: SaaS com mensalidade fixa sem taxa por transação, licenciamento white-label, etc.).
- Compromissos de Privacidade e Proteção de Dados (LGPD, sigilo de dados de clientes, não compartilhamento com brokers).
- Canais de Suporte e Comunicação.

#### D. `integrations.txt` (Catálogo de Conectores e APIs)
Deve conter:
- Tabela com todas as integrações suportadas (ex: WhatsApp Business API / instâncias dedicadas, gateways PIX, webhooks, serviços de impressão térmica ESC/POS, notificações Web Push).
- Tipo de conexão (REST, Webhook, WebSocket, SSE).
- Status (Nativo, Sob Demanda, Em Desenvolvimento).
- Parâmetros de autenticação e requisitos de ambiente.

#### E. `compare.txt` (Matriz Comparativa de Mercado)
Deve conter:
- Posicionamento da categoria.
- Tabela comparando:
  - O produto em questão.
  - Marketplaces tradicionais com comissões abusivas.
  - Cardápios estáticos em PDF ou links de WhatsApp improvisados.
  - ERPs de prateleira genéricos.
- Critérios analisados: Taxas por pedido, propriedade da base de clientes, customização de marca (White-Label), velocidade mobile/PWA, facilidade operacional.

---

### 3. Injeção da Tag no `<head>`

No template de cabeçalho global (ex: `header.php`, `web/_core/_includes/functions/general.php` ou `app/layout.tsx`):
```html
<link rel="alternate" type="text/plain" href="<?php echo $canonical_base_url; ?>/llms.txt" title="Contexto do [Produto] para sistemas de IA">
```

No Next.js (Metadata API):
```typescript
export const metadata: Metadata = {
  // ...
  alternates: {
    types: {
      'text/plain': '/llms.txt',
    },
  },
};
```

---

### 4. Implementação do Rodapé Moderno & Dropdown "Docs de IA"

O padrão de excelência de interface (referência `soceo.ai`) adota um rodapé escuro premium (`#000000` / `#09090b`) dividido em 4 colunas principais e uma barra inferior (sub-footer):
1. **Hero / Newsletter ("Fique Conectado"):** Título expressivo, texto de contexto e campo de e-mail no formato pílula com botão circular de envio.
2. **Links Rápidos:** Navegação essencial do produto/serviço.
3. **Contato:** E-mail oficial e orientações diretas de suporte.
4. **Siga-nos:** Ícones sociais circulares com microinterações refinadas (Instagram, X, LinkedIn, WhatsApp).
5. **Sub-footer Inferior:** Copyright à esquerda; Política de Privacidade, Termos de Serviço e o dropdown **"Docs de IA"** alinhados à direita.

#### Opção A: Implementação PHP / HTML + CSS + JS (Vanilla)

Crie o arquivo reutilizável do widget (ex: `web/_core/_layout/ai_docs_widget.php`):
```php
<?php
/**
 * Componente: Dropdown "Docs de IA" no Rodapé
 * Apresenta links de documentação abertos para IAs e LLMs (/llms.txt, etc.)
 */
$base_url = function_exists('get_base_url') ? get_base_url() : '';
$brand = function_exists('brand_name') ? brand_name() : 'Bora Automatizar';
?>
<div class="ba-ai-docs" data-ba-ai-docs>
  <button
    class="ba-ai-docs-trigger"
    data-ba-ai-docs-trigger
    type="button"
    aria-expanded="false"
    aria-controls="ba-ai-docs-panel"
    title="Documentação da plataforma para sistemas de IA e LLMs (Padrão llms.txt)"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" style="flex-shrink:0;">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
    </svg>
    <span>Docs de IA</span>
    <svg class="ba-ai-docs-chevron" aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" style="flex-shrink:0; transition: transform 180ms ease;">
      <path d="m7 10 5 5 5-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
    </svg>
  </button>
  <div
    id="ba-ai-docs-panel"
    class="ba-ai-docs-panel"
    data-ba-ai-docs-panel
    hidden
  >
    <div class="ba-ai-docs-header">
      <div class="ba-ai-docs-header-title">Docs de IA & LLMs</div>
      <div class="ba-ai-docs-header-sub">Padrão /llms.txt para agentes e modelos</div>
    </div>
    <ul class="ba-ai-docs-list">
      <li>
        <a href="<?php echo $base_url; ?>/llms.txt" target="_blank" rel="noopener noreferrer">
          <code>llms.txt</code>
          <span>Resumo do <?php echo htmlspecialchars($brand, ENT_QUOTES, 'UTF-8'); ?></span>
        </a>
      </li>
      <li>
        <a href="<?php echo $base_url; ?>/llms-full.txt" target="_blank" rel="noopener noreferrer">
          <code>llms-full.txt</code>
          <span>Perfil completo e técnico</span>
        </a>
      </li>
      <li>
        <a href="<?php echo $base_url; ?>/company.txt" target="_blank" rel="noopener noreferrer">
          <code>company.txt</code>
          <span>Empresa, visão e governança</span>
        </a>
      </li>
      <li>
        <a href="<?php echo $base_url; ?>/integrations.txt" target="_blank" rel="noopener noreferrer">
          <code>integrations.txt</code>
          <span>Integrações (WhatsApp, APIs, etc.)</span>
        </a>
      </li>
      <li>
        <a href="<?php echo $base_url; ?>/compare.txt" target="_blank" rel="noopener noreferrer">
          <code>compare.txt</code>
          <span>Como a plataforma se compara</span>
        </a>
      </li>
    </ul>
  </div>
</div>

<style>
.ba-ai-docs {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 1000;
}
.ba-ai-docs-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--ba-border, rgba(0,0,0,0.14));
  background: var(--ba-card-bg, #ffffff);
  color: var(--ba-text-subtle, #555555);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 180ms ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ba-ai-docs-trigger:hover,
.ba-ai-docs.is-open .ba-ai-docs-trigger {
  border-color: var(--ba-primary, #0060F0);
  background: rgba(0, 96, 240, 0.08);
  color: var(--ba-primary, #0060F0);
}
.ba-ai-docs.is-open .ba-ai-docs-chevron {
  transform: rotate(180deg);
}
.ba-ai-docs-panel {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: min(290px, calc(100vw - 32px));
  padding: 8px;
  border-radius: 12px;
  background: var(--ba-card-bg, #ffffff);
  border: 1px solid var(--ba-border, rgba(0,0,0,0.12));
  box-shadow: 0 16px 40px rgba(0,0,0,0.22);
  transform: translateY(6px);
  opacity: 0;
  transition: opacity 180ms ease, transform 180ms ease;
  box-sizing: border-box;
}
.ba-ai-docs-panel[hidden] {
  display: none;
}
.ba-ai-docs.is-open .ba-ai-docs-panel {
  transform: translateY(0);
  opacity: 1;
}
.ba-ai-docs-header {
  padding: 8px 10px 10px 10px;
  border-bottom: 1px solid var(--ba-border, rgba(0,0,0,0.08));
  margin-bottom: 6px;
}
.ba-ai-docs-header-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--ba-text, #111111);
}
.ba-ai-docs-header-sub {
  font-size: 11px;
  color: var(--ba-text-subtle, #777777);
  margin-top: 2px;
}
.ba-ai-docs-list {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ba-ai-docs-list a {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 7px 10px;
  border-radius: 8px;
  text-decoration: none !important;
  transition: background-color 150ms ease;
}
.ba-ai-docs-list a:hover,
.ba-ai-docs-list a:focus-visible {
  background: rgba(0, 96, 240, 0.08);
}
.ba-ai-docs-list code {
  padding: 0;
  background: transparent;
  color: var(--ba-primary, #0060F0);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}
.ba-ai-docs-list span {
  color: var(--ba-text-subtle, #666666);
  font-size: 11px;
  line-height: 1.35;
}

/* Suporte a Dark Mode */
[data-theme="dark"] .ba-ai-docs-trigger {
  background: #1c1b24;
  border-color: rgba(255,255,255,0.14);
  color: #c5c5cd;
}
[data-theme="dark"] .ba-ai-docs-trigger:hover,
[data-theme="dark"] .ba-ai-docs.is-open .ba-ai-docs-trigger {
  background: rgba(0, 96, 240, 0.2);
  color: #fff;
}
[data-theme="dark"] .ba-ai-docs-panel {
  background: #16151e;
  border-color: rgba(255,255,255,0.16);
  box-shadow: 0 18px 48px rgba(0,0,0,0.55);
}
[data-theme="dark"] .ba-ai-docs-header-title { color: #ffffff; }
[data-theme="dark"] .ba-ai-docs-header-sub { color: #90909c; }
[data-theme="dark"] .ba-ai-docs-list span { color: #9c9ca8; }
[data-theme="dark"] .ba-ai-docs-list a:hover { background: rgba(0, 96, 240, 0.2); }
[data-theme="dark"] .ba-ai-docs-list code { color: #58a6ff; }

@media (max-width: 480px) {
  .ba-ai-docs-panel {
    right: auto;
    left: 50%;
    transform: translate(-50%, 6px);
    width: min(300px, calc(100vw - 24px));
  }
  .ba-ai-docs.is-open .ba-ai-docs-panel {
    transform: translate(-50%, 0);
  }
}
</style>

<script>
(function() {
  function initAiDocs() {
    document.querySelectorAll('[data-ba-ai-docs]').forEach(function(aiDocs) {
      if (aiDocs.__initialized) return;
      aiDocs.__initialized = true;

      var trigger = aiDocs.querySelector('[data-ba-ai-docs-trigger]');
      var panel = aiDocs.querySelector('[data-ba-ai-docs-panel]');
      if (!trigger || !panel) return;

      function setOpen(isOpen, restoreFocus) {
        trigger.setAttribute('aria-expanded', String(isOpen));
        panel.hidden = !isOpen;
        aiDocs.classList.toggle('is-open', isOpen);
        if (!isOpen && restoreFocus) trigger.focus();
      }

      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var wasOpen = trigger.getAttribute('aria-expanded') === 'true';
        setOpen(!wasOpen);
      });

      document.addEventListener('click', function(e) {
        if (!aiDocs.contains(e.target)) {
          setOpen(false);
        }
      });

      aiDocs.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false, true);
        }
      });

      aiDocs.addEventListener('focusout', function(e) {
        if (e.relatedTarget && aiDocs.contains(e.relatedTarget)) return;
        setOpen(false);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiDocs);
  } else {
    initAiDocs();
  }
})();
</script>
```

#### Opção B: Implementação React / Next.js (Tailwind + Lucide)

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface AiDocItem {
  filename: string;
  label: string;
  href: string;
}

const AI_DOCS: AiDocItem[] = [
  { filename: 'llms.txt', label: 'Resumo da plataforma', href: '/llms.txt' },
  { filename: 'llms-full.txt', label: 'Perfil técnico completo', href: '/llms-full.txt' },
  { filename: 'company.txt', label: 'Empresa, visão e governança', href: '/company.txt' },
  { filename: 'integrations.txt', label: 'Integrações e APIs', href: '/integrations.txt' },
  { filename: 'compare.txt', label: 'Comparativo de mercado', href: '/compare.txt' },
];

export function AiDocsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 transition-all shadow-sm"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Docs de IA</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2.5 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
            <p className="text-xs font-bold text-neutral-900 dark:text-white">Docs de IA & LLMs</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Padrão /llms.txt para agentes e modelos</p>
          </div>
          <div className="space-y-0.5">
            {AI_DOCS.map((doc) => (
              <a
                key={doc.filename}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors group"
              >
                <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                  {doc.filename}
                </code>
                <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {doc.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Checklist de Validação e Entrega

Após gerar e publicar os arquivos e componentes, execute este checklist:

- [ ] Todos os 5 arquivos retornam HTTP 200 via `curl -sI`:
  ```bash
  for f in llms.txt llms-full.txt company.txt integrations.txt compare.txt; do
    echo -n "$f: " && curl -sI "https://seu-dominio.com.br/$f" | grep -i "HTTP/"
  done
  ```
- [ ] O header `Content-Type` é `text/plain` (não `text/html`).
- [ ] A tag `<link rel="alternate" type="text/plain" href=".../llms.txt">` está presente no `<head>` da home e das páginas públicas.
- [ ] O dropdown "Docs de IA" renderiza no rodapé sem quebrar o layout existente.
- [ ] O clique abre o dropdown para cima sem cortar na tela em dispositivos mobile.
- [ ] Pressionar `Escape` ou clicar fora fecha o dropdown.
- [ ] Nenhum arquivo possui placeholders (`{{...}}`, `[inserir...]`, `TODO`).

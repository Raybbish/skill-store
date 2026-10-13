---
name: ba-init
description: Início de projeto E documentação contínua, no mesmo comando. Em projeto novo (pouco/nenhum código) — escolhe stack, monta estrutura, qualidade e segurança day-1, e crava CHANGELOG.md/ARCHITECTURE.md/ROADMAP.md desde o primeiro commit. Em projeto em andamento — analisa código e histórico git reais e atualiza os 3 arquivos com o delta, sem inventar. Idempotente — reexecutar sempre atualiza, nunca sobrescreve.
allowed-tools: Read Write Edit Bash Grep Glob
user-invocable: true
---

# /ba-init — Início de Projeto e Documentação

Você está agora em **modo init**. Esse skill tem duas cabeças, e a que entra em ação depende do estado do projeto:

- **Projeto novo** (pouco ou nenhum código) → você faz o que um init de verdade faz: escolhe stack, monta estrutura, configura qualidade e segurança desde o primeiro commit. E já nasce documentado.
- **Projeto em andamento** (já tem código rodando) → você não mexe em nada da implementação. Só investiga o que já existe e atualiza os 3 documentos pra refletir a realidade.

Em ambos os casos, o objetivo final é o mesmo: qualquer pessoa — você mesmo daqui a 3 meses, outro dev, um cliente técnico — entende em 5 minutos o que esse projeto é, como foi construído e pra onde vai. Sem isso, todo esse contexto vive só na cabeça de quem construiu, e some.

Você não está prescrevendo como um projeto genérico deveria ser. Está **descrevendo fielmente** o que ele já é, ou registrando o que foi combinado que vai ser quando ainda não existe código. Fonte da verdade é o código, o git log e a conversa com o fundador — nunca invenção.

## Os 3 documentos

| Arquivo | O que registra | Fonte |
|---|---|---|
| `CHANGELOG.md` | O que mudou, quando | Git log real, formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) |
| `ARCHITECTURE.md` | Como o projeto é feito e por quê | Código, manifests, estrutura de pastas, decisões documentadas ou perguntadas |
| `ROADMAP.md` | O que já foi feito vs. o que ainda falta | Changelog + TODOs no código + conversa com o fundador |

## Como trabalhar

### 1. Detecte o estado do projeto

```bash
git log --oneline | wc -l   # projeto novo (0-poucos commits) ou em andamento?
ls CHANGELOG.md ARCHITECTURE.md ROADMAP.md 2>/dev/null   # os 3 já existem?
```

Isso te diz qual dos dois modos usar.

### 2a. Projeto novo (pouco ou nenhum código ainda)

O primeiro commit define o padrão — um projeto não fica bom depois, ele começa bom. Antes de documentar, você constrói a base:

**Escolhe a stack e justifica.** Não a popular, não "o que a gente sempre usa" sem pensar — a melhor pra esse projeto específico. Pra Bora Automatizar, os padrões que já se provaram (não são regra rígida, são o ponto de partida a vencer com justificativa se for fugir deles):
- Site institucional / landing / oferta → Next.js + Tailwind, ver `/ba-designer-system` pro modo visual certo.
- App interno / painel → mesma base Next.js, modo Sistema/App.
- Dados do cliente → Firestore (ver `/ba-firestore-backup` e `/ba-firestore-restore` já prontos pra esse padrão) ou CSV local via `/ba-controle-operacional` se o cliente não precisa de banco de verdade.
- Integração com CRM/ERP/planilha do cliente → `/ba-integracoes` já tem os clientes prontos, não reinvente.
- Deploy → Docker Compose + Coolify (mesmo padrão de `ba-integracoes/deploy`), a menos que o alvo seja Vercel/serverless.
- WhatsApp → sistema próprio do Bora Automatizar, nunca uma integração nova.

Se a stack certa foge desses padrões, tudo bem — mas justifique em uma frase por quê. "É o que a gente sempre usa" não é justificativa se não serve pra esse projeto.

**Monta a estrutura** — pastas que tornam a arquitetura visível, convenção de nomes consistente, um dev sênior entenderia o projeto em 10 minutos.

**Configura qualidade desde o dia um** — linting/formatação com config real (não vazia), `.env.example` com placeholders (nunca secret real, nem "de teste" que parece real), gerenciamento de tipos se a stack suportar.

**Segurança desde o primeiro commit, se o projeto usa Docker:**
- `.dockerignore` obrigatório (`.git`, `.env*` exceto `.env.example`, `node_modules`, `.next`, `*.md`).
- Multi-stage build, stage final sem ferramenta de compilação, usuário non-root (nunca `USER root` ou omitido).
- Nenhum secret hardcoded em Dockerfile/docker-compose — tudo via `${VAR}`/`env_file`.
- `--reload`/`npm run dev` nunca em imagem de produção.

Se o projeto não usa Docker (ex: site estático via Vercel), pule esta seção — não force infraestrutura que o projeto não precisa.

**Pergunte ao fundador** (se não tiver sido descrito na conversa) o que falta pra essas decisões: o que vai ser construído, stack fora do padrão se for o caso, prioridades do roadmap inicial. Não invente escopo que ele não mencionou — se a descrição for vaga demais pra tomar essas decisões com confiança, pergunte antes de construir.

**Documenta o que acabou de decidir/construir** nos 3 arquivos:
- `CHANGELOG.md` — seção `[Unreleased]` com a primeira entrada real (o que o init já criou), não vazia.
- `ARCHITECTURE.md` — stack decidida e o porquê (uma frase por escolha), estrutura de pastas, como rodar (comando real, testado).
- `ROADMAP.md` — o que o init já entregou vai em "Feito"; o resto do que foi descrito vai em "Planejado".

### 2b. Projeto em andamento (já tem código)

**Investigue antes de escrever — nunca chute:**

- `git log --all --date=short --pretty=format:"%ad %s"` — histórico completo, não só os últimos commits. É a fonte primária do CHANGELOG.
- `git tag` — se existem tags de versão, o CHANGELOG segue elas; se não, agrupe por data/marco relevante ou use só `[Unreleased]`.
- Estrutura de pastas (`find . -maxdepth 3 -type d`, ignorando `node_modules`/`.git`/build) + manifests (`package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, etc.) — o que a stack REALMENTE é, não a que você acharia natural escolher.
- `grep -rn "TODO\|FIXME\|HACK"` no código — sinaliza trabalho incompleto conhecido, vira candidato a "Em andamento" ou "Planejado" no roadmap.
- README existente, comentários de arquitetura no código, `CLAUDE.md`/`AGENTS.md` se existirem — decisões já documentadas em algum lugar não devem ser reinventadas, devem ser consolidadas.
- Se `gh` está configurado e o repo tem issues abertas: `gh issue list` vira candidato a "Planejado".
- **Se os 3 arquivos já existem**, leia-os primeiro por inteiro. Você está fazendo um **update**, não uma reescrita — preserve decisões e entradas antigas que ainda são válidas, adicione só o delta desde a última vez.

Depois de investigar, escreva ou atualize os 3 arquivos com o que a investigação mostrou.

### 3. Escrevendo cada arquivo

#### CHANGELOG.md

- Formato Keep a Changelog: `## [versão ou Unreleased] — data`, seções `### Added/Changed/Fixed/Removed` (ou a divisão por skill/feature se o projeto já usa outro agrupamento — veja se já existe convenção antes de impor uma nova).
- Cada entrada é a mudança **em linguagem de quem usa o projeto**, não o commit message cru. Sintetize commits relacionados numa entrada só quando fazem parte da mesma mudança.
- Nunca inventar uma entrada de algo que o git log não sustenta.
- Ao atualizar: adicione só as entradas novas desde a última entrada existente — não duplique, não reescreva o histórico já registrado a menos que esteja errado.

#### ARCHITECTURE.md

Seções mínimas:
- **Stack** — cada peça e por quê (se o porquê não é descobrível no código/commits/conversa, marque `(motivo não documentado — confirmar)` em vez de inventar uma justificativa razoável-soante).
- **Estrutura de pastas** — o que cada diretório de topo faz.
- **Como rodar** — comandos reais, testados, não copiados de um template genérico.
- **Serviços e integrações externas** — banco, storage, APIs de terceiro, deploy target.
- **Decisões arquiteturais não óbvias** — trade-offs que alguém entrando no projeto ia se perguntar "por que assim e não do jeito óbvio". Só documente as que existem de fato.
- Ao atualizar: revise se a stack/estrutura documentada ainda bate com a real (projetos mudam de direção); corrija o que ficou desatualizado, não só acrescente.

#### ROADMAP.md

- **Feito** — derivado do CHANGELOG e do que roda de verdade hoje. Não é uma lista de features desejadas, é o que existe.
- **Em andamento** — branches abertas, TODOs explícitos no código, trabalho começado e não fechado.
- **Planejado** — o que vem a seguir. Isso não é descobrível só analisando código — se não estiver em TODOs/issues abertas, **pergunte ao fundador** o que ele quer priorizar em seguida em vez de supor.
- Checklist simples (`- [x]` / `- [ ]`), não cronograma com datas — datas em roadmap ficam erradas em uma semana e viram ruído.

## Regras

- Nunca invente decisão, feature ou entrada de changelog que não existe no código/histórico/conversa.
- Se não souber o porquê de algo, marque como não documentado — não fabrique uma razão plausível.
- Reexecução é sempre update: leia o que já existe antes de escrever qualquer coisa.
- Só pergunte ao fundador o que **não é descobrível** por investigação (roadmap futuro, razão de uma decisão não documentada em lugar nenhum, stack fora do padrão). Não pergunte o que já dá pra inferir do código ou dos padrões Bora Automatizar.
- Em projeto novo: toda dependência e escolha de stack precisa de justificativa de uma frase — "é o padrão" só vale se for de fato o melhor fit pra esse projeto.
- Em projeto novo: sem placeholder, sem TODO no dia um — o que for criado tem que funcionar de verdade, inclusive rodar com um comando.
- Em projeto novo com Docker: sem `.dockerignore`, sem multi-stage, ou com usuário root, o init não está completo.
- Em projeto em andamento: você só documenta. Não refatora, não muda stack, não "aproveita e melhora" código — isso é outro trabalho, com outro pedido.

## Output

Ao final, reporte:
- Quais dos 3 arquivos foram criados vs. atualizados.
- Resumo de 2-3 linhas do que mudou em cada um.
- Se algo ficou marcado como "não documentado" ou pendente de resposta do fundador, liste explicitamente.

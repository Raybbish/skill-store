# /eter-briefing — Briefing Pré-Reunião

Você está agora em **modo briefing**. Dado um cliente do Eter CRM, você gera um resumo executivo de 1 página e o salva automaticamente no painel admin.

## Contexto do negócio

Eter é uma consultoria done-with-you de automação. O briefing é uma ferramenta interna — nunca vai pro cliente.

## Passo 1 — Obter dados do cliente

Se tiver um ID, busca os dados:
```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT * FROM \"Application\" WHERE id = \$1', ['ID_AQUI']).then(r => { console.log(JSON.stringify(r.rows[0], null, 2)); pool.end(); });
"
```

Se não tiver o ID, lista os recentes:
```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, name, status, \"createdAt\" FROM \"Application\" ORDER BY \"createdAt\" DESC LIMIT 10').then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); });
"
```

## Passo 2 — Gerar o briefing

Formato obrigatório:

```
BRIEFING — [Nome do Cliente]
[Data]

NEGÓCIO
[2 linhas: o que vende, tamanho, receita estimada]

DOR PRINCIPAL
[1 linha clara: o que mais custa tempo/dinheiro/sanidade]

IMPACTO SE RESOLVER
[O que o cliente disse que mudaria. Citar literalmente se possível.]

FERRAMENTAS ATUAIS
[O que usa hoje: CRM, ERP, planilha, WhatsApp, etc.]

CANAIS DE AQUISIÇÃO
[Como busca clientes]

DECISOR
[É o dono? Tem sócio? Precisa consultar alguém?]

GATILHO
[O que fez ele preencher o formulário agora]

QUALIFICAÇÃO
✅/❌ Dor clara e específica
✅/❌ É o decisor
✅/❌ Negócio com receita real
✅/❌ Expectativa alinhada (done-with-you)
VEREDICTO: QUALIFICADO / DESQUALIFICADO / REVISAR

PERGUNTAS PARA A CALL
1. [pergunta]
2. [pergunta]
3. [pergunta]

PRÓXIMO PASSO SUGERIDO
[O que fazer depois da call]
```

## Passo 3 — Salvar no painel (OBRIGATÓRIO)

Após gerar o briefing, salvar diretamente no banco:

```bash
cd E:/dev/eter-crm
node -e "
const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const content = \`COLE_O_BRIEFING_AQUI\`;
pool.query('UPDATE \"Application\" SET briefing = \$1, \"briefingAt\" = NOW() WHERE id = \$2', [content, 'ID_DO_CLIENTE']).then(() => { console.log('Briefing salvo no painel.'); pool.end(); });
"
```

**Instrução ao Claude:** após gerar o briefing, execute o script acima com o conteúdo completo e o ID correto. O painel admin mostrará o briefing automaticamente após o save.

## Regras

- Máximo 1 página (300-400 palavras)
- Veredicto de qualificação sempre presente
- Se dados faltarem, marcar com [?]
- Tom: notas de trabalho, não documento formal
- **Sempre salvar no banco ao final — nunca encerrar sem executar o Passo 3**

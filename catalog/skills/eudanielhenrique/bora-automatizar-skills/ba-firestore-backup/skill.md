---
name: ba-firestore-backup
description: Faz backup de collections do Firestore para um arquivo JSON local. Instala o pacote automaticamente se necessário. Suporta todas as collections ou seleção específica.
---

# /ba-firestore-backup — Backup do Firestore

Você está agora em **modo backup**. Seu trabalho é exportar dados do Firestore para um arquivo JSON local com segurança e clareza.

## Princípio central

Backup é uma operação de leitura — não destrutiva. Mas um backup silencioso que falhou é pior que não ter backup. Todo backup precisa de confirmação explícita do que foi salvo.

## O que você faz

### 0. Instalar o pacote (automático)

**Antes de qualquer coisa**, verifique se o `firestore-export-import` está disponível:

```bash
node -e "require('firestore-export-import')" 2>/dev/null && echo "OK" || echo "NOT_FOUND"
```

Se retornar `NOT_FOUND`, instale automaticamente sem perguntar:

```bash
npm install github:eudanielhenrique/firestore-backup-restore#fix/v1.7.0-batch-writes-data-types
```

Aguarde a instalação completar antes de continuar. Se falhar, reporte o erro e pare.

### 1. Verificar Service Account

Cheque se existe um arquivo de Service Account. Procure por:
- `serviceAccountKey.json` na raiz do projeto
- Qualquer `.json` com `"type": "service_account"` no projeto

Se não encontrar, instrua o usuário:
```
Firebase Console → Project Settings → Service accounts → Generate new private key
Salvar como serviceAccountKey.json na raiz do projeto
```

**Nunca commite esse arquivo.** Confirme que está no `.gitignore`.

### 2. Identificar o projeto e collections

Pergunte ao usuário (ou infira do contexto):
- Quais collections? (`[]` = todas)
- Incluir subcollections? (padrão: sim)

### 3. Executar o backup

Salve e execute o script abaixo:

```js
import { readFileSync, writeFileSync } from 'fs'
import { initializeFirebaseApp, backups } from 'firestore-export-import'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
const db = initializeFirebaseApp(serviceAccount)

const collections = [] // [] = todas, ou ['users', 'accounts']
const options = { showLogs: true, includeSubcollections: true }

console.log('Iniciando backup...')
const data = await backups(db, collections, options)

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const filename = `backup-${timestamp}.json`
writeFileSync(filename, JSON.stringify(data, null, 2))

const total = Object.values(data).reduce((sum, col) => sum + Object.keys(col).length, 0)
const sizeKb = Math.round(JSON.stringify(data).length / 1024)
console.log(`\nBackup concluído: ${total} documentos em ${Object.keys(data).length} collection(s)`)
console.log(`Arquivo: ${filename} (${sizeKb} KB)`)
```

Execute com:
```bash
node --input-type=module < backup.mjs
```

### 4. Reportar resultado

Após o backup, mostre:
```
BACKUP CONCLUÍDO
Projeto:     <project_id>
Collections: <lista>
Documentos:  <total>
Arquivo:     backup-<timestamp>.json
Tamanho:     <kb>
```

Se falhar, mostre o erro completo e o provável motivo (credenciais inválidas, collection inexistente, sem permissão).

## Opções avançadas

### Backup de collection específica
```js
const data = await backup(db, 'users', { showLogs: true })
```

### Backup de documento específico
```js
const data = await backupFromDoc(db, 'users', 'doc-id', { showLogs: true })
```

### Sem subcollections (mais rápido)
```js
const options = { includeSubcollections: false, showLogs: true }
```

### Limitar documentos por collection (amostra)
```js
const options = { docsFromEachCollection: 10, showLogs: true }
```

## Segurança

- `serviceAccountKey.json` NUNCA vai pro git
- O arquivo de backup pode conter dados sensíveis — tratar com o mesmo cuidado
- Em produção, salvar backups em local seguro (bucket privado, não no repo)

## Regras

- Sempre instale o pacote no passo 0 — não assuma que está disponível
- Sempre confirme o que foi salvo — total de docs, collections, arquivo gerado
- Se o backup estiver vazio (0 docs), avise — pode ser problema de permissão
- Se o arquivo de backup passar de 50MB, sugira backup por collection separada
- Nunca assuma que o backup funcionou sem verificar o arquivo gerado

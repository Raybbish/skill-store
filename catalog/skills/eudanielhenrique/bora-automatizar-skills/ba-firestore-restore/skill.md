---
name: ba-firestore-restore
description: Restaura dados no Firestore a partir de um arquivo JSON de backup. Instala o pacote automaticamente se necessário. Suporta conversão de tipos (Timestamp, GeoPoint, refs), limpeza prévia de collections e logging. Operação destrutiva — requer confirmação.
---

# /ba-firestore-restore — Restore do Firestore

Você está agora em **modo restore**. Seu trabalho é restaurar dados no Firestore com segurança, confirmação explícita e rastreabilidade completa.

## Princípio central

Restore é uma operação **potencialmente destrutiva**. Um restore errado no banco errado apaga dados reais. Toda execução exige: arquivo correto, banco correto, confirmação explícita, log do que foi escrito.

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

### 1. Verificar pré-requisitos

- `serviceAccountKey.json` existe e é válido?
- O arquivo de backup existe e é um JSON válido?

Se não encontrar o service account:
```
Firebase Console → Project Settings → Service accounts → Generate new private key
Salvar como serviceAccountKey.json na raiz do projeto
```

### 2. Identificar arquivo de backup

Liste os backups disponíveis:
```bash
ls backup-*.json
```

Pergunte ao usuário qual arquivo usar. Se houver mais de um, liste com tamanho e data:
```
backup-2026-07-13T23-24-31-485Z.json  (2.3 MB — 13/07/2026 20:24)
backup-2026-07-10T10-00-00-000Z.json  (2.1 MB — 10/07/2026 07:00)
```

### 3. Confirmar destino — CRÍTICO

Antes de restaurar, mostre claramente:
```
ATENÇÃO — OPERAÇÃO DE ESCRITA NO FIRESTORE

Projeto:    whats-remember (projeto-firebase-adminsdk-xxx@...)
Arquivo:    backup-2026-07-13T23-24-31-485Z.json
Collections: accounts, sessions, users
Documentos: ~435
clearCollection: NÃO (merge com dados existentes)

Confirme: isso está correto?
```

**Se `clearCollection: true`:**
```
⚠️  ATENÇÃO — DADOS EXISTENTES SERÃO DELETADOS

clearCollection: SIM — as collections serão apagadas ANTES do restore.
Isso é irreversível. Os dados atuais serão perdidos.

Confirme digitando o nome do projeto: whats-remember
```

### 4. Identificar opções de conversão de tipos

Analise o arquivo de backup para detectar campos que precisam de conversão:
- Campos com `_seconds` + `_nanoseconds` → `dates` ou `autoParseDates: true`
- Campos com `_latitude` + `_longitude` → `geos` ou `autoParseGeos: true`
- Campos com valor tipo `collection/docId` → `refs`

Sugestão de opções baseada no conteúdo:
```js
const options = {
  autoParseDates: true,   // se encontrar _seconds/_nanoseconds
  autoParseGeos: true,    // se encontrar _latitude/_longitude
  showLogs: true,
  clearCollection: false, // padrão seguro
}
```

### 5. Executar o restore

```js
import { readFileSync } from 'fs'
import { initializeFirebaseApp, restore } from 'firestore-export-import'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
const db = initializeFirebaseApp(serviceAccount)

const backupFile = './backup-2026-07-13T23-24-31-485Z.json'

const options = {
  autoParseDates: true,
  autoParseGeos: true,
  showLogs: true,
  clearCollection: false,
}

console.log('Iniciando restore...')
const result = await restore(db, backupFile, options)
console.log(result.message)
```

Execute com: `node --input-type=module < script.mjs`

### 6. Verificar resultado

Após o restore:
- `result.status === true` = sucesso
- Se falhar, o erro tem `status: false` e a mensagem original

Sempre faça uma verificação spot-check:
```js
import { backup } from 'firestore-export-import'
const check = await backup(db, 'users', { docsFromEachCollection: 3 })
console.log('Amostra pós-restore:', JSON.stringify(check, null, 2))
```

### 7. Reportar resultado

```
RESTORE CONCLUÍDO
Projeto:     whats-remember
Arquivo:     backup-2026-07-13T23-24-31-485Z.json
Collections: accounts, sessions, users
Status:      sucesso
```

## Cenários comuns

### Restore completo (produção → staging)
```js
{ autoParseDates: true, autoParseGeos: true, clearCollection: true, showLogs: true }
```

### Restore incremental (merge, sem apagar)
```js
{ autoParseDates: true, autoParseGeos: true, clearCollection: false, showLogs: true }
```

### Restore com types específicos
```js
{
  dates: ['createdAt', 'updatedAt', 'schedule.time'],
  geos: ['location', 'addresses.coords'],
  refs: ['userId', 'accountRef'],
  showLogs: true,
}
```

## Regras

- **Nunca execute restore sem confirmar projeto e arquivo** — erro aqui apaga dados reais
- **`clearCollection: true` é irreversível** — exija confirmação explícita do nome do projeto
- **Sempre verifique `result.status`** — silêncio não é sucesso
- **Faça um spot-check pós-restore** — leia 2-3 docs e confirme os tipos (Timestamp, GeoPoint)
- **Em caso de dúvida, faça backup do estado atual ANTES de restaurar**
- Se o restore travar em muitos documentos, é normal — o batch writer commita a cada 500 docs e loga o progresso
- Sempre instale o pacote no passo 0 — não assuma que está disponível

---
name: deferred-external-action-verification
description: Richtet für asynchron arbeitende externe Programme, APIs und CI/CD-Systeme eine zeitversetzte, wiederholbare Ergebnisprüfung per Cronjob oder gleichwertigem Scheduler ein. Nimmt jeden vom Agenten selbst ausgelösten CI-Lauf automatisch in eine Beobachtungsliste auf und setzt den gespeicherten Arbeitsablauf nach verifiziertem Erfolg fort. Der Skill definiert Wartefenster, Statusabfrage, Idempotenz, Sperren, Retry- und Abbruchregeln, Protokollierung sowie die sichere Aufräumlogik nach Erfolg oder endgültigem Fehler.
version: 1.0.0
status: stable
owners:
  - White Label Maintainer
requires: []
outputs:
  - watch record
  - verified terminal status
  - continuation result
lastEvaluated: 2026-07-31
implicitInvocation: true
---

# Zeitversetzte Prüfung externer Aktionen

## Zweck

Dieser Skill beschreibt das verbindliche Vorgehen, wenn eine ausgelöste Funktion in einem externen Programm nicht sofort abgeschlossen ist und das Ergebnis erst nach einer gewissen Zeit zuverlässig geprüft werden kann.

Typische Beispiele:

- GitHub Actions, Deployments und externe Build-Pipelines,
- Cloud- oder Hosting-Provisionierung,
- Dateiimporte, Exporte und Konvertierungen,
- Batchjobs, Datenbankmigrationen und ETL-Prozesse,
- externe Analyse-, Rendering- oder KI-Aufträge,
- API-Aufträge mit Job-ID und späterem Statusabruf.

Der Skill verhindert zwei ungeeignete Muster:

1. einen lang laufenden Prozess aktiv und blockierend warten zu lassen,
2. eine externe Aktion als erfolgreich zu melden, bevor ihr Ergebnis tatsächlich geprüft wurde.

Stattdessen wird eine belastbare spätere Prüfung über `cron`, `systemd timer`, einen CI-Scheduler, eine Queue oder einen vergleichbaren Zeitplaner eingerichtet.

## Abgrenzung

Dieser Skill gilt für technisch asynchrone oder verzögert konsistente Vorgänge. Er ist nicht erforderlich, wenn der aufgerufene Befehl synchron mit einem belastbaren Endergebnis zurückkehrt.

Ein Cronjob ist nur eine mögliche Implementierung. Auf Systemen mit `systemd` ist ein Timer häufig vorzuziehen. In containerisierten oder verteilten Umgebungen können Job-Queues, Workflow-Engines oder Plattform-Scheduler geeigneter sein.

## Auslöser

Der Skill wird angewendet, wenn mindestens eine der folgenden Bedingungen erfüllt ist:

- eine externe Aktion liefert zunächst nur `queued`, `pending`, `running`, `accepted` oder eine Job-ID,
- das Zielsystem benötigt erfahrungsgemäß Zeit für Build, Deployment, Import oder Verarbeitung,
- das Ergebnis wird erst durch einen späteren Status-, Health- oder Artefaktabruf sichtbar,
- sofortige Wiederholungsabfragen würden Rate Limits, unnötige Last oder instabile Ergebnisse erzeugen,
- der Nutzer verlangt ausdrücklich, nach einer Wartezeit erneut zu prüfen oder fortzufahren,
- ein Workflow soll nach einem externen Zwischenschritt automatisch wieder aufgenommen werden.
- der Agent löst CI direkt oder indirekt aus, etwa durch Push, PR-Aktualisierung, Re-Run oder `workflow_dispatch`.

## Voraussetzungen

Vor der Einrichtung müssen folgende Angaben soweit verfügbar bestimmt werden:

- eindeutige Vorgangskennung, zum Beispiel Run-ID, Job-ID, Commit-SHA oder Deployment-ID,
- zuständiges Zielsystem und Statusschnittstelle,
- erwartete Mindestlaufzeit beziehungsweise sinnvolles erstes Prüfintervall,
- terminale Erfolgszustände,
- terminale Fehlerzustände,
- maximal zulässige Gesamtdauer oder maximale Anzahl Prüfversuche,
- notwendige Zugangsdaten in sicherer Ablage,
- Ort für Status, Logs und gegebenenfalls Ergebnisartefakte,
- fortzusetzendes Ziel, nächster zulässiger Schritt und erforderliche Erfolgskriterien.

Fehlt eine Job-ID, muss die spätere Prüfung den Vorgang durch eine stabile Kombination identifizieren, etwa Repository, Branch, Commit-SHA und Workflowname. Flüchtige Merkmale wie „letzter Job“ sind nur zulässig, wenn keine parallelen Vorgänge auftreten können.

## Verbindlicher Ablauf

### 1. Externe Aktion auslösen

Die auslösende Operation wird genau einmal ausgeführt, sofern das Zielsystem keine ausdrücklich sichere Idempotenz garantiert.

Unmittelbar danach werden mindestens gespeichert:

- Zeitpunkt der Auslösung,
- Vorgangskennung,
- Zielsystem,
- erwartete Prüfung,
- aktueller Zustand,
- Korrelations-ID des lokalen Workflows.

Beispiel einer Zustandsdatei:

```json
{
  "correlationId": "project-deploy-20260729-001",
  "externalSystem": "example-ci",
  "jobId": "123456",
  "triggeredAt": "2026-07-29T10:50:00+02:00",
  "status": "pending",
  "attempt": 0,
  "maxAttempts": 12,
  "nextCheckAt": "2026-07-29T10:55:00+02:00"
}
```

### 1a. Selbst ausgelöste CI automatisch beobachten

Wenn der Agent durch eine eigene Aktion einen CI-Lauf direkt oder als erwartbare Folge auslöst, gehört die Aufnahme dieses Laufs in die Beobachtungsliste verbindlich zur selben Operation. Dafür ist keine zusätzliche Aufforderung des Nutzers erforderlich.

Dies gilt insbesondere für:

- Pushes und PR-Aktualisierungen, die CI-Workflows starten,
- manuell gestartete Workflows,
- Re-Runs fehlgeschlagener Jobs oder kompletter Workflow-Läufe,
- Commits oder Merge-Aktionen, deren Erfolg erst durch Required Checks feststeht.

Unmittelbar nach der auslösenden Aktion:

1. Repository, Branch, Commit-SHA, Workflow und Fortsetzungsziel erfassen.
2. Run-ID beziehungsweise Check-Suite-ID abrufen.
3. Ist die Run-ID noch nicht sichtbar, vorläufig über Repository, Commit-SHA und Workflow beobachten und die stabile Run-ID beim ersten Treffer ergänzen.
4. Einen persistenten Scheduler-Eintrag oder einen Eintrag in einem bereits laufenden Dispatcher aktivieren.
5. Prüfen, dass der Beobachtungseintrag tatsächlich aktiv ist.

Die auslösende Aktion gilt erst dann als vollständig nachverfolgt, wenn dieser Eintrag verifiziert wurde. Lässt sich die Beobachtung wegen fehlender Berechtigung, nicht verfügbarem Scheduler oder fehlender Statusschnittstelle nicht einrichten, darf keine automatische Fortsetzung behauptet werden; der konkrete Blocker ist sofort zu melden.

Ein CI-Beobachtungseintrag enthält mindestens:

```json
{
  "correlationId": "repo-ci-20260730-001",
  "repository": "owner/repository",
  "pullRequest": 123,
  "branch": "feature/example",
  "commitSha": "0123456789abcdef",
  "workflow": "CI",
  "runId": null,
  "triggeredAt": "2026-07-30T12:00:00Z",
  "status": "pending",
  "attempt": 0,
  "maxAttempts": 12,
  "continuationGoal": "Pull Request bis zur Merge-Bereitschaft weiterbearbeiten",
  "nextAction": "Ergebnis prüfen und das nächste kleinste sichere Inkrement ausführen",
  "successCriteria": ["alle Required Checks erfolgreich"],
  "continuationKey": "owner/repository:0123456789abcdef:CI"
}
```

Die Beobachtung muss exakt dem ausgelösten Commit zugeordnet sein. Ein pauschaler Abruf des neuesten Laufs ist unzulässig, wenn parallele Branches, Workflows oder Commits möglich sind. Bis die Run-ID bekannt ist, dienen zusätzlich Branch, Ereignistyp und Auslösezeit zur eindeutigen Zuordnung.

### 2. Erstes Wartefenster festlegen

Die erste Prüfung darf nicht sofort in einer engen Schleife erfolgen. Das Anfangsintervall richtet sich nach der typischen Dauer des Zielsystems:

- kurze API-Jobs: etwa 1 bis 2 Minuten,
- CI-Builds und Deployments: etwa 3 bis 5 Minuten,
- größere Imports oder Provisionierungen: 5 bis 15 Minuten,
- lang laufende Batchprozesse: fachlich angemessen länger.

Das Intervall ist eine Startregel, keine Garantie. Bekannte Laufzeitdaten des konkreten Systems haben Vorrang.

### 3. Prüfskript idempotent implementieren

Das Prüfskript muss bei wiederholtem Aufruf denselben Vorgang sicher prüfen können, ohne die ursprüngliche Aktion erneut auszulösen.

Es führt in dieser Reihenfolge aus:

1. Sperre erwerben,
2. gespeicherten Zustand laden,
3. prüfen, ob der Vorgang bereits terminal abgeschlossen ist,
4. aktuellen externen Status abrufen,
5. Status normalisieren,
6. Ergebnis und Zeitstempel speichern,
7. abhängig vom Zustand fortfahren, erneut planen oder beenden,
8. Sperre freigeben.

Zulässige normalisierte Zustände:

```text
pending
running
succeeded
failed
cancelled
timed_out
unknown
```

### 4. Parallelausführung verhindern

Ein neuer Prüflauf darf nicht starten, solange der vorherige noch läuft. Unter Linux wird bevorzugt `flock` verwendet:

```bash
flock -n /var/lock/external-check.lock \
  /usr/local/bin/check-external-job.sh
```

Alternativ können atomare Datenbanksperren, Queue-Leases oder Scheduler-eigene Concurrency-Regeln genutzt werden.

### 5. Cronjob einrichten

Beispiel für eine Prüfung alle fünf Minuten:

```cron
*/5 * * * * flock -n /var/lock/external-check.lock /usr/local/bin/check-external-job.sh >> /var/log/external-check.log 2>&1
```

Wichtige Regeln:

- absolute Pfade verwenden,
- erforderliche Umgebung explizit setzen,
- nicht von einer interaktiven Shell-Konfiguration abhängen,
- Standardausgabe und Fehler protokollieren,
- Secrets nicht direkt in die Crontab schreiben,
- Zeitzone bewusst festlegen,
- Skript mit restriktiven Dateirechten schützen.

Beispiel mit expliziter Umgebung:

```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=Europe/Vienna

*/5 * * * * flock -n /var/lock/external-check.lock /usr/local/bin/check-external-job.sh >> /var/log/external-check.log 2>&1
```

### 6. Status auswerten

#### `pending` oder `running`

- Versuchszähler erhöhen,
- aktuellen Zeitpunkt protokollieren,
- nächsten Lauf zulassen,
- keine Erfolgsmeldung erzeugen.

#### `succeeded`

- Ergebnisartefakte, Health-Endpunkte oder Folgebedingungen zusätzlich verifizieren,
- bei CI alle für den gespeicherten Commit erforderlichen Checks und nicht nur einen einzelnen Job prüfen,
- vor der Fortsetzung feststellen, ob der Branch inzwischen auf einen neueren Commit zeigt; einen veralteten Fortsetzungsschritt nicht blind ausführen,
- lokalen Zustand terminal auf `succeeded` setzen,
- gespeichertes Fortsetzungsziel laden und den nächsten zulässigen Arbeitsschritt idempotent ausführen,
- den Fortsetzungsschritt mit `continuationKey` oder einem atomaren Marker höchstens einmal starten,
- erzeugt der Fortsetzungsschritt einen neuen Commit oder CI-Lauf, dafür sofort einen neuen Beobachtungseintrag anlegen,
- weitere Prüfungen für diesen Vorgang deaktivieren oder wirkungslos machen,
- Abschluss nachvollziehbar protokollieren.

Ein externer Status `success` allein genügt nicht immer. Bei Deployments sollte beispielsweise zusätzlich der öffentliche oder interne Health-Endpunkt geprüft werden.

#### `failed` oder `cancelled`

- Fehlerdetails abrufen und speichern,
- lokalen Zustand terminal setzen,
- keine automatische Neuauslösung vornehmen, sofern diese nicht ausdrücklich als sicher definiert wurde,
- den gespeicherten Erfolgs-Folgeschritt nicht ausführen,
- zuständige Stelle mit konkreter Vorgangskennung und Fehlerursache informieren.

#### `unknown`

- als technischer Prüfungsfehler behandeln,
- mit begrenztem Retry erneut versuchen,
- nach Erreichen der Grenze auf `failed` oder `timed_out` eskalieren,
- niemals stillschweigend als Erfolg interpretieren.

### 7. Retry- und Backoff-Regeln anwenden

Für reine Statusabfragen ist ein begrenzter Retry zulässig. Empfohlen wird ein wachsendes Intervall, zum Beispiel:

```text
2 min, 5 min, 10 min, 15 min, danach alle 30 min
```

Dabei gelten:

- Rate-Limit-Header des Zielsystems respektieren,
- bei HTTP `429` oder temporären `5xx`-Fehlern später erneut prüfen,
- bei Authentifizierungsfehlern nicht endlos wiederholen,
- bei ungültiger Job-ID sofort eskalieren,
- eine maximale Gesamtdauer festlegen.

### 8. Abschluss und Aufräumen

Nach einem terminalen Zustand muss der Scheduler den Vorgang nicht erneut fachlich bearbeiten.

Mögliche Umsetzungen:

- Zustandsprüfung am Skriptanfang und sofortiges Ende,
- Entfernen eines vorgangsspezifischen Cron-Eintrags,
- Deaktivieren eines `systemd`-Timers,
- Löschen eines Queue-Jobs,
- Verschieben der Zustandsdatei in ein Archiv.

Dynamische Änderungen an einer gemeinsamen Crontab sind nur mit besonderer Vorsicht vorzunehmen. Ein dauerhaft laufender, idempotenter Dispatcher ist häufig sicherer als das wiederholte Erzeugen und Entfernen einzelner Cronzeilen.

## Referenzstruktur eines Prüfskripts

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

STATE_FILE="/var/lib/external-check/job.json"
LOCK_FILE="/var/lock/external-check.lock"
LOG_TAG="external-check"

exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

[[ -r "$STATE_FILE" ]] || {
  logger -t "$LOG_TAG" "state file missing"
  exit 1
}

status="$(/usr/local/bin/query-external-status "$STATE_FILE")"

case "$status" in
  pending|running)
    /usr/local/bin/update-external-state "$STATE_FILE" "$status"
    ;;
  succeeded)
    /usr/local/bin/verify-external-result "$STATE_FILE"
    /usr/local/bin/update-external-state "$STATE_FILE" "succeeded"
    /usr/local/bin/run-follow-up-once "$STATE_FILE"
    ;;
  failed|cancelled)
    /usr/local/bin/update-external-state "$STATE_FILE" "$status"
    /usr/local/bin/report-external-failure "$STATE_FILE"
    exit 1
    ;;
  *)
    /usr/local/bin/register-check-error "$STATE_FILE" "$status"
    exit 2
    ;;
esac
```

Die Hilfsbefehle sind Platzhalter. Ihre Implementierung hängt vom Zielsystem ab.

## Alternative mit systemd timer

Ein `systemd`-Timer ist vorzuziehen, wenn folgende Eigenschaften wichtig sind:

- bessere Protokollierung über `journalctl`,
- definierte Abhängigkeiten und Umgebungen,
- `Persistent=true` für nachgeholte Läufe nach einem Neustart,
- kontrollierte Timeouts und Ressourcenlimits,
- einfachere Aktivierung und Deaktivierung.

Beispiel:

```ini
# /etc/systemd/system/external-check.timer
[Unit]
Description=Zeitversetzte Prüfung eines externen Vorgangs

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/external-check.service
[Unit]
Description=Prüft den Zustand eines externen Vorgangs

[Service]
Type=oneshot
ExecStart=/usr/local/bin/check-external-job.sh
TimeoutStartSec=2min
```

Aktivierung:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now external-check.timer
systemctl list-timers external-check.timer
```

## Prüfungen und Erfolgskriterien

Vor der produktiven Nutzung ist zu prüfen:

- die externe Aktion wird nicht durch den Prüflauf erneut ausgelöst,
- der korrekte Vorgang wird über eine stabile Kennung abgefragt,
- parallele Prüfläufe sind ausgeschlossen,
- ein laufender Vorgang bleibt `pending` oder `running`,
- Erfolg wird erst nach zusätzlicher Ergebnisprüfung gemeldet,
- Fehler und unbekannte Zustände werden sichtbar eskaliert,
- die maximale Laufzeit beendet endlose Prüfungen,
- Neustarts des Hosts führen nicht zu Statusverlust,
- Logs enthalten Korrelations-ID, Job-ID, Versuch und Ergebnis,
- Secrets erscheinen weder in Logs noch in Prozessargumenten,
- Folgeschritte werden höchstens einmal ausgeführt.

Der Skill gilt als erfolgreich angewendet, wenn der externe Vorgang einen verifizierten terminalen Zustand erreicht hat und der lokale Workflow diesen Zustand eindeutig gespeichert und verarbeitet hat.

## Fehlerbehandlung

### Scheduler läuft nicht

- Cron-Dienst oder Timerstatus prüfen,
- Syntax mit einem Linter oder Testeintrag validieren,
- Benutzerkontext und Dateirechte kontrollieren,
- absolute Pfade und Umgebung prüfen,
- letzten Lauf anhand von Logs oder Journal nachvollziehen.

### Statusschnittstelle ist vorübergehend nicht erreichbar

- Fehler als Prüfungsfehler protokollieren,
- begrenzt mit Backoff erneut versuchen,
- bisherigen externen Zustand nicht überschreiben,
- nach Ablauf der Maximaldauer eskalieren.

### Job-ID ist unbekannt oder nicht mehr vorhanden

- Eingabe und Zielsystem prüfen,
- nicht automatisch einen ähnlich aussehenden oder neuesten Job verwenden,
- Zustand auf `unknown` beziehungsweise terminalen Fehler setzen,
- manuelle Klärung mit Korrelationsdaten anfordern.

### Host war ausgeschaltet

- bei Cron anhand des gespeicherten Zustands beim nächsten Lauf fortsetzen,
- bei zeitkritischen Vorgängen `systemd` mit `Persistent=true` oder einen externen Scheduler verwenden,
- maximale Gesamtdauer anhand des ursprünglichen Auslösezeitpunkts berechnen, nicht anhand der Anzahl tatsächlich ausgeführter Checks.

### Folgeschritt wurde bereits ausgeführt

- Idempotenzschlüssel oder atomaren Abschlussmarker prüfen,
- Folgeschritt nicht erneut ausführen,
- doppelten Schedulerlauf protokollieren und erfolgreich beenden.

## Sicherheits- und Datenschutzgrenzen

- API-Tokens, Passwörter und private Schlüssel gehören in Secret Stores oder restriktiv geschützte Umgebungsdateien.
- Secrets dürfen nicht in Crontab, Kommandozeilenargumenten, Logs oder Zustandsdateien erscheinen.
- Statusantworten können vertrauliche Daten enthalten und müssen entsprechend geschützt werden.
- Prüfscripte laufen mit den geringsten erforderlichen Rechten.
- Externe Aktionen werden bei unklarem Zustand nicht automatisch erneut ausgelöst.
- Lösch-, Rollback- oder Produktionsaktionen benötigen eigene, ausdrücklich definierte Sicherheitsregeln.
- Logrotation und Aufbewahrungsfristen sind festzulegen.

## Abschlusszustand

Der Ablauf ist abgeschlossen, wenn:

- die externe Aktion eindeutig identifiziert wurde,
- eine verzögerte und wiederholbare Prüfung eingerichtet ist,
- Erfolg oder Fehler terminal und nachvollziehbar gespeichert wurde,
- das Ergebnis zusätzlich fachlich oder technisch verifiziert wurde,
- Folgeschritte höchstens einmal ausgeführt wurden,
- weitere unnötige Prüfungen beendet oder wirkungslos sind,
- relevante Logs und Artefakte für die Nachvollziehbarkeit vorliegen.

## Wiederverwendungsregel

Bei zukünftigen Aufgaben mit externen, verzögert abschließenden Funktionen wird nicht aktiv im selben Prozess gewartet. Stattdessen wird dieser Skill verwendet, um die spätere Prüfung mit stabiler Vorgangskennung, begrenztem Retry, klaren Abbruchbedingungen und verifiziertem Abschluss zu organisieren.

---
name: auto-proxy-detect
description: Diagnose local proxy availability, validate HTTP/HTTPS proxy behavior, probe target resources, and choose the safest network execution path for tools like Codex, OpenCode, docker, npm, pip, apt, curl, and git.
---

# Auto Proxy Detect

This skill is used to **diagnose network execution conditions before running network-dependent commands**.

It is especially useful in environments where a local HTTP proxy may be running on `127.0.0.1:7890`, such as Clash, V2Ray, sing-box, or custom local proxy services.

This skill does **more than detect a listening port**. It should:

1. Detect whether a local proxy listener exists
2. Validate whether the proxy behaves like a usable HTTP proxy
3. Validate HTTPS CONNECT behavior when needed
4. Probe the target resource when the target is known
5. Recommend the best execution path
6. Output a structured diagnosis summary

---

## Use This Skill

Use this skill when:

- Running `docker pull`, `docker build`, or `docker run` commands that need internet access
- Running `npm install`, `pnpm install`, `yarn install`
- Running `pip install`, `apt install`, `git clone`, `curl`, `wget`
- Running tools such as Codex or OpenCode that may rely on external APIs, registries, or package downloads
- You suspect a proxy, DNS, TLS, or routing issue
- You need a fast and safe way to determine whether a target resource is reachable
- You want to prefer ephemeral proxy injection over persistent tool configuration

Do NOT use this skill when:

- The operation is fully offline/local-only
- The task is only local file manipulation
- You already have confirmed network health for the same target and tool in the same execution context
- You only need persistent config authoring without any runtime diagnosis

This skill is **not a full replacement** for:

- TLS certificate trust debugging
- GUI application proxy inheritance debugging
- Full packet capture / MITM analysis
- Deep application-level authentication debugging

---

## Core Principles

1. **Do not assume port listening means proxy usable**
2. **Do not assume proxy usable means target reachable**
3. **Prefer lightweight probes before expensive network commands**
4. **Prefer one-off environment injection over persistent config writes**
5. **Return a structured diagnosis, not only success/failure**
6. **Be explicit about the likely failure stage**
7. **If target is known, probe target specifically**

---

## Pre-Read Order

Read the task context first:

1. the user command or the network-dependent operation being prepared
2. any repository docs or scripts that already define proxy behavior for the target tool

Then load bundled guidance from this skill:

3. `references/diagnosis-stages.md`
4. `references/proxy-patterns.md`
5. `references/target-probe-patterns.md`
6. `references/codex-opencode-notes.md` when the task involves Codex, OpenCode, or another API client

---

## Workflow

### Step 1: Detect local proxy listener

Before any network execution, first determine whether something is listening on port `7890`.

Example:

```bash
lsof -i :7890 || netstat -an | grep 7890 || ss -tuln | grep 7890
```

This only answers:

- is a process listening?
- not whether it is a usable proxy

---

### Step 2: Validate basic proxy behavior

If a listener exists, validate that the local proxy behaves like a working HTTP proxy.

Example lightweight HTTP probe:

```bash
curl -x http://127.0.0.1:7890 -I http://example.com --max-time 5
```

This helps determine whether:

- the proxy accepts requests
- the proxy can reach a basic HTTP target

---

### Step 3: Validate HTTPS CONNECT behavior

If HTTPS will be used, validate CONNECT behavior separately.

Example:

```bash
curl -x http://127.0.0.1:7890 -I https://example.com --max-time 8
```

This helps determine whether:

- CONNECT works
- HTTPS via proxy is functioning
- failures occur at CONNECT, TLS, or upstream stages

---

### Step 4: Probe the actual target when known

If a target is known, probe the actual target before expensive work.

Examples:

- `https://registry.npmjs.org`
- `https://registry-1.docker.io`
- `https://api.github.com`
- `https://raw.githubusercontent.com`
- a specific model provider API endpoint

Prefer:

- HEAD request
- lightweight GET
- registry ping
- auth endpoint probe
- small file probe

Do not jump directly into:

- `npm install`
- `docker pull`
- large downloads

unless lightweight probing is not possible.

---

### Step 5: Choose execution mode

Choose one of these modes:

#### Mode A: Direct

Use when direct connectivity is healthy and proxy is not needed.

#### Mode B: Proxy Ephemeral

Use environment variables or one-off command flags only for the current command.

#### Mode C: Proxy + Target-Aware

Use proxy because target probe succeeded only via proxy.

#### Mode D: Mirror / Alternate Source

Use when primary target is slow, blocked, or unstable.

#### Mode E: Verbose Debug Fetch

Use `curl -v`, trace logs, or similar when diagnosis is incomplete.

---

## Default Environment Variables

For ephemeral proxy usage:

```bash
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export no_proxy=localhost,127.0.0.1,::1,host.docker.internal
export NO_PROXY=localhost,127.0.0.1,::1,host.docker.internal
```

Note:

- `host.docker.internal` should usually be included
- more entries may be added for local/internal services if needed
- avoid overly broad `no_proxy` values unless required

---

## Tool Execution Patterns

### Docker

Prefer ephemeral env or build args.

#### docker pull

```bash
http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 docker pull <image>
```

#### docker build

```bash
docker build \
  --build-arg http_proxy=http://127.0.0.1:7890 \
  --build-arg https_proxy=http://127.0.0.1:7890 \
  -t <image> .
```

#### docker run

```bash
docker run \
  -e http_proxy=http://host.docker.internal:7890 \
  -e https_proxy=http://host.docker.internal:7890 \
  -e no_proxy=localhost,127.0.0.1,host.docker.internal \
  <image>
```

---

### npm / yarn / pnpm

Prefer one-off env injection.

```bash
http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 npm install
http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 yarn install
http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 pnpm install
```

Persistent config is optional, not default.

---

### pip

```bash
http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 pip install <package>
```

or

```bash
pip install --proxy http://127.0.0.1:7890 <package>
```

---

### apt

Prefer command-scoped usage if possible.

```bash
apt update -o Acquire::http::Proxy="http://127.0.0.1:7890"
apt install -o Acquire::http::Proxy="http://127.0.0.1:7890" -y <packages>
```

---

### git

Prefer one-off invocation when practical.

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 clone <repo>
```

Persistent config is optional, not default.

---

### curl / wget

```bash
curl -x http://127.0.0.1:7890 <url>
wget -e http_proxy=http://127.0.0.1:7890 <url>
```

For diagnosis:

```bash
curl -v -x http://127.0.0.1:7890 <url>
curl -I -x http://127.0.0.1:7890 <url>
```

---

## Failure Stage Classification

When an operation fails, classify the failure stage if possible.

Common stages:

- `proxy_not_listening`
- `proxy_protocol_unusable`
- `proxy_https_connect_failed`
- `dns_failed`
- `tcp_connect_failed`
- `tls_handshake_failed`
- `http_status_error`
- `proxy_auth_required`
- `tool_proxy_not_applied`
- `upstream_blocked_or_rate_limited`
- `unknown`

Do not report only "failed". Report the likely stage.

---

## Codex / OpenCode Notes

For tools like Codex or OpenCode, remember:

- shell env may not equal GUI env
- subprocesses may not inherit proxy env
- an API SDK may behave differently from curl
- a package manager may use its own proxy logic
- a GUI app may not follow shell exports

So this skill should be used as a **runtime diagnosis aid**, not as proof that all app-level traffic will behave the same.

---

## Structured Output Contract

When using this skill, the result should include:

1. `proxy_listener_detected`: yes / no
2. `proxy_http_probe`: ok / failed / skipped
3. `proxy_https_probe`: ok / failed / skipped
4. `target_probe`: ok / failed / skipped
5. `execution_mode`: direct / proxy_ephemeral / proxy_target_aware / mirror / debug
6. `likely_failure_stage`
7. `recommended_next_action`

Preferred response shape:

```json
{
  "proxy_listener_detected": true,
  "proxy_http_probe": "ok",
  "proxy_https_probe": "ok",
  "target_probe": "ok",
  "execution_mode": "proxy_target_aware",
  "likely_failure_stage": "none",
  "recommended_next_action": "run npm install with ephemeral proxy env"
}
```

---

## Verification

1. Verify local proxy listener detection
2. Verify HTTP proxy behavior
3. Verify HTTPS CONNECT behavior
4. Verify target-specific probing
5. Verify recommended execution mode is reasonable
6. Verify output includes failure stage classification
7. Verify examples prefer ephemeral injection over persistent config

---

## References

* [Proxy Configuration Patterns](./references/proxy-patterns.md)
* [Diagnosis Stages](./references/diagnosis-stages.md)
* [Target Probe Patterns](./references/target-probe-patterns.md)
* [Codex / OpenCode Notes](./references/codex-opencode-notes.md)

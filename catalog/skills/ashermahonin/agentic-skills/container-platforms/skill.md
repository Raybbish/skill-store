---
name: container-platforms
description: Use for Docker, BuildKit, Podman, Compose, OCI image builds, runtime behavior, registries, multi-stage Dockerfiles, image optimization, healthchecks, non-root execution, supply chain safety, and container troubleshooting.
---

# Container Platforms

## Role

You build and review container images and runtime definitions that are reproducible, lean enough, secure enough, and friendly to CI/CD and production schedulers.

## Start By

1. Read `references/workflow.md`.
2. Identify runtime/build tool, base image, app language, target environment, multi-arch needs, startup requirements, and security constraints.
3. Verify current Dockerfile, Compose, BuildKit, registry, OCI, and rootless/non-root documentation before implementation.

## Procedure

1. Classify the task: build-only, build-and-run, production image, dev image, compose stack, registry, or troubleshooting.
2. Design stages, dependency install order, runtime image, user model, file ownership, healthcheck, entrypoint, and cache behavior.
3. Implement with pinned base images where practical, `.dockerignore`, deterministic installs, non-root runtime, and signal-safe commands.
4. Validate build, run, healthcheck, image metadata, size, and vulnerability-scan path.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide container context, documentation validation status, Dockerfile/Compose changes, build/run commands, validation/security notes, and assumptions.

## Quality Bar

- Avoid `latest` in production examples.
- Do not copy secrets into images or build logs.
- Prefer multi-stage builds for compiled apps.
- Use exec-form entrypoints/commands for correct signal behavior.
- Explain tradeoffs between image size, debuggability, and security.

## Handoff

For pipeline integration, add `cicd-automation`. For Kubernetes deployment, add `kubernetes-operations`. For image scanning/signing/secrets, add `security-secrets`.

## References

- `references/workflow.md` for container design, security, performance, and validation.

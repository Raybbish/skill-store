---
name: api-deploy-workflow
description: >
  Guide deployments of API services through staging and production environments with
  health checks, rollback procedures, and verification steps. Triggers when user says
  "deploy API", "push to staging", "release to production", "rollback deployment",
  or discusses CI/CD pipelines for backend services.
  指导 API 服务的部署流程，涵盖 staging/production 环境、健康检查、回滚和验证。
allowed-tools: Read Bash Grep Glob Write
---

# API Deploy Workflow

Automate and standardize API service deployments across staging and production environments with built-in safety checks.

## When to Use

- User wants to deploy an API service to staging or production
- User needs to roll back a failed deployment
- User is setting up a deployment pipeline for a backend service
- User asks about blue-green or canary deployment strategies
- User mentions "deploy", "release", "rollback", "staging", "production" in the context of backend services

## When NOT to Use

- Frontend/static site deployments (different tooling: Vercel, Netlify, etc.)
- Database migrations without accompanying code changes (use a dedicated migration skill)
- Infrastructure provisioning (Terraform, Pulumi — different scope)
- Deploying ML models (different pipeline: model registry, A/B testing)

## Prerequisites

- Docker installed and configured
- `kubectl` or target platform CLI authenticated
- Container registry access (ECR, GCR, Docker Hub)
- Environment config files in place (see `references/environment-config.md`)

## Step-by-Step Workflow

### Phase 1: Pre-Deploy Validation

1. **Run tests**: Ensure all unit and integration tests pass
   ```bash
   npm test        # or pytest, go test, etc.
   ```
2. **Build container image**: Tag with git SHA for traceability
   ```bash
   docker build -t $REGISTRY/$SERVICE:$(git rev-parse --short HEAD) .
   ```
3. **Push image to registry**:
   ```bash
   docker push $REGISTRY/$SERVICE:$(git rev-parse --short HEAD)
   ```

### Phase 2: Deploy to Staging

4. **Update staging manifest** with new image tag
5. **Apply to staging cluster**:
   ```bash
   kubectl apply -f k8s/staging/ --namespace=staging
   ```
6. **Wait for rollout**:
   ```bash
   kubectl rollout status deployment/$SERVICE --namespace=staging --timeout=300s
   ```
7. **Run health check** against staging endpoint:
   ```bash
   python3 ${CLAUDE_SKILL_DIR}/scripts/health_check.py https://staging-api.example.com/health
   ```

### Phase 3: Staging Verification

8. **Smoke test**: Hit critical endpoints and verify responses
9. **Check logs** for errors in the first 5 minutes
10. **Compare metrics** (latency, error rate) against baseline

### Phase 4: Deploy to Production

11. **Get approval**: Confirm with the user before proceeding
12. **Apply to production cluster**:
    ```bash
    kubectl apply -f k8s/production/ --namespace=production
    ```
13. **Monitor rollout**:
    ```bash
    kubectl rollout status deployment/$SERVICE --namespace=production --timeout=300s
    ```
14. **Run production health check**:
    ```bash
    python3 ${CLAUDE_SKILL_DIR}/scripts/health_check.py https://api.example.com/health
    ```

### Phase 5: Post-Deploy

15. **Tag the release** in git:
    ```bash
    git tag -a v$VERSION -m "Release v$VERSION"
    git push origin v$VERSION
    ```
16. **Notify team** with deployment summary

## Input/Output Spec

- **Input**: Service name, target environment (staging/production), git ref or image tag
- **Output**: Deployed service with verified health, git tag, deployment summary

## Commands

| Command | Description |
|---------|-------------|
| `/api-deploy-workflow:deploy-staging` | Deploy to staging with health checks |
| `/api-deploy-workflow:deploy-prod` | Deploy to production (requires staging success) |
| `/api-deploy-workflow:rollback` | Roll back to previous stable version |

See `commands/` directory for detailed command definitions.

## Scripts

- `scripts/health_check.py` — HTTP health check with retry logic and timeout handling. See script for usage.

## Verification

After each deployment:
1. Health endpoint returns 200 with `{"status": "healthy"}`
2. No increase in error rate (5xx) over 5 minutes
3. p99 latency stays within 2x of pre-deploy baseline
4. All critical API endpoints respond correctly

## Edge Cases & Error Handling

| Scenario | Action |
|----------|--------|
| Health check fails after deploy | Automatic rollback via `/api-deploy-workflow:rollback` |
| Rollout timeout (>300s) | Abort and rollback, check pod events for crash loops |
| Registry push fails | Retry with exponential backoff; check auth tokens |
| Staging passes but production fails | Investigate env-specific config differences (see `references/environment-config.md`) |
| Partial rollout (some pods updated) | Use `kubectl rollout undo` to restore consistency |

## Examples

### Example 1: Standard Staging Deploy

**Input**: "Deploy the user-service to staging from the feature/auth-v2 branch"

**Execution**:
1. Checks out `feature/auth-v2`, runs tests — all pass
2. Builds `registry.example.com/user-service:a3f7b2c`
3. Pushes to registry
4. Updates staging manifest, applies to cluster
5. Health check passes: `{"status": "healthy", "version": "a3f7b2c"}`

**Output**: "user-service deployed to staging. Health check passed. Version: a3f7b2c. Ready for production deploy when you give the go-ahead."

### Example 2: Production Rollback

**Input**: "The API is returning 503s after the last deploy — roll back now"

**Execution**:
1. Identifies current deployment: `v2.4.1` (image tag `b8e2d1f`)
2. Finds previous stable version: `v2.4.0` (image tag `9c1a4e3`)
3. Runs `kubectl rollout undo deployment/user-service --namespace=production`
4. Monitors rollout, runs health check
5. Confirms error rate drops to baseline

**Output**: "Rolled back user-service from v2.4.1 to v2.4.0. Health check passed. Error rate normalized. Recommend investigating the v2.4.1 changes before re-deploying."

## References

- `references/environment-config.md` — Environment-specific configuration patterns and secrets management

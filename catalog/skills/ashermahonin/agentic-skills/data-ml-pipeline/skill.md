---
name: data-ml-pipeline
description: "Design and operate data and ML pipelines for any product: data sourcing, ingestion, schema management, transformation (batch and streaming), feature stores, dataset versioning, model training, evaluation, deployment, drift monitoring, retraining triggers, lineage, and reproducibility. Covers analytical data warehouses, lakehouse architectures, real-time streaming, embeddings/vector stores, and LLM fine-tune/RAG pipelines. Produces architecture, data contracts, validation plan, evaluation harness, deployment plan, and monitoring posture. Use whenever the product depends on data products, ML models, or LLM augmentation."
---

# Data / ML Pipeline

## Role

Be the responsible adult for data correctness, dataset provenance, and model lifecycle. Make sure data is sourced legally, schemas are versioned, transformations are reproducible, models are evaluated against drift, and retraining triggers are wired before the model ships.

## Start By

1. Read `references/data-ml-stages.md`.
2. Pull architecture context from `architecture-review`, platform matrix from `platform-detector`, security posture from `security-secrets` and `security-owasp-llm` (if LLM-using).
3. Classify the work: analytical warehouse, lakehouse, streaming, feature store, training pipeline, model serving, RAG, fine-tune, eval harness, monitoring.
4. Use Context7 MCP for current docs of: data warehouses (BigQuery, Snowflake, Redshift, ClickHouse), lakehouse (Delta, Iceberg, Hudi), orchestrators (Airflow, Dagster, Prefect), streaming (Kafka, Flink, Materialize), feature stores (Feast, Tecton), ML platforms (MLflow, Weights & Biases, Vertex AI, SageMaker), vector stores (Pinecone, pgvector, Qdrant, Weaviate), and LLM providers.

## Procedure

1. **Data contracts.** For each dataset: schema, owner, source, freshness SLA, quality SLA, PII fields, retention, access.
2. **Lineage.** Map upstream → transformations → downstream consumers. No orphan datasets.
3. **Quality gates.** Per dataset: schema check, row-count anomaly, null-rate threshold, distribution drift detector, referential integrity.
4. **Versioning.** Datasets and models versioned with reproducible build. Lock training data + code + hyperparameters per artifact.
5. **Evaluation harness.** Per model: train/val/test split policy, evaluation metrics, baseline, fairness audit, robustness probes (adversarial, distribution shift, missing fields).
6. **Deployment.** Canary or shadow deploy; rollback path; monitoring on prediction distribution; A/B test plan if user-facing.
7. **Drift monitoring.** Input drift, output drift, performance drift; retraining triggers.
8. **LLM-specific.** Embedding model pinned; RAG corpus provenance and refresh cadence; eval set per persona; offline + online eval; coordinate with `security-owasp-llm` for injection and disclosure risks.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current platform docs, model-card limitations, dataset license terms.
- Keep a decision trace: choice of warehouse/lakehouse/streaming, why; choice of orchestrator; choice of model; rejected options.
- Refuse to deploy a model without an evaluation harness, drift monitor, and retraining trigger.
- Escalate before processing PII, training on user-generated content, or fine-tuning on customer data without explicit consent and a documented retention policy.

## Output Artifacts

- Data flow diagram (sources, transforms, consumers)
- Data contracts (schema, freshness, quality, PII, retention)
- Quality-gate definitions per dataset
- Evaluation harness with baseline metrics
- Deployment plan with rollback and shadow/canary
- Drift-monitoring posture and retraining triggers
- LLM-specific: RAG corpus provenance, eval set, refresh cadence

## Quality Bar

- No undocumented dataset in production.
- No model deployed without evaluation harness, drift monitor, retraining trigger.
- No PII processed without retention policy and access control.
- No training run without a versioned, reproducible build.
- No LLM-driven product feature without an eval set ≥ 30 representative prompts.

## Handoff

Hand off to `service-implementation` for code, `infrastructure-as-code` for storage/streaming, `cve-zero-day-scanner` for dependency feeds, `security-owasp-llm` / `-agentic` for LLM features, `qa-eval` for eval gates.

## References

- `references/data-ml-stages.md`: pipeline stages, evaluation methods, drift detection, LLM-specific patterns.

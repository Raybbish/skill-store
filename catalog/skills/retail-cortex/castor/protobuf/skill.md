---
name: protobuf
description: Protocol Buffers and gRPC engineering standards for Castor, covering schema design, modular schema composition, cross-language generation, backward compatibility, MDD, and Bazel rules.
license: Apache-2.0
author: Ryan McGuinness
version: "1.0.0"
metadata:
  author: Ryan McGuinness
  version: "1.0.0"
authors:
  - name: Retail Cortex Engineering
    url: https://github.com/retail-cortex/castor
category: protobuf
tags:
  - protobuf
  - proto3
  - grpc
  - mdd
  - code-generation
  - schema-design
trigger_phrases:
  - "design protobuf schema"
  - "compile proto stubs"
  - "generate proto diagrams"
  - "proto wire compatibility"
execution_hints:
  preferred_model: "gemini-3.8-flash"
  requires_human_approval: false
  environment_variables: []
  timeout_seconds: 180
---

# Protocol Buffers Engineering Guide & Best Practices

Protocol Buffers (`proto/castor/`) serve as the canonical **Model-Driven Development (MDD)** contract across all Castor services, CLI binaries, and polyglot SDKs.

---

## 1. Model-Driven Development (MDD) as Single Source of Truth

* **Canonical Schemas**:
  - `proto/castor/skills/v1/`: Skill manifests, tool definitions, execution schemas, and vector index bindings.
  - `proto/castor/registration/v1/`: Application registrations, API keys, developer identity, and access scopes.
* **Hermetic Bazel Compilation**:
  - Code generation across Go, Python, and Java is driven entirely by Bazel rules:
    ```bash
    bazel build //proto/castor/...
    ```
  - **Never** install or run system `protoc` manually. Bazel manages the hermetic Protobuf 33.4 toolchain via `rules_proto`.
* **Visual Architecture Generation**:
  - Generate visual entity-relationship diagrams from proto definitions:
    ```bash
    bazel run //:diagrams
    ```

---

## 2. Object-Oriented & Modular Schema Design

Protocol Buffers achieve Object-Oriented and Modular modeling through message composition, encapsulation, package namespacing, and polymorphism with `oneof`.

### 1. Message Composition Over Monolithic Types
* **Decompose Complex Schemas**: Build modular, nested structures rather than flat, repetitive messages:
  ```protobuf
  message SkillManifest {
    SkillMetadata metadata = 1 [json_name = "metadata"];
    SkillSecurityConfig security = 2 [json_name = "security"];
    repeated ToolDefinition tools = 3 [json_name = "tools"];
    VectorIndexBinding index_binding = 4 [json_name = "index_binding"];
  }

  message SkillMetadata {
    string id = 1 [json_name = "id"];
    string name = 2 [json_name = "name"];
    string version = 3 [json_name = "version"];
    string description = 4 [json_name = "description"];
  }
  ```

### 2. Polymorphism via `oneof`
* Model polymorphic behavior explicitly rather than using generic strings or untyped bytes:
  ```protobuf
  message SkillSource {
    oneof source_type {
      RemoteRegistrySource remote = 1 [json_name = "remote"];
      GitRepositorySource git = 2 [json_name = "git"];
      LocalDirectorySource local = 3 [json_name = "local"];
      ManifestLockSource lockfile = 4 [json_name = "lockfile"];
    }
  }
  ```
  Generated code in Go, Python, and Java yields type-safe pattern matching and algebraic data types.

### 3. Modular Package Namespacing & Imports
* **Semantic Versioned Packages**:
  ```protobuf
  syntax = "proto3";

  package castor.skills.v1;

  import "proto/castor/common/v1/types.proto";
  ```
* **Bounded Contexts**: Keep schema domains separated into cohesive folders:
  - `skills/v1`: Core skill manifest and tool specification.
  - `registration/v1`: Tenant, developer, and application authentication.

---

## 3. Schema Design & Style Guide (Google API Conventions)

1. **Naming Conventions**:
   - Files: `snake_case.proto` (e.g., `skill_service.proto`).
   - Packages: Lowercase with version suffix: `package castor.skills.v1;`.
   - Messages: `CamelCase` (e.g., `SkillRegistrationRequest`, `UserProfile`).
   - Fields: `snake_case` (e.g., `user_name`, `vector_dimension`, `execution_timeout_ms`).
   - Enums: `CamelCase` with `TYPE_PREFIX_` (e.g., `EMBEDDING_TYPE_UNSPECIFIED = 0;`).

2. **Field Naming & JSON Serialization (`json_name`)**:
   - Messages **MUST** prefer `snake_case` for all field names.
   - All fields **MUST** be explicitly annotated with `[json_name = "field_name"]`:
     ```protobuf
     message UserProfile {
       string user_name = 1 [json_name = "user_name"];
       string display_name = 2 [json_name = "display_name"];
       string email_address = 3 [json_name = "email_address"];
       int64 created_at_ms = 4 [json_name = "created_at_ms"];
     }
     ```
   - **Rationale**: By default, Protobuf3 compilers convert `snake_case` field names to `camelCase` (e.g. `user_name` -> `userName`) when serializing to JSON. Annotating `[json_name = "user_name"]` guarantees that JSON representations remain strictly `snake_case` across Go (`protojson`), Python (`MessageToDict`), Java (`JsonFormat`), REST APIs, and database columns.

3. **Zero Value Conventions**:
   - Always define the 0 enum value as `_UNSPECIFIED` to handle uninitialized fields cleanly:
     ```protobuf
     enum EmbeddingProvider {
       EMBEDDING_PROVIDER_UNSPECIFIED = 0;
       EMBEDDING_PROVIDER_VERTEX_AI = 1;
       EMBEDDING_PROVIDER_ALLOYDB_AI = 2;
     }
     ```

4. **Units in Field Names**:
   - Explicitly annotate duration and size units in field names:
     - `timeout_seconds`, `retry_delay_ms`, `max_payload_bytes`.

---

## 4. Backward & Forward Compatibility Rules

1. **Never Change Field Numbers**:
   - Field numbers cannot be reassigned once merged.
2. **Never Remove Fields Without Reserving**:
   - If a field is deprecated and removed, mark its tag and name as `reserved`:
     ```protobuf
     message SkillManifest {
       reserved 4, 7 to 9;
       reserved "legacy_token", "deprecated_hash";
       string name = 1 [json_name = "name"];
       string version = 2 [json_name = "version"];
       string description = 3 [json_name = "description"];
     }
     ```
3. **Additive Changes Only**:
   - New fields must always be optional (the default in proto3).
   - Never introduce required semantics that break older polyglot clients.

---

## 5. Secure Serialization & Wire Safety

1. **Payload Size Limits (DoS Mitigation)**:
   - Enforce bounded message deserialization sizes on the server:
     - Default maximum: 4 MB for skill manifests, 32 MB for binary WASM/bundle uploads.
2. **Recursive Depth Bounds**:
   - Set max recursion depth to prevent stack overflow during nested message parsing.
3. **Input Validation**:
   - Validate field contents (e.g., non-empty strings, regex for skill names, valid semantic version strings) immediately upon deserialization before passing to domain services.

---

## 6. Castor Proto Layout & Generated Bazel Targets

### Active Schema Inventory:
* **`proto/castor/skills/v1/`**:
  - `manifest.proto`: Manifest locking, metadata, dependencies, checksums.
  - `skill.proto`: Core skill definition, tool schemas, parameter types.
  - `skill_service.proto`: gRPC service for registration, search, and retrieval.
* **`proto/castor/registration/v1/`**:
  - `registration_service.proto`: Developer login, app creation, API key generation.

### Concrete Polyglot Bazel Targets:
```bash
# Skills v1 Stubs:
bazel build //proto/castor/skills/v1:skills_v1_go_proto    # Go
bazel build //proto/castor/skills/v1:skills_v1_py_proto    # Python
bazel build //proto/castor/skills/v1:skills_v1_java_proto  # Java

# Registration v1 Stubs:
bazel build //proto/castor/registration/v1:registration_v1_go_proto   # Go
bazel build //proto/castor/registration/v1:registration_v1_py_proto   # Python
bazel build //proto/castor/registration/v1:registration_v1_java_proto # Java
```

---

## 7. Wire Compatibility Matrix

| Action | Binary Safe? | JSON Safe? | Generated Code Safe? | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Add optional field** | Yes | Yes | Yes | Assign new unique tag number. |
| **Delete field** | Yes | Yes | Breaking | Mark tag and name as `reserved`. |
| **Rename field** | Yes | Breaking | Breaking | Avoid unless major version bump. |
| **Change field number** | Breaking | Breaking | Breaking | **NEVER DO THIS**. |
| **Singular to `repeated`** | Breaking | Breaking | Breaking | Create a new field instead. |
| **`int32` to `int64`** | Yes | Yes | Breaking | Requires updating consuming client types. |


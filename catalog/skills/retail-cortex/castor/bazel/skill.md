---
name: bazel
description: Expert Bazel 8 and Bzlmod guide for hermetic multi-language builds, dependency management, Gazelle automation, test execution, coverage, and CI/CD integrity in Castor.
license: Apache-2.0
author: Ryan McGuinness
version: "1.0.0"
metadata:
  author: Ryan McGuinness
  version: "1.0.0"
authors:
  - name: Retail Cortex Engineering
    url: https://github.com/retail-cortex/castor
category: bazel
tags:
  - bazel
  - bzlmod
  - build-system
  - hermetic
  - monorepo
  - gazelle
trigger_phrases:
  - "configure Bazel build"
  - "manage Bzlmod dependencies"
  - "run Gazelle synchronization"
  - "execute hermetic test suite"
execution_hints:
  preferred_model: "gemini-3.8-flash"
  requires_human_approval: false
  environment_variables:
    - BAZEL_NO_APPLE_CPP_TOOLCHAIN
  timeout_seconds: 300
---

# Bazel Engineering Guide & Best Practices

Bazel 8 (`.bazelversion: 8.0.0`) with Bzlmod (`MODULE.bazel`) is the canonical, hermetic build system for the Castor platform.

---

## 1. Golden Rule of Hermeticity

1. **Zero Host Tool Execution**:
   - **NEVER** run host `go`, `gofmt`, or `go test` directly. Use the hermetic runner: `bazel run go -- ...` (aliased in `BUILD.bazel` to `@rules_go//go`).
   - **NEVER** run `uv`, `pip`, or host `python` directly. Run tests and builds via `bazel test //clients/python:...` and `bazel build //clients/python:...`.
   - **NEVER** run `mvn` or `maven` directly. Run tests and builds via `bazel test //clients/java:...` and `bazel build //clients/java:...`.
   - **NEVER** run `make` or invoke `Makefile` under any circumstances.
2. **Deterministic Sandboxing**:
   - Every action executes in a sandbox (`darwin-sandbox` or `linux-sandbox`).
   - No undeclared outputs, ambient environment variables, or undeclared network calls during build actions.

---

## 2. Bzlmod Architecture (`MODULE.bazel`)

Castor uses Bzlmod for all external module resolution:

* **Go (`rules_go` & `gazelle`)**:
  - Configured with Go SDK 1.26.5.
  - Go dependencies are imported from `go.mod` using `go_deps.from_file(go_mod = "//:go.mod")`.
  - Modenv override: `go_deps.gazelle_override(path = "github.com/rrmcguinness/modenv", build_file_generation = "clean")`.
* **Python (`rules_python`)**:
  - Toolchain pinned to Python 3.13 (`python.toolchain(python_version = "3.13")`).
* **Java (`rules_java`, `rules_jvm_external`, `contrib_rules_jvm`)**:
  - Toolchain pinned to Java 21.
  - Maven dependencies resolved via `maven.install(artifacts = [...])`.
* **Protocol Buffers (`rules_proto`, `protobuf`)**:
  - Pinned to `rules_proto` 7.1.0 and `protobuf` 33.4 for polyglot stub generation.
* **Hugo (`rules_hugo`)**:
  - Custom git override with `patches/rules_hugo_data_dir.patch` for Geekdoc documentation site rendering.
* **macOS CLI Compatibility (`apple_support`)**:
  - Pinned single version override to 1.11.1 to bypass Xcode detection crashes on macOS 15 CLI/SSH environments.
  - `.bazelrc` defines `BAZEL_NO_APPLE_CPP_TOOLCHAIN=1`.

---

---

## 3. Gazelle & Bzlmod Dependency Workflow

### Adding New Go Dependencies
When introducing a new external Go package, follow the 4-step Bzlmod ingestion workflow:
1. **Fetch Dependency Hermetically**:
   ```bash
   bazel run go -- get github.com/foo/bar@v1.2.3
   ```
2. **Prune and Tidy `go.mod`**:
   ```bash
   bazel run go -- mod tidy
   ```
3. **Synchronize Build Targets via Gazelle**:
   ```bash
   bazel run //:gazelle
   ```
4. **Register in `MODULE.bazel` (`use_repo`)**:
   - If Bazel errors with `no such repo @com_github_foo_bar`, you must explicitly register the repo in `MODULE.bazel`:
     ```bzl
     use_repo(
         go_deps,
         "com_github_foo_bar",
         # ... existing repos
     )
     ```

### Adding New Java Maven Dependencies
Add the Maven artifact coordinate to the `maven.install` call in `MODULE.bazel`:
```bzl
maven.install(
    artifacts = [
        "com.google.guava:guava:33.0.0-jre",
        # ...
    ],
)
```

---

## 4. Testing, TDD, Coverage & Test Filtering

Run tests hermetically using Bazel's test runner:

```bash
# Run all unit and integration tests across all languages
bazel test //...

# Run the end-to-end multi-language test suite
bazel test //:test-e2e

# Run tests for specific language packages
bazel test //cmd/... //pkg/... //internal/... # Go
bazel test //clients/python:...              # Python
bazel test //clients/java:...                # Java
bazel test //docs:site_test                  # Documentation

# Filter to a single test function/method (crucial for rapid TDD loops):
bazel test //clients/go/pkg/castor_client:castor_client_test --test_filter="TestSuggestSkills"
bazel test //clients/python:test_castor_client --test_filter="test_skill_manifest_validation"
bazel test //clients/java:castor_client_java_test --test_filter="CastorClientTest#should*"

# Stream test failures and logs directly to terminal on failure:
bazel test //... --test_output=errors

# Generate code coverage (LCOV format):
bazel coverage //... --test_tag_filters=-no-ci,-integration,-manual
```

### Test Tagging Conventions:
* `small`: Pure unit tests with zero I/O or network dependencies (default).
* `medium`: Integration tests spinning up SQLite or local in-memory fixtures.
* `no-ci`: Tests excluded from headless automated CI pipelines.
* `integration`: Long-running or external service tests.

---

## 5. Running CLI & Server Binaries (The `--` Argument Delimiter)

When running executables via `bazel run`, you **MUST** separate Bazel flags from application arguments using `--`:

```bash
# CORRECT: Arguments after '--' are forwarded to the executable
bazel run //cmd/cstr -- validate ./examples/skills/testing/multi-content-suite/examples
bazel run //cmd/cstr -- search "canvas" -r -p 1 -n 5
bazel run go -- fmt ./...

# INCORRECT: Flags before '--' are consumed by Bazel itself
bazel run //cmd/cstr validate ./skills # FAILS: Bazel treats 'validate' as a target
```

---

## 6. Modular Build Architecture & Target Encapsulation

Bazel enforces structural modularity at the compiler and linker level via explicit Directed Acyclic Graphs (DAGs).

### 1. Fine-Grained Target Granularity
* **Cohesive Library Targets**: Split codebases into focused, single-purpose library targets (`go_library`, `py_library`, `java_library`) rather than large monolithic packages:
  ```bzl
  # Clean, cohesive library target
  go_library(
      name = "service",
      srcs = [
          "apps_service.go",
          "service.go",
      ],
      importpath = "github.com/retail-cortex/castor/pkg/service",
      deps = [
          "//pkg/data",
          "//pkg/model",
      ],
  )
  ```
* **Benefits**: Maximizes incremental build caching, parallelizes test execution across cores, and immediately identifies circular dependencies.

### 2. Visibility & Encapsulation
* **Default Private Visibility**: Keep implementation details private to their defining package:
  ```bzl
  package(default_visibility = ["//visibility:private"])
  ```
* **Explicit Public Facades**: Export only intended public API boundaries or allowlist specific consumer packages:
  ```bzl
  alias(
      name = "castor-client",
      actual = "//clients/go:castor-client",
      visibility = ["//visibility:public"],
  )
  ```

### 3. Layered Architectural Enforcement
* The build graph strictly mirrors the software architecture:
  ```text
  cmd/ (binaries)
    ↓
  pkg/service/ (orchestration)
    ↓
  pkg/data/ (persistence)
    ↓
  pkg/model/ & proto/ (contracts & entities)
  ```
* Bazel guarantees that low-level layers (`pkg/model`, `proto/`) cannot accidentally import high-level layers (`cmd/`), preventing architectural degradation.

---

## 7. DRY & KISS Build Patterns

1. **Root Aliases**:
   - Provide clean top-level entrypoints in `BUILD.bazel`:
     - `//:go` -> `@rules_go//go`
     - `//:castor-server` -> `//cmd/castor_server`
     - `//:cstr` -> `//cmd/cstr`
     - `//:validate` -> `//cmd/cstr`
     - `//:docs` -> `//docs:serve`
     - `//:diagrams` -> `//tools/proto_diagrams`
2. **Shared Filegroups**:
   - Use centralized `filegroup` targets (such as `//:skills_data`) rather than duplicating `glob` statements across multiple client build files.

---

## 8. Multithreading, Parallel Action Execution & Worker Strategies

Bazel natively achieves massive parallelism by executing independent actions across all available CPU cores concurrently while strictly preventing race conditions through filesystem sandboxing.

### 1. Action Concurrency & Graph Parallelism
* **Fine-Grained Actions**: Because Bazel models dependencies as a Directed Acyclic Graph (DAG), independent compilation units (e.g., compiling Go packages, building proto stubs, running unit tests) execute concurrently up to `--jobs` (defaults to host core count).
* **Maximize Concurrency via Small Targets**:
  - Keep targets small and granular. A single large target forces single-threaded sequential execution, creating a critical path bottleneck.

### 2. Persistent & Multiplex Workers
* **Eliminate JVM & Tool Warmup Overhead**:
  - Compilers like Java and Protobuf use persistent workers that stay alive across build steps:
    ```bzl
    # Workers allow hot-JIT compilation without repeatedly launching JVMs
    --strategy=JavaCompile=worker
    ```
  - Multiplex workers process multiple concurrent build actions simultaneously within a single long-lived daemon process.

### 3. Hermetic Sandboxing for Race-Free Parallel Testing
* **Zero Inter-Test Pollution**:
  - Every test runs in an isolated sandbox directory (`darwin-sandbox` or `linux-sandbox`).
  - Tests cannot accidentally collide on temporary filenames, ports, or cached state, allowing `bazel test //...` to run dozens of test targets concurrently with total determinism.
* **Test Sharding for Long-Running Suites**:
  - For large test suites, split execution across parallel processes using `shard_count`:
    ```bzl
    go_test(
        name = "data_test",
        srcs = ["data_test.go"],
        shard_count = 4, # Splits tests into 4 parallel test runners
        deps = [":data"],
    )
    ```

---

## 9. Secure Build Standards

* **No Ambient Secrets**: Never read secrets, tokens, or private credentials during Bazel analysis or execution phases. Use `--action_env` or runtime `.env.toml` files loaded at service execution time.
* **Deterministic Artifacts**: All binaries and JARs generated in `bazel-bin/` must have deterministic timestamps and SHA-256 checksums.



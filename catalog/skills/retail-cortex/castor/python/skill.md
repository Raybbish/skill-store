---
name: python
description: Modern Python 3.13 engineering standards for Castor Client SDK, PEP 517 build backend, and Google ADK agent integration, enforcing hermetic Bazel execution, secure coding, and TDD.
license: Apache-2.0
author: Ryan McGuinness
version: "1.0.0"
metadata:
  author: Ryan McGuinness
  version: "1.0.0"
authors:
  - name: Retail Cortex Engineering
    url: https://github.com/retail-cortex/castor
category: python
tags:
  - python
  - python-3-13
  - google-adk
  - pep-517
  - asyncio
  - jit-retrieval
trigger_phrases:
  - "develop Python client"
  - "configure PEP 517 build hook"
  - "run Google ADK agent"
  - "Python hermetic test"
execution_hints:
  preferred_model: "gemini-3.8-flash"
  requires_human_approval: false
  environment_variables:
    - PYTHONPATH
  timeout_seconds: 300
---

# Python Engineering Guide & Best Practices

Python 3.13 powers the Castor Client SDK (`clients/python`), the PEP 517 build hook backend (`castor_client.build_meta`), and the Google Agent Development Kit (ADK) integration runtime (`tests/adk-agent`).

---

## 1. Hermetic Execution (Strict Bazel Execution)

* **NEVER run `uv`, `pip`, or host `python` directly from the shell.**
* All builds, dependencies, and test executions must route strictly through Bazel:
  ```bash
  # Run all Python client, loader, and example tests:
  bazel test //clients/python:... //tests/adk-agent:... //examples/python/...

  # Test individual targets:
  bazel test //clients/python:test_castor_client
  bazel test //clients/python:test_build_meta
  bazel test //tests/adk-agent:test_agent

  # Filter to a specific test function with immediate terminal failure logs:
  bazel test //clients/python:test_castor_client --test_filter="test_skill_manifest_validation" --test_output=errors

  # Build the Python client library:
  bazel build //clients/python:castor_client

  # Run the ADK skills agent:
  bazel run //tests/adk-agent:start_agent
  ```
* Bazel manages hermetic Python 3.13 via `rules_python` configured in `MODULE.bazel`.

---

## 2. Modern Python 3.13 Standards & Architecture

1. **Type Annotations & Modern Syntax**:
   - Use built-in generics (`list[str]`, `dict[str, Any]`, `X | None` union syntax).
   - Use `@dataclass(frozen=True)` or `typing.NamedTuple` for immutable domain models:
     ```python
     from dataclasses import dataclass

     @dataclass(frozen=True)
     class SkillDescriptor:
         name: str
         version: str
         description: str
         tags: tuple[str, ...] = ()
         score: float = 0.0
     ```

2. **JIT Dynamic Pre-Call Retrieval (Google ADK Integration)**:
   - Client SDK and Google ADK agents query the semantic index on incoming prompts before calling tools:
     ```python
     from castor_client import SkillRegistry

     registry = SkillRegistry(server_url="http://localhost:8000")
     # Constrain injected tools to top <= 3 ranked skills to eliminate tool bleed and conserve context window tokens
     suggested_skills = registry.suggest_skills(prompt=user_prompt, max_skills=3)
     ```
   - Falls back gracefully to local directory discovery if the central server is unreachable.

3. **PEP 517 Build Backend Hook (`castor_client.build_meta`)**:
   - Allows packages to declare in their `pyproject.toml`:
     ```toml
     [build-system]
     requires = ["castor-client", "setuptools>=61.0"]
     build-backend = "castor_client.build_meta"
     ```
   - Intercepts `build_wheel` and `build_sdist` hooks to:
     1. Read skill URIs from project configuration.
     2. Download, unpack, and validate skill checksums against `.manifest.lock`.
     3. Bundle zero-I/O pre-compiled `skills_manifest.json` into the distribution package.

---

## 3. Secure Coding Practices

1. **Path Traversal & Zip Slip Prevention (CWE-22)**:
   - When resolving or extracting skills from packages:
     ```python
     import os
     from pathlib import Path

     def safe_resolve_path(base_dir: Path, rel_path: str) -> Path:
         resolved = (base_dir / rel_path).resolve()
         if not resolved.is_relative_to(base_dir.resolve()):
             raise PermissionError(f"Path traversal attempt: {rel_path}")
         return resolved
     ```

2. **No Dynamic Code Evaluation**:
   - Never use `eval()`, `exec()`, or unpickling (`pickle.loads`) on skill manifests or payload metadata. Use standard `json.loads` or safe YAML loaders.

3. **Subprocess Invocation Security**:
   - Avoid `subprocess.run(..., shell=True)`. Always pass commands as a list of argument tokens.

4. **Human-in-the-Loop (HITL) Policy Gates**:
   - Always verify interactive approvals before triggering tools with filesystem, network, or credential side effects:
     ```python
     from castor_client.hitl import verify_hitl_approval

     if not verify_hitl_approval(action="deploy_skill", details={"skill": skill.name}):
         raise PermissionError("Action aborted by HITL policy gate")
     ```

---

## 4. Test-Driven Development (TDD) & Testing

Write hermetic tests that do not rely on ambient network state or host files:

```python
import pytest
from castor_client.types import SkillManifest

def test_skill_manifest_validation():
    manifest = SkillManifest(
        name="retail-checkout",
        version="1.0.0",
        description="Handles cart checkout workflows"
    )
    assert manifest.name == "retail-checkout"
    assert manifest.version == "1.0.0"

def test_skill_manifest_invalid_name():
    with pytest.raises(ValueError, match="Invalid skill name"):
        SkillManifest(
            name="../invalid/path",
            version="1.0.0",
            description="Bad name"
        )
```

* Execute tests hermetically via Bazel:
  ```bash
  bazel test //clients/python:test_castor_client
  ```

---

## 5. Object-Oriented & Modular Design in Python

Python 3.13 development in Castor emphasizes structural subtyping via Protocols, clean modular encapsulation, and composition over deep inheritance.

### 1. Structural Subtyping & Dependency Inversion (`typing.Protocol`)
* **Interface Segregation with Protocols**: Use runtime-checkable or static Protocols to decouple consumers from concrete implementations:
  ```python
  from typing import Protocol, runtime_checkable
  from pathlib import Path

  @runtime_checkable
  class SkillLoaderProtocol(Protocol):
      def load(self, source_path: Path) -> SkillManifest:
          """Loads and parses a skill manifest from disk."""
          ...

  class RemoteRegistryProtocol(Protocol):
      def search(self, query: str, limit: int = 5) -> list[SkillDescriptor]:
          """Queries remote semantic search index."""
          ...
  ```
* **Dependency Injection**: Accept Protocol interfaces in constructors (`SkillRegistry(loader: SkillLoaderProtocol, ...)`), allowing straightforward injection of test doubles without monkey-patching.

### 2. Composition Over Inheritance
* **Immutable Domain Entities**: Use frozen dataclasses with `slots=True` to prevent arbitrary attribute assignment and memory bloat:
  ```python
  @dataclass(frozen=True, slots=True)
  class SkillPackage:
      manifest: SkillManifest
      entrypoint: Path
      checksum: str

      def verify(self) -> bool:
          return calculate_sha256(self.entrypoint) == self.checksum
  ```
* **Avoid Deep Hierarchies**: Never subclass beyond 1 level of abstraction. Compose behavior using helper strategies (e.g., separate URI resolvers, hashers, and network clients).

### 3. Encapsulation & Information Hiding
* **Explicit Private APIs**: Use leading underscores (`_private_method`, `_cache`) for all internal state and helper functions.
* **Property Validation**: Use `@property` getters and setters to protect invariants:
  ```python
  class SkillRegistry:
      def __init__(self, server_url: str):
          self._server_url = server_url.rstrip("/")
          self._cache: dict[str, SkillManifest] = {}

      @property
      def server_url(self) -> str:
          return self._server_url
  ```

### 4. Modular Module & Package Architecture
* **Strict Public Exports via `__all__`**:
  Expose only intended public types in `clients/python/src/castor_client/__init__.py`:
  ```python
  __all__ = [
      "SkillRegistry",
      "SkillManifest",
      "SkillDescriptor",
      "CastorError",
  ]
  ```
* **Cohesive Module Boundaries**:
  - `types.py`: Pure value types, dataclasses, and protocols.
  - `discovery.py`: Local and remote search and ranking algorithms.
  - `compiler.py`: Pre-compilation and JSON manifest bundling.
  - `hitl.py`: Human-in-the-Loop policy verification gates.
  - `build_meta.py`: Standalone PEP 517 build backend hooks.

---

## 6. Multithreading, Asynchronous & Parallel Execution

Python 3.13 provides both `asyncio` for non-blocking I/O and `concurrent.futures` for multi-threaded and multi-process parallelism.

### 1. Structured Asynchronous Concurrency (`asyncio.TaskGroup`)
* **TaskGroup over `asyncio.gather`**: Use `asyncio.TaskGroup()` (introduced in Python 3.11) for structured concurrency. If one task fails, all remaining sibling tasks are cancelled automatically:
  ```python
  import asyncio

  async def fetch_all_skill_metadata(uris: list[str]) -> list[SkillDescriptor]:
      results: list[SkillDescriptor] = []
      async with asyncio.TaskGroup() as tg:
          tasks = [tg.create_task(fetch_metadata(uri)) for uri in uris]
      
      return [t.result() for t in tasks]
  ```
* **Bounded Concurrency with `asyncio.Semaphore`**:
  - Always constrain concurrent network requests to prevent connection exhaustion or 429 rate limiting:
    ```python
    async def bounded_fetch(sem: asyncio.Semaphore, uri: str) -> SkillDescriptor:
        async with sem:
            return await fetch_metadata(uri)

    sem = asyncio.Semaphore(5) # Max 5 parallel requests
    ```

### 2. CPU-Bound vs I/O-Bound Execution (Bypassing the GIL)
* **Offload Blocking I/O**: Use `asyncio.to_thread` to run legacy synchronous disk or network calls without stalling the async event loop:
  ```python
  content = await asyncio.to_thread(path.read_text, encoding="utf-8")
  ```
* **CPU-Bound Multi-Processing**: Use `ProcessPoolExecutor` for computationally intensive tasks (e.g., computing SHA-256 digests over large directory trees, parsing massive ASTs) to bypass Python's Global Interpreter Lock (GIL):
  ```python
  from concurrent.futures import ProcessPoolExecutor

  def verify_checksums_parallel(file_paths: list[Path]) -> dict[Path, str]:
      with ProcessPoolExecutor() as executor:
          results = executor.map(calculate_file_hash, file_paths)
          return dict(zip(file_paths, results))
  ```

### 3. Thread-Safe In-Memory Caches
* When using threads (`ThreadPoolExecutor`), protect mutable shared state using `threading.Lock()`:
  ```python
  import threading

  class ThreadSafeSkillCache:
      def __init__(self):
          self._lock = threading.Lock()
          self._cache: dict[str, SkillDescriptor] = {}

      def get(self, key: str) -> SkillDescriptor | None:
          with self._lock:
              return self._cache.get(key)

      def set(self, key: str, value: SkillDescriptor) -> None:
          with self._lock:
              self._cache[key] = value
  ```

---

## 7. KISS & DRY Principles

1. **Minimal Surface Area**:
   - Keep `castor_client` lightweight and decoupled from heavy ML dependencies. Embeddings are computed by the server or pluggable providers.
2. **Model-Driven Development (MDD)**:
   - Map Protobuf contracts generated by Bazel (`proto/castor/skills/v1`) directly into client domain types.
3. **Explicit Error Hierarchies**:
   - Define domain-specific exceptions: `CastorError`, `SkillNotFoundError`, `ManifestLockError`, `SecurityViolationError`.



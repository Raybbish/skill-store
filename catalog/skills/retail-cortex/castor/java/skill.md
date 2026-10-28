---
name: java
description: Enterprise Java 21 development standards for Castor Client SDK and Maven plugins, covering Bazel hermetic builds, JUnit 5 TDD, secure coding, and clean architecture.
license: Apache-2.0
author: Ryan McGuinness
version: "1.0.0"
metadata:
  author: Ryan McGuinness
  version: "1.0.0"
authors:
  - name: Retail Cortex Engineering
    url: https://github.com/retail-cortex/castor
category: java
tags:
  - java
  - java-21
  - virtual-threads
  - junit-5
  - maven-plugin
  - client-sdk
trigger_phrases:
  - "develop Java client"
  - "implement Maven plugin mojo"
  - "Java JUnit 5 TDD"
  - "Java virtual threads"
execution_hints:
  preferred_model: "gemini-3.8-flash"
  requires_human_approval: false
  environment_variables:
    - JAVA_HOME
  timeout_seconds: 300
---

# Java Engineering Guide & Best Practices

Java 21 powers the enterprise Castor Client SDK (`clients/java`) and its build-time integration plugins.

---

## 1. Hermetic Execution (Strict Bazel Execution)

* **NEVER run `mvn` or `maven` directly on the host.**
* All builds, dependencies, and test executions must route strictly through Bazel:
  ```bash
  # Run all Java unit and integration tests:
  bazel test //clients/java:... //examples/java/...

  # Test individual targets:
  bazel test //clients/java:castor_client_java_test

  # Filter to a specific test method:
  bazel test //clients/java:castor_client_java_test --test_filter="CastorClientTest#should*"

  # Build client library JAR:
  bazel build //clients/java:skills_loader_java
  bazel build //clients/java:castor_client_java
  ```
* **Bytecode Compatibility**: The Java toolchain executes on Java 21 JDK, but targets `--release 17` in `BUILD.bazel` javacopts (`javacopts = ["--release", "17"]`) ensuring compatibility with Java 17+ enterprise runtimes.
* External Maven dependencies are declared and managed hermetically in `MODULE.bazel` via `rules_jvm_external`.

---

## 2. Modern Java 21 Standards

1. **Records for Immutable Data Carriers**:
   - Use records for DTOs, API request/response payloads, and skill metadata:
     ```java
     public record SkillMetadata(
         String name,
         String version,
         String description,
         List<String> tags
     ) {
         public SkillMetadata {
             Objects.requireNonNull(name, "skill name must not be null");
             Objects.requireNonNull(version, "skill version must not be null");
             tags = List.copyOf(tags != null ? tags : List.of());
         }
     }
     ```

2. **Pattern Matching & Sealed Types**:
   - Use pattern matching for `switch` and `instanceof` to avoid verbose type casting:
     ```java
     public String describeUri(SkillUri uri) {
         return switch (uri) {
             case SkillUri.Remote remote -> "Remote skill: " + remote.host();
             case SkillUri.Local local -> "Local path: " + local.path();
             case SkillUri.Lockfile lock -> "Manifest lock: " + lock.digest();
         };
     }
     ```

3. **Immutability by Default**:
   - Return unmodifiable collections using `List.copyOf()`, `Set.copyOf()`, or `Collections.unmodifiableList()`.

---

## 3. Secure Coding Practices

1. **Safe Deserialization (Jackson & SnakeYAML)**:
   - Always disable default typing in Jackson to prevent remote code execution vulnerabilities:
     ```java
     ObjectMapper mapper = new ObjectMapper()
         .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
     ```
   - For SnakeYAML, always use `SafeConstructor`:
     ```java
     Yaml yaml = new Yaml(new SafeConstructor(new LoaderOptions()));
     ```

2. **Path Traversal Prevention (CWE-22)**:
   - When extracting or loading skill directories:
     ```java
     Path target = destinationDir.resolve(entryName).normalize();
     if (!target.startsWith(destinationDir)) {
         throw new SecurityException("Zip slip / path traversal detected: " + entryName);
     }
     ```

3. **SSRF & HTTP Request Bounding**:
   - Use Java 11+ `java.net.http.HttpClient` with explicit connect and request timeouts.
   - Restrict protocol schemes to `http` and `https` when fetching remote registries.

4. **HTTP 429 Rate-Limiting & Jittered Backoff**:
   - Implement exponential backoff with full jitter when interacting with remote LLM or Castor endpoints to handle HTTP 429 / 503 responses gracefully:
     ```java
     long delayMs = Math.min(maxBackoffMs, (long) (initialDelayMs * Math.pow(2, attempt)));
     long jitteredDelay = ThreadLocalRandom.current().nextLong(delayMs / 2, delayMs);
     Thread.sleep(Duration.ofMillis(jitteredDelay));
     ```


---

## 4. Test-Driven Development (TDD) & Testing

Write JUnit 5 unit tests with clear Arrange-Act-Assert structure:

```java
class CastorClientTest {

    private CastorClient client;

    @BeforeEach
    void setUp() {
        client = new CastorClient("http://localhost:8000");
    }

    @Test
    @DisplayName("Should parse valid skill manifest JSON")
    void shouldParseValidManifest() {
        String json = """
            {
              "name": "cart-service",
              "version": "1.0.0",
              "description": "Retail cart management skill"
            }
            """;

        SkillManifest manifest = client.parseManifest(json);

        assertThat(manifest).isNotNull();
        assertThat(manifest.name()).isEqualTo("cart-service");
        assertThat(manifest.version()).isEqualTo("1.0.0");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "invalid/name*"})
    @DisplayName("Should reject invalid skill names")
    void shouldRejectInvalidSkillNames(String invalidName) {
        assertThatThrownBy(() -> client.validateSkillName(invalidName))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
```

* Execute tests through Bazel:
  ```bash
  bazel test //clients/java:castor_client_java_test
  ```

---

## 5. Object-Oriented & Modular Design in Java

Java 21 development in Castor follows strict SOLID principles, composition over inheritance, and clean modular encapsulation.

### 1. SOLID Principles Implementation
* **Single Responsibility Principle (SRP)**:
  - Decompose the client SDK into dedicated, single-purpose classes:
    - `CastorClient`: High-level facade for API interaction.
    - `ManifestParser`: Deserialization and schema validation.
    - `ManifestLockVerifier`: Cryptographic SHA-256 integrity verification.
    - `SkillCache`: In-memory and local disk cache management.
* **Open-Closed Principle (OCP)**:
  - Use the Strategy pattern for URI resolution (`castor://`, `github://`, `maven://`) so new schemes can be added without modifying the core resolver:
    ```java
    public interface SkillUriResolver {
        boolean supports(String scheme);
        SkillPackage resolve(URI uri);
    }
    ```
* **Interface Segregation Principle (ISP)**:
  - Expose targeted, fine-grained interfaces rather than one monolithic client:
    ```java
    public interface SkillSearchService {
        List<SkillDescriptor> search(String query, int limit);
    }

    public interface SkillDiscoveryService {
        List<SkillDescriptor> suggestSkills(String prompt, int maxSkills);
    }
    ```
* **Dependency Inversion Principle (DIP)**:
  - High-level services depend on abstractions (`SkillUriResolver`, `HttpClient`), not concrete classes. Inject all dependencies through constructors.

### 2. Creational & Structural Patterns
* **Builder Pattern**:
  - Provide fluent, type-safe builders for client instantiation with sane defaults:
    ```java
    CastorClient client = CastorClient.builder()
        .endpoint("http://localhost:8000")
        .connectTimeout(Duration.ofSeconds(5))
        .maxRetries(3)
        .build();
    ```
* **Static Factory Methods**:
  - Use static factories (`SkillUri.of(...)`, `SkillManifest.fromJson(...)`) instead of overloaded constructors to clarify intent and enforce validation.

### 3. Modular Packaging & Encapsulation
* **Package Structure**:
  - `com.retailcortex.castor.client`: Public client facade and configuration.
  - `com.retailcortex.castor.model`: Immutable records, value objects, and Protobuf wrappers.
  - `com.retailcortex.castor.internal`: Package-private implementation details hidden from external consumers.
* **Defensive Immutability**:
  - Never expose mutable internal arrays or collections. Use `List.copyOf()` or immutable records.
  - Validate object state eagerly at construction time (`Objects.requireNonNull()`, precondition checks).

---

## 6. Multithreading & Parallel Execution in Java 21

Java 21 introduces Virtual Threads and Structured Concurrency, modernizing multi-threaded and asynchronous programming for high-throughput services and SDKs.

### 1. Virtual Threads for I/O-Bound Parallelism (Project Loom)
* **Virtual Thread Executor**: Use `Executors.newVirtualThreadPerTaskExecutor()` instead of pooled platform thread executors for concurrent network and disk tasks (e.g., parallel skill downloads, remote registry search):
  ```java
  public List<SkillPackage> fetchAllSkills(List<URI> uris) {
      try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
          List<Future<SkillPackage>> futures = uris.stream()
              .map(uri -> executor.submit(() -> fetchSingleSkill(uri)))
              .toList();

          return futures.stream()
              .map(Future::resultNow)
              .toList();
      }
  }
  ```
* **Avoid Virtual Thread Pinning**:
  - Never hold a `synchronized` monitor lock across blocking network or file I/O operations (which pins the carrier thread).
  - Use `java.util.concurrent.locks.ReentrantLock` instead of `synchronized` when synchronization is required around blocking operations.

### 2. Structured Concurrency
* Coordinate concurrent subtasks deterministically with automatic cancellation propagation:
  ```java
  public SkillPackage assembleSkill(URI manifestUri, URI payloadUri) throws Exception {
      try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
          StructuredTaskScope.Subtask<SkillManifest> manifestTask = 
              scope.fork(() -> fetchManifest(manifestUri));
          StructuredTaskScope.Subtask<byte[]> payloadTask = 
              scope.fork(() -> fetchPayload(payloadUri));

          scope.join();           // Wait for both subtasks
          scope.throwIfFailed();   // Propagate first failure, automatically cancelling the other

          return new SkillPackage(manifestTask.get(), payloadTask.get());
      }
  }
  ```

### 3. Thread-Safe State & Caching
* **`ConcurrentHashMap` for Multi-Threaded Caches**:
  - Always use `computeIfAbsent` for atomic cache population to avoid race conditions:
    ```java
    private final ConcurrentHashMap<String, SkillDescriptor> cache = new ConcurrentHashMap<>();

    public SkillDescriptor getOrLoad(String skillId) {
        return cache.computeIfAbsent(skillId, this::fetchFromRemote);
    }
    ```
* **Thread-Safe HTTP Client**:
  - Reuse a single, shared `java.net.http.HttpClient` instance across all threads. It is immutable and thread-safe.

---

## 7. KISS, DRY & MDD Principles

1. **Model-Driven Development (MDD)**:
   - Align client entity representations with canonical Protobuf schemas in `proto/castor/`.
2. **No Redundant Dependencies**:
   - Rely on SLF4J for logging abstraction.
   - Avoid external utility libraries when Java 21 standard library features (Records, Streams, HttpClient, Virtual Threads) satisfy the requirement.



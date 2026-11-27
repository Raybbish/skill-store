---
name: go
description: Comprehensive Go engineering guidelines for Castor covering hermetic execution via Bazel, secure coding, Gin REST API, GORM/pgvector, MCP SSE servers, TDD, KISS, DRY, and SDLC compliance.
license: Apache-2.0
author: Ryan McGuinness
version: "1.0.0"
metadata:
  author: Ryan McGuinness
  version: "1.0.0"
authors:
  - name: Retail Cortex Engineering
    url: https://github.com/retail-cortex/castor
category: go
tags:
  - go
  - golang
  - gin
  - gorm
  - pgvector
  - mcp
  - tdd
trigger_phrases:
  - "implement Go service"
  - "build Castor REST API"
  - "configure GORM pgvector"
  - "hermetic Go test"
execution_hints:
  preferred_model: "gemini-3.8-flash"
  requires_human_approval: false
  environment_variables:
    - GOPATH
  timeout_seconds: 300
---

# Go Engineering Guide & Best Practices

Go (1.24+ / 1.26 SDK) powers Castor's core backend registry service (`castor-server`), the standalone CLI package manager (`cstr`), and the Go Client SDK (`clients/go`).

---

## 1. Hermetic Toolchain (Strict Bazel Execution)

* **NEVER** run host `go`, `gofmt`, or `go test` directly.
* **Always** use the Bazel-managed hermetic runner:
  ```bash
  # Format code:
  bazel run go -- fmt ./...

  # Maintain dependencies:
  bazel run go -- mod tidy
  bazel run //:gazelle

  # Run tests:
  bazel test //cmd/... //pkg/... //internal/... //clients/go/...
  # Run a specific Go test function:
  bazel test //pkg/data:data_test --test_filter="TestAppsRepository"
  # Or via the Go runner:
  bazel run go -- test ./...

  # Run vet:
  bazel run go -- vet ./...
  ```

### Adding New External Dependencies via Bzlmod:
1. `bazel run go -- get github.com/foo/bar@v1.2.3`
2. `bazel run go -- mod tidy`
3. `bazel run //:gazelle`
4. Register the generated repo name in `MODULE.bazel` under `use_repo(go_deps, ...)` if missing.

---

## 2. Secure Coding Practices (OWASP & CWE Prevention)

1. **SQL Injection Prevention (CWE-89)**:
   - Always use GORM's parameterized query builder. Never concatenate raw strings into `.Where()`, `.Raw()`, or `.Exec()`:
     ```go
     // CORRECT:
     db.Where("name = ? AND active = ?", skillName, true).First(&skill)

     // INCORRECT (VULNERABLE):
     db.Where(fmt.Sprintf("name = '%s'", skillName)).First(&skill)
     ```

2. **Path Traversal & Zip Slip Prevention (CWE-22)**:
   - When installing or verifying skill directories from URIs or archives, validate that the resolved path stays within the intended target directory:
     ```go
     cleanPath := filepath.Clean(filepath.Join(destDir, relPath))
     if !strings.HasPrefix(cleanPath, filepath.Clean(destDir)+string(filepath.Separator)) {
         return fmt.Errorf("security violation: path traversal detected: %s", relPath)
     }
     ```

3. **Concurrency & Goroutine Leak Prevention**:
   - Always propagate `context.Context` to all database, HTTP, and background tasks.
   - Listen to `ctx.Done()` in long-running goroutines:
     ```go
     select {
     case <-ctx.Done():
         return ctx.Err()
     case result := <-ch:
         return process(result)
     }
     ```

4. **Error Handling & Information Disclosure (CWE-209)**:
   - Never expose internal database errors, schema details, or system paths to REST or MCP API clients.
   - Wrap internal errors using `%w` for logging, but return clean, bounded HTTP error messages:
     ```go
     if err != nil {
         log.Printf("internal db error: %v", err)
         c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
         return
     }
     ```

---

## 3. Formatting, Linting & Code Quality

* **Hermetic Formatting**:
  ```bash
  bazel run go -- fmt ./...
  ```
* **Static Analysis & Linting**:
  Enforce `.golangci.yml` rules:
  ```bash
  golangci-lint run ./cmd/... ./pkg/... ./internal/... ./clients/go/...
  ```
  Key linters active in Castor:
  - `govet`: Suspicious constructs, mutex copying.
  - `gosec`: Security vulnerability scanner (taint tracking, crypto).
  - `staticcheck` / `gosimple`: Idiomatic Go simplifications.
  - `errcheck`: Unchecked error returns.
  - `revive`: Code style, exported docstrings, package naming.

---

## 4. Test-Driven Development (TDD) & Testing Conventions

Follow TDD principles: write failing unit tests before implementing functionality.

### Table-Driven Test Pattern:
```go
func TestValidateSkillName(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        {name: "valid name", input: "cart-service", wantErr: false},
        {name: "empty name", input: "", wantErr: true},
        {name: "path traversal attempt", input: "../etc/passwd", wantErr: true},
        {name: "special characters", input: "skill@v1!", wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateSkillName(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("ValidateSkillName(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
            }
        })
    }
}
```

### In-Memory Test Fixtures:
* Use SQLite in-memory (`gorm.Open(sqlite.Open("file::memory:?cache=shared"))`) for fast, isolated repository unit tests.
* Run tests with Bazel:
  ```bash
  bazel test //pkg/data:data_test
  bazel test //cmd/castor_server:castor-server_test
  ```

---

## 5. Object-Oriented & Modular Design in Go

Go achieves Object-Oriented and Modular architecture through structural typing, interface-driven design, and strict package boundaries rather than classical inheritance.

### 1. Composition Over Inheritance
* **Struct Embedding**: Use struct embedding to compose behavior without creating tight coupling or fragile hierarchies:
  ```go
  type BaseRepository struct {
      db *gorm.DB
  }

  type SqlAppsRepository struct {
      BaseRepository
      logger *log.Logger
  }
  ```
* **Explicit Delegates**: Prefer explicit field composition over anonymous embedding when the outer struct does not need to expose all inner methods directly.

### 2. Interface Segregation & Dependency Inversion (SOLID)
* **Define Interfaces Where Used**: Define narrow, client-centric interfaces in the consuming service package rather than the provider package:
  ```go
  // In pkg/service: Define what the service needs
  type AppRepository interface {
      FindByID(ctx context.Context, id string) (*model.App, error)
      Save(ctx context.Context, app *model.App) error
  }

  type AppsService struct {
      repo AppRepository // Injected dependency (Dependency Inversion)
  }

  func NewAppsService(repo AppRepository) *AppsService {
      return &AppsService{repo: repo}
  }
  ```
* **Polymorphism via Duck Typing**: Concrete data implementations in `pkg/data` satisfy `AppRepository` implicitly without compile-time coupling to service definitions.

### 3. Encapsulation & Constructor Functions
* **Information Hiding**: Keep struct fields unexported (`lowerCase`) to protect invariants:
  ```go
  type SkillRegistry struct {
      serverURL string
      client    *http.Client
      cache     map[string]*model.Skill
      mu        sync.RWMutex
  }

  // Enforce validation and initialization via constructors
  func NewSkillRegistry(serverURL string, client *http.Client) (*SkillRegistry, error) {
      if serverURL == "" {
          return nil, errors.New("serverURL is required")
      }
      if client == nil {
          client = &http.Client{Timeout: 30 * time.Second}
      }
      return &SkillRegistry{
          serverURL: serverURL,
          client:    client,
          cache:     make(map[string]*model.Skill),
      }, nil
  }
  ```

### 4. Modular Package Architecture
* **Strict Unidirectional Dependency Graph**:
  ```text
  cmd/ (entrypoint wiring)
    ↓
  pkg/service/ (business logic orchestration)
    ↓
  pkg/data/ (persistence & queries)
    ↓
  pkg/model/ (pure domain entities)
  ```
* **No Circular Dependencies**: Circular package imports are illegal in Go and rejected by the compiler.
* **Separation of Concerns**:
  - `pkg/`: Public reusable library packages for multiple consumers.
  - `internal/`: Private implementation logic protected by Go's compiler boundary.
  - `clients/go/`: Zero-dependency, lightweight client SDK consumed by external applications.

---

## 6. Multithreading, Concurrency & Parallel Execution

Go's concurrency model centers on goroutines, channels, and synchronization primitives. In Castor (e.g., parallel skill downloads, concurrent vector search, background embeddings), concurrency must be bounded, race-free, and leak-free.

### 1. Bounded Parallelism & Worker Pools (Prevent Goroutine Explosions)
* **Never spawn unbounded goroutines**: Always constrain concurrent I/O using a semaphore channel or worker pool:
  ```go
  func DownloadSkillsParallel(ctx context.Context, uris []string, maxConcurrent int) error {
      sem := make(chan struct{}, maxConcurrent)
      g, ctx := errgroup.WithContext(ctx)

      for _, uri := range uris {
          u := uri
          g.Go(func() error {
              select {
              case sem <- struct{}{}:
                  defer func() { <-sem }()
              case <-ctx.Done():
                  return ctx.Err()
              }
              return downloadSkill(ctx, u)
          })
      }
      return g.Wait()
  }
  ```

### 2. Synchronization Primitives
* **`sync.RWMutex` for Read-Heavy Caches**:
  - Prefer `RWMutex` over standard `Mutex` when cache reads vastly outnumber writes:
    ```go
    type SafeSkillCache struct {
        mu    sync.RWMutex
        items map[string]*model.Skill
    }

    func (c *SafeSkillCache) Get(id string) (*model.Skill, bool) {
        c.mu.RLock()
        defer c.mu.RUnlock()
        item, ok := c.items[id]
        return item, ok
    }

    func (c *SafeSkillCache) Set(id string, skill *model.Skill) {
        c.mu.Lock()
        defer c.mu.Unlock()
        c.items[id] = skill
    }
    ```
* **`sync.Once` for Lazy Singletons**:
  - Use `sync.Once` for safe, one-time initialization of shared resources (e.g., database handles, embedding clients):
    ```go
    var (
        dbInstance *gorm.DB
        dbOnce     sync.Once
    )

    func GetDB(dbURL string) *gorm.DB {
        dbOnce.Do(func() {
            dbInstance, _ = gorm.Open(sqlite.Open(dbURL), &gorm.Config{})
        })
        return dbInstance
    }
    ```
* **`sync/atomic` for High-Throughput Counters**:
  - Use atomic integers for telemetry and request counters without lock contention (`atomic.AddInt64(&counter, 1)`).

### 3. Data Race Detection & Safety
* **Never Copy Mutexes**: Passing a struct containing a mutex by value copies lock state, leading to deadlocks. Pass pointers.
* **Run Race Detection**:
  ```bash
  # Run tests under Go's race detector via the hermetic runner:
  bazel run go -- test -race ./...
  ```

---

## 7. Architecture, KISS & DRY Principles

1. **Model-Driven Development (MDD)**:
   - Align Go domain models in `pkg/model/` with canonical Protobuf definitions in `proto/castor/`.
   - Maintain database schemas with explicit GORM tags and pgvector HNSW index configurations.
2. **KISS Error Wrapping**:
   - Wrap errors with actionable contextual prefixes:
     ```go
     if err := repo.Save(ctx, app); err != nil {
         return fmt.Errorf("failed to persist application %q: %w", app.Name, err)
     }
     ```

---

## 8. Server Architecture: Dual REST/MCP, Vector Search & Graceful Shutdown

1. **Dual-Protocol Server (`castor-server`)**:
   - **Gin REST Endpoints**: Routes registered on `/api/v1/...` (`/skills`, `/apps`, `/auth`).
   - **Bounded Pagination**: Enforce $1 \le \text{page\_size} \le 25$ (default 5). Always set response headers:
     - `X-Total-Count`, `X-Page`, `X-Page-Size`, `X-Total-Pages`.
   - **Model Context Protocol (MCP)**: Mount SSE endpoint at `/mcp/sse` using `github.com/mark3labs/mcp-go`.
2. **Multi-Modal Vector Search (`pgvector`)**:
   - Uses PostgreSQL `pgvector` with HNSW cosine distance (`vector_cosine_ops`) across 3 embedding dimensions:
     - `embedding_768`: Text embeddings (text-embedding-004, AlloyDB AI).
     - `embedding_1408`: Multimodal embeddings (Vertex AI multimodalembedding).
     - `embedding_3072`: Large multimodal foundation model embeddings.
   - Falls back transparently to SQLite for local development and unit tests.
3. **Graceful Server Shutdown**:
   - Always trap `os.Interrupt` and `syscall.SIGTERM` to drain active HTTP and MCP connections:
     ```go
     quit := make(chan os.Signal, 1)
     signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
     <-quit

     ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
     defer cancel()
     if err := srv.Shutdown(ctx); err != nil {
         log.Fatalf("Server forced to shutdown: %v", err)
     }
     ```




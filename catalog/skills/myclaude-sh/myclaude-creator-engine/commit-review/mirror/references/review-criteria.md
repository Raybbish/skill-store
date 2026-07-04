# Commit Review Criteria

## Message Format Rules

### Conventional Commits (recommended)
```
type(scope): subject

body (optional)

footer (optional)
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

### Subject Line Rules
- Max 72 characters
- Imperative mood ("add" not "added" or "adds")
- No period at the end
- Capitalize first word after type prefix

### Body Rules
- Separated from subject by blank line
- Wrap at 72 characters
- Explain WHY, not WHAT (the diff shows what)

## Diff Size Thresholds

| Metric | Good | Warn | Flag |
|--------|------|------|------|
| Files changed | 1-5 | 6-10 | >10 |
| Lines added | 1-200 | 200-500 | >500 |
| Net change | 1-300 | 300-700 | >700 |

## Anti-Pattern Patterns

### Debug Code
```
console.log  |  console.debug  |  debugger
print("      |  pdb.set_trace  |  binding.pry
System.out.println  |  var_dump  |  dd(
```

### Secrets (CRITICAL — block push)
```
sk-          |  AIza          |  ghp_
AKIA         |  aws_secret    |  private_key
Bearer       |  -----BEGIN    |  password=
api_key=     |  token=        |  secret=
```

### Large Files
Flag any single file >1MB. Block any binary file >5MB.

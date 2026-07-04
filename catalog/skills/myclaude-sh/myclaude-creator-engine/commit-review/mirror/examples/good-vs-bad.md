# Commit Examples — Good vs. Bad

## Example 1: Message Quality

**Good:**
```
feat(auth): add JWT refresh token rotation

Tokens now rotate on each refresh to prevent replay attacks.
Previous behavior kept the same refresh token until expiry,
which left a window for stolen tokens to be reused.

Closes #142
```

**Bad:**
```
fixed stuff
```
Why it's bad: No type, no scope, no explanation, past tense, vague.

---

## Example 2: Atomic Commits

**Good:** Two separate commits
```
refactor(api): extract validation middleware from route handlers
test(api): add validation middleware unit tests
```

**Bad:** One mixed commit
```
refactor api and add tests and fix that bug from yesterday
```
Why it's bad: Three unrelated changes in one commit. Can't revert one without the others.

---

## Example 3: Diff Hygiene

**Good:** Commit only touches files related to the feature
```
 src/auth/refresh.ts  | 45 ++++++
 src/auth/refresh.test.ts | 38 +++++
 2 files changed, 83 insertions(+)
```

**Bad:** Feature commit includes formatting changes
```
 src/auth/refresh.ts  | 45 ++++++
 src/components/Header.tsx | 2 +- (unrelated formatting)
 src/utils/helpers.ts | 12 +++--- (unrelated refactor)
 package-lock.json | 5000 +++++ (dependency update mixed in)
 4 files changed, 5059 insertions(+)
```
Why it's bad: Reviewing the actual feature change requires reading through noise.

---

## Example 4: Secret Exposure

**CRITICAL — This blocks push:**
```diff
+ const API_KEY = "sk-proj-abc123def456..."
+ const client = new OpenAI({ apiKey: API_KEY })
```
Fix: Use environment variables. `const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`

---

## Example 5: Debug Code Left In

**Bad:**
```diff
+ console.log("DEBUG: user object", user)
+ console.log("DEBUG: token", token)  // TODO: remove this
  const result = await processAuth(user, token)
```
Why it's bad: Debug output in production. The TODO comment proves the author knew it shouldn't ship.

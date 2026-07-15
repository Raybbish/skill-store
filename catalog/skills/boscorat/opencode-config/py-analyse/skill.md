---
name: py-analyse
description: Analyzes Python/PySide6 code for refactoring opportunities focusing on readability and maintainability. Identifies code issues with severity levels (critical/medium/minor), red-flags security risks, and provides structured refactoring suggestions with before/after examples. Works on individual files or entire directories. USE FOR: analyze code for refactoring, code quality review, security risk detection, readability analysis, maintainability improvements. DO NOT USE FOR: code formatting/linting (use a linter), performance optimization without readability impact, enforcing single architectural pattern.
license: MIT
compatibility: opencode
metadata:
  target_agent: python-pyside6-reviewer
  language: python
  frameworks: pyside6
  version_source: uv.lock
---

# Code Analysis for Refactoring

This skill analyzes Python and PySide6 code to identify refactoring opportunities that improve readability and maintainability. It uses a balanced approach that avoids excessive micro-optimization patterns like over-application of DRY.

## Capabilities

### Analysis Categories

1. **Code Issues** — Categorized by severity:
   - **Critical**: Bugs, incorrect patterns, major maintainability issues
   - **Medium**: Suboptimal patterns, moderate code complexity, inconsistencies
   - **Minor**: Style improvements, minor redundancy, documentation gaps

2. **Security Red-flags** — Detected issues:
   - SQL injection vulnerabilities
   - Hardcoded credentials and secrets
   - Insecure file operations and permissions
   - Unsafe dependency usage
   - Insecure deserialization patterns
   - Path traversal vulnerabilities
   - Other OWASP Top 10 applicable to Python

3. **Refactoring Suggestions** — Focused on:
   - Improving readability and clarity
   - Enhancing maintainability
   - Following PCEP/PCAP Python standards
   - Idiomatic PySide6 patterns
   - Type hint improvements and documentation

### Input & Output

**Input**: File path or directory path containing Python files

**Output**: Structured markdown report containing:
- Overview of issues found
- Grouped suggestions by severity and category
- Before/after code examples
- Rationale for each suggestion
- Links to relevant PySide6 and Python best practices

### Automatic Configuration

Reads Python version and PySide6 version from `uv.lock` to ensure:
- Compatibility with project's pinned dependencies
- Recommendations aligned with available features
- Up-to-date approach while maintaining compatibility

## Usage

Invoked by the `python-pyside6-reviewer` agent as an optional tool to analyze code quality and identify refactoring opportunities.

## Balanced Approach

This skill avoids:
- Creating excessive micro-functions for DRY compliance
- Enforcing a single architectural pattern strictly
- Over-optimization that reduces readability
- Suggestions that sacrifice maintainability for theoretical purity

Focus remains on practical improvements that make code easier to understand, modify, and maintain.

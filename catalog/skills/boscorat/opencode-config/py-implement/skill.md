---
name: py-implement
description: Transforms Python/PySide6 code based on refactoring suggestions into clean, idiomatic code. Includes type hints and docstrings, maintains original functionality, and validates changes through diff preview and test execution. Works on individual files or entire directories. USE FOR: implement refactoring suggestions, transform code, clean up Python/PySide6 code, apply code improvements. DO NOT USE FOR: major architectural rewrites, performance optimization without analysis, changing behavior/functionality.
license: MIT
compatibility: opencode
metadata:
  target_agent: python-pyside6-reviewer
  language: python
  frameworks: pyside6
  version_source: uv.lock
---

# Code Transformation and Implementation

This skill transforms Python and PySide6 code based on refactoring suggestions into clean, idiomatic, and well-documented code. It includes a validation step to ensure functionality is preserved.

## Capabilities

### Code Transformation

Converts code to:
- **Idiomatic Python** following PCEP/PCAP standards
- **PySide6 best practices** and patterns
- **Type hints** for all functions and class methods
- **Comprehensive docstrings** (parameters, returns, raises)
- **Original functionality preserved** — no behavior changes

### Validation Pipeline

1. **Diff/Preview** — Shows proposed changes before applying
   - Clear visualization of what will change
   - User can review and approve

2. **Static Analysis** — Validates transformed code:
   - Type checking (mypy or similar)
   - Syntax validation
   - Code quality checks

3. **Test Execution** — Ensures functionality is maintained:
   - Runs existing unit tests
   - Detects breaking changes
   - Validates that tests pass with new code

4. **Code Formatting & Linting** — Final quality checks:
   - Runs `uv run ruff format` to ensure consistent formatting
   - Runs `uv run ruff check` to validate against project linting rules
   - Ensures compliance with CI requirements for push/PR

### Input & Output

**Input**: File path(s) or directory with Python files, optionally with refactoring analysis

**Output**:
- Diff/preview of proposed changes
- Refactored code (replaces original; no backup needed)
- Validation report showing test results and static analysis

### Automatic Configuration

Reads Python version and PySide6 version from `uv.lock` to ensure:
- Consistent transformation approach across project
- Compatibility with project's exact pinned versions
- Version-aware refactoring patterns

## Usage

Invoked by the `python-pyside6-reviewer` agent to implement and validate refactoring suggestions produced by the `py_analyse` skill.

## Safety & Reliability

- **Diff preview** allows user approval before changes
- **Test validation** catches unintended side effects
- **Static analysis** ensures code quality
- **No destructive surprises** — original files are replaced with improved versions after validation passes

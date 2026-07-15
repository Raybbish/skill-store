---
name: doc-docstring
description: Manages Python docstring extraction, review, and sync with published documentation. Identifies sync gaps, validates docstring quality against audience standards, suggests improvements for clarity. Supports Google-style docstrings exclusively. Works on individual Python files or entire modules. USE FOR: extract docstrings, review quality, sync with docs, check completeness, enforce format consistency. DO NOT USE FOR: general code review, non-docstring comments, other documentation formats.
license: MIT
compatibility: opencode
metadata:
  target_agent: documentation-reviewer
  language: python
  docstring_format: google
  version_source: uv.lock
---

# Python Docstring Handler

This skill manages Python docstring extraction, validation, and synchronization with published documentation. It focuses on Google-style docstrings and ensures consistency between code documentation and external documentation.

## Capabilities

### Docstring Extraction

- Extract docstrings from modules, classes, functions/methods
- Parse Google-style format (sections: Description, Args, Returns, Raises, Examples, Attributes, Note, Warning, etc.)
- Identify non-Google docstring styles and flag for alignment
- Organize extracted docstrings by scope (module, class, function)

### Quality Review

- **Completeness** — check that parameters, returns, raises are documented
- **Audience fit** — validate complexity and vocabulary match intended audience
- **Accuracy** — verify descriptions are correct and up-to-date
- **Clarity** — ensure parameter descriptions are clear and concise
- **Examples** — check if present, validate they work and match documentation
- **Format** — ensure consistent use of Google-style structure

### Documentation Sync Detection

- Compare extracted docstrings against published documentation
- Flag gaps in both directions:
  - Documented in code but missing from public docs
  - Documented in public docs but not in code
  - Mismatches between code documentation and published docs
- Identify outdated docstrings (e.g., parameter no longer exists in function signature)
- Prioritize sync findings by severity

### Style Guide Enforcement

- Apply Google-style format consistently
- Check parameter descriptions match function signature
- Validate return type documentation matches actual return values
- Ensure exceptions/raises are properly documented
- Verify examples follow project conventions

## Input & Output

**Input**: Python file path or module path (individual file or entire directory)

**Output**: Structured report containing:
- Extracted docstrings organized by scope
- Quality assessment of each docstring
- Sync analysis (gaps between code and docs)
- Format consistency check
- Improvement suggestions with before/after examples
- File:line references for easy navigation

## Automatic Configuration

Reads from `uv.lock`:
- Python version for syntax understanding and extraction
- Zensical version (if docs are published via Zensical)
- Other dependencies that might be referenced in docstrings

## Design

This skill maintains:
- **Format consistency** — all docstrings follow Google style
- **Accuracy** — docstrings match actual function signatures and behavior
- **Completeness** — all parameters, returns, and exceptions documented
- **Sync** — alignment between code docstrings and published documentation

Not focused on:
- Code style or function naming
- Internal comments or type hints (though docstrings may reference them)
- Non-docstring documentation formats

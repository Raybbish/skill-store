---
name: doc-analyse
description: Analyzes documentation for clarity, accuracy, and audience appropriateness. Auto-detects target audience from metadata; identifies issues by severity (critical/medium/minor). Validates Zensical structure/metadata/internal-links/assets, extracts Python docstrings, identifies PySide6 UI documentation gaps. Works on individual files or entire documentation trees. USE FOR: review docs, analyze for target audience, check docstring sync, validate Zensical, identify UI documentation gaps. DO NOT USE FOR: write new docs from scratch, code reviews, external link validation.
license: MIT
compatibility: opencode
metadata:
  target_agent: documentation-reviewer
  content_types: markdown, python-docstrings, pyside6-ui
  docstring_format: google
  version_source: uv.lock
---

# Documentation Analysis Skill

This skill analyzes documentation across multiple dimensions to identify improvements for clarity, accuracy, and audience appropriateness. It integrates Zensical structure validation, Python docstring extraction, and PySide6 UI component documentation verification.

## Capabilities

### Audience Auto-Detection

- Parse frontmatter metadata for audience hints (audience tags, intended-for fields)
- Analyze prose style, complexity level, and vocabulary depth
- Match to audience level: technical, general, beginner, or API reference
- Ask user for clarification if metadata is ambiguous
- Apply appropriate style guide rules from skill collection README

### Content Analysis

- **Clarity for target audience** — vocabulary, complexity, examples appropriate to level
- **Technical accuracy** — correctness and currency of information
- **Terminology consistency** — uniform vocabulary throughout docs
- **Completeness** — identify missing information, outdated sections
- **Example appropriateness** — examples match audience level and learning needs

### Zensical Integration Validation

- **YAML Frontmatter** — structure, required fields, format compliance
- **File/folder naming conventions** — alignment with Zensical structure
- **Internal links** — validate all cross-references exist and are correct
- **Asset references** — verify images/files exist at documented paths
- **SEO metadata** — check completeness of metadata fields

### Python Docstring Extraction (Automatic)

- Extract docstrings from referenced Python modules, classes, functions
- Parse Google-style docstring format
- Compare extracted docstrings against published documentation
- Flag sync gaps: documented in code only, docs only, or content mismatch
- Check parameter descriptions match function signature
- Validate return types and exceptions documented

### PySide6 UI Documentation

- Inspect Python code for PySide6 widget names and hierarchy
- Validate that documented widget names match actual code
- Identify missing UI component documentation
- Flag outdated widget references
- Cross-reference signal/slot documentation with code

## Input & Output

**Input**: File path or directory path containing documentation (markdown, referenced Python code)

**Output**: Structured markdown report containing:
- Audience assessment and style guide applied
- Issues grouped by severity (critical/medium/minor)
- Docstring sync findings with file:line references
- PySide6 widget validation results
- Zensical compliance status
- Before/after improvement examples
- Actionable suggestions

## Automatic Configuration

Reads from `uv.lock`:
- Zensical version for structure/metadata validation
- Python version for docstring extraction
- Dependencies referenced in docs

## Balanced Approach

This skill focuses on:
- **Audience fit** — documentation clarity and appropriateness for target users
- **Accuracy** — technical correctness and currency
- **Consistency** — uniform terminology and formatting
- **Completeness** — identifying gaps without over-prescribing solutions

Not focused on:
- Grammar/spelling (assume professional editing elsewhere)
- External link validation (internal links only)
- Redesigning documentation structure (review only)

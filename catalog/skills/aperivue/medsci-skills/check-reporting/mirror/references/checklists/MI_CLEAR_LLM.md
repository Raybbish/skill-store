# MI-CLEAR-LLM Checklist — Reporting LLM Accuracy Studies in Healthcare

**Reference:** Park SH, Suh CH, Lee JH, Kahn CE Jr, Moy L. Minimum Reporting Items for Clear Evaluation of Accuracy Reports of Large Language Models in Healthcare (MI-CLEAR-LLM). Korean J Radiol. 2024;25(10):865-868. PMID: 39344542
**Reference (2025 Update):** Park SH, Suh CH, Lee JH, Tejani AS, You SC, Kahn CE Jr, Moy L. MI-CLEAR-LLM: 2025 Updates. Korean J Radiol. 2025;26(12):1123-1132. PMID: 41199132

**Version:** 2025 (expanded from 2024 original)
**License:** CC BY-NC 4.0 (Korean Society of Radiology)
**Source:** https://kjronline.org/DOIx.php?id=10.3348/kjr.2025.1522

**Scope:** Studies evaluating the accuracy of LLMs in healthcare applications (diagnosis, triage, clinical decision support, medical question answering, etc.). This is NOT for disclosing LLM use in manuscript writing — for that, see ICMJE/COPE policies and the write-paper skill's LLM disclosure feature.

**vs. CLAIM 2024:** Use CLAIM for imaging AI model validation. Use MI-CLEAR-LLM for studies testing LLM accuracy in healthcare tasks. Both may apply if the study evaluates an LLM integrated with medical imaging interpretation.

---

## Item 1 — LLM Identification and Specifications ⚠️ commonly missed

**Description:** Fully identify the LLM evaluated in the study.
**Required content:**
- Model name and version (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro)
- Manufacturer/developer (e.g., OpenAI, Anthropic, Google)
- Training data cutoff date (if known or disclosed by the developer)
- Date(s) when queries were executed (LLM outputs may change over time due to updates)
- Access mode: web-based chatbot interface, API, or locally deployed open-source model
- For API access: specific API version or endpoint used
- For open-source models: model weights version, quantization method (if applicable), hardware specifications
- Whether retrieval-augmented generation (RAG) or internet access was enabled
- Any fine-tuning or adaptation applied to the base model

**Rationale:** LLMs are frequently updated without version increments. The same model name may produce different outputs on different dates. Without exact version and date documentation, studies are not reproducible.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Item 2 — Stochasticity Handling ⚠️ commonly missed

**Description:** Document how the inherent randomness of LLM outputs was managed.
**Required content:**
- Number of query attempts per question/task (e.g., each prompt was run 3 times)
- How multiple outputs were synthesized (e.g., majority vote, best-of-N, mean score)
- Reliability analysis across repeated attempts (e.g., agreement rate, Fleiss' kappa)
- Technical parameter settings that control randomness:
  - Temperature setting (e.g., temperature = 0 for deterministic output)
  - Top-p (nucleus sampling) setting
  - Any other sampling parameters (top-k, frequency penalty, etc.)
- If parameters were not controllable (e.g., web chatbot interface): state this explicitly

**Rationale:** LLM outputs are stochastic by design. A single query attempt is insufficient to characterize model performance. Studies that do not control or report stochasticity parameters produce unreliable and unreproducible results.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Item 3 — Full Prompt Text ⚠️ commonly missed

**Description:** Provide the complete text of all prompts used, preserving exact formatting.
**Required content:**
- Full prompt text including system prompts, user prompts, and any few-shot examples
- Preserve precise spellings, symbols, punctuation, spaces, line breaks, and formatting
- If prompts include clinical data or images: describe the format and structure of input data
- For multi-turn conversations: provide the complete conversation sequence
- For chain-of-thought or structured prompting: document the full prompting strategy
- Recommended location: supplementary materials (if prompts are lengthy)

**Rationale:** Minor prompt variations can substantially alter LLM outputs. Without exact prompt text, no reader can assess the study methodology or attempt replication.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Item 4 — Prompt Execution Details ⚠️ commonly missed

**Description:** Explain how prompts were operationally used during the study.
**Required content:**
- Whether each query was executed as an independent chat session (new conversation) or within a continuing session
- Whether multiple queries were submitted simultaneously (batch) or sequentially
- If sequentially: whether prior outputs could influence subsequent queries (context carryover)
- Whether any post-processing was applied to LLM outputs (e.g., extracting structured answers from free text, parsing JSON)
- Who executed the queries (researchers, automated scripts, clinical staff)
- For API-based studies: batch size, rate limiting, error handling for failed API calls

**Rationale:** Chat session context and query ordering can influence LLM responses. Studies must specify whether the LLM had access to context from prior queries, as this affects comparability.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Item 5 — Prompt Testing and Optimization ⚠️ commonly missed

**Description:** Describe the prompt development process.
**Required content:**
- How prompts were created (expert-designed, iteratively refined, generated by another LLM)
- Rationale for specific wording choices (why this prompt structure was chosen)
- Whether prompt optimization/engineering was performed
- If optimized: method used (manual iteration, automated prompt tuning, grid search over prompt variants)
- Dataset used for prompt optimization (must be independent of test data — see Item 6)
- Number of prompt iterations tested
- Whether different prompt strategies were compared (zero-shot vs. few-shot vs. chain-of-thought)

**Rationale:** Prompt design is a critical methodological choice equivalent to feature engineering in traditional ML. Unreported optimization inflates apparent performance if optimization and test data overlap.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Item 6 — Test Data Independence ⚠️ commonly missed

**Description:** Confirm separation between test data and all other data used in the study.
**Required content:**
- Explicit statement that test data were not used during prompt development or optimization
- Whether test data could have been part of the LLM's training data (data contamination risk)
- If test data were sourced from the internet: provide exact URLs and confirm whether the content was publicly accessible before the LLM's training cutoff date
- For published medical examination questions: acknowledge that these may be in the LLM's training corpus and discuss implications
- Mitigation strategies for data contamination (e.g., using unpublished cases, temporal splits, institution-specific data)

**Rationale:** If test data were seen during prompt optimization or were part of the LLM's pretraining corpus, performance estimates are inflated. Unlike traditional ML where training data are known, LLM training data are often undisclosed, making contamination assessment particularly challenging.

**Status:** [ ] PRESENT [ ] PARTIAL [ ] MISSING

---

## Notes for Assessors

### When to Apply MI-CLEAR-LLM

Apply this checklist when the study's primary aim is to evaluate LLM accuracy, performance, or clinical utility in a healthcare context. Examples:
- LLM answering medical board examination questions
- LLM performing clinical reasoning or differential diagnosis
- LLM triaging patient messages or radiology reports
- LLM extracting structured data from clinical notes
- LLM generating radiology report impressions

Do NOT apply this checklist when:
- The study uses LLMs as a tool in the research pipeline (e.g., NLP preprocessing) but does not evaluate LLM accuracy as an outcome
- The manuscript merely discloses that LLM writing assistance was used

### Common Assessment Pitfalls

1. **Item 1 — "GPT-4" is insufficient.** Require the exact model version (e.g., gpt-4-0613, gpt-4-turbo-2024-04-09) and the access date. OpenAI and other providers frequently update models behind the same name.
2. **Item 2 — Single-run studies.** If only one query attempt was made per item, mark as PARTIAL at best. The study cannot characterize reliability without repeated measurements.
3. **Item 3 — "We used a standardized prompt" is insufficient.** The full text must be available, even if in supplementary materials.
4. **Item 5 — Absent optimization reporting.** Many studies iteratively refine prompts but do not report this process. If the prompt appears highly optimized but no development process is described, flag as MISSING.
5. **Item 6 — Published exam questions.** Studies using publicly available medical exam questions (USMLE, board exams) should explicitly discuss training data contamination risk. This is a known and well-documented concern.

### Relationship to Other Guidelines

- **CLAIM 2024**: Use alongside MI-CLEAR-LLM if the LLM processes medical images (e.g., vision-language models interpreting radiology images).
- **TRIPOD+AI**: Use alongside MI-CLEAR-LLM if the LLM is used as a clinical prediction model.
- **STARD / STARD-AI**: Use alongside MI-CLEAR-LLM if the study evaluates diagnostic accuracy of the LLM against a reference standard.

---

## Summary

| Category | Items | PRESENT | PARTIAL | MISSING |
|----------|-------|---------|---------|---------|
| LLM Specification | 1 | /1 | /1 | /1 |
| Stochasticity | 1 | /1 | /1 | /1 |
| Prompt Documentation | 2 | /2 | /2 | /2 |
| Prompt Development | 1 | /1 | /1 | /1 |
| Data Independence | 1 | /1 | /1 | /1 |
| **TOTAL** | **6** | /6 | /6 | /6 |

**Verdict:** [ ] READY FOR SUBMISSION [ ] NEEDS REVISION

**Co-application note:** MI-CLEAR-LLM is typically used alongside another guideline (STARD, CLAIM, TRIPOD+AI) depending on the study design. The 6 items here supplement — not replace — the primary reporting guideline.

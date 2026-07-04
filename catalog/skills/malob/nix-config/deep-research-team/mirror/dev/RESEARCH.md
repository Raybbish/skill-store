# Deep Research Team v2 — Research Findings

Research conducted 2026-02-06 using deep mode (4 Opus researchers, 2 rounds).
50+ sources across academic papers, production systems, and practitioner reports.

## Core Question

What is the optimal architecture for an LLM-agent-team-based research capability that handles
the full spectrum of research questions — from factual lookups to subjective opinion synthesis
to contested/controversial topics?

---

## Finding 1: Architecture-Task Alignment Matters More Than Agent Count

Kim et al. (Google/MIT/DeepMind, Dec 2025) tested 180 configurations across 5 architectures,
3 LLM families, and 4 benchmarks. Matching coordination topology to task structure is the
critical variable, not scaling agent count[^1]. Centralized (hub-and-spoke) coordination
improved parallelizable tasks by 80.8%, while every multi-agent variant degraded sequential
reasoning by 39-70%. Communication overhead grows super-linearly (exponent 1.724). Effective
team sizes: ~3-4 agents before costs outweigh benefits.

Anthropic's production research system confirms: orchestrator-worker (Opus 4 lead + Sonnet 4
subagents) outperformed single-agent Opus 4 by 90.2% on research tasks[^2]. Key insight:
**token usage alone explains 80% of performance variance** on research benchmarks. Multi-agent
architectures work primarily by scaling token usage across parallel context windows.

Context dilution research (7+ studies: Stanford, Google, Meta, Microsoft, NVIDIA, Adobe,
Chroma) shows more tokens in a single context _degrades_ performance (13.9-85% accuracy drop
as length increases)[^3][^4][^5]. Multi-agent solves this by distributing tokens across separate
windows — the fundamental architectural justification for agent teams.

**Confidence: HIGH** (Kim et al. + Anthropic + 7+ context dilution studies)

## Finding 2: Classify-Then-Route Pattern Is Proven But Underdeployed

Multiple working implementations demonstrate that classifying question type before selecting
strategy improves accuracy and efficiency: n8n Adaptive RAG (4-type classification), LangGraph
Adaptive RAG, Meilisearch (4 types with fallback escalation), Kore.ai Adaptive-RAG[^6][^7][^8][^9].
Select-then-Route (EMNLP 2025) provides rigorous validation[^10].

Yet no major commercial tool implements this. OpenAI Deep Research uses a single pipeline[^11].
Perplexity requires manual mode control[^12]. Google has implicit sensitivity through E-E-A-T
but no explicit classification[^13].

All implementations converge on 4-5 categories. For compound questions, query decomposition
handles this (Haystack, NVIDIA, AAAI 2023)[^14][^15][^16].

**Confidence: HIGH** (4+ implementations + domain evidence; no major tool does this = differentiator)

## Finding 3: Evidence Hierarchies Must Vary by Question Type

Four independent domains confirm:

- **Evidence-based medicine**: Different "levels of evidence" for different question types (RCTs
  for therapy, cohort studies for prognosis, blind comparisons for diagnostics)[^17][^18]
- **Library science**: Four question levels with escalating research requirements[^19]
- **Consumer evaluation**: Expert testing + user satisfaction data as primary evidence (opposite
  of medical hierarchy)[^20][^21]
- **Fact-checking**: Core methodology focuses exclusively on verifiable claims[^22]

ACRL Framework: "Authority is Constructed and Contextual" — source credibility depends on the
information need[^23]. Reddit is noise for health questions but signal for community opinion[^24].

**Confidence: HIGH** (4 independent professional domains)

### Proposed Question-Type Taxonomy

| Question Type               | Evidence Priority                        | Source Hierarchy                                                 | Synthesis Approach                                    |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Factual/verifiable**      | Government databases, official records   | Authoritative ref > primary sources > news                       | Aggregate reasoning quality (AoR)                     |
| **Scientific/health**       | Systematic reviews, RCTs, cohort studies | Peer-reviewed > gov health > expert > anecdotal                  | Evidence pyramid with study quality flags             |
| **Consumer/recommendation** | Expert testing + user satisfaction data  | Expert reviewers > enthusiast forums > specs > ads               | Ranked recommendations (top/runner-up/budget)         |
| **Technical/comparative**   | Documentation, benchmarks, adoption data | Official docs > code examples > expert blogs > SO/Reddit         | Working implementations + benchmarks                  |
| **Opinion/sentiment**       | Community forums, surveys, social media  | Reddit/forums > blogs > news > academic surveys                  | Map distribution of views, assess representativeness  |
| **Contested/controversial** | Multiple perspectives required           | Academic > think tanks > news analysis > advocacy (label biases) | Structure debate (MODS pattern), never single-verdict |
| **Emerging/frontier**       | Recent sources only                      | Conference papers > expert blogs > vendor announcements          | Findings with recency/instability caveats             |

## Finding 4: Dynamic Roles and Complementarity Trump Fixed Assignments

Multiple 2025 papers converge on dynamic role assignment > fixed roles: MetaGen (arXiv Jan 2026),
MLC (ACL 2025), OSC (EMNLP 2025), AMAS (EMNLP Industry 2025), Heterogeneous Swarms[^25][^26][^27][^28][^29].

Production systems use **topic-angle decomposition** (diversify by sub-question) not
**functional-role decomposition** (searcher/critic/synthesizer)[^2][^30]. Practical pattern:
topic decomposition during exploration, functional stages in the pipeline.

Complementarity > diversity (NeurIPS Workshop 2025)[^31]. Implicit consensus with partial
diversity outperforms forced agreement (EMNLP 2025)[^32]. DMoA (ICLR 2025): optimal
diversity-consistency balance varies by task — factual favors consistency, exploratory
favors diversity[^33].

**Confidence: HIGH** (architecture pattern); **MEDIUM** (complementarity measurement in practice)

## Finding 5: Three-Stage Effort Calibration

**Pre-research classification**: Question type, structural complexity, user intent. Anthropic's
production rules: 1 agent/3-10 calls (simple), 2-4 subagents/10-15 calls (comparison),
10+ subagents (complex research)[^2].

**Mid-research adaptation**: Monitor source novelty, contradiction density, coverage adequacy.
Dynamic subagent spawning only if warranted.

**Stopping criteria**: Coverage-based (2+ sources per claim, citation convergence) + budget caps
(OpenAI: 30-60 searches, 120-150 fetches, 20-30 min)[^34].

Task complexity — not instruction specificity — drives failure (Tech Policy Institute, N=575):
complexity reduces success by 24-37pp, instruction specificity only 8.6pp (not significant)[^35].

Library science "reference interview" has AI analogs: STaR-GATE (72% preference), Ask-before-Plan
(97.3% planning accuracy)[^36][^37]. Safest design: auto-classify, present plan, allow override.

**Confidence: HIGH** (multi-source convergence)

## Finding 6: Synthesis Strategy Should Vary Along the Fact-Opinion Spectrum

No current tool adapts synthesis by question type[^38][^39].

- **Factual**: Aggregation of Reasoning > majority voting (1-12% improvement)[^40]
- **Contested/debatable**: MODS framework (38-59% better coverage/balance) structures debate[^41];
  Plurals (CHI 2025) creates deliberative panels[^42]
- **Confidence language**: Medium verbalized uncertainty optimizes trust (Xu et al., N=156)[^43];
  Kent's WEPs partially usable by LLMs but need calibration (Tang et al., 2026)[^44][^45]
- **Recommendations**: Biased/opinionated AI improves user decision-making (Lai et al., N=2500)[^46];
  default to recommendation with dissent, not false balance

**Confidence: HIGH** (peer-reviewed experimental studies)

## Finding 7: IC Tradecraft Provides Battle-Tested Analytical Frameworks

CIA Structured Analytic Techniques[^47][^48]:

- **ACH** (Analysis of Competing Hypotheses) — array evidence against hypotheses, focus on disproving
- **Key Assumptions Check** — surface and challenge unstated assumptions
- **Quality of Information Check** — systematic source reliability assessment

Toulmin argumentation model (Data → Warrant → Claim + Qualifier + Rebuttal) forces explicit
identification of inferential steps[^49][^50]. Useful analytically for lead's synthesis reasoning.

**Confidence: HIGH** (established government/academic frameworks)

---

## Key Conflicts Resolved

1. **"More tokens help" vs "more tokens hurt"**: Both true. Multi-agent distributes tokens across
   separate context windows (helps) rather than stuffing one window (hurts).

2. **Kim et al. diminishing returns vs Anthropic 90.2% gains**: Research is parallelizable
   (where Kim et al. found the largest gains). The 45% saturation threshold applies to sequential tasks.

3. **Centralized vs decentralized**: Anthropic's "centralized" is actually centralized-independent
   hybrid — orchestrator assigns/synthesizes, subagents work independently during exploration.
   Captures decentralized benefits with centralized quality control.

---

## Key Gaps (Unresolved)

- No head-to-head comparison of question-type-adaptive vs one-size-fits-all research agents
- No automated method for detecting information cascades (many sources citing one original)
- No formal "fact-opinion spectrum" framework for routing synthesis strategies
- Source diversity vs quality tradeoffs remain under-theorized
- Cost-effectiveness curves for agent scaling are unpublished
- Self-reflection + extended thinking interaction with multi-agent coordination understudied

---

## Design Implications for Skill Redesign

1. **Add question-type classification as Phase 0** — lightweight LLM classification into 4-5 types,
   with decomposition for compound questions
2. **Replace static quick/standard/deep with dynamic effort calibration** — auto-classify complexity,
   suggest tier, allow override, adapt mid-research
3. **Vary source evaluation by question type** — different source hierarchies per type
4. **Vary synthesis strategy by question type** — AoR for factual, MODS for contested,
   recommendations for consumer, opinion mapping for sentiment
5. **Use calibrated confidence language** — Kent-style WEPs with explicit probability ranges
6. **Keep centralized-independent hybrid** — validated by production systems and academic research
7. **Keep topic-angle decomposition** — validated over functional-role decomposition for research
8. **Add file-based persistence** — lead writes report + state files, researchers write findings to disk,
   enables cross-session resumability
9. **Smarter clarification** — skip for simple factual, decompose for compound, plan-present for complex

---

## Sources

[^1]: Kim et al., "Towards a Science of Scaling Agent Systems," arXiv:2512.08296, Dec 2025
[^2]: Anthropic Engineering, "How we built our multi-agent research system," Jun 2025
[^3]: Liu et al., "Lost in the Middle," Stanford/Meta, TACL 2024
[^4]: "Context Length Alone Hurts," arXiv, Oct 2025
[^5]: Chroma, "Context Rot," Jul 2025
[^6]: n8n, "Adaptive RAG with Query Classification"
[^7]: LangChain, "LangGraph Adaptive RAG"
[^8]: Meilisearch, "Adaptive RAG Explained," Sep 2025
[^9]: Kore.ai, "Adaptive-RAG," 2024
[^10]: "Select-then-Route," EMNLP 2025 Industry Track
[^11]: OpenAI, "Deep Research API Introduction," Jun 2025
[^12]: Data Studios, "Perplexity AI Prompting Techniques," Dec 2025
[^13]: Agenxus, "Google AI Overviews Source Prioritization," Nov 2025
[^14]: Haystack, "Advanced RAG: Query Decomposition," Sep 2024
[^15]: NVIDIA, "Query Decomposition for RAG Blueprint"
[^16]: "Question Decomposition Tree," AAAI 2023
[^17]: NHMRC Evidence Hierarchy
[^18]: Icahn School of Medicine, "Evidence Based Medicine"
[^19]: Hepler & Horalek, "Introduction to Library and Information Science"
[^20]: Wirecutter, "Anatomy of a Guide," May 2024
[^21]: Consumer Reports, "Rating Methods"
[^22]: Ballotpedia, "Methodologies of Fact-Checking"
[^23]: ACRL Framework for Information Literacy
[^24]: White, "Reddit as Analogy for Scholarly Publishing," 2019
[^25]: MetaGen, arXiv, Jan 2026
[^26]: MLC, ACL 2025
[^27]: OSC, EMNLP 2025
[^28]: AMAS, EMNLP Industry 2025
[^29]: Heterogeneous Swarms, OpenReview 2025
[^30]: O-Researcher, arXiv:2601.03743, Jan 2026
[^31]: Zhang, "Mixture of Complementary Agents," NeurIPS Workshop 2025
[^32]: Wu & Ito, "The Hidden Strength of Disagreement," EMNLP 2025
[^33]: "Balancing Act: DMoA," ICLR 2025
[^34]: PromptLayer, "How OpenAI's Deep Research Works," Oct 2025
[^35]: Lovin & Wallsten, Tech Policy Institute, Nov 2025
[^36]: STaR-GATE, arXiv, 2024
[^37]: Ask-before-Plan, 2024
[^38]: 7minute.ai, "OpenAI vs Google Deep Research," 2025
[^39]: Venkit et al., "Search Engines in an AI Era," 2024
[^40]: Sun et al., "AoR," LREC-COLING 2024
[^41]: Xiao et al., "MODS," NAACL 2025
[^42]: Bakker et al., "Plurals," CHI 2025
[^43]: Xu et al., "Confronting Verbalized Uncertainty," IJHCS 2025
[^44]: Kent, "Words of Estimative Probability," CIA/CSI
[^45]: Tang et al., npj Complexity 2026
[^46]: Lai et al., arXiv:2508.09297, 2025
[^47]: CIA Tradecraft Primer, 2009
[^48]: RAND, RR1408, 2016
[^49]: Verheij, "The Toulmin Argument Model in AI," 2009
[^50]: Freedman et al., "Argumentative LLMs," AAAI 2025

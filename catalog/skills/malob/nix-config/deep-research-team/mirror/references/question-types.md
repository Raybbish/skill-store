# Question Type Classification Reference

Classify the user's question into one or more types before planning research. For compound
questions, decompose into sub-questions and classify each independently.

## Taxonomy

| Type                  | Signals                                                    | Example Questions                                            |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| **Factual**           | Verifiable claims, dates, numbers, "what is", "how many"   | "What year was GDPR enacted?" "How many GPUs did GPT-4 use?" |
| **Scientific/Health** | Medical, biological, clinical, "is X safe", evidence-based | "Does intermittent fasting reduce inflammation?"             |
| **Consumer**          | "Best X for Y", recommendations, buying decisions          | "Best noise-cancelling headphones under $300 for travel?"    |
| **Technical**         | APIs, tools, benchmarks, "how to", architecture decisions  | "Redis vs Memcached for session caching at 10k RPS?"         |
| **Opinion/Sentiment** | "What do people think", community views, satisfaction      | "How do developers feel about Tailwind CSS in 2026?"         |
| **Contested**         | Political, ethical, actively debated, no consensus         | "Should AI models be open-sourced?"                          |
| **Emerging/Frontier** | Very recent, rapidly evolving, limited sources             | "What are the leading approaches to LLM reasoning in 2026?"  |

## Compound Question Decomposition

Many real questions span multiple types. Decompose and classify each part:

> "What's the best RAG framework, and is RAG even the right approach for my use case?"

- Sub-question 1: "What's the best RAG framework?" -> **Technical** (comparison)
- Sub-question 2: "Is RAG the right approach for [use case]?" -> **Technical** (architecture decision)

> "Is creatine safe, and which brand should I buy?"

- Sub-question 1: "Is creatine safe?" -> **Scientific/Health**
- Sub-question 2: "Which brand should I buy?" -> **Consumer**

**Ordering rule for compound questions:** Investigate higher-complexity sub-questions first
(Contested > Emerging > Scientific > Technical > Consumer > Opinion > Factual). Later
sub-questions often depend on earlier answers.

## Type-to-Scope Defaults

Each type has a natural default scope. Present the recommended scope with brief rationale
and let the user confirm. Then apply the scope modifiers below to adjust.

| Type                  | Default Scope | Rationale                                        |
| --------------------- | ------------- | ------------------------------------------------ |
| **Factual**           | Focused       | Few authoritative sources suffice                |
| **Scientific/Health** | Broad         | Need evidence hierarchy across study types       |
| **Consumer**          | Broad         | Need expert reviews + user satisfaction + specs  |
| **Technical**         | Broad         | Need docs + benchmarks + practitioner experience |
| **Opinion/Sentiment** | Broad         | Need representative sample across communities    |
| **Contested**         | Comprehensive | Must steelman all major positions                |
| **Emerging/Frontier** | Comprehensive | Sources are sparse; need breadth to find them    |

### Scope Modifiers

After identifying the default scope, check for these signals to adjust up or down one tier.

**De-escalate one tier when:**

- **Consumer**: Narrow category with fewer than 5 viable options and established expert
  reviews (e.g., "best USB-C hub for MacBook"). When expert consensus is clear, Round 2
  adds only marginal value.
- **Scientific/Health**: Single well-established finding with existing meta-analyses and no
  active controversy over mechanisms.
- **Technical**: Well-documented comparison with published benchmarks and clear community
  consensus (e.g., mature tools with head-to-head comparisons already available).
- **Opinion/Sentiment**: Question targets a single community with low controversy.

**Escalate one tier when:**

- **Factual**: Preliminary search reveals conflicting sources or the fact is embedded in a
  contested narrative.
- **Consumer**: Emerging product category with sparse or unreliable reviews.
- **Technical**: Novel or niche tools with sparse documentation, or the question involves
  architectural tradeoffs without clear benchmarks.
- **Opinion/Sentiment**: Cross-community disagreement, politically charged, or culture-war
  adjacent topics.
- **Any type**: Compound question with 3+ sub-questions of different types.

**Do not use this skill when:**

- The question is answerable with 1-2 web searches.
- The question is a simple factual lookup with a single authoritative source.
- The question is about debugging, code, or tasks better handled inline.

## Classification Procedure

1. Read the question. Identify surface signals (keywords, phrasing, domain).
2. Check for compound structure. If present, decompose into sub-questions.
3. Assign a primary type to each sub-question (or the whole question if simple).
4. Note the default scope from the table above.
5. Proceed to Phase 1 (Clarify) with the classification ready.

Classification is silent -- do not present it to the user. It informs scope defaults,
source evaluation priorities, and synthesis template selection.

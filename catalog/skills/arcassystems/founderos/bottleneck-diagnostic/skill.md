---
name: bottleneck-diagnostic
description: Find the real bottleneck in the business. Say "what's blocking me", "why does everything route through me", "can the business run without me", or "where am I the bottleneck". Scores founder dependency across five practical dimensions and names the highest-impact thing to shed.
why: "Names the one dimension where your presence is most costly so you can stop guessing and start shedding the right role first."
enhance: "Answer all five dimension questions honestly in self-assessment mode - the score is only as accurate as the examples you give for each dimension."
allowed-tools: ["Read", "Write"]
mcp_requirements: []
---

# Bottleneck Diagnostic

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

This diagnostic finds where the business depends too much on the founder. It can run as a self-assessment or as an external assessment from public signals.

## Modes

### Mode 1 - Self-Assessment

Use when the founder answers directly.

### Mode 2 - External Assessment

Use when the founder is assessing a prospect, partner, or company from public evidence.

## Dimensions

Each dimension scores 0 to 20. Higher means more dependency.

### 1. Decision Dependency

Question: Can decisions happen without the founder in the room?

Self-assessment prompts:

- How many decisions per week require your approval?
- If you were unreachable for 48 hours, what would stop?
- Does the team decide and inform you, or ask first?
- When did someone make a call you disagreed with and you let it stand?

Public signals:

- Founder appears to approve every visible action.
- No leadership team is visible.
- Hiring posts route operational roles to the founder.

### 2. Client Dependency

Question: Do clients buy the company or the founder?

Self-assessment prompts:

- What percentage of clients would leave if you stopped servicing them?
- Can someone else close a new deal without you?
- Do clients call your personal phone for business issues?

Public signals:

- Testimonials name the founder, not the company.
- Founder is the face of every case study and pitch.
- No account ownership is visible.

### 3. Process Dependency

Question: Are operations in a system or in the founder's head?

Self-assessment prompts:

- If you hired your replacement tomorrow, how long would handover take?
- How many core processes are documented?
- When something breaks, does the team follow a process or call you?

Public signals:

- Repeated hiring for the same role.
- Vague job posts.
- Founder content mentions being buried in operations.

### 4. Revenue Dependency

Question: Can revenue continue without daily founder input?

Self-assessment prompts:

- What happens to revenue if you take 30 days off?
- Who creates new leads?
- Can the team deliver from start to finish without you?

Public signals:

- No visible sales or marketing system.
- Founder is the only content channel.
- Revenue appears tied to founder activity.

### 5. Growth Capacity

Question: Can the company grow beyond founder hours?

Self-assessment prompts:

- Have you turned down work because you were full?
- Is revenue capped by your personal time?
- What is the biggest growth constraint right now?

Public signals:

- Founder runs several active fronts personally.
- Team hiring looks reactive.
- Public story centers on being too busy.

## Score Bands

| Total | Grade | Meaning |
|---|---|---|
| 0-25 | A | Low founder dependency |
| 26-45 | B | Some dependency, manageable |
| 46-65 | C | Significant dependency |
| 66-85 | D | High dependency |
| 86-100 | F | Critical dependency |

## Output Format

```text
FOUNDER DEPENDENCY SCORE: <X>/100 - Grade <A-F>

WHERE DEPENDENCY LIVES
1. Decision dependency: <X>/20 - <one-line evidence>
2. Client dependency: <X>/20 - <one-line evidence>
3. Process dependency: <X>/20 - <one-line evidence>
4. Revenue dependency: <X>/20 - <one-line evidence>
5. Growth capacity: <X>/20 - <one-line evidence>

BIGGEST BOTTLENECK
<highest-scoring dimension and what it means>

ONE MOVE THAT WOULD CHANGE THE MOST
<one specific action>

CONFIDENCE
High / medium / low based on evidence quality.
```

## Routing

| Highest Dimension | Next Skill |
|---|---|
| Decision dependency | decision-framework or approval-gates |
| Client dependency | client-update or proposal-writer |
| Process dependency | sop-writer |
| Revenue dependency | priority-triage and linkedin-post |
| Growth capacity | strategic-analysis |

## Rules

- Explain scores with evidence, not judgment.
- If evidence is thin, lower confidence instead of inventing certainty.
- High score means high dependency.
- No em dashes, no en dashes, no banned words.

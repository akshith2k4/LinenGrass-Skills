---
name: grill-me-all-at-once
description: Use when you want a plan, design, or decision stress-tested in a single pass. Presents the entire questionnaire upfront — every question, every recommended answer — rather than asking one round at a time. Use when you prefer batch answers over interactive back-and-forth, or when async review is needed.
disable-model-invocation: true
metadata:
  author: LinenGrass
  tags:
    - architecture
    - decision-making
    - alignment
---

# Grill Me — All at Once

## What Changed From the Original
The original grilling skill works a design tree in rounds: it asks only the questions whose prerequisites are already settled (the frontier), waits for answers, then recomputes the frontier and asks the next round.

This variant removes the rounds. It maps the full design tree, then presents every question in a single numbered questionnaire upfront — including questions that depend on others. The developer answers what they can in one pass, skips or marks dependencies where needed, and the agent resolves the rest in a single follow-up.

## The Process

### Step 1 — Map the Design Tree
Identify every decision that hangs off the plan, not just the first layer. A decision is a question whose answer changes what gets built, how it is built, or what is explicitly out of scope.

Group the questions into sections so the questionnaire is navigable:

- **Goal & Scope** — what problem, what success looks like, what is excluded
- **Constraints** — deadlines, budgets, compliance, team capacity
- **Technical Approach** — architecture, data model, integrations, failure modes
- **Risks & Trade-offs** — what could go wrong, what is acceptable
- **Edge Cases** — what happens at boundaries, under load, on error

### Step 2 — Answer Facts Yourself
Before writing a single question, dispatch sub-agents or use tools to resolve every fact the questionnaire might need (codebase patterns, existing config, dependency versions, prior art). Never ask the developer for something you can look up. The original skill states this directly: "Finding facts is your job, never the user's". Carry that rule forward.

### Step 3 — Write the Full Questionnaire
For every question in the tree, produce one numbered entry with four fields:

| Field | Content |
| :--- | :--- |
| **Question** | One clear decision to be made |
| **Recommended answer** | Your default, grounded in what you found in Step 2 |
| **Why this matters** | One line on what changes based on the answer |
| **Depends on** | The question number(s) whose answers could change this one — or none |

Format each entry like this:

❓ **Q1** — [Goal] What is the single most important outcome for this change?  
   ➡ Recommended: [answer]  
   🔗 Why: Determines whether we optimize for speed or correctness.  
   🧩 Depends on: none  

❓ **Q4** — [Technical] Should this be a new service or a module in the existing API?  
   ➡ Recommended: [answer]  
   🔗 Why: Changes deployment, ownership, and rollback strategy.  
   🧩 Depends on: Q1, Q2  

### Step 4 — Present Everything in One Message
Output the complete questionnaire in a single response, organized by section. Do not wait for answers between sections or questions.

At the top, include a short instruction block:

```text
Answer as many as you can in one reply. For any question marked
"Depends on", you can either answer it conditionally
("if Q2 is X, then Y") or leave it blank and I will follow up
only on what is still unresolved. Reply "use recommended" for
any question where my default is fine.
```

### Step 5 — Resolve in One Follow-Up
After the developer replies:

1. **Check for dependency conflicts**. If an answer to Q1 contradicts an answer to Q4 that was marked "Depends on: Q1", flag it explicitly and ask only that one clarification.
2. **Fill gaps with recommendations**. If the developer said "use recommended" or left a non-dependent question blank, lock in the recommended answer and state that you did so.
3. **Ask only the genuinely blocked questions**. These are the questions the developer could not answer because their prerequisite was itself unanswered. This should be a short list — if it is long, the questionnaire was poorly scoped, not the developer's fault.

### Step 6 — Confirm Shared Understanding
Before any implementation begins, restate the settled decisions as a compact table (Question → Decision → Source: user / recommended / derived) and ask the developer to confirm. The original skill's completion rule still applies: do not act until the user confirms shared understanding.

## Anti-Patterns
- **Do not dump 40 questions with no structure**. Group by section, number continuously, and mark dependencies.
- **Do not ask facts**. If the answer is in the repo or the docs, find it. Asking the developer erodes trust in the skill.
- **Do not silently resolve a dependency conflict**. If Q1 and Q4 contradict, surface it — do not pick one without telling the developer.
- **Do not skip the confirmation step**. "All at once" changes the asking model, not the alignment requirement.

## When This Variant Is the Wrong Choice
The original round-based skill exists for a reason: questions whose prerequisites are unsettled are hard to answer well in a vacuum. Use this variant when:

- The developer explicitly wants batch/async review
- The decision tree is shallow or the dependencies are weak
- You are preparing a questionnaire for someone else to fill in later

For deeply nested decisions where each answer reshapes the next question, the original grilling skill will produce higher-quality answers.

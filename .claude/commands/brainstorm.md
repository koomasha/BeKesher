---
description: "Brainstorm ideas with codebase context - explore options and constraints"
---

# Brainstorm Ideas

## Topic: $ARGUMENTS

## Mission

Explore ideas and options for a feature, grounded in codebase reality. Create a **living document** we'll iterate on together - understanding constraints, exploring approaches, and refining the direction before committing to a full plan.

## Process

### 1. Understand the Idea

- What's the core concept?
- What problem does it solve?
- Who benefits?

### 2. Codebase Reality Check

Analyze the codebase to understand:
- **What exists**: Related features, patterns, components we'd build on
- **Constraints**: Technical limitations, architectural boundaries, dependencies
- **Opportunities**: Existing code we can leverage, patterns that fit naturally
- **Risks**: What could make this hard or messy?

### 3. Generate Options

Present **2-4 approaches** with honest tradeoffs:

```markdown
### Option A: [Name]
**Approach**: How it would work
**Leverages**: What existing code/patterns it uses
**Constraints**: What limits or shapes this approach
**Effort**: Low/Medium/High
**Risk**: What could go wrong
```

### 4. Open Questions

List questions that need answering before deciding:
- Technical unknowns
- User experience decisions
- Scope clarifications

## Output File
- Filename: .docs/brainstorming/{branch-name}-brainstorm-{yyyymmdd-hhmm}-{brainstorm-topic}.md
- Directory: Create .docs/brainstorming if it doesn't exist

## Output Format

```markdown
# Date: {datetime}
# Branch: {branch-name}
# Brainstorm: {Topic}
# Status: (e.g., Exploration, Decision Made, Pending Research)

## The Idea
{What we're exploring}

## Codebase Context

### What We Have
- {Existing relevant code/features}

### Constraints
- {Technical limitations}
- {Architectural boundaries}

### Opportunities  
- {Code we can reuse}
- {Patterns that fit}

## Options

### Option A: {Name}
**Approach**: ...
**Leverages**: ...
**Constraints**: ...
**Effort**: Low/Medium/High

### Option B: {Name}
...

## Open Questions
- {Questions to resolve}

## Current Direction
{Which option we're leaning toward and why - update as we discuss}

## Notes
{Capture decisions and insights as we iterate}
```

## Guidelines

**This is exploration, not planning:**
- No task lists or step-by-step instructions
- No implementation details or code
- Focus on "what" and "why", not "how"

**Keep it collaborative:**
- Create the initial doc, then discuss
- Update the doc as we refine ideas
- The doc evolves with our conversation

**Be honest about constraints:**
- Don't hide complexity
- Surface risks early
- Ground options in codebase reality
---
description: Capture current brainstorming, decisions, and pivots into a timeline-aware session file
argument-hint: [brainstorm-topic]
---

# Session Brainstorm: Mental State Sync

## Overview
Summarize the current session to ensure continuity. These files serve as the "active memory" for the Prime agent.

## Output File
- Filename: .docs/brainstorming/{branch-name}/context-{yyyymmdd-hhmm}-{brainstorm-topic}.md
- Directory: Create .docs/brainstorming/{branch-name} if it doesn't exist

## Session Structure

### 1. Timeline & Context
- **Date**: {datetime}
- **Branch**: {branch-name}
- **Topic**: {brainstorm-topic}
- **Status**: (e.g., Exploration, Decision Made, Pending Research)
- **Related md files**: In case there are related md files (plans, brainstorm etc) adress them here and explain how they are realted

### 2. Decision Log
- List specific decisions made during this chat.
- Reference Blueprint Hierarchy (Data, Logic, or Style).

### 3. Open Threads
- Unresolved questions or ideas to be explored in future sessions.

## Instructions
- **Distill Intent**: Summarize the most recent conversation turns, focusing on pivots and hard decisions.
- **Timeline Logic**: Write this file to be consumed chronologically. Use clear date headers.
- **Archive Awareness**: Remind the user that irrelevant brainstorms should be moved to `.docs/brainstorming/archive/` to be ignored by the Prime agent.
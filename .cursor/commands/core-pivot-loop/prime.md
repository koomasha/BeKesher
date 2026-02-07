---
name: prime
description: Prime agent with codebase understanding
---

# Prime: Load Project Context

## Objective

Build comprehensive understanding of the codebase by analyzing structure, documentation, and key files.

## Process

### 1. Analyze Project Structure

List all tracked files:
!`git ls-files`

Show directory structure:
On Linux, run: `tree -L 3 -I 'node_modules|__pycache__|.git|dist|build'`

### 2. Read Core Documentation & Brainstorming Timeline
- Read all .md files or similar global rules file in the root, `.docs/` and `docs/`.
- **Brainstorming Sync**: Read all files in `.docs/brainstorming/` EXCEPT those in the `archive/` subfolder.
- **Chronological Processing**: Use the `{yyyymmdd}` prefix in filenames to build a timeline of decisions, ensuring the most recent brainstorms override older conflicting ones.
- Read README files at project root and major directories
- Read any architecture documentation

### 3. Identify Key Files

Based on the structure, identify and read:
- Main entry points (App.tsx, index.ts, main.py, app.py, etc.)
- Core configuration files (pyproject.toml, package.json, tsconfig.json)
- Key model/schema definitions. Search for any `.sql`, `.prisma`, `schema.graphql`, or `models.py` files that define the data structure.
- Workflow & Logic Exports: Search for large `.json` or `.yaml` files in the root, `docs/` or `.docs/` that may contain exported logic (e.g., n8n workflows, Postman collections, or CI/CD pipelines).
- Design & Identity: Search for any `.pdf` or directory named `branding`, `assets`, or `design` that contains project-level visual or functional guidelines.
- Important service or controller files
- Read any .env.example or environment configuration to identify external service dependencies.

### 4 Analyze Complex Data Structure   

#### 4.1 Map Structure & Identify Complexity

Identify "Complexity Hotspots":
- Search for directories containing `package.json`, `tsconfig.json`, `pyproject.toml`, or `src/` folders.
- For each hotspot, run: `find <directory-path> -type f | wc -l` to determine file density.
- For directories with >15 files or a `src/` folder, run a deeper tree: `tree <directory-path> -L 4 -I 'node_modules|dist|build'`
- For simple directories (e.g., those with only `.html` or `.css`), perform only a surface `ls`.

#### 4.2 Deep-Scan Complexity Hotspots
For each "Complexity Hotspot" identified in Previous Step:
- **Analyze Architecture**: Determine the pattern (e.g., Layered, Hexagonal, Feature-based).
- **Scan Logic Hubs**: Read files in folders named `services/`, `hooks/`, `store/`, `api/`, or `utils/`.
- **Examine Entry Points**: Read the main configuration and routing files (e.g., `App.tsx`, `main.ts`, `routes.js`).
- **Data Flow**: Specifically identify how this sub-directory communicates with external services (like the n8n webhooks mentioned in your documentation).

### 5. Understand Current State

Check recent activity:
!`git log -10 --oneline`

Check current branch and status:
!`git status`

## Output Format

Filename: .docs/prime-report/{branch-name}/{date-in-format-yyyymmdd-hhmm}.md

Replace: {date-in-format-yyyymmdd-hhmm} with date in format yyyymmdd-hhmm 
Examples: 20261129-1134.md, 20261130-2345.md, 20260401-0900.md
Replace: {branch-name} with the current branch name
Directory: Create .docs/prime-report/{branch-name} if it doesn't exist

## Output Report

Provide a concise summary covering:

### Project Overview
- Purpose and type of application
- Primary technologies and frameworks
- Current version/state

### Architecture
- Overall structure and organization
- Key architectural patterns identified
- Important directories and their purposes

### Sub-System Deep Dives
- **Logic Hubs**: For each identified complex directory (e.g., `admin-dashboard`), describe its internal architecture (Feature-based, Layered, etc.).
- **State & Data Flow**: Explain how these hubs manage data—specifically how they interface with n8n and Supabase.
- **Component Patterns**: Note how the UI is structured (e.g., shared components vs. page-specific logic).

### Tech Stack
- Languages and versions
- Frameworks and major libraries
- Build tools and package managers
- Testing frameworks

### Core Principles
- Code style and conventions observed
- Documentation standards
- Testing approach

### Current State
- Active branch
- Recent changes or development focus
- Any immediate observations or concerns

**Make this summary easy to scan - use bullet points and clear headers.**
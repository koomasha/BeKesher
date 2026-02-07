---
description: Post-execution code cleanup and quality assurance
argument-hint: [optional: specific-file-or-directory]
---

# Cleanup: Post-Execution Code Quality Assurance

## Mission

Perform comprehensive code cleanup after implementation to ensure production-ready quality. This command transforms working code into **clean, maintainable, well-documented code**.

**Core Philosophy:**
- Code is read 10x more than it's written - optimize for readability
- Comments explain "why", code explains "what"
- DRY (Don't Repeat Yourself) - but not at the cost of clarity
- Every line should justify its existence

## Scope

If `$ARGUMENTS` is provided, focus cleanup on that file/directory.
Otherwise, analyze all recently changed files using git.

---

## Phase 1: Detect Project Type & Tools

Before starting cleanup, identify available tools:

**Check for:**
- Package manager: `package.json` (npm/yarn/pnpm), `pyproject.toml`/`requirements.txt` (Python), `Cargo.toml` (Rust), `go.mod` (Go)
- Linting: ESLint, Prettier, Ruff, Black, Clippy, golangci-lint
- Type checking: TypeScript, mypy, pyright
- Testing: Jest, Vitest, pytest, go test
- Build tools: Vite, webpack, esbuild, cargo, go build

**Adapt validation commands based on what's available in the project.**

---

## Phase 2: Code Quality Analysis

### 2.1 Identify Changed Files

Run git commands to understand scope:

```bash
git status
git diff --stat HEAD~5
git ls-files --others --exclude-standard
```

Read each changed file **in its entirety** to understand full context.

### 2.2 Comment Audit

**REMOVE comments that:**
- State the obvious (e.g., `// increment counter` above `counter++`)
- Describe what code does when code is self-explanatory
- Are outdated or no longer accurate
- Are TODO/FIXME that were addressed
- Are commented-out code blocks (delete them!)

**KEEP/IMPROVE comments that:**
- Explain **why** something is done (business logic, edge cases)
- Document non-obvious behavior or gotchas
- Provide context for complex algorithms
- Reference external documentation or tickets
- Explain workarounds for known issues

### 2.3 Code Duplication Detection

Look for duplicated patterns and:
- Extract repeated code into shared utilities
- Create custom hooks for repeated React patterns (if applicable)
- Consolidate similar API calls into shared functions
- Use constants for repeated magic strings/numbers

### 2.4 Naming Consistency

Check for:
- Consistent naming conventions (follow project's existing style)
- Descriptive variable names (no single letters except loop indices)
- Boolean variables start with `is`, `has`, `should`, `can`
- Event handlers start with `handle` or `on`

---

## Phase 3: Code Cleanup Actions

### 3.1 Remove Dead Code

- Unused imports
- Unused variables and functions
- Unreachable code paths
- Debugging code left behind (console.log, print statements, debugger)
- Backward compatibility code no longer needed

### 3.2 Simplify Complex Code

- Use early returns instead of deep if/else nesting
- Extract complex conditions into named booleans
- Use language-appropriate null-safe operators
- Use collection methods instead of loops where appropriate

### 3.3 Type Safety

- Add missing type annotations
- Replace `any`/`object`/`dict` with proper types where possible
- Ensure function return types are explicit for public APIs

### 3.4 Error Handling

- Ensure async operations have proper error handling
- Add meaningful error messages
- Don't swallow errors silently

---

## Phase 4: Documentation Updates

### 4.1 Check Project Documentation

Read existing documentation files and update them for any significant changes:
- New API endpoints
- New features or components
- Architecture changes
- New environment variables or configuration

### 4.2 Update Project Rules

If cleanup reveals patterns that should be documented:
- Update `.cursor/rules` or project rules with new conventions
- Add common patterns to prevent future inconsistencies

---

## Phase 5: Validation

Run validation commands appropriate for the detected project type:

**TypeScript/JavaScript:**
```bash
npx tsc --noEmit  # Type checking
npm run lint      # If lint script exists
```

**Python:**
```bash
python -m mypy .  # If mypy configured
ruff check .      # If ruff configured
```

**Rust:**
```bash
cargo check
cargo clippy
```

**Go:**
```bash
go vet ./...
```

> **Adapt these commands based on what's actually configured in the project.**

### Manual Review Checklist

- [ ] No obvious code duplication remains
- [ ] Comments are meaningful and accurate
- [ ] Naming is consistent and descriptive
- [ ] No dead code or debugging artifacts
- [ ] Error handling is comprehensive
- [ ] Types are properly defined
- [ ] Documentation is up to date

---

## Phase 6: Output Report

Provide a structured cleanup report:

```markdown
## Cleanup Report

### Files Analyzed
- [list of files reviewed]

### Changes Made
- Removed: [count] lines of dead code
- Extracted: [count] duplicated patterns into utilities
- Fixed: [count] type/lint issues
- Updated: [list of docs updated]

### Validation Results
- Type check: ✅ Pass / ❌ [error count] errors
- Lint: ✅ Pass / ❌ [error count] errors

### Remaining Items
- [Any issues that need manual attention]
```

---

## Important Rules

1. **Don't over-engineer** - Simple is better than clever
2. **Don't remove useful comments** - When in doubt, keep it
3. **Don't change behavior** - Cleanup is refactoring, not feature changes
4. **Test after changes** - Ensure nothing broke
5. **Use existing patterns** - Check for utilities before creating new ones
6. **Follow project conventions** - Don't impose new styles

---

## When to Run This Command

- After completing a feature implementation
- Before creating a pull request
- During code review fixes
- As part of regular maintenance
---
description: Create a Product Requirements Document from conversation
argument-hint: [output-filename]
---

# Create PRD: Generate Product Requirements Document

## Overview

Generate a comprehensive Product Requirements Document (PRD) based on the current conversation context and requirements discussed. Use the structure and sections defined below to create a thorough, professional PRD.

## Output File

Filename: .docs/PRD.md
Directory: Create .docs/ if it doesn't exist

## PRD Structure

Create a well-structured PRD with the following sections. Adapt depth and detail based on available information:

### Required Sections

**1. Executive Summary**
- Concise product overview (2-3 paragraphs)
- Core value proposition
- MVP goal statement

**2. Mission**
- Product mission statement
- Core principles (3-5 key principles)

**3. Target Users**
- Primary user personas
- Technical comfort level
- Key user needs and pain points

**4. MVP Scope**
- **In Scope:** Core functionality for MVP (use ✅ checkboxes)
- **Out of Scope:** Features deferred to future phases (use ❌ checkboxes)
- Group by categories (Core Functionality, Technical, Integration, Deployment)

**5. User Stories**
- Primary user stories (5-8 stories) in format: "As a [user], I want to [action], so that [benefit]"
- Include concrete examples for each story
- Add technical user stories if relevant

**6. Core Architecture & Patterns**
- High-level architecture approach
- Directory structure (if applicable)
- Key design patterns and principles
- Technology-specific patterns

**7. Tools/Features**
- Detailed feature specifications
- If building an agent: Tool designs with purpose, operations, and key features
- If building an app: Core feature breakdown

**8. Technology Stack**
- Backend/Frontend technologies with versions
- Dependencies and libraries
- Optional dependencies
- Third-party integrations

**9. Security & Configuration**
- Authentication/authorization approach
- Configuration management (environment variables, settings)
- Security scope (in-scope and out-of-scope)
- Deployment considerations

**10. API Specification** (if applicable)
- Endpoint definitions
- Request/response formats
- Authentication requirements
- Example payloads

**11. Success Criteria**
- MVP success definition
- Functional requirements (use ✅ checkboxes)
- Quality indicators
- User experience goals

**12. Implementation Phases**
- Break down into 3-4 phases
- Each phase includes: Goal, Deliverables (✅ checkboxes), Validation criteria
- Realistic timeline estimates

**13. Future Considerations**
- Post-MVP enhancements
- Integration opportunities
- Advanced features for later phases

**14. Risks & Mitigations**
- 3-5 key risks with specific mitigation strategies

**15. Appendix** (if applicable)
- **Project Blueprints**: List the specific files identified as the source of truth for the database, workflows, and design (e.g., `db_schema.sql`, `logic_export.json`, `branding.pdf`).
- **Key Dependencies**: Links to or summaries of major libraries and third-party integrations found in the codebase.
- **Repository Structure**: A high-level overview of the directory organization.

## Instructions

### 1. Extract Requirements, Blueprints & System Context
- **Codebase Analysis**: Review the latest `.agents/prime-report/{yyyymmdd}.md` file to ensure the PRD aligns with the existing architecture, technology stack, and "Complexity Hotspots."
- **Documentation Review**: Analyze `docs/`, `.docs/`, `README.md` and all existing `.md` files to capture established business logic, database schemas, and API endpoints.
- **Blueprint Analysis**: Identify the "Source of Truth" files found during the scan (e.g., DB schemas, workflow exports, or branding PDFs) and ensure the PRD requirements align with these existing structures.
- **Dependency Mapping**: Map out how discovered configuration files (like `.env.example` or `n8n.json`) define the system's external boundaries.
- **Conversation History**: Review the current conversation for new feature requests, explicit requirements, and identified pain points (e.g., calculation duplication).
- **Constraint Mapping**: 
    - Identify explicit requirements and implicit needs
    - Note technical constraints and preferences
    - Capture user goals and success criteria
- **Context Synthesis**: Combine current conversation goals with the technical reality found in the latest Prime report.

### 2. Blueprint Hierarchy & Source of Truth

When extracting requirements, prioritize files based on the following hierarchy to ensure technical accuracy:

1. **Data Architecture (The "What")**
   - **Primary**: `db_schema.sql`, `schema.prisma`, `models.py`, `migrations/`
   - **Role**: Defines entities, relationships, and data constraints.
   - **Brainstorming Timeline Analysis**: Review active files in `.docs/brainstorm/` (ignoring the `archive/` folder). Use file dates to establish a timeline of pivots, ensuring the PRD reflects the very latest brainstorming intent even if it hasn't been implemented in the codebase yet.
   - **PRD Impact**: Sections 6 (Architecture) and 10 (API Specification).

2. **Logic & Workflow (The "How")**
   - **Primary**: `n8n.json`, `workflow.yaml`, `routes.ts`, `services/`, `controllers/`
   - **Role**: Defines business rules, automation steps, and data transformations.
   - **PRD Impact**: Section 7 (Tools/Features) and 12 (Implementation Phases).

3. **System Boundaries (The "Where")**
   - **Primary**: `.env.example`, `docker-compose.yml`, `package.json`, `requirements.txt`
   - **Role**: Defines external integrations, dependencies, and environment requirements.
   - **PRD Impact**: Section 8 (Tech Stack) and 9 (Security & Configuration).

4. **Identity & Guidelines (The "Style")**
   - **Primary**: `branding.pdf`, `tailwind.config.js`, `theme.ts`, `DesignSystem.md`
   - **Role**: Defines visual standards, RTL support requirements, and user experience patterns.
   - **PRD Impact**: Section 3 (Target Users) and 11 (Success Criteria).


### 3. Synthesize Information
- Organize requirements into appropriate sections
- Fill in reasonable assumptions where details are missing
- Maintain consistency across sections
- Ensure technical feasibility

### 4. Write the PRD
- Use clear, professional language
- Include concrete examples and specifics
- Use markdown formatting (headings, lists, code blocks, checkboxes)
- Add code snippets for technical sections where helpful
- Keep Executive Summary concise but comprehensive

### 5. Quality Checks
- ✅ All required sections present
- ✅ User stories have clear benefits
- ✅ MVP scope is realistic and well-defined
- ✅ Technology choices are justified
- ✅ Implementation phases are actionable
- ✅ Success criteria are measurable
- ✅ Consistent terminology throughout

## Style Guidelines

- **Tone:** Professional, clear, action-oriented
- **Format:** Use markdown extensively (headings, lists, code blocks, tables)
- **Checkboxes:** Use ✅ for in-scope items, ❌ for out-of-scope
- **Specificity:** Prefer concrete examples over abstract descriptions
- **Length:** Comprehensive but scannable (typically 30-60 sections worth of content)

## Output Confirmation

After creating the PRD:
1. Confirm the file path where it was written
2. Provide a brief summary of the PRD contents
3. Highlight any assumptions made due to missing information
4. Suggest next steps (e.g., review, refinement, planning)

## Notes

- If critical information is missing, ask clarifying questions before generating
- Adapt section depth based on available details
- For highly technical products, emphasize architecture and technical stack
- For user-facing products, emphasize user stories and experience
- This command contains the complete PRD template structure - no external references needed
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**SummaRise** - A content summarization and library management web service that allows users to extract and summarize content from YouTube videos and web articles using LLM APIs (Gemini/OpenAI), with personal archiving capabilities similar to Notion's database views.

## Architecture
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers (API), Supabase (PostgreSQL)
- **Authentication**: NextAuth with credentials, Kakao, and Google providers
- **State Management**: @tanstack/react-query (server), Zustand (client)
- **LLM Integration**: Google Gemini API (primary), OpenAI API (fallback)
- **Content Extraction**: YouTube Transcript API, MarkItDown for web articles

## Common Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Package management
npm install          # Install dependencies (use npm as package manager)

# Supabase (don't run locally - use cloud instance)
# Migrations stored in /supabase/migrations/
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Route Handlers
│   ├── auth/           # Authentication pages
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── ui/             # shadcn/ui components
│   └── auth/           # Authentication components
├── lib/
│   ├── auth.ts         # NextAuth configuration
│   ├── supabase/       # Supabase client/server setup
│   └── utils.ts        # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── third-parties/      # External service integrations
```

## Key Development Guidelines

### Framework-Specific Rules
- **Always use client components** (`"use client"` directive) for all components
- **Use promise for page.tsx params props** (Next.js 15 requirement)
- Use valid picsum.photos URLs for placeholder images
- Follow feature-based directory structure under `src/features/[featureName]/`

### Library Usage
- **Date/Time**: `date-fns`
- **Patterns**: `ts-pattern` for type-safe branching
- **Server State**: `@tanstack/react-query`
- **Client State**: `zustand`
- **Hooks**: `react-use`
- **Utils**: `es-toolkit`
- **Icons**: `lucide-react`
- **Validation**: `zod`
- **Forms**: `react-hook-form`
- **UI**: `shadcn/ui` with Tailwind CSS
- **Backend**: `supabase`

### Component Installation
When adding new shadcn/ui components:
```bash
npx shadcn@latest add card
npx shadcn@latest add textarea
npx shadcn@latest add dialog
```

### Database Management
- Create migrations for new tables, store in `/supabase/migrations/`
- Use Supabase cloud instance (don't run locally)
- All data models include `user_id` field for future multi-user support

### Authentication
- Use NextAuth session for all authentication
- Current providers: credentials, Kakao, Google
- Session strategy: JWT

### Quality Standards
- Follow TDD process (Red → Green → Refactor)
- Maintain test coverage >80% (unit), >70% (integration)
- Use early returns over nested conditions
- Prefer composition over inheritance
- Follow SOLID principles
- Korean text: Check for UTF-8 encoding issues after code generation

## Performance Requirements
- P95 summarization time: ≤30 seconds
- Search API response: ≤200ms
- Summarization success rate: ≥95%
- Daily processing capacity: ≥50 URLs

## Testing Strategy
- **Unit**: Vitest, React Testing Library
- **Integration**: Vitest, Supertest
- **E2E**: Playwright
- **Load**: k6/Locust for search API performance validation

<Coding_Guideline>
- @.cursor/rules/global.mdc
- @.cursor/rules/clean-code.mdc
- @.cursor/rules/step-by-step.mdc
- @.cursor/rules/TDD.mdc
</Coding_Guideline>

<Project_Docs>
- @docs/PRD.md
- @docs/TRD.md
- @docs/IA.md
- @docs/ERD.md
- @docs/Use-Case.md
</Project_Docs>

<Available_MCPs>
- 21st
- context7
- playwright
- sequential-thinking
- supabase
- vooster
</Available_MCPs>

<ClaudeCode_Commands>
- @docs/Reference/SuperClaude_Commands.md
</ClaudeCode_Commands>

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
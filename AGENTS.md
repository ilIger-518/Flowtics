<!-- BEGIN:nextjs-agent-rules -->

# Critical Instructions

## This is NOT standard Next.js

This project may use experimental patterns, custom architecture, nonstandard routing, modified conventions, or breaking changes that differ from your training data.

Before generating or modifying code:
1. Read `README.md`
2. Follow the documented architecture and conventions
3. Do not assume standard Next.js behavior
4. Respect deprecation notices and migration notes
5. Prefer existing project patterns over generic framework conventions

If implementation details in the codebase conflict with your prior knowledge, the codebase is authoritative.

---

# Documentation Requirements

`README.md` is a required source of truth for this repository.

After EVERY meaningful code change, feature addition, refactor, architectural modification, dependency change, or API update:
- immediately update `README.md`
- keep examples accurate
- keep architecture documentation synchronized with implementation
- remove outdated documentation
- document WHY changes exist, not only WHAT changed

## README must always document

- Project architecture
- Folder/file responsibilities
- Rendering strategy and data flow
- Server/client boundaries
- API endpoints and examples
- Environment variables
- Authentication flow
- Database schema and migrations
- State management
- Caching strategy
- External services
- Build/deployment process
- Important dependencies and rationale
- Known limitations and edge cases
- Troubleshooting notes

## Feature Documentation Rules

When adding functionality:
- explain how it works internally
- document integration points
- provide usage examples
- update related sections
- include migration steps if behavior changed

Assume future developers have zero context about the project.

Documentation quality is as important as code quality.

Never leave `README.md` outdated.

<!-- END:nextjs-agent-rules -->
# InformationArchitect

Website structure and navigation specialist for MMarkov.

## Usage

```
/information-architect sitemap
/information-architect routes <review or design>
/information-architect navigation <section>
/information-architect content-model <entity>
/information-architect audit <page or section>
```

## Agent Instructions

$import(.claude/agents/information-architect.md)

## Task

Design and maintain the organization of MMarkov's front-end:

1. **Sitemap**: Create and maintain logical site hierarchy
2. **Routes**: Design and review app.routes.ts
3. **Navigation**: Define nav rules, breadcrumbs, and wayfinding
4. **Content Models**: Define relationships between content types
5. **Audit**: Identify orphan pages, duplicate content, broken hierarchy

Primary responsibility: `/mmarkov.com/src/app/app.routes.ts`

Outputs include sitemaps, route configurations, and content relationship diagrams.

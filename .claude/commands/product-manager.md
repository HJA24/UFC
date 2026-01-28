# ProductManager

Product roadmap and coordination lead for MMarkov.

## Usage

```
/product-manager roadmap
/product-manager prioritize <features>
/product-manager prd <feature name>
/product-manager daily todos
/product-manager kpis <define or review>
```

## Agent Instructions

$import(.claude/agents/product-manager.md)

## Task

Manage MMarkov's product roadmap and coordinate all agents:

1. **Roadmap**: Plan and maintain the product roadmap in Linear
2. **Prioritize**: Use RICE framework to rank features
3. **PRD**: Write Product Requirements Documents
4. **Daily TODOs**: Generate `.claude/todos/{date}.md` from current Linear sprint
5. **KPIs**: Define success metrics for features

Central coordinator between all agents. Has full read/write access to Linear via MCP tools.

### Daily TODO Output

Single file `.claude/todos/{date}.md` (e.g., `2026-01-22.md`) with pipe-delimited format:

```
completed | issue | description | assignee(s)
[]|MMKRV-042|Optimize database indexes|DatabaseEngineer
[]|MMKRV-045|Set up Stripe webhook|BackendArchitect
[x]|MMKRV-039|Fighter profile page|FrontendDeveloper
```

### Linear MCP Tools

Use these tools to manage Linear:
- `mcp__linear-server__create_issue` - Create tasks
- `mcp__linear-server__list_issues` - Query sprint tasks
- `mcp__linear-server__update_issue` - Update status
- `mcp__linear-server__create_project` - Create roadmap projects
- `mcp__linear-server__create_cycle` - Create sprints
- `mcp__linear-server__list_cycles` - Get sprint info

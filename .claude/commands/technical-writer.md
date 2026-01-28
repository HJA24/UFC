# TechnicalWriter

Documentation specialist for MMarkov.

## Usage

```
/technical-writer user-guide <topic>
/technical-writer api-docs <endpoint or feature>
/technical-writer faq <topic>
/technical-writer admin <procedure>
/technical-writer extract <agent name>
```

## Agent Instructions

$import(.claude/agents/technical-writer.md)

## Task

Create clear, structured documentation for all audiences:

1. **User Guide**: End-user documentation for predictions, features
2. **API Docs**: Developer documentation for API endpoints
3. **FAQ**: Frequently asked questions with clear answers
4. **Admin**: Administrator procedures and troubleshooting
5. **Extract**: Extract knowledge from Engineer and Professor agents

Uses Markdown format. Adapts tone and vocabulary to target audience. Outputs include documentation pages, API references, and procedural guides.

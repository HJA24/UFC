# FrontendDeveloper

Angular component and service developer for MMarkov.

## Usage

```
/frontend-developer component <name and purpose>
/frontend-developer service <name and responsibility>
/frontend-developer review <code>
/frontend-developer signal <state management pattern>
/frontend-developer accessibility <component or page>
```

## Agent Instructions

$import(.claude/agents/frontend-developer.md)

## Task

Build robust, performant Angular components and services:

1. **Component**: Create components with signals, OnPush, clear I/O contracts
2. **Service**: Design single-responsibility services with signal-based state
3. **Review**: Audit code for Angular idioms and best practices
4. **Signal**: Implement state management using signals and computed()
5. **Accessibility**: Add ARIA hooks and keyboard navigation

Consumes theme tokens from UXDesigner, icons from GraphicDesigner, copy from Copywriter. Uses native control flow (@if), inject() function, and lazy loading. Outputs include complete Angular components with templates and styles.

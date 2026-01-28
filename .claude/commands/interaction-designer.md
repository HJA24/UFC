# InteractionDesigner

Interaction design specialist for MMarkov's front-end.

## Usage

```
/interaction-designer flow <page or feature>
/interaction-designer states <component>
/interaction-designer loading <page>
/interaction-designer error <scenario>
/interaction-designer prototype <interaction>
```

## Agent Instructions

$import(.claude/agents/interaction-designer.md)

## Task

Design intuitive, efficient, and satisfying interactions for MMarkov:

1. **Flow**: Design user flows through pages, especially `/fights/{fightId}`
2. **States**: Define UI states (loading, error, disabled, hover, active)
3. **Loading**: Design loading sequences using DualProgressBar
4. **Error**: Create error states with recovery paths
5. **Prototype**: Specify click-through prototypes and flow diagrams

Works closely with UIDesigner on visual implementation. Outputs include interaction specs, flow diagrams, and animation guidelines.

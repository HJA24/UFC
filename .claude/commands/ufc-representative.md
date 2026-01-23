# UFCRepresentative

Adversarial legal review from UFC's perspective to identify IP risks.

## Usage

```
/ufc-representative review <file or URL>
/ufc-representative audit website
/ufc-representative check branding
/ufc-representative review content <text>
```

## Agent Instructions

$import(.claude/agents/ufc-representative.md)

## Task

Review the specified content from UFC's legal department perspective:

1. **Identify** all potential trademark, copyright, and IP issues
2. **Classify** each by risk level (Critical/High/Medium/Low/Clear)
3. **Explain** how UFC legal would characterize each issue
4. **Recommend** specific remediation steps

Provide a comprehensive risk assessment report. Be thorough and adversarial - find issues before UFC's lawyers do.

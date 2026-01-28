# PrivacyOfficer

Data protection and privacy compliance lead for MMarkov.

## Usage

```
/privacy-officer review <feature or data flow>
/privacy-officer audit third-parties
/privacy-officer verify <privacy policy section>
/privacy-officer dpia <new feature>
/privacy-officer data-map <system or process>
```

## Agent Instructions

$import(.claude/agents/privacy-officer.md)

## Task

Ensure mmarkov complies with data protection laws and privacy best practices:

1. **Verify**: Verify that actual data handling practices is in accordance with Privacy Policy
2. **Audit**: Evaluate third-party processors (Stripe, Polymarket, hosting)
3  **Assess**: Assess data handling practices of mmarkov against regulations


## Document Path
- Privacy Policy: `.claude/legal/privacy-policy.md`


## Collaboration with other agents
LegalAdvisor drafts/reviews documents based on PrivacyOfficer's guidance / suggestions.
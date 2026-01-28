# LegalAdvisor

Draft or review legal documents for the MMarkov website.

## Usage

```
/legal-advisor draft privacy policy
/legal-advisor draft terms and agreements
/legal-advisor draft cookie policy
/legal-advisor draft disclaimer
/legal-advisor review <document>
```

## Agent Instructions

$import(.claude/agents/legal-advisor.md)

## Task

Based on the user's request:
1. **Draft**: Create a complete legal document following the standards and required sections
2. **Review**: Analyze existing legal content for completeness, clarity, and protection

## Document guidelines
When drafting or reviewing documents, ensure:
- Clear non-affiliation with UFC statement
- Comprehensive betting/prediction liability disclaimers
- GDPR/CCPA compliance where applicable
- Plain language where possible
- All required sections for the document type

## Document Types
- **Privacy Policy**: Data collection, usage, sharing, user rights
- **Terms and Agreements**: User obligations, prohibited activities, liability limitations
- **Cookie Policy**: Types of cookies, usage, user control
- **Disclaimer**: Accuracy of information, no professional advice, external links

## Document Paths
- Privacy Policy: `.claude/legal/privacy-policy.md`
- Terms and Agreements: `.claude/legal/terms-and-agreements.md`
- Cookie Policy: `.claude/legal/cookie-policy.md`
- Disclaimer: `.claude/legal/disclaimer.md`

Coordinates with PrivacyOfficer on matters about data-protection
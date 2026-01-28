# Copywriter

Conversion copywriter for MMarkov's website content.

## Usage

```
/copywriter landing-page <section>
/copywriter pricing <tier or page>
/copywriter about <section>
/copywriter cta <context>
/copywriter translate <technical concept>
```

## Agent Instructions

$import(.claude/agents/copywriter.md)

## Task

Write compelling copy that converts visitors into subscribers:

1. **Landing Page**: Hero, value proposition, how-it-works, social proof
2. **Pricing**: Tier names, descriptions, feature lists, CTAs
3. **About**: Methodology explanation, credibility, team
4. **CTAs**: Action-oriented buttons and links
5. **Translate**: Turn technical concepts into user-friendly language

Adapts tone for RetailClient (casual), SophisticatedClient (technical), and WealthyClient (premium). Outputs include headlines, body copy, and microcopy.

# WebsitePerformanceEngineer

Web performance optimization specialist for MMarkov.

## Usage

```
/website-performance-engineer audit <page>
/website-performance-engineer bundle <analyze or optimize>
/website-performance-engineer kpis <define or measure>
/website-performance-engineer lazy-load <component or route>
/website-performance-engineer stress-test <scenario>
```

## Agent Instructions

$import(.claude/agents/website-performance-engineer.md)

## Task

Optimize www.mmarkov.com for speed and responsiveness:

1. **Audit**: Analyze page performance with Chrome DevTools and Lighthouse
2. **Bundle**: Reduce JavaScript bundle size, especially D3.js
3. **KPIs**: Define and track Core Web Vitals and custom metrics
4. **Lazy Load**: Implement lazy loading for routes, components, and images
5. **Stress Test**: Load test the website under high traffic conditions

Uses Chrome DevTools extensively. Outputs include performance reports, optimization recommendations, and implementation code.

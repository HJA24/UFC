# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mmarkov is a UFC fight prediction system that uses Bayesian modeling to estimate different type of skills for each fighter. 
A fight is modeled as an absorbing Markov chain where each state represents a fight situation (strike attempt blue, takedown landed red, standing, ground control blue, etc.).
Transition probabilities between states are derived from the estimated skills of the fighters.
Properties of a Markov chain (fundamental matrix, absorption probabilities) are used to estimate probabilities of all kinds of fight outcomes and within-fight events.
## Tech Stack

- **Backend**: Python 3.11+ with NumPy, SciPy, Pandas, NetworkX, ArviZ, Gurobi
- **Frontend**: Angular 21 with D3.js visualizations (in `mmarkov.com/`)
- **Database**: PostgreSQL (production), SQLite (local)
- **Bayesian Sampling**: Stan models via CmdStanPy

## Development Commands

### Python Backend
```bash
# Activate virtual environment
source .venv/bin/activate

# Run Bayesian model training pipeline
python src/touch_gloves.py

# Run fight scoring and judge decision pipeline
python src/enter_octagon.py

# Run test utilities
python src/test.py
```

### Angular Frontend (mmarkov.com/)
```bash
cd mmarkov.com
npm install          # Install dependencies
npm start            # Dev server at localhost:4200
npm run build        # Production build
npm test             # Run Karma tests
```

## Architecture

### Core Pipeline Flow
```
- Collect raw UFC Data (ufc/) → 
- Insert process data into SQLite database → 
- Estimate fighter skills (bayes/) → 
- Build fight (markov/) → 
- Judge fight (judging/) → 
- Extract fight-related predictions (predictions.py)→ 
- Insert data into PostgresQL database → 
- Display data on www.mmarkov.com
```

### Key Components

**Markov Chain Engine** (`src/markov/`)
- `markov.py`: Base `Markov` class implementing absorbing Markov chain theory - transition matrices, fundamental matrix N, absorption probabilities
- `fight.py`: `Fight` class extending Markov - 4 absorbing states (KO/submission for each fighter), transient states for strikes/takedowns/grappling
- Default: 3 rounds × 300 seconds, 1-second resolution (dt=1)

**Bayesian Modeling** (`src/bayes/`)
- Stan models for fighter skill estimation
- `sample.py`: MCMC sampling with configurable chains/draws (default: 4 chains × 1000 draws)
- `diagnostics.py`: Convergence checks (divergences, R-hat, acceptance rate)

**Judge Scoring** (`src/judging/`)
- `judge.py`: `Judge` class using ordinal logistic regression with calibrated beta coefficients and cutpoints
- `scorecards.py`: `Scorecards` class generating probability distributions over feasible scorecard outcomes
- `decision.py`: `Decisions` class aggregating judge scorecards into final decision probabilities

**Fight Predictions** (`src/predictions.py`)
- Generates comprehensive betting markets: winner, method (KO/submission/decision), duration, differentials, totals
- Outputs stored in `kelly/markets.json` and `kelly/truths.json`


### Database Layer (`src/database/`)
- `domain/`: Modular DB operations split by responsibility (entities, scorecards, stats, markov, predictions, networks, betting, config, identifiers)
- `connection.py`: Connection management (PostgreSQL via `digital_ocean.ini`, SQLite fallback)
- Tables: events, fights, fighters, judges, scores, p (probabilities), edges, stats

### Data Scraping (`src/ufc/`, `src/imgarena/`)
- UFC
- IMG Arena
- 
## Important Patterns

- Paths are hardcoded to `/Users/huibmeulenbelt/PycharmProjects/ufc/` in entry scripts
- Model configurations in `models/fights/models.json` and `models/judges/models.json`
- Fight graphs stored as NetworkX MultiDiGraph with edge weights from Bayesian posterior samples (n_samples=4000)
- Markov states indexed with 4 absorbing states first (indices 0-3), then transient states
- Fighter colors: "blue" (first) and "red" (second) throughout codebase

## Model Configuration

Current defaults in entry scripts:
- `graph_id = 1`
- `fighting_id = 3` (fight model)
- `judging_id = 9` (judge model)
- `judge_ids = [14, 200, 32]`

Sampler configuration (`src/bayes/sampler.ini`):
- `n_chains = 4`
- `adapt_delta = 0.95`
- `max_treedepth = 10`


## www.markov.com/ Subscription Tiers
There are 4 tiers: Strawweight, Lightweight, Middleweight, Heavyweight.
Pricing of the tiers can be found in `mmarkov.com/src/app/config/pricing.config.ts`.

## Custom Agents

### Professors (Academic/Domain Experts)

#### MarkovChainsProfessor (`.claude/agents/markov-chains-professor.md`)
Academic expert in Markov chain theory for mathematical code review. Expertise includes:
- Kemeny & Snell "Finite Markov Chains" - fundamental matrix N=(I-Q)^(-1), absorption probabilities, canonical forms
- Numerical stability of matrix operations
- Theoretical correctness of stochastic process implementations

Use via `/markov-chains-professor review <file>` or `/markov-chains-professor explain <theorem>`.

#### NetworkScienceProfessor (`.claude/agents/network-science-professor.md`)
Academic expert in network and graph analysis with profound knowledge of:
- Centrality measures: degree, betweenness, closeness, eigenvector, PageRank
- Graph properties: clustering, transitivity, components, diameter
- Community detection algorithms
- NetworkX library (intimately familiar with all algorithms)
- Uses LaTeX for mathematical notation

Use via `/network-science-professor centrality <measure>` or `/network-science-professor analyze <property>`.

### Engineers (Technical Implementation)

#### BackendArchitect (`.claude/agents/backend-architect.md`)
Kotlin/Spring Boot backend architecture specialist:
- **Kotlin**: Data classes, sealed classes, extension functions, coroutines
- **Spring Boot**: Auto-configuration, dependency injection, WebFlux
- **REST API Design**: Clean URLs, proper HTTP status codes, versioning
- **DTOs**: Request/response patterns, validation, mappers
- Long-term maintainability and evolution

Works closely with DatabaseEngineer on persistence layer.

Use via `/backend-architect design <api>` or `/backend-architect dto <request>`.

#### FrontendDeveloper (`.claude/agents/frontend-developer.md`)
Angular component and service developer:
- **Signals**: State management with `signal()`, `computed()`, derived states
- **Components**: OnPush by default, clear `input()`/`output()` contracts
- **Templates**: Native control flow (`@if`, `@for`), simple and readable
- **Services**: Single responsibility, `inject()` function pattern
- **Accessibility**: ARIA hooks, keyboard navigation, screen reader support
- Lazy loading for feature routes

Consumes theme tokens from UXDesigner, icons from GraphicDesigner, copy from Copywriter.

Use via `/frontend-developer component <name>` or `/frontend-developer service <name>`.

#### DatabaseEngineer (`.claude/agents/database-engineer.md`)
PostgreSQL specialist for database design, optimization, and maintenance:
- Schema design with proper constraints (PK, FK, unique, check)
- Index optimization and query performance
- Backup strategies and disaster recovery
- Migration management and schema evolution
- Works closely with BackendArchitect

Use via `/database-engineer design <table>` or `/database-engineer backup <strategy>`.

#### StanEngineer (`.claude/agents/stan-engineer.md`)
Bayesian inference and computation engineer:
- **Model Design**: Parameterization (centered vs non-centered), Cholesky factorization, vectorization
- **Diagnostics**: R-hat, ESS, divergences, funnels, E-BFMI - with specific solutions
- **Performance**: `reduce_sum` parallelization, compiler flags, CmdStan optimization
- **Hardware**: Desktop/laptop/cloud recommendations for Stan workloads

Prefers CmdStan/CmdStanPy. References Betancourt, Gelman, Vehtari.

Use via `/stan-engineer review <model>` or `/stan-engineer hardware <budget>`.

#### WebsitePerformanceEngineer (`.claude/agents/website-performance-engineer.md`)
Web performance optimization specialist:
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Bundle size reduction (especially D3.js tree-shaking)
- Lazy loading implementation (routes, components, images)
- Chrome DevTools analysis (Performance, Network, Lighthouse)
- Stress testing and load testing

Use via `/website-performance-engineer audit <page>` or `/website-performance-engineer bundle <analyze>`.

#### DataProcessor (`.claude/agents/data-processor.md`)
Data pipeline specialist for external-to-internal data transformation:
- ETL pipeline management (location: `/src/ufc/`)
- Schema validation with Pydantic/dataclasses
- Enum-based data classification
- Comprehensive logging and error handling
- Prevents silent failures and missing data

Use via `/data-processor validate <data>` or `/data-processor enum <category>`.

#### D3Specialist (`.claude/agents/d3-specialist.md`)
Expert D3.js developer for custom data visualizations (Mike Bostock quality):
- **GraphChart**: Markov state transition diagram (force-directed)
- **StatsChart**: Fighter statistics comparison (mirrored bars)
- **PredictionsChart**: Win probability with HDI confidence intervals
- **JudgeChart**: Judge scoring heatmap
- **VerdictChart**: Final decision radial chart
- SVG/Canvas optimization for performance

Use via `/d3-specialist chart <name>` or `/d3-specialist implement <visualization>`.

#### PaymentIntegrator (`.claude/agents/payment-integrator.md`)
Stripe payment integration specialist:
- **Backend**: Python/FastAPI checkout sessions, webhooks, subscription management
- **Frontend**: Angular pricing page, billing toggle, subscription status
- **Webhooks**: `checkout.session.completed`, `subscription.updated`, `invoice.payment_failed`
- **Security**: PCI compliance, webhook signature verification

Tier structure: Strawweight (free) → Lightweight ($15/mo) → Middleweight ($79/mo) → Heavyweight ($299/mo)

Use via `/payment-integrator implement <feature>` or `/payment-integrator setup stripe`.

#### PolymarketDeveloper (`.claude/agents/polymarket-developer.md`)
Polymarket API integration developer. **Goal: MMarkov becomes an official Polymarket Builder.**
- REST endpoints, WebSocket subscriptions, authentication, rate limits
- Order books (bids/asks), prices, volumes, historical timeseries
- Angular services, D3.js charts for market visualization
- Edge computation (MMarkov probability vs market implied probability)
- Builder program requirements and application preparation

Use via `/polymarket-developer implement <feature>` or `/polymarket-developer api <question>`.

### Architects (Structure & Design)

#### InformationArchitect (`.claude/agents/information-architect.md`)
Website structure and navigation specialist:
- Site hierarchy and sitemap design
- **Primary responsibility**: `/mmarkov.com/src/app/app.routes.ts`
- Navigation rules, breadcrumbs, content relationships
- Prevents orphan pages and content duplication
- URL patterns and route configuration

Use via `/information-architect sitemap` or `/information-architect routes <review>`.

#### InteractionDesigner (`.claude/agents/interaction-designer.md`)
User interaction specialist for front-end:
- **Primary focus**: `/fights/{fightId}` page interactions
- UI states: idle, hover, active, loading, error, disabled
- **DualProgressBar** component for loading state communication
- Micro-interactions and animation timing
- Error states with recovery paths
- Works closely with UIDesigner

Use via `/interaction-designer flow <page>` or `/interaction-designer states <component>`.

#### GraphicDesigner (`.claude/agents/graphic-designer.md`)
Icon design specialist:
- **Adobe Illustrator**: Full workflow, pixel-perfect alignment, export settings
- **Angular Material Icons**: Appropriate icon recommendations
- **Custom Icons**: MMA-specific (octagon, fighter stance, KO, submission)
- SVG optimization (SVGO), 24x24px grid, 2px stroke

Use via `/graphic-designer design <icon>` or `/graphic-designer review <svg file>`.

### Writers (Content & Copy)

#### Copywriter (`.claude/agents/copywriter.md`)
Conversion copywriter for website content:
- Landing page, pricing page, about page copy
- Translates complex concepts into user-friendly language
- Adapts tone for RetailClient (casual), SophisticatedClient (technical), WealthyClient (premium)
- Feature-benefit translation, CTAs, microcopy

Use via `/copywriter landing-page <section>` or `/copywriter pricing <tier>`.

#### TechnicalWriter (`.claude/agents/technical-writer.md`)
Documentation specialist:
- User guides, API documentation, FAQs, admin procedures
- Adapts to audience: end users, developers, administrators
- Extracts knowledge from Engineer and Professor agents
- Markdown format, static site generator compatible

Use via `/technical-writer user-guide <topic>` or `/technical-writer api-docs <endpoint>`.

### Legal & Compliance

#### LegalAdvisor (`.claude/agents/legal-advisor.md`)
In-house legal counsel for website legal content:
- Terms of Service, Privacy Policy, Cookie Policy, Disclaimers
- Ensures clear **non-affiliation with UFC** in all documents
- **Betting liability disclaimers** (no liability for losses)
- GDPR/CCPA compliance, intellectual property protection
- Coordinates with PrivacyOfficer on data protection

Use via `/legal-advisor draft <document>` or `/legal-advisor review <content>`.

#### PrivacyOfficer (`.claude/agents/privacy-officer.md`)
Data protection and privacy compliance lead:
- GDPR, CCPA, and other data protection regulations
- Verifies actual data handling matches Privacy Policy
- Reviews third-party processors (Stripe, Polymarket, hosting)
- Data subject rights implementation
- Coordinates with LegalAdvisor on compliance

Use via `/privacy-officer review <feature>` or `/privacy-officer audit third-parties`.

#### UFCRepresentative (`.claude/agents/ufc-representative.md`)
Adversarial agent representing UFC's legal department perspective. Identifies legal risks:
- **Trademark**: UFC name, Octagon, event names, fighter nicknames
- **Copyright**: Fighter photos, video clips, scraped content
- **Implied affiliation**: Branding similarity, misleading language
- **Data usage**: Scraping, proprietary statistics, licensing issues

Provides risk assessments (Critical/High/Medium/Low) with remediation steps.

Use via `/ufc-representative review <content>` or `/ufc-representative audit website`.

### Business & Product

#### ProductManager (`.claude/agents/product-manager.md`)
Central coordinator for MMarkov's roadmap and all agents:
- **Prioritization**: RICE framework for feature ranking
- **PRDs**: Product Requirements Documents for features
- **Linear Integration**: Uses Linear MCP server (`linear-server`) for direct access (team: `mmarkov`, identifier: `MMRKV`)
- **Daily TODOs**: Generates `.claude/todos/{date}.md` files from Linear sprint (e.g., `2026-01-22.md`)
- **KPIs**: Success metrics definition (MRR, conversion, NPS)
- **Tradeoffs**: Balances time, money, technical constraints

Hub connecting Engineers, Designers, Writers, Professors, and Business agents.

Use via `/product-manager roadmap`, `/product-manager daily todos`, or `/product-manager prd <feature>`.

**Linear**: Team `mmarkov`, issues referenced as `MMRKV-XXX`, URLs: `https://linear.app/mmarkov/issue/MMRKV-XXX`

#### SalesRepresentative (`.claude/agents/sales-representative.md`)
Commercial strategy agent:
- **Customer Segments**: Synthesizes feedback from client personas
- **Market Sizing**: TAM/SAM/SOM for MMA betting market
- **Competitive Analysis**: BetMMA, Action Network, PFF comparisons
- **Pricing Strategy**: Tier structure and revenue projections

Recommends: Strawweight (free) → Lightweight ($15) → Middleweight ($79) → Heavyweight ($299)

Use via `/sales-representative pricing strategy` or `/sales-representative market analysis`.

### Client Personas

#### RetailClient (`.claude/agents/retail-client.md`)
Average UFC fan - NOT the target audience, but potential expansion market.
**Primary focus: UX and Pricing feedback.**
- Bets regularly, knows fighters, NOT technical
- Evaluates clarity, ease of use, information overload
- WTP comparisons to Netflix/ESPN+ ($10-30/mo range)

Use via `/retail-client review <page>` or `/retail-client pricing feedback`.

#### SophisticatedClient (`.claude/agents/sophisticated-client.md`)
Sharp bettor - **MMarkov's core target audience**.
- Quantitative professional, profitable long-term, $500-5000/bet
- Understands statistics, Kelly criterion, Bayesian inference
- Evaluates analytical depth, differentiated value, API access
- WTP: $50-100 (solid) → $100-200 (professional) → $200-500 (best-in-class)

Use via `/sophisticated-client review <feature>` or `/sophisticated-client pricing assessment`.

#### WealthyClient (`.claude/agents/wealthy-client.md`)
Betting whale - high-net-worth, $100k+ wagers, OTC betting.
**Primary focus: UX, pricing, perceived sophistication.**
- Wants elegant simplicity, premium aesthetic
- Appreciates complexity "under the hood"
- Expects white-glove service, analyst access, exclusivity
- WTP: $500-1000/mo (premium) → $1000-5000/mo (enterprise) → custom

Use via `/wealthy-client review <page>` or `/wealthy-client premium tier feedback`.

### UFCRepresentative (`.claude/agents/ufc-representative.md`)
Adversarial agent representing UFC's legal department perspective. Identifies legal risks:
- **Trademark**: UFC name, Octagon, event names, fighter nicknames
- **Copyright**: Fighter photos, video clips, scraped content
- **Implied affiliation**: Branding similarity, misleading language
- **Data usage**: Scraping, proprietary statistics, licensing issues
- **Right of publicity**: Fighter names/likenesses in commercial context

Provides risk assessments (Critical/High/Medium/Low) with remediation steps.

Use via `/ufc-representative review <content>` or `/ufc-representative audit website`.

### RetailClient (`.claude/agents/retail-client.md`)
Average UFC fan persona - NOT the target audience, but a potential expansion market. Profile: bets regularly, knows fighters, NOT technical. **Primary focus: UX and Pricing feedback.**
- **UX**: Clarity, ease of use, information overload, mobile experience, friction points
- **Pricing**: Willingness-to-pay, tier suggestions, deal breakers, comparisons to Netflix/ESPN+

Provides 1-5 scores and honest, casual feedback. Key for subscription pricing decisions.

Use via `/retail-client review <page>` or `/retail-client pricing feedback`.

### SophisticatedClient (`.claude/agents/sophisticated-client.md`)
Sharp bettor persona - MMarkov's core target audience. Profile: quantitative professional, profitable long-term, $500-5000/bet, understands statistics and Kelly criterion. Evaluates:
- **Analytical Depth**: Rigor, methodology, uncertainty quantification, calibration
- **Differentiated Value**: Edge over market, unique insights, CLV performance
- **Professional Features**: API access, data exports, historical predictions
- **Transparency**: Methodology documentation, verifiable track record

Willingness-to-pay thresholds: $50-100 (solid tool) → $100-200 (professional-grade) → $200-500 (best-in-class)

Use via `/sophisticated-client review <feature>` or `/sophisticated-client pricing assessment`.

### WealthyClient (`.claude/agents/wealthy-client.md`)
Betting whale persona - high-net-worth, $100k+ wagers, OTC betting, sits ringside. **Primary focus: UX, pricing, and perceived sophistication.**
- **UX**: Wants elegant simplicity - answers fast, premium aesthetic, no clutter
- **Sophistication**: Appreciates complexity "under the hood" - builds trust
- **Pricing**: Not price-sensitive; expects white-glove service, analyst access, exclusivity
- **Service**: Direct analyst contact, private portal, custom arrangements

Willingness-to-pay: $500-1000/mo (premium) → $1000-5000/mo (enterprise) → custom pricing preferred

Use via `/wealthy-client review <page>` or `/wealthy-client premium tier feedback`.

### SalesRepresentative (`.claude/agents/sales-representative.md`)
Commercial strategy agent that synthesizes customer feedback and recommends pricing. Capabilities:
- **Customer Segments**: Works with RetailClient, SophisticatedClient, WealthyClient personas
- **Market Sizing**: TAM/SAM/SOM estimates for MMA betting market
- **Competitive Landscape**: Analysis of BetMMA, Action Network, PFF, and adjacent competitors
- **Pricing Strategy**: Tier structure recommendations with revenue projections

Recommends tiered pricing: Strawweight (free) → Lightweight ($15/mo) → Middleweight ($79/mo) → Heavyweight ($299/mo)

Use via `/sales-representative pricing strategy` or `/sales-representative market analysis`.

### PolymarketDeveloper (`.claude/agents/polymarket-developer.md`)
Technical developer for Polymarket API integration. Expertise:
- **API Knowledge**: REST endpoints, WebSocket subscriptions, authentication, rate limits
- **Data Retrieval**: Order books (bids/asks), prices, volumes, historical timeseries
- **Frontend Components**: Angular services, D3.js charts for market visualization
- **Value Calculation**: Edge computation (MMarkov probability vs market implied probability)
- **Event Mapping**: Match UFC fights to Polymarket condition IDs

Key endpoints: `/markets`, `/book`, `/prices`, `/midpoint`, WebSocket for real-time updates

Use via `/polymarket-developer implement <feature>` or `/polymarket-developer api <question>`.

### StanEngineer (`.claude/agents/stan-engineer.md`)
Bayesian inference and computation engineer. Expertise:
- **Model Design**: Parameterization (centered vs non-centered), Cholesky factorization, vectorization
- **Diagnostics**: R-hat, ESS, divergences, funnels, E-BFMI - with specific solutions
- **Priors**: Weakly informative defaults, prior predictive checks
- **Performance**: `reduce_sum` parallelization, compiler flags, CmdStan optimization
- **Hardware**: Desktop/laptop/cloud recommendations for Stan workloads

Prefers CmdStan/CmdStanPy. References Betancourt, Gelman, Vehtari.

Use via `/stan-engineer review <model>` or `/stan-engineer hardware <budget>`.

### PaymentIntegrator (`.claude/agents/payment-integrator.md`)
Stripe payment integration specialist. Implements:
- **Stripe Setup**: Products, prices, checkout sessions, customer portal
- **Backend**: Python/FastAPI routes for checkout, webhooks, subscription management
- **Frontend**: Angular pricing page, billing toggle, subscription status
- **Webhooks**: `checkout.session.completed`, `subscription.updated`, `invoice.payment_failed`
- **Security**: PCI compliance, webhook signature verification, secret key handling

Tier structure: Strawweight (free) → Lightweight ($15/mo) → Middleweight ($79/mo) → Heavyweight ($299/mo)

Use via `/payment-integrator implement <feature>` or `/payment-integrator setup stripe`.

### Illustrator (`.claude/agents/illustrator.md`)
Icon design specialist for the MMarkov front-end. Expertise:
- **Adobe Illustrator**: Full workflow for icon creation, pixel-perfect alignment, export settings
- **Angular Material Icons**: Recommends appropriate icons from the Material library
- **Custom Icon Design**: MMA-specific icons (octagon, fighter stance, KO, submission, strike zones)
- **SVG Optimization**: Export settings, SVGO, web performance
- **Angular Integration**: Icon registration, MatIconRegistry, accessibility

Design specs: 24x24px grid, 2px stroke, outlined style, `currentColor` for CSS inheritance.

Use via `/illustrator design <icon>` or `/illustrator review <svg file>`.

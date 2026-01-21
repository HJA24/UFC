# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MMarkov is a UFC fight prediction system that uses absorbing Markov chains and Bayesian modeling to simulate fight outcomes, generate betting probabilities, and predict judge decisions.

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
UFC Data (IMG Arena API) → Fighter Statistics (stats/) → Bayesian Model (bayes/)
    → Fight Simulation (markov/) → Judge Scoring (judging/) → Market Predictions (predictions.py)
    → Betting Optimization (kelly/) → Database → Angular Dashboard
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

**Market Predictions** (`src/predictions.py`)
- Generates comprehensive betting markets: winner, method (KO/submission/decision), duration, differentials, totals
- Outputs stored in `kelly/markets.json` and `kelly/truths.json`

**Kelly Criterion Betting** (`src/kelly/`)
- `kelly.py`: Bankroll optimization using Gurobi mixed-integer programming
- `X.py`: Feature matrix construction for betting decisions

### Database Layer (`src/database/`)
- `domain.py`: Core domain models and DB operations (~1000 lines)
- `connection.py`: Connection management (PostgreSQL via `digital_ocean.ini`, SQLite fallback)
- Tables: events, fights, fighters, judges, scores, p (probabilities), edges, stats

### Data Scraping (`src/ufc/`, `src/imgarena/`)
- UFC event/fight/fighter/scorecard scraping
- IMG Arena API integration for live event data

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

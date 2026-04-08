# Amazon Product Profitability Analyzer

A dual-signal profitability analyzer using **ACoS + TACoS** to make Go/No-Go recommendations on Amazon products.

**[Launch the Tool](https://muhmmadasadullah.github.io/amazon-product-profitability-analyzer/)**

## Features
- Interactive calculator with live calculations
- 5-outcome decision engine: SCALE / OPTIMIZE / TEST / REPRICE / KILL
- Excel and CSV export
- Mobile responsive dark SaaS UI

## Decision Engine
| Condition | Action |
|-----------|--------|
| Profitable, ACoS ok, TACoS ok, low ad dependency | **SCALE** |
| Profitable, targets met, high ad dependency | **OPTIMIZE** |
| Profitable, ACoS high, TACoS ok | **TEST** |
| Both signals exceed targets | **REPRICE** |
| Economics fundamentally broken | **KILL** |

## Development
```bash
npm install
npm run dev
```

## Deploy
Pushes to main auto-deploy via GitHub Actions.

Built by [Tokia AI](https://tokia.ai)

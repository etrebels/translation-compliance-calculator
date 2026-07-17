# Translation Compliance Exposure Calculator

**Open-source model for what regulated-content compliance violations cost as they propagate through translation to every market** — and what catching them at source saves. For localization leads, compliance owners, and anyone shipping regulated content (pharma, cosmetics, finance, medical devices) into multiple languages.

▶ **Use the live tool:** [tools.langoptima.com/translation-compliance](https://tools.langoptima.com/translation-compliance)

The live version adds a guided walkthrough and shareable output. This repo is the open calculation engine — deterministic, transparent, and built on **your** operational estimates, not asserted industry statistics.

## What it models

- A compliance violation in a source document ships to every translated market it reaches — the model multiplies your source error rate through your content volume and market count.
- Review-time economics: what flagged-at-source review costs vs. unflagged downstream discovery.
- Expected-value incident exposure (probability × impact), labeled as an expectation, never a prediction.

**The one external figure it carries** is peer-reviewed: on a controlled 30-error regulatory corpus, knowledge-graph-mediated translation detected 100% of source-compliance violations while two LLM baselines detected 0% (Gene & Sosoni, *Dual-Metric Compliance and Quality Evaluation of KGMT in Regulated Domains*, NeTTIT 2026, DOI 10.26615/issn.2815-4711.2026_015). Every other input is your own estimate.

## Install & use

```bash
npm install
npm run typecheck && npm test
```

```ts
import {
  calculateComplianceExposureResults,
  DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
} from "@langoptima/translation-compliance-calculator";

const result = calculateComplianceExposureResults(DEFAULT_COMPLIANCE_EXPOSURE_INPUTS);
```

Framework-agnostic TypeScript, zero runtime dependencies.

## Built by LangOptima

LangOptima builds [Knowledge Graph Mediated Translation (KGMT)](https://www.langoptima.com/features/knowledge-graph-mediated-translation-kgmt) — compliance checking at source, before a violation propagates through your language pipeline, so regulated translation stays auditable. This is one of our open-source [free tools](https://tools.langoptima.com) — [langoptima.com](https://www.langoptima.com).

## License

[Apache-2.0](./LICENSE). Free to use, modify, and redistribute. The **LangOptima name and marks are not licensed** — a fork may not imply endorsement (see [`NOTICE`](./NOTICE)). Contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · Support: [`SUPPORT.md`](./SUPPORT.md).

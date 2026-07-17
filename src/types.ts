// ─── Regulatory Compliance Exposure Model — Types ────────────────
//
// Anchor stat (the reason a "with knowledge graph" column exists at
// all): on a controlled 30-error regulatory corpus (a 500-word
// retinol product description, EN→Greek/French), knowledge-graph-
// mediated translation detected 100% of source-compliance violations
// vs 0% for two LLM baselines (Gene & Sosoni, NeTTIT 2026, DOI
// 10.26615/issn.2815-4711.2026_015). SOLID for the controlled-corpus
// claim; DIRECTIONAL for generalization. Everything the USER sets
// below (error rate, incident cost, incident probability) is their
// estimate, never presented as a sourced figure.

export interface ComplianceExposureInputs {
  /** Regulated documents / claims translated per year. */
  regulatedDocsPerYear: number;
  /** Jurisdictions each document ships to, multiplies exposure. */
  targetMarkets: number;
  /** Share of source docs carrying ≥1 compliance violation (%, 0-100). USER ESTIMATE. */
  sourceErrorRatePct: number;
  /** Reviewer minutes per doc with no source flagging. */
  reviewMinutesNoFlag: number;
  /** Reviewer minutes per doc when violations are pre-flagged. */
  reviewMinutesWithFlag: number;
  /** Fully-loaded reviewer / compliance cost per hour ($). */
  reviewerCostPerHour: number;
  /** Annual cost of the compliance/knowledge-graph layer ($). 0 = not provided → payback shows N/A. */
  kgInvestmentAnnual: number;
  /** (Advanced, optional) Cost of one compliance incident ($). 0 = exclude incident exposure. USER ESTIMATE. */
  incidentCost: number;
  /** (Advanced, optional) Probability an undetected propagated violation triggers an incident (%, 0-100). USER ESTIMATE, DIRECTIONAL. */
  incidentProbPct: number;
}

export interface ComplianceExposureResults {
  /** Docs/yr with ≥1 violation that ship unflagged today (expected value, can be fractional). */
  propagatedDocs: number;
  /** Violation-market instances/yr (propagated docs × target markets). */
  marketExposures: number;
  /** Review hours/yr with no source flagging. */
  reviewHoursToday: number;
  /** Review hours/yr with violations pre-flagged. */
  reviewHoursWithKG: number;
  reviewHoursSaved: number;
  /** Annual review cost today ($). */
  reviewCostToday: number;
  /** Annual review cost with pre-flagging ($). */
  reviewCostWithKG: number;
  reviewCostSaved: number;
  /** Expected, probability-weighted incident exposure avoided ($/yr). 0 when not modeled. */
  incidentExposure: number;
  /** reviewCostSaved + incidentExposure ($/yr). */
  annualBenefit: number;
  /** null means the investment never pays back, or no annual investment was provided. */
  paybackPeriodMonths: number | null;
}

export const DEFAULT_COMPLIANCE_EXPOSURE_INPUTS: ComplianceExposureInputs = {
  regulatedDocsPerYear: 2000,
  targetMarkets: 3,
  sourceErrorRatePct: 10, // conservative default, labelled an estimate in the UI
  reviewMinutesNoFlag: 45,
  reviewMinutesWithFlag: 8,
  reviewerCostPerHour: 90,
  kgInvestmentAnnual: 110000, // illustrative annual cost placeholder — not a real vendor quote
  incidentCost: 0, // incident exposure off by default
  incidentProbPct: 1,
};

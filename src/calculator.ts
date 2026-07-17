import {
  ComplianceExposureInputs,
  ComplianceExposureResults,
} from "./types";

// ─── Regulatory Compliance Exposure Model ────────────────────
// Deterministic, pure math, no LLM reasoning anywhere in the
// calculation (hybrid-architecture rule).
//
// Anchor stat (the reason the "with KG" column exists at all):
// on a controlled 30-error regulatory corpus (a 500-word retinol
// product description, EN→Greek/French), knowledge-graph-mediated
// translation detected 100% of source-compliance violations; two
// GPT-5 baselines (plain prompt, and glossary-and-tables pasted in)
// detected 0%, with unstable outputs across runs.
// Source: Gene & Sosoni, "Dual-Metric Compliance and Quality
// Evaluation of KGMT in Regulated Domains", NeTTIT 2026,
// pp. 109-118, DOI 10.26615/issn.2815-4711.2026_015.
// Tier: SOLID for the controlled-corpus claim; DIRECTIONAL for
// generalization beyond it.
//
// Everything else, the error rate, review minutes, reviewer cost,
// incident cost, and incident probability, is the USER'S estimate
// of their own operation, never a sourced statistic. The UI must
// keep that distinction visible.
//
// incidentExposure is an EXPECTED VALUE (probability × impact), the
// same convention as the GDPR calculator's breach-risk exposure.
// It is a probability-weighted average, not a prediction for any
// single year, the UI labels it "expected" and DIRECTIONAL.

/** Clamp a possibly out-of-range user value into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round money to the cent so results are stable and testable. */
function roundToCent(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateComplianceExposureResults(
  inputs: ComplianceExposureInputs
): ComplianceExposureResults {
  // Validate at the boundary: negative or out-of-range inputs are
  // clamped to the nearest valid value rather than poisoning the math.
  const docs = Math.max(0, inputs.regulatedDocsPerYear);
  const markets = Math.max(0, inputs.targetMarkets);
  const sourceErrorRate = clamp(inputs.sourceErrorRatePct, 0, 100) / 100;
  const minutesNoFlag = Math.max(0, inputs.reviewMinutesNoFlag);
  const minutesWithFlag = Math.max(0, inputs.reviewMinutesWithFlag);
  const costPerHour = Math.max(0, inputs.reviewerCostPerHour);
  const kgInvestmentAnnual = Math.max(0, inputs.kgInvestmentAnnual);
  const incidentCost = Math.max(0, inputs.incidentCost);
  const incidentProb = clamp(inputs.incidentProbPct, 0, 100) / 100;

  // Docs that carry a violation and, per the 0% baseline detection -
  // ship unflagged today. A KG layer catches these at source (100% on
  // the study corpus), so they are also the docs it rescues.
  const propagatedDocs = docs * sourceErrorRate;

  // Each propagated doc reaches every target market, so exposure
  // multiplies by jurisdiction count.
  const marketExposures = propagatedDocs * markets;

  // Review time: with no source flagging every doc gets the full
  // manual pass; with violations pre-flagged reviewers confirm flags
  // instead of hunting for them.
  const reviewHoursToday = (docs * minutesNoFlag) / 60;
  const reviewHoursWithKG = (docs * minutesWithFlag) / 60;
  const reviewHoursSaved = Math.max(0, reviewHoursToday - reviewHoursWithKG);

  const reviewCostToday = roundToCent(reviewHoursToday * costPerHour);
  const reviewCostWithKG = roundToCent(reviewHoursWithKG * costPerHour);
  const reviewCostSaved = roundToCent(reviewHoursSaved * costPerHour);

  // Optional expected-value exposure: only modeled when the user has
  // supplied an incident cost. Probability-weighted, not a point
  // prediction for any single year.
  const incidentExposure =
    incidentCost > 0
      ? roundToCent(propagatedDocs * incidentProb * incidentCost)
      : 0;

  const annualBenefit = roundToCent(reviewCostSaved + incidentExposure);

  // Payback in months. The KG investment is an ANNUAL RECURRING cost, so
  // it only "pays back" when the annual benefit exceeds it - a benefit
  // below the recurring cost loses money every year, forever, and any
  // formula-payback over 12 months against a recurring cost means "never".
  // null in that case; the UI shows "N/A", never a fake number.
  const paybackPeriodMonths =
    kgInvestmentAnnual > 0 && annualBenefit > kgInvestmentAnnual
      ? Math.max(1, Math.ceil((kgInvestmentAnnual / annualBenefit) * 12))
      : null;

  return {
    propagatedDocs,
    marketExposures,
    reviewHoursToday,
    reviewHoursWithKG,
    reviewHoursSaved,
    reviewCostToday,
    reviewCostWithKG,
    reviewCostSaved,
    incidentExposure,
    annualBenefit,
    paybackPeriodMonths,
  };
}

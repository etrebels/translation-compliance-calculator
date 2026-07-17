import { describe, it, expect } from "vitest";
import { calculateComplianceExposureResults } from "./calculator";
import { DEFAULT_COMPLIANCE_EXPOSURE_INPUTS } from "./types";
import type { ComplianceExposureInputs } from "./types";

describe("calculateComplianceExposureResults", () => {
  // Hand-worked scenario 1, the defaults ("typical").
  // 2,000 docs × 10% = 200 propagated; × 3 markets = 600 exposures.
  // Hours: 2000×45/60 = 1,500 today; 2000×8/60 = 266.667 with KG.
  // Cost at $90/hr: $135,000 today; $24,000 with KG; $111,000 saved.
  // Payback: the $110K annual cost is RECURRING and the benefit
  // ($111,000/yr) exceeds it, so it pays back in
  // ceil(110000/111000 × 12) = ceil(11.8919) = 12 months.
  it("matches the hand-worked typical scenario to the cent", () => {
    const r = calculateComplianceExposureResults(
      DEFAULT_COMPLIANCE_EXPOSURE_INPUTS
    );
    expect(r.propagatedDocs).toBe(200);
    expect(r.marketExposures).toBe(600);
    expect(r.reviewHoursToday).toBe(1500);
    expect(r.reviewHoursWithKG).toBeCloseTo(266.6667, 3);
    expect(r.reviewHoursSaved).toBeCloseTo(1233.3333, 3);
    expect(r.reviewCostToday).toBe(135000);
    expect(r.reviewCostWithKG).toBe(24000);
    expect(r.reviewCostSaved).toBe(111000);
    expect(r.incidentExposure).toBe(0); // incidentCost 0 = not modeled
    expect(r.annualBenefit).toBe(111000);
    expect(r.paybackPeriodMonths).toBe(12);
  });

  // Hand-worked scenario 2, a small operation.
  // 300 docs × 5% = 15 propagated; × 2 markets = 30 exposures.
  // Hours: 300×30/60 = 150 today; 300×5/60 = 25 with KG; 125 saved.
  // Cost at $75/hr: $11,250 today; $1,875 with KG; $9,375 saved.
  // Payback: $9,375/yr benefit < $30K/yr recurring cost → never → null.
  it("matches the hand-worked small scenario to the cent", () => {
    const small: ComplianceExposureInputs = {
      regulatedDocsPerYear: 300,
      targetMarkets: 2,
      sourceErrorRatePct: 5,
      reviewMinutesNoFlag: 30,
      reviewMinutesWithFlag: 5,
      reviewerCostPerHour: 75,
      kgInvestmentAnnual: 30000,
      incidentCost: 0,
      incidentProbPct: 1,
    };
    const r = calculateComplianceExposureResults(small);
    expect(r.propagatedDocs).toBe(15);
    expect(r.marketExposures).toBe(30);
    expect(r.reviewHoursToday).toBe(150);
    expect(r.reviewHoursWithKG).toBe(25);
    expect(r.reviewHoursSaved).toBe(125);
    expect(r.reviewCostToday).toBe(11250);
    expect(r.reviewCostWithKG).toBe(1875);
    expect(r.reviewCostSaved).toBe(9375);
    expect(r.annualBenefit).toBe(9375);
    expect(r.paybackPeriodMonths).toBeNull();
  });

  // Hand-worked scenario 3, incident exposure as an expected value.
  // Defaults + $250K incident cost at 1% per propagated violation:
  // 200 × 0.01 × 250000 = $500,000 expected exposure avoided.
  // Benefit $611,000 > $110K cost; payback ceil(110000/611000 × 12) = 3 mo.
  it("adds probability-weighted incident exposure when modeled", () => {
    const r = calculateComplianceExposureResults({
      ...DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
      incidentCost: 250000,
      incidentProbPct: 1,
    });
    expect(r.incidentExposure).toBe(500000);
    expect(r.annualBenefit).toBe(611000);
    expect(r.paybackPeriodMonths).toBe(3);
  });

  it("returns null payback when the benefit is zero (never pays back)", () => {
    // Pre-flagged review taking LONGER than unflagged review yields no
    // savings, hours saved clamps to 0, not negative.
    const r = calculateComplianceExposureResults({
      ...DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
      reviewMinutesNoFlag: 10,
      reviewMinutesWithFlag: 20,
      incidentCost: 0,
    });
    expect(r.reviewHoursSaved).toBe(0);
    expect(r.reviewCostSaved).toBe(0);
    expect(r.annualBenefit).toBe(0);
    expect(r.paybackPeriodMonths).toBeNull();
  });

  it("returns null payback when no annual investment is provided", () => {
    const r = calculateComplianceExposureResults({
      ...DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
      kgInvestmentAnnual: 0,
    });
    expect(r.annualBenefit).toBeGreaterThan(0);
    expect(r.paybackPeriodMonths).toBeNull();
  });

  it("handles all-zero inputs without NaN or negatives", () => {
    const r = calculateComplianceExposureResults({
      regulatedDocsPerYear: 0,
      targetMarkets: 0,
      sourceErrorRatePct: 0,
      reviewMinutesNoFlag: 0,
      reviewMinutesWithFlag: 0,
      reviewerCostPerHour: 0,
      kgInvestmentAnnual: 0,
      incidentCost: 0,
      incidentProbPct: 0,
    });
    for (const value of Object.values(r)) {
      if (value !== null) {
        expect(Number.isFinite(value as number)).toBe(true);
        expect(value as number).toBeGreaterThanOrEqual(0);
      }
    }
    expect(r.paybackPeriodMonths).toBeNull();
  });

  it("clamps negative and out-of-range inputs at the boundary", () => {
    const r = calculateComplianceExposureResults({
      regulatedDocsPerYear: -100,
      targetMarkets: -3,
      sourceErrorRatePct: 150, // clamped to 100%
      reviewMinutesNoFlag: -45,
      reviewMinutesWithFlag: -8,
      reviewerCostPerHour: -90,
      kgInvestmentAnnual: -110000,
      incidentCost: -250000,
      incidentProbPct: 250,
    });
    expect(r.propagatedDocs).toBe(0);
    expect(r.reviewCostSaved).toBe(0);
    expect(r.incidentExposure).toBe(0);
    expect(r.paybackPeriodMonths).toBeNull();
  });

  it("treats an over-100% error rate as 100%", () => {
    const r = calculateComplianceExposureResults({
      ...DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
      sourceErrorRatePct: 150,
    });
    // 100% of 2,000 docs propagate, never more than the doc count.
    expect(r.propagatedDocs).toBe(2000);
  });

  it("payback never rounds below one month", () => {
    const r = calculateComplianceExposureResults({
      ...DEFAULT_COMPLIANCE_EXPOSURE_INPUTS,
      kgInvestmentAnnual: 1000, // tiny investment, big benefit
    });
    expect(r.paybackPeriodMonths).toBe(1);
  });
});

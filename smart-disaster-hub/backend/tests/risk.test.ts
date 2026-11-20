import { calculateRiskScore, RiskFactors } from '../src/services/risk.service';

describe('Risk Prediction Scoring Engine', () => {
  it('case 1: should calculate LOW risk for normal / dry conditions', () => {
    const factors: RiskFactors = {
      rainfall24h: 5,
      rainfall48h: 12,
      peakHourlyRain: 2,
      precipProbability: 40,
      minElevation: 250,
      elevationVariance: 30,
      riverDischargeRatio: 0.9,
      nearbyDisasterAlert: false,
    };

    const result = calculateRiskScore(factors);
    expect(result.level).toBe('low');
    expect(result.score).toBeLessThan(25);
    expect(result.reason).toContain('12 mm rain forecast in 48h');
  });

  it('case 2: should calculate MODERATE risk for moderate rain', () => {
    const factors: RiskFactors = {
      rainfall24h: 55,
      rainfall48h: 95,
      peakHourlyRain: 18,
      precipProbability: 85,
      minElevation: 120,
      elevationVariance: 50,
      riverDischargeRatio: 1.1,
      nearbyDisasterAlert: false,
    };

    const result = calculateRiskScore(factors);
    expect(result.level).toBe('moderate');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
  });

  it('case 3: should calculate HIGH risk for heavy rain in low-lying sector', () => {
    const factors: RiskFactors = {
      rainfall24h: 90,
      rainfall48h: 170,
      peakHourlyRain: 28,
      precipProbability: 95,
      minElevation: 8, // coastal / low-lying
      elevationVariance: 10,
      riverDischargeRatio: 1.6,
      nearbyDisasterAlert: false,
    };

    const result = calculateRiskScore(factors);
    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(75);
    expect(result.reason).toContain('low-lying sector');
  });

  it('case 4: should calculate SEVERE risk for catastrophic monsoon and swelling river', () => {
    const factors: RiskFactors = {
      rainfall24h: 180,
      rainfall48h: 240,
      peakHourlyRain: 45,
      precipProbability: 100,
      minElevation: 15,
      elevationVariance: 200,
      riverDischargeRatio: 2.7,
      nearbyDisasterAlert: true,
    };

    const result = calculateRiskScore(factors);
    expect(result.level).toBe('severe');
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.reason).toContain('river discharge 2.7x normal');
    expect(result.reason).toContain('active disaster alert');
  });

  it('case 5: should handle missing elevation and API failure gracefully', () => {
    const factors: RiskFactors = {
      rainfall24h: 0,
      rainfall48h: 0,
      peakHourlyRain: 0,
      precipProbability: 0,
      minElevation: null, // missing elevation
      elevationVariance: 0,
      riverDischargeRatio: null, // missing flood API
      nearbyDisasterAlert: false,
    };

    const result = calculateRiskScore(factors);
    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
    expect(typeof result.reason).toBe('string');
  });

  it('case 6: should account for steep ghat landslide hazard in high elevation variance', () => {
    const factors: RiskFactors = {
      rainfall24h: 65,
      rainfall48h: 110,
      peakHourlyRain: 24,
      precipProbability: 90,
      minElevation: 180,
      elevationVariance: 320, // steep ghat section
      riverDischargeRatio: 1.2,
      nearbyDisasterAlert: false,
    };

    const result = calculateRiskScore(factors);
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.reason).toContain('steep terrain variance');
  });

  it('case 7: active disaster alert within 15km adds +10 points', () => {
    const withoutAlert = calculateRiskScore({
      rainfall24h: 40,
      rainfall48h: 60,
      peakHourlyRain: 10,
      precipProbability: 80,
      minElevation: 50,
      elevationVariance: 20,
      riverDischargeRatio: 1.0,
      nearbyDisasterAlert: false,
    });

    const withAlert = calculateRiskScore({
      rainfall24h: 40,
      rainfall48h: 60,
      peakHourlyRain: 10,
      precipProbability: 80,
      minElevation: 50,
      elevationVariance: 20,
      riverDischargeRatio: 1.0,
      nearbyDisasterAlert: true,
    });

    expect(withAlert.score).toBeCloseTo(withoutAlert.score + 10, 1);
  });
});

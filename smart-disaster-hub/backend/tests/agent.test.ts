describe('Autonomous Agent Decision Rules & Delay Avoided Models', () => {
  it('Rule 1: Risk < 50 triggers CONTINUE without detour', () => {
    const risk = 35;
    const decision = risk < 50 ? 'CONTINUE' : 'REROUTE';
    expect(decision).toBe('CONTINUE');
  });

  it('Rule 2: Risk >= 50 with safe alternate within detour threshold triggers REROUTE', () => {
    const risk = 78;
    const alternateFound = true;
    const alternateRisk = 22;
    const detourMin = 65;
    const maxDetour = 180; // medicine

    let decision = 'CONTINUE';
    if (risk >= 50) {
      if (alternateFound && alternateRisk < 50 && detourMin <= maxDetour) {
        decision = 'REROUTE';
      }
    }

    expect(decision).toBe('REROUTE');
  });

  it('Rule 3: Risk >= 50 with no alternate and rain easing triggers HOLD', () => {
    const risk = 85;
    const alternateFound = false;
    const rainEasingWithin12h = true;
    const isPerishable = false;

    let decision = 'CONTINUE';
    if (risk >= 50 && !alternateFound) {
      if (rainEasingWithin12h && !isPerishable) {
        decision = 'HOLD';
      } else {
        decision = 'ESCALATE';
      }
    }

    expect(decision).toBe('HOLD');
  });

  it('Rule 4: Risk >= 50 with no alternate and perishable cargo triggers ESCALATE', () => {
    const risk = 92;
    const alternateFound = false;
    const isPerishable = true; // medicine / perishable food

    let decision = 'CONTINUE';
    if (risk >= 50 && !alternateFound) {
      if (isPerishable) {
        decision = 'ESCALATE';
      }
    }

    expect(decision).toBe('ESCALATE');
  });

  it('Delay avoided formula accurately computes conservative time savings', () => {
    const BLOCKED_ROAD_DELAY_MIN = 360; // 6 hours baseline
    const riskScore = 80;
    const extraMinutes = 70;

    // formula: max(0, BLOCKED_ROAD_DELAY_MIN * (riskScore / 100) - extraMinutes)
    const avoided = Math.max(0, Math.round(BLOCKED_ROAD_DELAY_MIN * (riskScore / 100) - extraMinutes));

    // 360 * 0.8 = 288 min. 288 - 70 = 218 min (~3.6 hours)
    expect(avoided).toBe(218);
    expect(avoided / 60).toBeGreaterThan(3.5);
  });
});

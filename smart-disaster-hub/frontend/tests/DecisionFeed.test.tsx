import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DecisionFeed from '../src/components/resilience/DecisionFeed';
import type { AgentDecision } from '../src/types';

describe('DecisionFeed Component', () => {
  it('renders empty standby state when no decisions are provided', () => {
    render(<DecisionFeed decisions={[]} />);
    expect(screen.getByText(/Agent standing by/i)).toBeDefined();
    expect(screen.getByText(/0 events/i)).toBeDefined();
  });

  it('renders agent decisions with badges and explanation', () => {
    const mockDecisions: AgentDecision[] = [
      {
        id: 1,
        shipmentId: 101,
        decision: 'REROUTE',
        riskScore: 82,
        riskLevel: 'severe',
        reasoning: 'Truck TRK-MED-001 rerouted via Charmadi Ghat to avoid Shiradi flood.',
        explanationSource: 'gemini',
        extraMinutes: 70,
        estimatedDelayAvoidedMin: 218,
        notified: true,
        createdAt: new Date().toISOString(),
        shipment: {
          id: 101,
          code: 'TRK-MED-001',
          cargoType: 'medicine',
          priority: 'critical',
          status: 'rerouted',
          driverName: 'Ramesh Kumar',
        },
      },
    ];

    render(<DecisionFeed decisions={mockDecisions} />);

    expect(screen.getByText('REROUTE')).toBeDefined();
    expect(screen.getByText('TRK-MED-001')).toBeDefined();
    expect(
      screen.getByText(/Truck TRK-MED-001 rerouted via Charmadi Ghat/i)
    ).toBeDefined();
    expect(screen.getByText(/Gemini/i)).toBeDefined();
    expect(screen.getByText('+4h avoided')).toBeDefined();
    expect(screen.getByText('+70m detour')).toBeDefined();
  });
});

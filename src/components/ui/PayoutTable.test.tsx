/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { PayoutTable } from '@/components/ui/PayoutTable';
import type { Bet, BetResult } from '@/lib/types';

const baseBet: Bet = {
  id: 'bet-1',
  groupId: 'group-1',
  title: 'Match Winner',
  description: 'Who wins?',
  options: [
    { id: 'o1', text: 'Team A', votes: [] },
    { id: 'o2', text: 'Team B', votes: [] },
  ],
  deadline: new Date('2026-03-10T00:00:00.000Z'),
  status: 'settled',
  votingType: 'single',
  minStake: 1,
  maxStake: 100,
  createdBy: 'u1',
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
};

describe('PayoutTable (component)', () => {
  it('renders winner payout summary for settled bet', () => {
    const result: BetResult = {
      betId: 'bet-1',
      winningOptionId: 'o1',
      winningOptionText: 'Team A',
      winningOptionIds: ['o1'],
      winningOptionTexts: ['Team A'],
      totalPool: 40,
      winners: [{ userId: 'u1', username: 'alice', stake: 10, payout: 40 }],
      losers: [{ userId: 'u2', username: 'bob', stake: 30 }],
    };

    render(<PayoutTable bet={baseBet} result={result} />);

    expect(screen.getByText(/winning option/i)).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText(/total pool:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/40.00/).length).toBeGreaterThan(0);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders refund state when no winners found', () => {
    const result: BetResult = {
      betId: 'bet-1',
      winningOptionId: 'o1',
      winningOptionText: 'Team A',
      winningOptionIds: ['o1'],
      winningOptionTexts: ['Team A'],
      totalPool: 25,
      isRefund: true,
      winners: [
        { userId: 'u1', username: 'alice', stake: 10, payout: 10 },
        { userId: 'u2', username: 'bob', stake: 15, payout: 15 },
      ],
      losers: [],
    };

    render(<PayoutTable bet={baseBet} result={result} />);

    expect(screen.getByText(/stakes refunded/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no winners/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/stake refunds/i)).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });
});

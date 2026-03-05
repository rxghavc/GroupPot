import { calculateBetPayout } from '@/lib/payouts';

const makeId = (value: string) => ({ toString: () => value });

describe('lib/payouts', () => {
  it('calculates single-vote winner payout proportionally', () => {
    const bet = {
      options: [
        { _id: makeId('option-1'), text: 'Team A' },
        { _id: makeId('option-2'), text: 'Team B' },
      ],
      winningOption: 0,
    };

    const votes = [
      { userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 10 },
      { userId: makeId('user2'), optionId: makeId('option-2'), username: 'bob', stake: 30 },
    ];

    const result = calculateBetPayout(bet, votes);

    expect(result.totalPool).toBe(40);
    expect(result.isRefund).toBe(false);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0].username).toBe('alice');
    expect(result.winners[0].payout).toBe(40);
    expect(result.losers).toHaveLength(1);
    expect(result.losers[0].loss).toBe(30);
  });

  it('refunds all participants when there are no winning votes', () => {
    const bet = {
      options: [
        { _id: makeId('option-1'), text: 'Heads' },
        { _id: makeId('option-2'), text: 'Tails' },
      ],
      winningOption: 1,
    };

    const votes = [
      { userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 15 },
      { userId: makeId('user2'), optionId: makeId('opt-1'), username: 'bob', stake: 25 },
    ];

    const result = calculateBetPayout(bet, votes);

    expect(result.isRefund).toBe(true);
    expect(result.losers).toHaveLength(0);
    expect(result.winners).toHaveLength(2);
    expect(result.winners[0].payout).toBe(result.winners[0].stake);
    expect(result.winners[1].payout).toBe(result.winners[1].stake);
  });

  it('calculates exact-match multi-vote payouts correctly', () => {
    const bet = {
      votingType: 'multi',
      multiVoteType: 'exact_match',
      options: [
        { _id: makeId('option-1'), text: 'A' },
        { _id: makeId('option-2'), text: 'B' },
        { _id: makeId('option-3'), text: 'C' },
      ],
      winningOptions: [0, 1],
    };

    const votes = [
      { userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 20 },
      { userId: makeId('user1'), optionId: makeId('option-2'), username: 'alice', stake: 20 },
      { userId: makeId('user2'), optionId: makeId('option-1'), username: 'bob', stake: 15 },
      { userId: makeId('user3'), optionId: makeId('option-3'), username: 'carol', stake: 45 },
    ];

    const result = calculateBetPayout(bet, votes);

    expect(result.totalPool).toBe(100);
    expect(result.betType).toBe('exact_match');
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0].username).toBe('alice');
    expect(result.winners[0].payout).toBe(100);
    expect(result.losers).toHaveLength(2);
  });

  it('calculates partial-match multi-vote payouts and losing pools', () => {
    const bet = {
      votingType: 'multi',
      multiVoteType: 'partial_match',
      options: [
        { _id: makeId('option-1'), text: 'A' },
        { _id: makeId('option-2'), text: 'B' },
        { _id: makeId('option-3'), text: 'C' },
      ],
      winningOptions: [0, 1],
    };

    const votes = [
      { userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 10 },
      { userId: makeId('user1'), optionId: makeId('option-3'), username: 'alice', stake: 10 },
      { userId: makeId('user2'), optionId: makeId('option-2'), username: 'bob', stake: 20 },
      { userId: makeId('user3'), optionId: makeId('option-3'), username: 'carol', stake: 20 },
    ];

    const result = calculateBetPayout(bet, votes);

    expect(result.betType).toBe('partial_match');
    expect(result.winners).toHaveLength(2);
    expect(result.losers).toHaveLength(1);
    expect(result.totalLosingStakesFromLosers).toBe(20);
    expect(result.additionalLosingStakesFromWinners).toBe(10);
    expect(result.winners[0].totalOriginalStake).toBeGreaterThanOrEqual(result.winners[0].stake);
  });

  it('throws when single-vote bet has no winning option', () => {
    const bet = {
      options: [{ _id: makeId('option-1'), text: 'A' }],
      winningOption: null,
    };

    const votes = [{ userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 10 }];

    expect(() => calculateBetPayout(bet, votes)).toThrow('No winning option set for this bet');
  });

  it('throws when winning option index is invalid', () => {
    const bet = {
      options: [{ _id: makeId('option-1'), text: 'A' }],
      winningOption: 5,
    };

    const votes = [{ userId: makeId('user1'), optionId: makeId('option-1'), username: 'alice', stake: 10 }];

    expect(() => calculateBetPayout(bet, votes)).toThrow('Invalid winning option index');
  });
});

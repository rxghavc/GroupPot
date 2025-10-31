import Bet from '@/models/Bet';
import Vote from '@/models/Vote';

// Type for the payout result shape used by existing endpoints
export interface BetPayoutResult {
  totalPool: number;
  winningOptionId?: string;
  winningOptionIds?: string[];
  winningOptionText?: string;
  winningOptionTexts?: string[];
  winners: any[]; // Keep loose for now (existing code expects dynamic fields)
  losers: any[];
  isRefund: boolean;
  betType?: 'partial_match' | 'exact_match';
  explanation?: string;
  totalLosingStakesFromLosers?: number;
  additionalLosingStakesFromWinners?: number;
}

/**
 * Calculate payout distribution for a settled bet given all of its votes.
 * Mirrors logic previously in /api/bets/[betId]/payouts route.
 */
export function calculateBetPayout(bet: any, allVotes: any[]): BetPayoutResult {
  // Calculate total pool
  const totalPool = allVotes.reduce((total, vote) => total + vote.stake, 0);

  if (bet.votingType === 'multi' && bet.winningOptions && bet.winningOptions.length > 0) {
    const winningOptionIds = bet.winningOptions.map((optionIndex: number) => bet.options[optionIndex]._id.toString()).sort();

    // Group votes by user
    const votesByUser = new Map<string, any[]>();
    allVotes.forEach((vote: any) => {
      const userId = vote.userId.toString();
      if (!votesByUser.has(userId)) votesByUser.set(userId, []);
      votesByUser.get(userId)!.push(vote);
    });

    const winners: any[] = [];
    const losers: any[] = [];

    if (bet.multiVoteType === 'partial_match') {
      const winningSet = new Set(winningOptionIds);
      votesByUser.forEach((userVotes, userId) => {
        const userTotalStake = userVotes.reduce((s, v) => s + v.stake, 0);
        const winningVotes = userVotes.filter(v => winningSet.has(v.optionId.toString()));
        if (winningVotes.length > 0) {
          const totalWinningStake = winningVotes.reduce((s, v) => s + v.stake, 0);
          winners.push({ userId, username: userVotes[0].username, stake: totalWinningStake });
        } else {
          losers.push({ userId, username: userVotes[0].username, stake: userTotalStake });
        }
      });
    } else { // exact_match
      votesByUser.forEach((userVotes, userId) => {
        const userOptionIds = userVotes.map(v => v.optionId.toString()).sort();
        const userStake = userVotes.reduce((s, v) => s + v.stake, 0);
        const record = { userId, username: userVotes[0].username, stake: userStake };
        const isWinner = userOptionIds.length === winningOptionIds.length && userOptionIds.every(id => winningOptionIds.includes(id));
        if (isWinner) winners.push(record); else losers.push(record);
      });
    }

    let totalLosingStakes: number;
    let totalWinningStakes: number;

    if (bet.multiVoteType === 'partial_match') {
      const votesByUser = new Map<string, any[]>();
      allVotes.forEach((vote: any) => {
        const userId = vote.userId.toString();
        if (!votesByUser.has(userId)) votesByUser.set(userId, []);
        votesByUser.get(userId)!.push(vote);
      });
      const totalLosingStakesFromLosers = losers.reduce((s, l) => s + l.stake, 0);
      const additionalLosingStakes = winners.reduce((s, w) => {
        const userVotes = votesByUser.get(w.userId)!;
        const userTotalStake = userVotes.reduce((sum, v) => sum + v.stake, 0);
        return s + (userTotalStake - w.stake);
      }, 0);
      totalLosingStakes = totalLosingStakesFromLosers + additionalLosingStakes;
      totalWinningStakes = winners.reduce((s, w) => s + w.stake, 0);

      if (winners.length === 0) {
        return {
          totalPool,
          winningOptionIds,
            winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
          winners: Array.from(votesByUser.values()).map(userVotes => ({
            userId: userVotes[0].userId,
            username: userVotes[0].username,
            stake: userVotes.reduce((s, v) => s + v.stake, 0),
            payout: userVotes.reduce((s, v) => s + v.stake, 0)
          })),
          losers: [],
          isRefund: true,
          betType: 'partial_match'
        };
      }

      if (totalLosingStakes === 0) {
        return {
          totalPool,
          winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
          winners: winners.map(w => ({ userId: w.userId, username: w.username, stake: w.stake, payout: w.stake })),
          losers: [],
          isRefund: false,
          betType: 'partial_match'
        };
      }

      return {
        totalPool,
        winningOptionIds,
        winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
        winners: winners.map(w => {
          const proportionalShare = totalWinningStakes > 0 ? (w.stake / totalWinningStakes) * totalLosingStakes : 0;
          const payout = w.stake + proportionalShare;
          const userVotes = allVotes.filter(v => v.userId.toString() === w.userId);
          return {
            userId: w.userId,
            username: w.username,
            stake: w.stake,
            payout,
            winningPortion: w.stake,
            shareOfLosingPool: proportionalShare,
            totalOriginalStake: userVotes.reduce((s, v) => s + v.stake, 0),
            totalOptionsCount: userVotes.length
          };
        }),
        losers: losers.map(l => ({ userId: l.userId, username: l.username, stake: l.stake, loss: l.stake })),
        isRefund: false,
        betType: 'partial_match',
        explanation: `In partial match betting, your stake applies to each selected option.`,
        totalLosingStakesFromLosers: losers.reduce((s, l) => s + l.stake, 0),
        additionalLosingStakesFromWinners: winners.reduce((s, w) => {
          const userVotes = allVotes.filter(v => v.userId.toString() === w.userId);
          const userTotalStake = userVotes.reduce((sum, v) => sum + v.stake, 0);
          return s + (userTotalStake - w.stake);
        }, 0)
      };
    } else { // exact_match logic already in winners/losers
      totalLosingStakes = losers.reduce((s, l) => s + l.stake, 0);
      totalWinningStakes = winners.reduce((s, w) => s + w.stake, 0);

      if (winners.length === 0) {
        const votesByUser = new Map<string, any[]>();
        allVotes.forEach((vote: any) => {
          const userId = vote.userId.toString();
          if (!votesByUser.has(userId)) votesByUser.set(userId, []);
          votesByUser.get(userId)!.push(vote);
        });
        return {
          totalPool,
          winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
          winners: Array.from(votesByUser.values()).map(userVotes => ({
            userId: userVotes[0].userId,
            username: userVotes[0].username,
            stake: userVotes.reduce((s, v) => s + v.stake, 0),
            payout: userVotes.reduce((s, v) => s + v.stake, 0)
          })),
          losers: [],
          isRefund: true,
          betType: 'exact_match'
        };
      }

      if (totalLosingStakes === 0) {
        return {
          totalPool,
          winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
          winners: winners.map(w => ({ userId: w.userId, username: w.username, stake: w.stake, payout: w.stake })),
          losers: [],
          isRefund: false,
          betType: 'exact_match'
        };
      }

      return {
        totalPool,
        winningOptionIds,
        winningOptionTexts: bet.winningOptions.map((i: number) => bet.options[i].text),
        winners: winners.map(w => {
          const proportionalShare = totalWinningStakes > 0 ? (w.stake / totalWinningStakes) * totalLosingStakes : 0;
            const payout = w.stake + proportionalShare;
          return { userId: w.userId, username: w.username, stake: w.stake, payout };
        }),
        losers: losers.map(l => ({ userId: l.userId, username: l.username, stake: l.stake, loss: l.stake })),
        isRefund: false,
        betType: 'exact_match',
        explanation: 'In exact match betting, you must vote on ALL winning options and ONLY those options to win.'
      };
    }
  }

  // Single vote
  const winningIdx = bet.winningOption;
  if (winningIdx === undefined || winningIdx === null) {
    throw new Error('No winning option set for this bet');
  }
  const winningOption = bet.options[winningIdx];
  if (!winningOption) {
    throw new Error('Invalid winning option index');
  }

  const winningVotes: any[] = [];
  const losingVotes: any[] = [];
  allVotes.forEach(v => {
    if (v.optionId.toString() === winningOption._id.toString()) {
      winningVotes.push({ userId: v.userId.toString(), username: v.username, stake: v.stake });
    } else {
      losingVotes.push({ userId: v.userId.toString(), username: v.username, stake: v.stake });
    }
  });

  const totalLosingStakes = losingVotes.reduce((s, v) => s + v.stake, 0);
  const totalWinningStakes = winningVotes.reduce((s, v) => s + v.stake, 0);

  if (winningVotes.length === 0) {
    return {
      totalPool,
      winningOptionId: winningOption._id.toString(),
      winningOptionText: winningOption.text,
      winners: allVotes.map(v => ({ userId: v.userId.toString(), username: v.username, stake: v.stake, payout: v.stake })),
      losers: [],
      isRefund: true
    };
  }

  return {
    totalPool,
    winningOptionId: winningOption._id.toString(),
    winningOptionText: winningOption.text,
    winners: winningVotes.map(v => {
      const proportionalShare = totalWinningStakes > 0 ? (v.stake / totalWinningStakes) * totalLosingStakes : 0;
      const payout = v.stake + proportionalShare;
      return { userId: v.userId, username: v.username, stake: v.stake, payout };
    }),
    losers: losingVotes.map(v => ({ userId: v.userId, username: v.username, stake: v.stake, loss: v.stake })),
    isRefund: false
  };
}

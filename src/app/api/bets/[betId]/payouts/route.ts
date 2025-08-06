import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

// GET /api/bets/:betId/payouts - Get bet results and payouts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ betId: string }> }
) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    // Await params for Next.js 15 compatibility
    const { betId } = await params;

    const bet = await Bet.findById(betId);
    
    if (!bet) {
      return Response.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'settled') {
      return Response.json({ error: 'Bet has not been settled yet' }, { status: 400 });
    }

    // Fetch all votes for this bet from the Vote collection
    const allVotes = await Vote.find({ betId: bet._id });

    // Group votes by option
    const votesByOption = new Map();
    bet.options.forEach((option: any) => {
      votesByOption.set(option._id.toString(), []);
    });

    allVotes.forEach((vote) => {
      const optionId = vote.optionId.toString();
      if (votesByOption.has(optionId)) {
        votesByOption.get(optionId).push({
          userId: vote.userId.toString(),
          username: vote.username,
          stake: vote.stake,
          timestamp: vote.timestamp
        });
      }
    });

    // Calculate total pool from all votes
    const totalPool = allVotes.reduce((total, vote) => total + vote.stake, 0);

    let result;

    if (bet.votingType === 'multi' && bet.winningOptions && bet.winningOptions.length > 0) {
      // Multi-vote logic: Different handling based on multiVoteType
      const winningOptionIds = bet.winningOptions.map((optionIndex: number) => 
        bet.options[optionIndex]._id.toString()
      ).sort();
      
      // Group all votes by user
      const votesByUser = new Map();
      allVotes.forEach((vote) => {
        const userId = vote.userId.toString();
        if (!votesByUser.has(userId)) {
          votesByUser.set(userId, []);
        }
        votesByUser.get(userId).push(vote);
      });

      const winners: any[] = [];
      const losers: any[] = [];

      if (bet.multiVoteType === 'partial_match') {
        // Partial Match: Users vote on multiple options, but only ONE option wins
        // Stakes are split across chosen options, only the portion on winning option counts
        const winningOptionId = winningOptionIds[0]; // Partial match can only have one winner
        
        // For each user, check if they voted on the winning option
        votesByUser.forEach((userVotes, userId) => {
          const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
          const winningVote = userVotes.find((vote: any) => vote.optionId.toString() === winningOptionId);
          
          if (winningVote) {
            // User has a vote on the winning option
            // In partial match, stakes are distributed equally across options chosen
            const userOptionCount = userVotes.length;
            const stakePerOption = userTotalStake / userOptionCount;
            
            // User wins based only on their stake portion on the winning option
            winners.push({
              userId: userId,
              username: userVotes[0].username,
              stake: stakePerOption // Only the portion on the winning option
            });
          } else {
            // User didn't vote on winning option - all stake goes to losers
            losers.push({
              userId: userId,
              username: userVotes[0].username,
              stake: userTotalStake
            });
          }
        });
      } else {
        // Exact Match (default): Users must vote on ALL winning options and ONLY those options
        votesByUser.forEach((userVotes, userId) => {
          const userOptionIds = userVotes.map((vote: any) => vote.optionId.toString()).sort();
          const totalUserStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
          
          // Check if user voted on exactly the winning options (no more, no less)
          const isWinner = userOptionIds.length === winningOptionIds.length && 
                           userOptionIds.every((id: string) => winningOptionIds.includes(id));
          
          const userRecord = {
            userId: userId,
            username: userVotes[0].username,
            stake: totalUserStake
          };

          if (isWinner) {
            winners.push(userRecord);
          } else {
            losers.push(userRecord);
          }
        });
      }

      // Calculate payouts
      let totalLosingStakes, totalWinningStakes;
      
      if (bet.multiVoteType === 'partial_match') {
        // For partial match, calculate losing stakes including non-winning portions from winners
        const totalLosingStakesFromLosers = losers.reduce((sum, loser) => sum + loser.stake, 0);
        const additionalLosingStakes = winners.reduce((sum, winner) => {
          const userVotes = votesByUser.get(winner.userId);
          const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
          const userOptionCount = userVotes.length;
          const stakePerOption = userTotalStake / userOptionCount;
          return sum + (userTotalStake - stakePerOption); // Non-winning portion
        }, 0);
        
        totalLosingStakes = totalLosingStakesFromLosers + additionalLosingStakes;
        totalWinningStakes = winners.reduce((sum, winner) => sum + winner.stake, 0);
        
      } else {
        // For exact match, use simple calculation
        totalLosingStakes = losers.reduce((sum, loser) => sum + loser.stake, 0);
        totalWinningStakes = winners.reduce((sum, winner) => sum + winner.stake, 0);
      }

      // Check if there are no winners (refund scenario)
      if (winners.length === 0) {
        result = {
          totalPool,
          winningOptionIds: winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((index: number) => bet.options[index].text),
          winners: Array.from(votesByUser.values()).map((userVotes: any) => ({
            userId: userVotes[0].userId,
            username: userVotes[0].username,
            stake: userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0),
            payout: userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0)
          })),
          losers: [],
          isRefund: true
        };
      } else {
        // Calculate additional info for partial match
        const betTypeInfo = bet.multiVoteType === 'partial_match' ? {
          betType: 'partial_match',
          explanation: 'In partial match betting, your stake is split equally across all options you choose. You win based only on the portion placed on the winning option.',
          totalLosingStakesFromLosers: losers.reduce((sum, loser) => sum + loser.stake, 0),
          additionalLosingStakesFromWinners: bet.multiVoteType === 'partial_match' ? 
            winners.reduce((sum, winner) => {
              const userVotes = votesByUser.get(winner.userId);
              const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
              const userOptionCount = userVotes.length;
              const stakePerOption = userTotalStake / userOptionCount;
              return sum + (userTotalStake - stakePerOption);
            }, 0) : 0
        } : {
          betType: 'exact_match',
          explanation: 'In exact match betting, you must vote on ALL winning options and ONLY those options to win.'
        };

        result = {
          totalPool,
          winningOptionIds: winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((index: number) => bet.options[index].text),
          winners: winners.map((winner: any) => {
            const proportionalShare = totalWinningStakes > 0 ? 
              (winner.stake / totalWinningStakes) * totalLosingStakes : 0;
            const payout = winner.stake + proportionalShare;
            
            // Add breakdown for partial match winners
            const winnerInfo = bet.multiVoteType === 'partial_match' ? {
              userId: winner.userId,
              username: winner.username,
              stake: winner.stake,
              payout: payout,
              winningPortion: winner.stake,
              shareOfLosingPool: proportionalShare,
              totalOriginalStake: votesByUser.get(winner.userId).reduce((sum: number, vote: any) => sum + vote.stake, 0)
            } : {
              userId: winner.userId,
              username: winner.username,
              stake: winner.stake,
              payout: payout
            };
            
            return winnerInfo;
          }),
          losers: losers.map((loser: any) => ({
            userId: loser.userId,
            username: loser.username,
            stake: loser.stake,
            loss: loser.stake
          })),
          isRefund: false,
          ...betTypeInfo
        };
      }
    } else {
      // Single vote logic (backward compatibility)
      if (bet.winningOption === undefined || bet.winningOption === null) {
        return Response.json({ error: 'No winning option set for this bet' }, { status: 400 });
      }

      const winningOption = bet.options[bet.winningOption];
      if (!winningOption) {
        return Response.json({ error: 'Invalid winning option index' }, { status: 400 });
      }

      const winningVotes = votesByOption.get(winningOption._id.toString()) || [];
      
      // Get losing votes (all votes not on winning option)
      const losingVotes: any[] = [];
      bet.options.forEach((option: any, index: number) => {
        if (index !== bet.winningOption) {
          const optionVotes = votesByOption.get(option._id.toString()) || [];
          losingVotes.push(...optionVotes);
        }
      });

      // Calculate total losing stakes (this goes to winners)
      const totalLosingStakes = losingVotes.reduce((sum, vote) => sum + vote.stake, 0);
      const totalWinningStakes = winningVotes.reduce((sum, vote) => sum + vote.stake, 0);

      // Check if there are no winners (refund scenario for single vote)
      if (winningVotes.length === 0) {
        // No one voted on the winning option - refund everyone
        const allVotes = [...losingVotes];
        
        result = {
          totalPool,
          winningOptionId: winningOption._id.toString(),
          winningOptionText: winningOption.text,
          winners: allVotes.map((vote: any) => ({
            userId: vote.userId,
            username: vote.username,
            stake: vote.stake,
            payout: vote.stake
          })),
          losers: [],
          isRefund: true
        };
      } else {
        result = {
          totalPool,
          winningOptionId: winningOption._id.toString(),
          winningOptionText: winningOption.text,
          winners: winningVotes.map((vote: any) => {
            // Each winner gets their stake back plus a proportional share of losing stakes
            const proportionalShare = totalWinningStakes > 0 ? 
              (vote.stake / totalWinningStakes) * totalLosingStakes : 0;
            const payout = vote.stake + proportionalShare;
            
            return {
              userId: vote.userId,
              username: vote.username,
              stake: vote.stake,
              payout: payout
            };
          }),
          losers: losingVotes.map((vote: any) => ({
            userId: vote.userId,
            username: vote.username,
            stake: vote.stake,
            loss: vote.stake
          })),
          isRefund: false
        };
      }
    }
    
    return Response.json({ result });
  } catch (error) {
    // Error logging removed for production cleanliness
    return Response.json({ error: 'Failed to fetch bet result' }, { status: 500 });
  }
} 
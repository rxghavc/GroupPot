import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

// POST /api/bets/:betId/outcome - Declare bet outcome and calculate payouts
export async function POST(
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

    const body = await req.json();
    const { winningOptionId, winningOptionIds } = body;

    // Support both single and multi-vote settlements
    let finalWinningOptionIds: string[];
    
    if (winningOptionIds && Array.isArray(winningOptionIds) && winningOptionIds.length > 0) {
      // Multi-vote settlement
      finalWinningOptionIds = winningOptionIds;
    } else if (winningOptionId) {
      // Single-vote settlement (backward compatibility)
      finalWinningOptionIds = [winningOptionId];
    } else {
      return Response.json({ error: 'Winning option ID(s) required' }, { status: 400 });
    } 

    await connectDB();
    
    // Await params for Next.js 15 compatibility
    const { betId } = await params;

    const bet = await Bet.findById(betId).populate('groupId');
    if (!bet) {
      return Response.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status === 'settled') {
      return Response.json({ error: 'Bet has already been settled' }, { status: 400 });
    }

    // Check if user is a moderator of the group
    const group = await Group.findById(bet.groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    const isOwner = group.ownerId.toString() === decoded.userId;
    
    if (!isModerator && !isOwner) {
      return Response.json({ error: 'Only moderators can declare outcomes' }, { status: 403 });
    }

    // Check if the winning options exist
    const winningOptionIndices: number[] = [];
    const winningOptions: any[] = [];
    
    for (const optionId of finalWinningOptionIds) {
      const optionIndex = bet.options.findIndex((opt: any) => 
        opt._id.toString() === optionId || 
        `${bet._id}-option-${bet.options.indexOf(opt) + 1}` === optionId
      );
      
      if (optionIndex === -1) {
        return Response.json({ error: `Invalid winning option: ${optionId}` }, { status: 400 });
      }
      
      winningOptionIndices.push(optionIndex);
      winningOptions.push(bet.options[optionIndex]);
    }

    // Remove duplicates and sort for consistency
    const uniqueWinningIndices = [...new Set(winningOptionIndices)].sort();
    const uniqueWinningOptions = uniqueWinningIndices.map(i => bet.options[i]);

    // Close the bet if it's still open
    if (bet.status === 'open') {
      bet.status = 'closed';
    }

    // Settle the bet
    bet.status = 'settled';
    
    // Store winning options based on bet type
    if (bet.votingType === 'multi') {
      bet.winningOptions = uniqueWinningIndices;
    } else {
      // Single vote - use legacy field for backward compatibility
      bet.winningOption = uniqueWinningIndices[0];
    }
    
    await bet.save();

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

    let winners: any[] = [];
    let losers: any[] = [];

    if (bet.votingType === 'multi') {
      // Multi-vote logic: Different handling based on multiVoteType
      const winningOptionIds = uniqueWinningOptions.map(opt => opt._id.toString()).sort();
      
      // Group all votes by user
      const votesByUser = new Map();
      allVotes.forEach((vote) => {
        const userId = vote.userId.toString();
        if (!votesByUser.has(userId)) {
          votesByUser.set(userId, []);
        }
        votesByUser.get(userId).push(vote);
      });

      if (bet.multiVoteType === 'partial_match') {
        // Situation A: Partial Match - Users vote on multiple options, each with individual stakes
        // Users win based on their stake on any of the winning options
        
        // Partial match now supports multiple winning options
        // A user wins if they voted on ANY of the winning options
        
        const winningOptionIdSet = new Set(winningOptionIds);
        
        // For each user, check if they voted on any of the winning options
        votesByUser.forEach((userVotes, userId) => {
          const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
          
          // Find all votes on winning options
          const winningVotes = userVotes.filter((vote: any) => 
            winningOptionIdSet.has(vote.optionId.toString())
          );
          
          if (winningVotes.length > 0) {
            // User has votes on one or more winning options
            // In partial match, calculate total stake on winning options
            const totalWinningStake = winningVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
            
            // User wins based on their full stake on all winning options
            winners.push({
              userId: userId,
              username: userVotes[0].username,
              stake: totalWinningStake // Total stake on all winning options
            });
            
            // The stakes on non-winning options contribute to the losing pool
            const losingStake = userTotalStake - totalWinningStake;
            if (losingStake > 0) {
              losers.push({
                userId: userId,
                username: userVotes[0].username,
                stake: losingStake
              });
            }
          } else {
            // User didn't vote on any winning option - all stake goes to losers
            losers.push({
              userId: userId,
              username: userVotes[0].username,
              stake: userTotalStake
            });
          }
        });
        
        // Calculate total losing stakes and winning stakes
        const totalLosingStakes = losers.reduce((sum, loser) => sum + loser.stake, 0);
        const totalWinningStakes = winners.reduce((sum, winner) => sum + winner.stake, 0);

        // Calculate payouts for partial match
        let winnersWithPayouts: any[] = [];
        let losersWithLoss: any[] = [];

        if (winners.length === 0) {
          // No winners scenario: Everyone gets their stake back
          const allParticipants = [...losers];
          winnersWithPayouts = allParticipants.map((participant: any) => ({
            userId: participant.userId,
            username: participant.username,
            stake: participant.stake,
            payout: participant.stake // Full stake refund
          }));
          
          losersWithLoss = []; // No one loses money when stakes are refunded
        } else {
          // Normal scenario: Winners split the losing pool based on their winning stake
          winnersWithPayouts = winners.map((winner: any) => {
            const proportionalShare = totalWinningStakes > 0 ? 
              (winner.stake / totalWinningStakes) * totalLosingStakes : 0;
            const payout = winner.stake + proportionalShare;
            
            // For partial match, add additional info
            const userVotes = votesByUser.get(winner.userId);
            const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
            
            return {
              userId: winner.userId,
              username: winner.username,
              stake: winner.stake,
              payout: payout,
              totalOriginalStake: userTotalStake,
              totalOptionsCount: userVotes.length
            };
          });

          losersWithLoss = losers.map((loser: any) => ({
            userId: loser.userId,
            username: loser.username,
            stake: loser.stake,
            loss: loser.stake
          }));
        }

        // For partial match, we need to handle the result differently
        const result = {
          totalPool,
          winningOptionId: uniqueWinningOptions[0]._id.toString(), // Keep for backward compatibility
          winningOptionText: uniqueWinningOptions[0].text, // Keep for backward compatibility
          winningOptionIds: uniqueWinningOptions.map(opt => opt._id.toString()),
          winningOptionTexts: uniqueWinningOptions.map(opt => opt.text),
          winners: winnersWithPayouts,
          losers: losersWithLoss,
          isRefund: winners.length === 0,
          // Add extra data for partial match understanding
          betType: 'partial_match',
          explanation: `In partial match betting, your stake applies to each selected option. You win based on your stakes on any of the winning options: ${uniqueWinningOptions.map(opt => opt.text).join(', ')}.`,
          totalLosingStakesFromLosers: losers.reduce((sum, loser) => sum + loser.stake, 0),
          additionalLosingStakesFromWinners: winners.reduce((sum, winner) => {
            const userVotes = votesByUser.get(winner.userId);
            const userTotalStake = userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
            return sum + (userTotalStake - winner.stake); // Non-winning portion
          }, 0)
        };

        const message = winners.length === 0 
          ? 'No winners found - all stakes have been refunded'
          : 'Bet settled successfully';

        return Response.json({ 
          result, 
          message,
          winningOptions: uniqueWinningOptions.map(opt => opt.text)
        });
      } else {
        // Situation B: Exact Match (default) - Users must vote on ALL winning options and ONLY those options
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
    } else {
      // Single vote logic (existing logic)
      const winningVotes = votesByOption.get(uniqueWinningOptions[0]._id.toString()) || [];
      
      // Get losing votes (all votes not on winning option)
      bet.options.forEach((option: any, index: number) => {
        if (!uniqueWinningIndices.includes(index)) {
          const optionVotes = votesByOption.get(option._id.toString()) || [];
          losers.push(...optionVotes.map((vote: any) => ({
            userId: vote.userId,
            username: vote.username,
            stake: vote.stake
          })));
        }
      });

      winners = winningVotes.map((vote: any) => ({
        userId: vote.userId,
        username: vote.username,
        stake: vote.stake
      }));
    }

    // Calculate payouts using the pool-based system
    const totalLosingStakes = losers.reduce((sum, loser) => sum + loser.stake, 0);
    const totalWinningStakes = winners.reduce((sum, winner) => sum + winner.stake, 0);

    let winnersWithPayouts: any[] = [];
    let losersWithLoss: any[] = [];

    // Check if there are no winners - if so, refund all stakes
    if (winners.length === 0) {
      // No winners scenario: Everyone gets their stake back
      const allParticipants = [...losers]; // In this case, everyone is initially in "losers"
      winnersWithPayouts = allParticipants.map((participant: any) => ({
        userId: participant.userId,
        username: participant.username,
        stake: participant.stake,
        payout: participant.stake // Full stake refund
      }));
      
      losersWithLoss = []; // No one loses money when stakes are refunded
    } else {
      // Normal scenario: Winners split the pool
      winnersWithPayouts = winners.map((winner: any) => {
        // Each winner gets their stake back plus a proportional share of losing stakes
        const proportionalShare = totalWinningStakes > 0 ? 
          (winner.stake / totalWinningStakes) * totalLosingStakes : 0;
        const payout = winner.stake + proportionalShare;
        
        return {
          userId: winner.userId,
          username: winner.username,
          stake: winner.stake,
          payout: payout
        };
      });

      losersWithLoss = losers.map((loser: any) => ({
        userId: loser.userId,
        username: loser.username,
        stake: loser.stake,
        loss: loser.stake
      }));
    }

    const result = {
      totalPool,
      // Backward compatibility fields for single vote
      winningOptionId: uniqueWinningOptions[0]._id.toString(),
      winningOptionText: uniqueWinningOptions[0].text,
      // New fields for multi-vote support
      winningOptionIds: uniqueWinningOptions.map(opt => opt._id.toString()),
      winningOptionTexts: uniqueWinningOptions.map(opt => opt.text),
      winners: winnersWithPayouts,
      losers: losersWithLoss,
      // Indicate if this was a refund scenario
      isRefund: winners.length === 0
    };

    const message = winners.length === 0 
      ? 'No winners found - all stakes have been refunded'
      : 'Bet settled successfully';

    return Response.json({ 
      result, 
      message,
      winningOptions: uniqueWinningOptions.map(opt => opt.text)
    });
  } catch (error) {
    // Error logging removed for production cleanliness
    return Response.json({ error: 'Failed to settle bet' }, { status: 500 });
  }
}

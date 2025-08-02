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
    const allVotes = await Vote.find({ betId: betId });

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
      // Multi-vote logic: Users must have voted on ALL winning options and ONLY those options
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

      // Determine winners and losers
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

      // Calculate payouts
      const totalLosingStakes = losers.reduce((sum, loser) => sum + loser.stake, 0);
      const totalWinningStakes = winners.reduce((sum, winner) => sum + winner.stake, 0);

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
        result = {
          totalPool,
          winningOptionIds: winningOptionIds,
          winningOptionTexts: bet.winningOptions.map((index: number) => bet.options[index].text),
          winners: winners.map((winner: any) => {
            const proportionalShare = totalWinningStakes > 0 ? 
              (winner.stake / totalWinningStakes) * totalLosingStakes : 0;
            const payout = winner.stake + proportionalShare;
            
            return {
              userId: winner.userId,
              username: winner.username,
              stake: winner.stake,
              payout: payout
            };
          }),
          losers: losers.map((loser: any) => ({
            userId: loser.userId,
            username: loser.username,
            stake: loser.stake,
            loss: loser.stake
          })),
          isRefund: false
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
    console.error('Error fetching bet result:', error);
    return Response.json({ error: 'Failed to fetch bet result' }, { status: 500 });
  }
} 
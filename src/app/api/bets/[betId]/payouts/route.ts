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

    const winningOption = bet.options[bet.winningOption!];
    const winningVotes = votesByOption.get(winningOption._id.toString()) || [];
    
    // Get losing votes (all votes not on winning option)
    const losingVotes = [];
    bet.options.forEach((option: any, index: number) => {
      if (index !== bet.winningOption) {
        const optionVotes = votesByOption.get(option._id.toString()) || [];
        losingVotes.push(...optionVotes);
      }
    });

    // Calculate total losing stakes (this goes to winners)
    const totalLosingStakes = losingVotes.reduce((sum, vote) => sum + vote.stake, 0);
    const totalWinningStakes = winningVotes.reduce((sum, vote) => sum + vote.stake, 0);

    const result = {
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
      }))
    };
    
    return Response.json({ result });
  } catch (error) {
    console.error('Error fetching bet result:', error);
    return Response.json({ error: 'Failed to fetch bet result' }, { status: 500 });
  }
} 
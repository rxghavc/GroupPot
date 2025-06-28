import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
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

    // Calculate payouts
    const totalPool = bet.options.reduce((total, option) => 
      total + option.votes.reduce((sum, vote) => sum + vote.stake, 0), 0
    );

    const winningOption = bet.options[bet.winningOption!];
    const winningVotes = winningOption.votes;
    const losingVotes = bet.options.flatMap((option, index) => 
      index === bet.winningOption ? [] : option.votes
    );

    const result = {
      totalPool,
      winningOptionId: winningOption._id.toString(),
      winningOptionText: winningOption.text,
      winners: winningVotes.map((vote: any) => ({
        userId: vote.userId.toString(),
        stake: vote.stake,
        payout: totalPool * (vote.stake / winningVotes.reduce((sum, v) => sum + v.stake, 0))
      })),
      losers: losingVotes.map((vote: any) => ({
        userId: vote.userId.toString(),
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
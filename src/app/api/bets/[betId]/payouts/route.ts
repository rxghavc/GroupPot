import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { calculateBetPayout } from '@/lib/payouts';
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

  const result = calculateBetPayout(bet, allVotes);
  return Response.json({ result });
  } catch (error) {
    // Error logging removed for production cleanliness
    return Response.json({ error: 'Failed to fetch bet result' }, { status: 500 });
  }
} 
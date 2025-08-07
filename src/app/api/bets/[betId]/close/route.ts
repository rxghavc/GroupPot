import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

// POST /api/bets/:betId/close - Force close a bet early
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

    // Await params for Next.js 15 compatibility
    const { betId } = await params;

    await connectDB();

    // Find the bet
    const bet = await Bet.findById(betId);
    if (!bet) {
      return Response.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Check if bet is already closed or settled
    if (bet.status !== 'open') {
      return Response.json({ error: 'Bet is not open' }, { status: 400 });
    }

    // Check if user is a moderator of the group
    const group = await Group.findById(bet.groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const isOwner = group.ownerId.toString() === decoded.userId;
    const isModerator = group.moderators.some((modId: string) => modId.toString() === decoded.userId);
    
    if (!isOwner && !isModerator) {
      return Response.json({ error: 'Only moderators can force close bets' }, { status: 403 });
    }

    // Update bet status to closed
    bet.status = 'closed';
    await bet.save();

    return Response.json({ 
      message: 'Bet closed successfully',
      bet: bet
    });
  } catch (error) {
    console.error('Error closing bet:', error);
    return Response.json({ error: 'Failed to close bet' }, { status: 500 });
  }
}

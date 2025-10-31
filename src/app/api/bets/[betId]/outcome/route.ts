import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';
import { calculateBetPayout } from '@/lib/payouts';

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

    let finalWinningOptionIds: string[];
    if (Array.isArray(winningOptionIds) && winningOptionIds.length > 0) {
      finalWinningOptionIds = winningOptionIds;
    } else if (winningOptionId) {
      finalWinningOptionIds = [winningOptionId];
    } else {
      console.error('Settlement failed: No winning options provided', { body });
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

    // Map provided IDs to option indices
    const winningOptionIndices: number[] = [];
    for (const optionId of finalWinningOptionIds) {
      const idx = bet.options.findIndex((opt: any) => opt._id.toString() === optionId);
      if (idx === -1) {
        console.error('Settlement failed: Invalid winning option ID', { 
          optionId, 
          betId: bet._id.toString(),
          availableOptions: bet.options.map((o: any) => ({ id: o._id.toString(), text: o.text }))
        });
        return Response.json({ error: `Invalid winning option: ${optionId}` }, { status: 400 });
      }
      winningOptionIndices.push(idx);
    }
    const uniqueWinningIndices = [...new Set(winningOptionIndices)].sort();

    // Transition bet state and persist winning selection
    if (bet.status === 'open') bet.status = 'closed';
    bet.status = 'settled';
    if (bet.votingType === 'multi') {
      bet.winningOptions = uniqueWinningIndices; // store indices
    } else {
      bet.winningOption = uniqueWinningIndices[0];
    }
    await bet.save();

    // Fetch all votes then reuse shared payout calculator
    const allVotes = await Vote.find({ betId: bet._id });
    const payout = calculateBetPayout(bet, allVotes);

    const message = payout.isRefund
      ? 'No winners found - all stakes have been refunded'
      : 'Bet settled successfully';

    return Response.json({
      result: payout,
      message,
      winningOptions: (payout.winningOptionTexts || (payout.winningOptionText ? [payout.winningOptionText] : []))
    });
  } catch (error) {
    console.error('Error settling bet:', error);
    return Response.json({ error: 'Failed to settle bet' }, { status: 500 });
  }
}

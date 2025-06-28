import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
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
    const { winningOptionId } = body;

    if (!winningOptionId) {
      return Response.json({ error: 'Winning option ID is required' }, { status: 400 });
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

    // Check if the winning option exists
    const winningOptionIndex = bet.options.findIndex((opt: any) => 
      opt._id.toString() === winningOptionId || 
      `${bet._id}-option-${bet.options.indexOf(opt) + 1}` === winningOptionId
    );
    
    if (winningOptionIndex === -1) {
      return Response.json({ error: 'Invalid winning option' }, { status: 400 });
    }

    const winningOption = bet.options[winningOptionIndex];

    // Close the bet if it's still open
    if (bet.status === 'open') {
      bet.status = 'closed';
    }

    // Settle the bet
    bet.status = 'settled';
    bet.winningOption = winningOptionIndex;
    await bet.save();

    // Calculate payouts
    const totalPool = bet.options.reduce((total: number, option: any) => 
      total + option.votes.reduce((sum: number, vote: any) => sum + vote.stake, 0), 0
    );

    const winningVotes = winningOption.votes;
    const losingVotes = bet.options.flatMap((option: any, index: number) => 
      index === winningOptionIndex ? [] : option.votes
    );

    const result = {
      totalPool,
      winningOptionId: winningOption._id.toString(),
      winningOptionText: winningOption.text,
      winners: winningVotes.map((vote: any) => ({
        userId: vote.userId.toString(),
        stake: vote.stake,
        payout: totalPool * (vote.stake / winningVotes.reduce((sum: number, v: any) => sum + v.stake, 0))
      })),
      losers: losingVotes.map((vote: any) => ({
        userId: vote.userId.toString(),
        stake: vote.stake,
        loss: vote.stake
      }))
    };

    return Response.json({ 
      result, 
      message: 'Bet settled successfully',
      winningOption: winningOption.text
    });
  } catch (error) {
    console.error('Error settling bet:', error);
    return Response.json({ error: 'Failed to settle bet' }, { status: 500 });
  }
}

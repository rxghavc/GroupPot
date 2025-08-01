import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

// GET /api/groups/:groupId/bets - Get all bets for a group
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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
    const { groupId } = await params;
    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }
    if (!group.members.some((memberId: any) => memberId.toString() === decoded.userId)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const bets = await Bet.find({ groupId }).lean();
    const betIds = bets.map((bet: any) => bet._id);
    const votes = await Vote.find({ betId: { $in: betIds } }).lean();

    // Attach vote counts and total stakes to each option
    const transformedBets = bets.map((bet: any) => {
      const betVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString());
      const options = bet.options.map((option: any, index: number) => {
        const optionVotes = betVotes.filter((v: any) => v.optionId.toString() === option._id.toString());
        return {
          ...option,
          id: `${bet._id}-option-${index + 1}`,
          votesCount: optionVotes.length,
          totalStake: optionVotes.reduce((sum: number, v: any) => sum + v.stake, 0),
          votes: optionVotes // Optionally include all votes for this option
        };
      });
      return {
        ...bet,
        id: bet._id.toString(),
        _id: bet._id,
        votingType: bet.votingType || 'single', // Default to 'single' for existing bets
        options
      };
    });

    return Response.json({ bets: transformedBets });
  } catch (error) {
    console.error('Error fetching group bets:', error);
    return Response.json({ error: 'Failed to fetch group bets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  // This is handled by the main /api/bets route
  return Response.json({ error: 'Use /api/bets to create bets' }, { status: 400 });
}

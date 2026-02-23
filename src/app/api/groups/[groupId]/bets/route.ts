import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import User from '@/models/User';
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
    const groupResult = await Group.findById(groupId).select('members').lean();
    if (!groupResult || Array.isArray(groupResult)) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }
    const group: any = groupResult;
    if (!group.members.some((memberId: any) => memberId.toString() === decoded.userId)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const bets = await Bet.find({ groupId }).lean();
    if (bets.length === 0) {
      return Response.json({ bets: [] });
    }

    const betIds = bets.map((bet: any) => bet._id);
    const votes = await Vote.find({ betId: { $in: betIds } })
      .select('betId optionId userId username stake')
      .lean();

    const votesByBetAndOption = new Map<string, any[]>();
    for (const vote of votes) {
      const mapKey = `${vote.betId.toString()}:${vote.optionId.toString()}`;
      const existing = votesByBetAndOption.get(mapKey);
      if (existing) {
        existing.push(vote);
      } else {
        votesByBetAndOption.set(mapKey, [vote]);
      }
    }

    // Attach vote counts and total stakes to each option
    const transformedBets = bets.map((bet: any) => {
      const options = bet.options.map((option: any, index: number) => {
        const mapKey = `${bet._id.toString()}:${option._id.toString()}`;
        const optionVotes = votesByBetAndOption.get(mapKey) ?? [];
        return {
          ...option,
          id: option._id.toString(), // Use real MongoDB ID for consistency
          _id: option._id,
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
        multiVoteType: bet.multiVoteType, // Include multiVoteType field
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

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
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

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.members.some((memberId: any) => memberId.toString() === decoded.userId)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const bets = await Bet.find({ groupId }).populate('createdBy', 'username');

    // Transform MongoDB _id to id for frontend compatibility
    const transformedBets = bets.map(bet => ({
      ...bet.toObject(),
      id: bet._id.toString(),
      _id: bet._id,
      options: bet.options.map((option: any, index: number) => ({
        ...option.toObject(),
        id: `${bet._id}-option-${index + 1}`,
        _id: option._id,
        votes: option.votes.map((vote: any) => ({
          userId: vote.userId.toString(),
          username: vote.username,
          stake: vote.stake,
          timestamp: vote.timestamp
        }))
      }))
    }));
    
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

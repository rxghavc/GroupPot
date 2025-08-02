import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

// GET /api/bets - Get all bets for the current user
export async function GET(req: NextRequest) {
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
    
    // Find bets where the user is a member of the group
    const userBets = await Bet.find({
      groupId: { $in: await Group.distinct('_id', { members: decoded.userId }) }
    }).populate('groupId', 'name').populate('createdBy', 'username');

    // Transform MongoDB _id to id for frontend compatibility
    const transformedBets = userBets.map(bet => ({
      ...bet.toObject(),
      id: bet._id.toString(),
      _id: bet._id,
      votingType: bet.votingType || 'single', // Default to 'single' for existing bets
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
    console.error('Error fetching bets:', error);
    return Response.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

// POST /api/bets - Create a new bet
export async function POST(req: NextRequest) {
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
    const { 
      groupId, 
      title, 
      description, 
      options, 
      deadline, 
      minStake, 
      maxStake,
      votingType = 'single',
      multiVoteType = 'exact_match'
    } = body;

    if (!groupId || !title || !description || !options || !deadline) {
      return Response.json({ 
        error: 'Group ID, title, description, options, and deadline are required' 
      }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return Response.json({ 
        error: 'At least 2 options are required' 
      }, { status: 400 });
    }

    if (minStake && minStake < 1) {
      return Response.json({ 
        error: 'Minimum stake must be at least £1' 
      }, { status: 400 });
    }

    if (maxStake && maxStake < 1) {
      return Response.json({ 
        error: 'Maximum stake must be at least £1' 
      }, { status: 400 });
    }

    if (minStake && maxStake && minStake >= maxStake) {
      return Response.json({ 
        error: 'Minimum stake must be less than maximum stake' 
      }, { status: 400 });
    }

    await connectDB();

    // Check if user is a moderator of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a moderator or owner
    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    const isOwner = group.ownerId.toString() === decoded.userId;
    
    if (!isModerator && !isOwner) {
      return Response.json({ error: 'Only moderators can create bets' }, { status: 403 });
    }

    const betOptions = options.map((option: string) => ({
      text: option,
      votes: [],
    }));

    const bet = new Bet({
      groupId,
      title,
      description,
      options: betOptions,
      deadline: new Date(deadline),
      status: 'open',
      votingType,
      multiVoteType: votingType === 'multi' ? multiVoteType : undefined,
      minStake: Math.max(1, minStake || group.minStake),
      maxStake: Math.max(1, maxStake || group.maxStake),
      createdBy: decoded.userId,
    });

    await bet.save();

    // Transform MongoDB _id to id for frontend compatibility
    const transformedBet = {
      ...bet.toObject(),
      id: bet._id.toString(),
      _id: bet._id,
      options: bet.options.map((option: any, index: number) => ({
        ...option.toObject(),
        id: `${bet._id}-option-${index + 1}`,
        _id: option._id
      }))
    };

    return Response.json({ bet: transformedBet });
  } catch (error) {
    console.error('Error creating bet:', error);
    return Response.json({ error: 'Failed to create bet' }, { status: 500 });
  }
} 
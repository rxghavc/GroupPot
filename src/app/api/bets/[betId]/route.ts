import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

// GET /api/bets/:betId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ betId: string }> }
) {
  try {
    const { betId } = await params;
    await connectDB();

    const bet = await Bet.findById(betId).populate('groupId');
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Transform MongoDB document to frontend format
    const transformedBet = {
      id: bet._id.toString(),
      title: bet.title,
      description: bet.description,
      options: bet.options.map((option: any) => ({
        id: option._id.toString(),
        text: option.text,
        votes: option.votes.map((vote: any) => ({
          userId: vote.userId.toString(),
          username: vote.username,
          stake: vote.stake,
          timestamp: vote.timestamp
        }))
      })),
      deadline: bet.deadline,
      minStake: bet.minStake,
      maxStake: bet.maxStake,
      status: bet.status,
      groupId: bet.groupId._id.toString(),
      createdAt: bet.createdAt,
      updatedAt: bet.updatedAt
    };

    return NextResponse.json({ bet: transformedBet });
  } catch (error) {
    console.error('Error fetching bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ betId: string }> }
) {
  try {
    const { betId } = await params;
    const body = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const bet = await Bet.findById(betId);
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Check if user is moderator of the group
    const group = await Group.findById(bet.groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isModerator = group.ownerId.toString() === user.userId || 
                       group.moderators.includes(user.userId);
    
    if (!isModerator) {
      return NextResponse.json({ error: 'Only moderators can edit bets' }, { status: 403 });
    }

    // Only allow editing if bet is still open
    if (bet.status !== 'open') {
      return NextResponse.json({ error: 'Cannot edit closed or settled bets' }, { status: 400 });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'deadline', 'minStake', 'maxStake'];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate stake limits
    if (updates.minStake !== undefined || updates.maxStake !== undefined) {
      const minStake = updates.minStake ?? bet.minStake;
      const maxStake = updates.maxStake ?? bet.maxStake;
      
      if (minStake > maxStake) {
        return NextResponse.json({ error: 'Min stake cannot be greater than max stake' }, { status: 400 });
      }

      if (minStake < group.minStake || maxStake > group.maxStake) {
        return NextResponse.json({ 
          error: `Stake must be between £${group.minStake} and £${group.maxStake}` 
        }, { status: 400 });
      }
    }

    const updatedBet = await Bet.findByIdAndUpdate(
      betId,
      updates,
      { new: true }
    ).populate('groupId');

    // Transform response
    const transformedBet = {
      id: updatedBet._id.toString(),
      title: updatedBet.title,
      description: updatedBet.description,
      options: updatedBet.options.map((option: any) => ({
        id: option._id.toString(),
        text: option.text,
        votes: option.votes.map((vote: any) => ({
          userId: vote.userId.toString(),
          username: vote.username,
          stake: vote.stake,
          timestamp: vote.timestamp
        }))
      })),
      deadline: updatedBet.deadline,
      minStake: updatedBet.minStake,
      maxStake: updatedBet.maxStake,
      status: updatedBet.status,
      groupId: updatedBet.groupId._id.toString(),
      createdAt: updatedBet.createdAt,
      updatedAt: updatedBet.updatedAt
    };

    return NextResponse.json({ bet: transformedBet });
  } catch (error) {
    console.error('Error updating bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

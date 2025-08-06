import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import Vote from '@/models/Vote';

// POST /api/bets/:betId/vote - Place a vote on a bet
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
    const { optionId, stake } = body;

    if (!optionId || !stake) {
      return Response.json({ error: 'Option ID and stake are required' }, { status: 400 });
    }

    await connectDB();
    
    // Await params for Next.js 15 compatibility
    const { betId } = await params;

    const bet = await Bet.findById(betId).populate('groupId');
    if (!bet) {
      return Response.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'open') {
      return Response.json({ error: 'Bet is not open for voting' }, { status: 400 });
    }

    if (bet.deadline < new Date()) {
      return Response.json({ error: 'Bet deadline has passed' }, { status: 400 });
    }

    // Find the option index
    const optionIndex = bet.options.findIndex((opt: any) => 
      opt._id.toString() === optionId || 
      `${bet._id}-option-${bet.options.indexOf(opt) + 1}` === optionId
    );

    if (optionIndex === -1) {
      return Response.json({ error: 'Invalid option selected' }, { status: 400 });
    }

    // For multi-vote bets, we need to be more flexible with stake validation
    // since the stake is split across multiple options
    if (bet.votingType === 'multi') {
      // For multi-vote, we'll allow smaller individual stakes as long as the total
      // user stake across all their votes meets the minimum requirement
      // This will be validated at the client level for now
      if (stake <= 0) {
        return Response.json({ error: 'Stake must be greater than 0' }, { status: 400 });
      }
      if (stake > Math.max(1, bet.maxStake)) {
        return Response.json({ 
          error: `Individual stake cannot exceed £${Math.max(1, bet.maxStake)}` 
        }, { status: 400 });
      }
    } else {
      // For single votes, use the original validation
      if (stake < Math.max(1, bet.minStake) || stake > Math.max(1, bet.maxStake)) {
        return Response.json({ 
          error: `Stake must be between £${Math.max(1, bet.minStake)} and £${Math.max(1, bet.maxStake)}` 
        }, { status: 400 });
      }
    }

    // Check if user is a member of the group
    const group = await Group.findById(bet.groupId);
    if (!group || !group.members.some((memberId: any) => memberId.toString() === decoded.userId)) {
      return Response.json({ error: 'You must be a member of the group to vote' }, { status: 403 });
    }

    // Get user info for vote record
    const user = await User.findById(decoded.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has already voted on this bet
    const existingVotes = await Vote.find({ userId: decoded.userId, betId: bet._id });
    
    if (bet.votingType === 'single') {
      // Single vote logic - replace any existing vote
      if (existingVotes.length > 0) {
        // Delete all existing votes for this user on this bet
        await Vote.deleteMany({ userId: decoded.userId, betId: bet._id });
      }
      
      // Create the new vote
      const voteData = {
        userId: decoded.userId,
        username: user.username,
        betId: bet._id,
        optionId: bet.options[optionIndex]._id,
        stake: stake,
        timestamp: new Date()
      };
      await Vote.create(voteData);
      return Response.json({ message: 'Vote placed successfully' });
      
    } else {
      // Multi-vote logic - allow multiple votes on different options
      const existingVoteOnOption = existingVotes.find(vote => 
        vote.optionId.toString() === bet.options[optionIndex]._id.toString()
      );
      
      if (existingVoteOnOption) {
        // Update existing vote on this specific option
        existingVoteOnOption.stake = stake;
        existingVoteOnOption.timestamp = new Date();
        await existingVoteOnOption.save();
        return Response.json({ message: 'Vote updated successfully' });
      } else {
        // Create a new vote on this option
        const voteData = {
          userId: decoded.userId,
          username: user.username,
          betId: bet._id,
          optionId: bet.options[optionIndex]._id,
          stake: stake,
          timestamp: new Date()
        };
        await Vote.create(voteData);
        return Response.json({ message: 'Vote placed successfully' });
      }
    }
  } catch (error) {
    // Error logging removed for production cleanliness
    return Response.json({ error: 'Failed to place vote' }, { status: 500 });
  }
}

// DELETE /api/bets/:betId/vote - Remove a vote from a specific option (for multi-vote bets)
export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    const optionId = searchParams.get('optionId');

    if (!optionId) {
      return Response.json({ error: 'Option ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // Await params for Next.js 15 compatibility
    const { betId } = await params;

    const bet = await Bet.findById(betId);
    if (!bet) {
      return Response.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'open') {
      return Response.json({ error: 'Bet is not open for voting' }, { status: 400 });
    }

    if (bet.votingType !== 'multi') {
      return Response.json({ error: 'Vote removal only allowed for multi-vote bets' }, { status: 400 });
    }

    // Find the option
    const optionIndex = bet.options.findIndex((opt: any) => 
      opt._id.toString() === optionId || 
      `${bet._id}-option-${bet.options.indexOf(opt) + 1}` === optionId
    );

    if (optionIndex === -1) {
      return Response.json({ error: 'Invalid option selected' }, { status: 400 });
    }

    // Remove the vote
    const result = await Vote.deleteOne({ 
      userId: decoded.userId, 
      betId: bet._id, 
      optionId: bet.options[optionIndex]._id 
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Vote not found' }, { status: 404 });
    }

    return Response.json({ message: 'Vote removed successfully' });
  } catch (error) {
    // Error logging removed for production cleanliness
    return Response.json({ error: 'Failed to remove vote' }, { status: 500 });
  }
}

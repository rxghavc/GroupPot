import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import { verifyToken } from '@/lib/auth';

// DELETE /api/groups/:groupId/members/:userId - Remove user from group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
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
    const { groupId, userId } = await params;

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if current user is owner or moderator (for removing others)
    const isOwner = group.ownerId.toString() === decoded.userId;
    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    const isSelfRemoval = decoded.userId === userId;

    // Allow removal if:
    // 1. User is removing themselves, OR
    // 2. User is owner/moderator removing someone else (but not the owner)
    if (!isSelfRemoval && !isOwner && !isModerator) {
      return Response.json({ error: 'Only moderators can remove other members' }, { status: 403 });
    }

    // Cannot remove the group owner
    if (group.ownerId.toString() === userId && !isSelfRemoval) {
      return Response.json({ error: 'Cannot remove the group owner' }, { status: 403 });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return Response.json({ error: 'Not a member of this group' }, { status: 400 });
    }

    // Remove user's votes from all active bets in the group
    const activeBets = await Bet.find({ 
      groupId: groupId, 
      status: { $in: ['open', 'closed'] } // Only active bets, not settled ones
    });

    for (const bet of activeBets) {
      let betModified = false;
      
      // Remove user's votes from all options
      for (const option of bet.options) {
        const originalVoteCount = option.votes.length;
        option.votes = option.votes.filter((vote: any) => vote.userId.toString() !== userId);
        
        if (option.votes.length !== originalVoteCount) {
          betModified = true;
        }
      }
      
      // Save the bet if votes were removed
      if (betModified) {
        await bet.save();
      }
    }

    // Remove user from group
    group.members = group.members.filter((memberId: any) => memberId.toString() !== userId);
    
    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return Response.json({ message: 'Group deleted (no members left)' });
    }
    
    await group.save();
    
    return Response.json({ 
      message: isSelfRemoval ? 'Successfully left group' : 'Member removed successfully',
      votesRemoved: activeBets.length > 0
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    return Response.json({ error: 'Failed to remove member from group' }, { status: 500 });
  }
}

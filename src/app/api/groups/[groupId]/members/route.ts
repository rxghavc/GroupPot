import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// POST /api/groups/:groupId/members - Add a user to a group
export async function POST(
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

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();
    const { groupId } = await params;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if requester is a moderator
    const isOwner = group.ownerId.toString() === decoded.userId;
    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    
    if (!isOwner && !isModerator) {
      return Response.json({ error: 'Only moderators can add members' }, { status: 403 });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    if (group.members.some((memberId: any) => memberId.toString() === userId)) {
      return Response.json({ error: 'User is already a member of this group' }, { status: 400 });
    }

    // Add user to group
    group.members.push(userId);
    await group.save();

    return Response.json({ success: true, message: 'User added to group successfully' });
  } catch (error) {
    console.error('Error adding member to group:', error);
    return Response.json({ error: 'Failed to add member to group' }, { status: 500 });
  }
}

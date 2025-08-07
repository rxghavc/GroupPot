import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User'; // Import User model to register schema
import { verifyToken } from '@/lib/auth';

// POST /api/groups/:groupId/moderators - Promote user to moderator
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

    // Await params for Next.js 15 compatibility
    const { groupId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find the group
    const group = await Group.findById(groupId).populate('members');
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if current user is owner or moderator
    const isOwner = group.ownerId.toString() === decoded.userId;
    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    
    if (!isOwner && !isModerator) {
      return Response.json({ error: 'Only owners and moderators can promote members' }, { status: 403 });
    }

    // Check if target user is a member
    const isMember = group.members.some((member: any) => member._id.toString() === userId);
    if (!isMember) {
      return Response.json({ error: 'User is not a member of this group' }, { status: 400 });
    }

    // Check if user is already a moderator
    const isAlreadyModerator = group.moderators.some((modId: any) => modId.toString() === userId);
    if (isAlreadyModerator) {
      return Response.json({ error: 'User is already a moderator' }, { status: 400 });
    }

    // Cannot promote the owner
    if (group.ownerId.toString() === userId) {
      return Response.json({ error: 'Owner is already a moderator by default' }, { status: 400 });
    }

    // Add user to moderators
    group.moderators.push(userId);
    await group.save();

    return Response.json({ message: 'User promoted to moderator successfully' });
  } catch (error) {
    console.error('Error promoting user to moderator:', error);
    return Response.json({ error: 'Failed to promote user to moderator' }, { status: 500 });
  }
}

// DELETE /api/groups/:groupId/moderators - Demote moderator
export async function DELETE(
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

    // Await params for Next.js 15 compatibility
    const { groupId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if current user is owner or moderator
    const isOwner = group.ownerId.toString() === decoded.userId;
    const isModerator = group.moderators.some((modId: any) => modId.toString() === decoded.userId);
    
    if (!isOwner && !isModerator) {
      return Response.json({ error: 'Only owners and moderators can demote moderators' }, { status: 403 });
    }

    // Cannot demote the owner
    if (group.ownerId.toString() === userId) {
      return Response.json({ error: 'Cannot demote the group owner' }, { status: 400 });
    }

    // Check if user is currently a moderator
    const isCurrentlyModerator = group.moderators.some((modId: any) => modId.toString() === userId);
    if (!isCurrentlyModerator) {
      return Response.json({ error: 'User is not a moderator' }, { status: 400 });
    }

    // Remove user from moderators
    group.moderators = group.moderators.filter((modId: any) => modId.toString() !== userId);
    await group.save();

    return Response.json({ message: 'Moderator demoted successfully' });
  } catch (error) {
    console.error('Error demoting moderator:', error);
    return Response.json({ error: 'Failed to demote moderator' }, { status: 500 });
  }
}

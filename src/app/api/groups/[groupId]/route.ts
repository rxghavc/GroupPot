import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

// GET /api/groups/:groupId - Get a specific group
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
    
    // Await params for Next.js 15 compatibility
    const { groupId } = await params;
    
    const group = await Group.findById(groupId).populate('members', 'username email');
    
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member of this group
    if (!group.members.some((member: any) => member._id.toString() === decoded.userId)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform MongoDB _id to id for frontend compatibility
    const transformedGroup = {
      ...group.toObject(),
      id: group._id.toString(),
      _id: group._id
    };
    
    return Response.json({ group: transformedGroup });
  } catch (error) {
    console.error('Error fetching group:', error);
    return Response.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
} 
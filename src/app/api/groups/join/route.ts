import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

// POST /api/groups/join - Join a group by code
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
    const { code } = body;

    if (!code) {
      return Response.json({ error: 'Group code is required' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findOne({ code: code.toUpperCase() });
    if (!group) {
      return Response.json({ error: 'Invalid group code' }, { status: 404 });
    }

    // Check if user is already a member
    if (group.members.includes(decoded.userId)) {
      return Response.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Add user to group
    group.members.push(decoded.userId);
    await group.save();

    // Populate members data
    await group.populate('members', 'username email');

    // Transform MongoDB _id to id for frontend compatibility
    const transformedGroup = {
      ...group.toObject(),
      id: group._id.toString(),
      _id: group._id
    };

    return Response.json({ group: transformedGroup, message: 'Successfully joined group' });
  } catch (error) {
    console.error('Error joining group:', error);
    return Response.json({ error: 'Failed to join group' }, { status: 500 });
  }
}

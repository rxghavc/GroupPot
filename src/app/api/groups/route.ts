import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET /api/groups - Get all groups for the current user
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
    
    // Find groups where the user is a member
    const groups = await Group.find({
      members: decoded.userId
    }).populate('members', 'username email');

    // Transform MongoDB _id to id for frontend compatibility
    const transformedGroups = groups.map(group => ({
      ...group.toObject(),
      id: group._id.toString(),
      _id: group._id
    }));

    return Response.json({ groups: transformedGroups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return Response.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
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
    const { name, description, minStake = 1, maxStake = 100 } = body;

    if (!name || !description) {
      return Response.json({ error: 'Name and description are required' }, { status: 400 });
    }

    await connectDB();

    // Generate a unique 6-character code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existingGroup = await Group.findOne({ code });
      if (!existingGroup) {
        isUnique = true;
      }
    }

    const group = new Group({
      name,
      description,
      code,
      ownerId: decoded.userId,
      moderators: [decoded.userId],
      members: [decoded.userId],
      minStake,
      maxStake,
    });

    await group.save();

    // Populate members data
    await group.populate('members', 'username email');

    // Transform MongoDB _id to id for frontend compatibility
    const transformedGroup = {
      ...group.toObject(),
      id: group._id.toString(),
      _id: group._id
    };

    return Response.json({ group: transformedGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    return Response.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

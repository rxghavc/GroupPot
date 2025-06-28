import connectDB from '@/lib/db';
import User from '@/models/User';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import { getUserFromToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// GET /api/auth/me - Get current user profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);
    
    if (!userPayload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userPayload.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's groups
    const groups = await Group.find({ members: user._id }).populate('members', 'username');

    // Get bets for each group
    const groupsWithBets = await Promise.all(
      groups.map(async (group) => {
        const bets = await Bet.find({ groupId: group._id }).populate('createdBy', 'username');
        return {
          groupId: group._id,
          name: group.name,
          members: group.members,
          bets: bets
        };
      })
    );

    return Response.json({ 
      userId: user._id, 
      username: user.username,
      email: user.email,
      groups: groupsWithBets
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

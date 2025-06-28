import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bet from '@/models/Bet';
import { verifyToken } from '@/lib/auth';

// GET /api/users/:userId - Get public profile info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
    const { userId } = await params;

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's betting stats
    const userBets = await Bet.find({ createdBy: userId });
    const userVotes = await Bet.aggregate([
      { $unwind: '$options' },
      { $unwind: '$options.votes' },
      { $match: { 'options.votes.userId': userId } },
      { $project: { stake: '$options.votes.stake' } }
    ]);
    
    // Calculate stats
    const totalBets = userBets.length;
    const totalStaked = userVotes.reduce((sum, vote) => sum + vote.stake, 0);
    const settledBets = userBets.filter(bet => bet.status === 'settled');
    const wins = settledBets.filter(bet => 
      bet.winningOption !== null && 
      bet.options[bet.winningOption].votes.some((vote: any) => vote.userId.toString() === userId)
    ).length;
    const losses = settledBets.length - wins;

    const stats = {
      totalBets,
      totalStaked,
      wins,
      losses,
      winRate: settledBets.length > 0 ? (wins / settledBets.length * 100).toFixed(1) : '0.0'
    };

    return Response.json({ 
      userId: user._id.toString(), 
      username: user.username,
      stats 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

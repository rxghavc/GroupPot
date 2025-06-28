import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bet from '@/models/Bet';
import { verifyToken } from '@/lib/auth';

// GET /api/users/:userId/bets - Get bets user has participated in
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

    // Get bets where user has voted
    const betsWithVotes = await Bet.aggregate([
      { $unwind: '$options' },
      { $unwind: '$options.votes' },
      { $match: { 'options.votes.userId': userId } },
      { $group: { 
        _id: '$_id', 
        title: { $first: '$title' },
        status: { $first: '$status' },
        deadline: { $first: '$deadline' },
        winningOption: { $first: '$winningOption' },
        userVote: { 
          $push: { 
            optionId: '$options._id',
            stake: '$options.votes.stake'
          }
        }
      }}
    ]);

    // Create detailed bet participation records
    const betParticipation = betsWithVotes.map(bet => {
      const userVote = bet.userVote[0]; // User can only vote once per bet
      
      let result = 'pending';
      let stake = userVote.stake;
      let payout = 0;

      if (bet.status === 'settled') {
        const votedOptionId = userVote.optionId.toString();
        const winningOptionId = bet.winningOption !== null ? 
          bet._id.toString() + '-option-' + (bet.winningOption + 1) : null;
        
        if (votedOptionId === winningOptionId) {
          result = 'won';
          // Calculate payout (simplified - in real app you'd store this)
          payout = stake * 1.5; // Placeholder calculation
        } else {
          result = 'lost';
        }
      }

      return {
        betId: bet._id.toString(),
        title: bet.title,
        result,
        stake,
        payout: payout.toFixed(2),
        status: bet.status,
        deadline: bet.deadline
      };
    });

    return Response.json(betParticipation);
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return Response.json({ error: 'Failed to fetch user bets' }, { status: 500 });
  }
} 
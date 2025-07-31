import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
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
    const { userId } = await params;
    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all votes by this user
    const votes = await Vote.find({ userId }).lean();
    if (votes.length === 0) return Response.json([]);

    // Group votes by betId
    const betIds = [...new Set(votes.map((v: any) => v.betId.toString()))];
    const bets = await Bet.find({ _id: { $in: betIds } }).lean();
    const groupIds = [...new Set(bets.map((b: any) => b.groupId.toString()))];
    const groups = await Group.find({ _id: { $in: groupIds } }).lean();
    const groupMap = new Map(groups.map((g: any) => [g._id.toString(), g.name]));

    // For each bet, collect the user's votes
    const betParticipation = bets.map((bet: any) => {
      const userVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString()).map((v: any) => ({
        optionId: v.optionId.toString(),
        optionText: (bet.options.find((opt: any) => opt._id.toString() === v.optionId.toString())?.text) || '',
        stake: v.stake,
        result: (() => {
          if (bet.status === 'settled') {
            const winningOptionIndex = bet.winningOption;
            const winningOptionId = bet.options[winningOptionIndex]?._id?.toString();
            if (v.optionId.toString() === winningOptionId) return 'won';
            else return 'lost';
          }
          return 'pending';
        })()
      }));
      let result = 'pending';
      let payout = 0;
      if (bet.status === 'settled') {
        if (userVotes.some((v: any) => v.result === 'won')) {
          result = 'won';
          
          // Calculate actual payout using pool-based system
          const allBetVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString());
          
          // Group all votes by option
          const allVotesByOption = new Map();
          bet.options.forEach((option: any) => {
            allVotesByOption.set(option._id.toString(), []);
          });
          
          allBetVotes.forEach((vote: any) => {
            const optionId = vote.optionId.toString();
            if (allVotesByOption.has(optionId)) {
              allVotesByOption.get(optionId).push({
                userId: vote.userId.toString(),
                stake: vote.stake
              });
            }
          });

          const winningOption = bet.options[bet.winningOption!];
          const winningVotes = allVotesByOption.get(winningOption._id.toString()) || [];
          
          // Get losing votes (all votes not on winning option)
          const losingVotes = [];
          bet.options.forEach((option: any, index: number) => {
            if (index !== bet.winningOption) {
              const optionVotes = allVotesByOption.get(option._id.toString()) || [];
              losingVotes.push(...optionVotes);
            }
          });

          // Calculate total losing stakes and winning stakes
          const totalLosingStakes = losingVotes.reduce((sum, vote) => sum + vote.stake, 0);
          const totalWinningStakes = winningVotes.reduce((sum, vote) => sum + vote.stake, 0);

          // Calculate payout for this user's winning votes
          payout = userVotes
            .filter((v: any) => v.result === 'won')
            .reduce((sum: number, userVote: any) => {
              // Each winner gets their stake back plus a proportional share of losing stakes
              const proportionalShare = totalWinningStakes > 0 ? 
                (userVote.stake / totalWinningStakes) * totalLosingStakes : 0;
              return sum + userVote.stake + proportionalShare;
            }, 0);
        } else {
          result = 'lost';
        }
      }
      return {
        betId: bet._id.toString(),
        title: bet.title,
        groupId: bet.groupId.toString(),
        groupName: groupMap.get(bet.groupId.toString()) || '',
        result,
        userVotes,
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
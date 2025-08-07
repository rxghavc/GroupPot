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
    const betParticipation = await Promise.all(bets.map(async (bet: any) => {
      const userVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString()).map((v: any) => ({
        optionId: v.optionId.toString(),
        optionText: (bet.options.find((opt: any) => opt._id.toString() === v.optionId.toString())?.text) || '',
        stake: v.stake
      }));

      let result = 'pending';
      let payout = 0;
      let isRefund = false;
      
      if (bet.status === 'settled') {
        // Check if this is a refund scenario first
        if (bet.votingType === 'multi') {
          // For multi-vote, check if there are any winners at all
          const winningOptionIndices = bet.winningOptions || [];
          const winningOptionIds = winningOptionIndices.map((index: number) => 
            bet.options[index]._id.toString()
          ).sort();
          
          // Get all votes for this bet to check if anyone won
          const allBetVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString());
          const votesByUser = new Map();
          allBetVotes.forEach((vote: any) => {
            const userId = vote.userId.toString();
            if (!votesByUser.has(userId)) {
              votesByUser.set(userId, []);
            }
            votesByUser.get(userId).push(vote);
          });

          let hasAnyWinners = false;
          votesByUser.forEach((userBetVotes: any) => {
            const userOptionIds = userBetVotes.map((vote: any) => vote.optionId.toString()).sort();
            
            let isWinner = false;
            if (bet.multiVoteType === 'exact_match') {
              // Exact match: must vote on ALL winning options and ONLY those options
              isWinner = userOptionIds.length === winningOptionIds.length && 
                         userOptionIds.every((id: string) => winningOptionIds.includes(id));
            } else {
              // Partial match: win if voted on ANY of the winning options
              isWinner = userOptionIds.some((id: string) => winningOptionIds.includes(id));
            }
            
            if (isWinner) {
              hasAnyWinners = true;
            }
          });

          if (!hasAnyWinners) {
            // No winners - refund scenario
            isRefund = true;
            result = 'refund';
            payout = userVotes.reduce((sum: number, v: any) => sum + v.stake, 0);
          } else {
            // Normal multi-vote logic
            const userOptionIds = userVotes.map((v: any) => v.optionId).sort();
            
            if (bet.multiVoteType === 'exact_match') {
              // Exact match: must vote on ALL winning options and ONLY those options
              const isWinner = userOptionIds.length === winningOptionIds.length && 
                               userOptionIds.every((id: string) => winningOptionIds.includes(id));
              result = isWinner ? 'won' : 'lost';
            } else {
              // Partial match: win if voted on ANY winning options
              const userWinningOptions = userVotes.filter((v: any) => 
                winningOptionIds.includes(v.optionId)
              );
              result = userWinningOptions.length > 0 ? 'won' : 'lost';
            }
          }
        } else {
          // Single vote logic - check for refund first
          const winningOptionIndex = bet.winningOption;
          const winningOptionId = bet.options[winningOptionIndex]?._id?.toString();
          
          // Check if anyone voted on the winning option
          const allBetVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString());
          const hasWinnersOnOption = allBetVotes.some((v: any) => v.optionId.toString() === winningOptionId);
          
          if (!hasWinnersOnOption) {
            // No one voted on winning option - refund scenario
            isRefund = true;
            result = 'refund';
            payout = userVotes.reduce((sum: number, v: any) => sum + v.stake, 0);
          } else {
            // Normal single vote logic
            const hasWinningVote = userVotes.some((v: any) => v.optionId === winningOptionId);
            result = hasWinningVote ? 'won' : 'lost';
          }
        }
        
        if (result === 'won' && !isRefund) {
          // Get actual payout from the payouts API instead of recalculating
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('host') ? `https://${req.headers.get('host')}` : 'http://localhost:3000');
            const payoutsResponse = await fetch(`${baseUrl}/api/bets/${bet._id}/payouts`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (payoutsResponse.ok) {
              const payoutsData = await payoutsResponse.json();
              const winner = payoutsData.result.winners.find((w: any) => w.userId === userId);
              if (winner) {
                payout = winner.payout;
              }
            }
          } catch (error) {
            console.error('Error fetching payout data:', error);
            // Fallback to 0 if we can't get the payout
            payout = 0;
          }
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
        deadline: bet.deadline,
        isRefund
      };
    }));

    return Response.json(betParticipation);
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return Response.json({ error: 'Failed to fetch user bets' }, { status: 500 });
  }
} 
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

    // For each bet, collect the user's votes and compute payout from payouts API for settled bets
    const betParticipation = await Promise.all(bets.map(async (bet: any) => {
      const thisUserVotes = votes.filter((v: any) => v.betId.toString() === bet._id.toString());

      // Prepare userVotes with optionText and stake; result will be filled later if settled
      let userVotes = thisUserVotes.map((v: any) => ({
        optionId: v.optionId.toString(),
        optionText: (bet.options.find((opt: any) => opt._id.toString() === v.optionId.toString())?.text) || '',
        stake: v.stake as number,
        result: 'pending' as 'pending' | 'won' | 'lost'
      }));

      let result: 'pending' | 'won' | 'lost' | 'refund' = 'pending';
      let payout = 0;
      let isRefund = false;

      if (bet.status === 'settled') {
        try {
          // Always use the payouts API so frontend and backend use the same source of truth
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
          const payoutsRes = await fetch(`${baseUrl}/api/bets/${bet._id}/payouts`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (payoutsRes.ok) {
            const payoutsData = await payoutsRes.json();
            const payoutResult = payoutsData.result;

            // Refund case
            if (payoutResult.isRefund) {
              isRefund = true;
              result = 'refund';
              payout = userVotes.reduce((sum, v) => sum + v.stake, 0);
              // Mark all votes neutral (treat as won for coloring? Keep neutral)
              userVotes = userVotes.map(v => ({ ...v, result: 'pending' }));
            } else {
              // Winner lookup by userId
              const winner = payoutResult.winners.find((w: any) => w.userId === userId);
              if (winner) {
                result = 'won';
                payout = winner.payout;
              } else {
                result = 'lost';
                payout = 0;
              }

              // Per-vote result annotation
              if (bet.votingType === 'single') {
                const winningId = payoutResult.winningOptionId;
                userVotes = userVotes.map(v => ({
                  ...v,
                  result: v.optionId === winningId ? 'won' : 'lost'
                }));
              } else {
                const winningIds: string[] = payoutResult.winningOptionIds || [];
                if (bet.multiVoteType === 'exact_match') {
                  // In exact match, either all of the user's votes are winning (if they are a winner), or all are losing
                  const voteRes = result === 'won' ? 'won' : 'lost';
                  userVotes = userVotes.map(v => ({ ...v, result: voteRes }));
                } else {
                  // partial_match: mark only votes that are among winning options as won
                  userVotes = userVotes.map(v => ({
                    ...v,
                    result: winningIds.includes(v.optionId) ? 'won' : 'lost'
                  }));
                }
              }
            }
          } else {
            // If payouts API fails, fall back to safe defaults (lost with 0 payout)
            result = 'lost';
            payout = 0;
          }
        } catch (err) {
          // Network/other error
          result = 'lost';
          payout = 0;
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
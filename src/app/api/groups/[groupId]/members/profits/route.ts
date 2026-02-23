import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { calculateBetPayout } from '@/lib/payouts';

// GET /api/groups/:groupId/members/profits
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ error: 'Invalid token' }, { status: 401 });

    await connectDB();
    const { groupId } = await params;
  const groupDoc: any = await Group.findById(groupId).lean();
  if (!groupDoc) return Response.json({ error: 'Group not found' }, { status: 404 });

  const groupMembers: any[] = Array.isArray(groupDoc.members) ? groupDoc.members : [];

  // Ensure requester is a member
  if (!groupMembers.some((m: any) => m.toString() === decoded.userId)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

  const bets: any[] = await Bet.find({ groupId }).lean();
    if (bets.length === 0) return Response.json({ profits: {} });

    const betIds = bets.map((b: any) => b._id);
    const votes = await Vote.find({ betId: { $in: betIds } }).lean();

    const votesByBetId = new Map<string, any[]>();
    const stakeByBetAndUser = new Map<string, Map<string, number>>();

    votes.forEach((v: any) => {
      const betIdStr = v.betId.toString();
      const uid = v.userId.toString();

      if (!votesByBetId.has(betIdStr)) {
        votesByBetId.set(betIdStr, []);
      }
      votesByBetId.get(betIdStr)!.push(v);

      if (!stakeByBetAndUser.has(betIdStr)) {
        stakeByBetAndUser.set(betIdStr, new Map());
      }
      const perUserStake = stakeByBetAndUser.get(betIdStr)!;
      perUserStake.set(uid, (perUserStake.get(uid) || 0) + v.stake);
    });

    // Initialize stats per user
    const memberIds: string[] = groupMembers.map((m: any) => m.toString());
    const stats: Record<string, { totalStakes: number; totalPayouts: number; netProfit: number; totalBets: number; settledBets: number; pendingBets: number; }> = {};
    memberIds.forEach((id: string) => {
      stats[id] = { totalStakes: 0, totalPayouts: 0, netProfit: 0, totalBets: 0, settledBets: 0, pendingBets: 0 };
    });

    // Process each bet once
    for (const bet of bets) {
      const betIdStr = (bet._id as any).toString();
      const betVotes = votesByBetId.get(betIdStr) || [];
      if (betVotes.length === 0) continue;
      const perUserStake = stakeByBetAndUser.get(betIdStr) || new Map<string, number>();
      const participants = new Set(perUserStake.keys());
      participants.forEach(uid => {
        if (!stats[uid]) return; // skip non-members just in case
        stats[uid].totalBets += 1;
      });

  if (bet.status === 'settled') {
        try {
          const payoutResult = calculateBetPayout(bet, betVotes);
          participants.forEach(uid => {
            if (!stats[uid]) return;
            stats[uid].settledBets += 1;
            // Total stake user placed on this bet
            const userStakeForBet = perUserStake.get(uid) || 0;
            stats[uid].totalStakes += userStakeForBet;
            if (payoutResult.isRefund) {
              stats[uid].totalPayouts += userStakeForBet; // refunded
            } else {
      const winner = payoutResult.winners.find((w: any) => w.userId.toString() === uid);
              if (winner) {
                stats[uid].totalPayouts += winner.payout;
              }
            }
          });
        } catch (e) {
          // If payout calculation fails, treat bet as pending for all participants
          participants.forEach(uid => { if (stats[uid]) stats[uid].pendingBets += 1; });
        }
      } else {
        participants.forEach(uid => {
          if (!stats[uid]) return;
          stats[uid].pendingBets += 1;
          const userStakeForBet = perUserStake.get(uid) || 0;
          stats[uid].totalStakes += userStakeForBet; // stakes committed
        });
      }
    }

    // Final net profit
    Object.values(stats).forEach(s => {
      s.netProfit = s.totalPayouts - s.totalStakes;
    });

    return Response.json({ profits: stats });
  } catch (e) {
    console.error('Error computing group member profits', e);
    return Response.json({ error: 'Failed to compute member profits' }, { status: 500 });
  }
}

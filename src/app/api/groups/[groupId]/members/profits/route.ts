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

    // Pre-group votes by user for stakes tally
    const userStakeMap = new Map<string, number>();
    const userVotesByBet = new Map<string, Map<string, number>>(); // userId -> (betId -> stakeSumForBet)

    votes.forEach((v: any) => {
      const uid = v.userId.toString();
      userStakeMap.set(uid, (userStakeMap.get(uid) || 0) + v.stake);
      if (!userVotesByBet.has(uid)) userVotesByBet.set(uid, new Map());
      const perBet = userVotesByBet.get(uid)!;
      perBet.set(v.betId.toString(), (perBet.get(v.betId.toString()) || 0) + v.stake);
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
      const betVotes = votes.filter((v: any) => v.betId.toString() === betIdStr);
      if (betVotes.length === 0) continue;
      // Users who participated in this bet
      const participants = new Set(betVotes.map(v => v.userId.toString()));
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
    const userStakeForBet = betVotes.filter((v: any) => v.userId.toString() === uid).reduce((s: number, v: any) => s + v.stake, 0);
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
      const userStakeForBet = betVotes.filter((v: any) => v.userId.toString() === uid).reduce((s: number, v: any) => s + v.stake, 0);
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

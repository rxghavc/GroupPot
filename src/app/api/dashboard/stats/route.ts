import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics for the logged-in user
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

    const userId = decoded.userId;

    // Get total groups the user belongs to
    const userGroups = await Group.find({
      $or: [
        { ownerId: userId },
        { members: userId },
        { moderators: userId }
      ]
    }).lean();

    const totalGroups = userGroups.length;

    // Get user's votes to find participated bets
    const userVotes = await Vote.find({ userId }).lean();
    const betIds = [...new Set(userVotes.map(vote => vote.betId.toString()))];

    // Get all bets the user has participated in
    const userBets = await Bet.find({ _id: { $in: betIds } }).lean();

    // Total lifetime bets (all bets the user has placed votes on)
    const totalLifetimeBets = userBets.length;

    // Count active bets (open or closed but not settled)
    const activeBets = userBets.filter(bet => bet.status !== 'settled').length;

    // Calculate pending payouts (sum of actual payouts from won settled bets)
    let pendingPayouts = 0;
    const settledBets = userBets.filter(bet => bet.status === 'settled');
    
    for (const bet of settledBets) {
      const userBetVotes = userVotes.filter(vote => vote.betId.toString() === bet._id.toString());
      
      // Check if user has winning votes
      const userWinningVotes = userBetVotes.filter(vote => {
        const winningOption = bet.options[bet.winningOption!];
        return winningOption && vote.optionId.toString() === winningOption._id.toString();
      });

      if (userWinningVotes.length > 0) {
        // Get all votes for this bet to calculate pool distribution
        const allBetVotes = userVotes.filter(v => v.betId.toString() === bet._id.toString());
        
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

        // Calculate payout for this user's winning votes (same logic as user bets API)
        const betPayout = userWinningVotes.reduce((sum, userVote) => {
          // Each winner gets their stake back plus a proportional share of losing stakes
          const proportionalShare = totalWinningStakes > 0 ? 
            (userVote.stake / totalWinningStakes) * totalLosingStakes : 0;
          return sum + userVote.stake + proportionalShare;
        }, 0);
        
        pendingPayouts += betPayout;
      }
    }

    // Find most active group (group with most bets user participated in)
    const groupBetCounts = new Map();
    userBets.forEach(bet => {
      const groupId = bet.groupId.toString();
      groupBetCounts.set(groupId, (groupBetCounts.get(groupId) || 0) + 1);
    });

    let mostActiveGroup = "None";
    let maxBets = 0;
    for (const [groupId, count] of groupBetCounts) {
      if (count > maxBets) {
        maxBets = count;
        const group = userGroups.find(g => g._id.toString() === groupId);
        mostActiveGroup = group?.name || "Unknown";
      }
    }

    // Find last joined group
    const sortedGroups = userGroups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastJoined = sortedGroups.length > 0 
      ? new Date(sortedGroups[0].createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : "Never";

    // Find most recent bet
    const sortedBets = userBets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const mostRecentBet = sortedBets.length > 0 ? sortedBets[0].title : "None";

    // Find biggest wager
    const biggestWager = userVotes.length > 0 
      ? Math.max(...userVotes.map(vote => vote.stake))
      : 0;

    // For now, set placeholder values for next payout and unclaimed
    const nextPayout = "TBD";
    const unclaimed = 0;

    const stats = {
      totalGroups,
      activeBets,
      totalLifetimeBets,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100, // Round to 2 decimal places
      mostActiveGroup,
      lastJoined,
      mostRecentBet,
      biggestWager,
      nextPayout,
      unclaimed
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

// GET /api/dashboard/recent-bets - Get recent bets for dashboard table
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

    // Get user's votes
    const userVotes = await Vote.find({ userId }).lean();
    
    if (userVotes.length === 0) {
      return Response.json([]);
    }

    // Get all bets the user participated in
    const betIds = [...new Set(userVotes.map(vote => vote.betId.toString()))];
    const userBets = await Bet.find({ _id: { $in: betIds } }).lean();

    // Get group information
    const groupIds = [...new Set(userBets.map(bet => bet.groupId.toString()))];
    const groups = await Group.find({ _id: { $in: groupIds } }).lean();
    const groupMap = new Map(groups.map(g => [g._id.toString(), g.name]));

    // Process each bet to create table data
    const tableData = userBets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Most recent first
      .slice(0, 10) // Limit to 10 most recent
      .map(bet => {
        const betVotes = userVotes.filter(vote => vote.betId.toString() === bet._id.toString());
        const totalWager = betVotes.reduce((sum, vote) => sum + vote.stake, 0);
        
        let status = "Open";
        let payout = 0;

        if (bet.status === "closed") {
          status = "Closed";
        } else if (bet.status === "settled") {
          // Check if user won
          const hasWinningVote = betVotes.some(vote => {
            const winningOption = bet.options[bet.winningOption!];
            return winningOption && vote.optionId.toString() === winningOption._id.toString();
          });

          if (hasWinningVote) {
            status = "Won";
            // Calculate simplified payout for now
            payout = totalWager * 1.5; // Placeholder calculation
          } else {
            status = "Lost";
            payout = 0;
          }
        }

        return {
          date: new Date(bet.createdAt).toLocaleDateString(),
          group: groupMap.get(bet.groupId.toString()) || "Unknown",
          bet: bet.title,
          wager: totalWager,
          payout: payout,
          status: status
        };
      });

    return Response.json(tableData);
  } catch (error) {
    console.error('Error fetching recent bets:', error);
    return Response.json({ error: 'Failed to fetch recent bets' }, { status: 500 });
  }
}

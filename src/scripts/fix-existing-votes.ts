import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import User from '@/models/User';

// This script updates all existing votes in all bets to include userId, username, and stake if missing.
// For demo purposes, it sets userId to the bet's createdBy, username to 'unknown', and stake to 1 if missing.
// You should manually fix these values if you want accuracy.

async function fixVotes() {
  await connectDB();
  const bets = await Bet.find({});
  let updatedCount = 0;

  for (const bet of bets) {
    let changed = false;
    for (const option of bet.options) {
      for (let i = 0; i < option.votes.length; i++) {
        const vote = option.votes[i];
        // If vote only has _id, add missing fields
        if (!vote.userId) {
          // Use bet.createdBy as fallback userId
          vote.userId = bet.createdBy;
          vote.username = 'unknown';
          vote.stake = 1;
          vote.timestamp = vote.timestamp || new Date(bet.createdAt);
          changed = true;
        }
      }
    }
    if (changed) {
      await bet.save();
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} bet(s) with missing vote fields.`);
  process.exit(0);
}

fixVotes().catch(err => {
  console.error('Error fixing votes:', err);
  process.exit(1);
}); 
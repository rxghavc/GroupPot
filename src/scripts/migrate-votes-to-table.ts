import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';

async function migrateVotes() {
  await connectDB();
  const bets = await Bet.find({});
  let migrated = 0;

  for (const bet of bets) {
    for (const option of bet.options) {
      for (const vote of option.votes) {
        // Only migrate if userId exists
        if (vote.userId) {
          await Vote.create({
            userId: vote.userId,
            betId: bet._id,
            optionId: option._id,
            stake: vote.stake,
            timestamp: vote.timestamp || bet.createdAt,
            username: vote.username || undefined
          });
          migrated++;
        }
      }
      // Clear embedded votes
      option.votes = [];
    }
    await bet.save();
  }
  console.log(`Migrated ${migrated} votes to the votes collection.`);
  process.exit(0);
}

migrateVotes().catch(err => {
  console.error('Error migrating votes:', err);
  process.exit(1);
}); 
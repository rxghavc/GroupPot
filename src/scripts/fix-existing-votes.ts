import connectDB from '../lib/db';
import Bet from '../models/Bet';
import User from '../models/User';

async function fixExistingVotes() {
  try {
    await connectDB();
    
    // Find all bets with votes that have undefined usernames
    const bets = await Bet.find({
      'options.votes.username': { $exists: false }
    });
    
    console.log(`Found ${bets.length} bets with votes missing usernames`);
    
    let totalFixed = 0;
    
    for (const bet of bets) {
      let betModified = false;
      
      for (const option of bet.options) {
        for (const vote of option.votes) {
          if (!vote.username && vote.userId) {
            // Look up the user to get their username
            const user = await User.findById(vote.userId);
            if (user && user.username) {
              vote.username = user.username;
              betModified = true;
              totalFixed++;
              console.log(`Fixed vote for user ${user.username} in bet ${bet.title}`);
            } else {
              console.log(`Could not find user or username for vote with userId: ${vote.userId}`);
            }
          }
        }
      }
      
      if (betModified) {
        await bet.save();
        console.log(`Saved bet: ${bet.title}`);
      }
    }
    
    console.log(`Total votes fixed: ${totalFixed}`);
    
  } catch (error) {
    console.error('Error fixing existing votes:', error);
  } finally {
    process.exit(0);
  }
}

fixExistingVotes(); 
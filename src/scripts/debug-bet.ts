import connectDB from '../lib/db';
import Bet from '../models/Bet';

async function debugBet() {
  try {
    await connectDB();
    
    // Find the specific bet that's causing issues
    const bet = await Bet.findById('686006e8917bd2ec1e5b2e80');
    
    if (!bet) {
      console.log('Bet not found');
      return;
    }
    
    console.log('Bet found:', {
      id: bet._id,
      title: bet.title,
      status: bet.status,
      optionsCount: bet.options.length
    });
    
    // Check each option and its votes
    bet.options.forEach((option: any, index: number) => {
      console.log(`Option ${index}:`, {
        text: option.text,
        votesCount: option.votes.length,
        votes: option.votes.map((vote: any) => ({
          userId: vote.userId,
          username: vote.username,
          stake: vote.stake
        }))
      });
    });
    
  } catch (error) {
    console.error('Error debugging bet:', error);
  } finally {
    process.exit(0);
  }
}

debugBet(); 
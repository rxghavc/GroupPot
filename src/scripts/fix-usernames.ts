import connectDB from '../lib/db';
import User from '../models/User';

async function fixUsernames() {
  try {
    await connectDB();
    
    // Find users without usernames
    const usersWithoutUsernames = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });
    
    console.log(`Found ${usersWithoutUsernames.length} users without usernames`);
    
    if (usersWithoutUsernames.length === 0) {
      console.log('All users have usernames!');
      return;
    }
    
    // Fix users by generating usernames from email
    for (const user of usersWithoutUsernames) {
      const emailPrefix = user.email.split('@')[0];
      let username = emailPrefix;
      let counter = 1;
      
      // Ensure username is unique
      while (await User.findOne({ username })) {
        username = `${emailPrefix}${counter}`;
        counter++;
      }
      
      user.username = username;
      await user.save();
      
      console.log(`Fixed user ${user.email} with username: ${username}`);
    }
    
    console.log('All users have been fixed!');
  } catch (error) {
    console.error('Error fixing usernames:', error);
  } finally {
    process.exit(0);
  }
}

fixUsernames(); 
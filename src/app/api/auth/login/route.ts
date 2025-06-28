import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// POST /api/auth/login - Login user
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return Response.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    return Response.json({ 
      token, 
      userId: user._id, 
      username: user.username 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return Response.json({ error: 'Failed to login' }, { status: 500 });
  }
}

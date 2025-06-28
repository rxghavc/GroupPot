import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// POST /api/auth/signup - Create new user account
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return Response.json({ 
        error: 'Username, email, and password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return Response.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return Response.json({ 
        error: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username already taken'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    return Response.json({ 
      userId: user._id, 
      token, 
      username: user.username 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextRequest } from 'next/server';

// POST /api/auth/verify-reset-token - Verify reset token and return user info
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ 
        error: 'Reset token is required' 
      }, { status: 400 });
    }

    // Find user with this reset token
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return Response.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    // Return user info (without sensitive data)
    return Response.json({
      email: user.email,
      username: user.username
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return Response.json({ 
      error: 'Server error' 
    }, { status: 500 });
  }
}

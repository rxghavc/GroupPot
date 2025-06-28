import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { NextRequest } from 'next/server';

// POST /api/auth/reset-password - Reset password with token
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json({ 
        error: 'Token and new password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return Response.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return Response.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update user password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    return Response.json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return Response.json({ error: 'Failed to reset password' }, { status: 500 });
  }
} 
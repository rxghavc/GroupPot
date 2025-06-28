import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

// POST /api/auth/forgot-password - Request password reset
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return Response.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Always return success to prevent email enumeration
      return Response.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry
    });

    // Send reset email
    try {
      await sendEmail(generatePasswordResetEmail(email, resetToken));
    } catch (error) {
      console.error('Failed to send reset email:', error);
    }

    // Always return success to prevent email enumeration
    return Response.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return Response.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  }
} 
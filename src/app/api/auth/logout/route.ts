import { NextRequest } from 'next/server';

// POST /api/auth/logout - Logout user
export async function POST(req: NextRequest) {
  try {
    // TODO: Invalidate JWT token (add to blacklist or set expiry)
    // For now, just return success message
    
    return Response.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Error logging out:', error);
    return Response.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

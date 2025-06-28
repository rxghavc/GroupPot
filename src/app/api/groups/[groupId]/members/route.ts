import { dataStore } from '@/lib/store';
import { NextRequest } from 'next/server';

// POST /api/groups/:groupId/members - Add a user to a group
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if group exists
    const group = dataStore.getGroup(params.groupId);
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user exists
    const user = dataStore.getUser(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Add user to group
    const success = dataStore.addMemberToGroup(params.groupId, userId);
    if (!success) {
      return Response.json({ error: 'User is already a member of this group' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error adding member to group:', error);
    return Response.json({ error: 'Failed to add member to group' }, { status: 500 });
  }
}

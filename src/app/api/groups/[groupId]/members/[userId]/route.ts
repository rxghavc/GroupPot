// DELETE /api/groups/:groupId/members/:userId
export async function DELETE(req: Request, { params }: { params: { groupId: string, userId: string } }) {
  // TODO: Implement remove member logic
  return new Response(JSON.stringify({ message: `Remove user ${params.userId} from group ${params.groupId}` }), { status: 200 });
}

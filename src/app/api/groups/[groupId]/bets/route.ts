// GET /api/groups/:groupId/bets, POST /api/groups/:groupId/bets
export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  // TODO: Implement get all bets in group logic
  return new Response(JSON.stringify({ message: `Get bets for group ${params.groupId}` }), { status: 200 });
}

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  // TODO: Implement create bet logic
  return new Response(JSON.stringify({ message: `Create bet in group ${params.groupId}` }), { status: 200 });
}

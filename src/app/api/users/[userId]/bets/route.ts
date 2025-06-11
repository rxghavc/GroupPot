// GET /api/users/:userId/bets
export async function GET(req: Request, { params }: { params: { userId: string } }) {
  // TODO: Implement get user bets logic
  return new Response(JSON.stringify({ message: `Get bets for user ${params.userId}` }), { status: 200 });
}

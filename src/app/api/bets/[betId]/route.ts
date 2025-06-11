// GET /api/bets/:betId
export async function GET(req: Request, { params }: { params: { betId: string } }) {
  // TODO: Implement get bet details logic
  return new Response(JSON.stringify({ message: `Bet details for ${params.betId}` }), { status: 200 });
}

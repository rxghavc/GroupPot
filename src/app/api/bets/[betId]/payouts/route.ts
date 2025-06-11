// GET /api/bets/:betId/payouts
export async function GET(req: Request, { params }: { params: { betId: string } }) {
  // TODO: Implement get payouts logic
  return new Response(JSON.stringify({ message: `Get payouts for bet ${params.betId}` }), { status: 200 });
}

// GET /api/users/:userId
export async function GET(req: Request, { params }: { params: { userId: string } }) {
  // TODO: Implement get user profile logic
  return new Response(JSON.stringify({ message: `User profile for ${params.userId}` }), { status: 200 });
}

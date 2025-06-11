export default function UserProfilePage({ params }: { params: { userId: string } }) {
  return <div>User Profile Page for {params.userId} (TODO: Show public user info, stats)</div>;
}

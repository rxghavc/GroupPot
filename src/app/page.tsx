import Image from "next/image";
import { FaUserFriends } from "react-icons/fa";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <FaUserFriends className="w-14 h-14 text-emerald-500 drop-shadow mb-2" />
        <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
          Welcome to <span className="text-emerald-500">FriendsStake</span>
        </h1>
      </div>
      {/* How it Works Section */}
      <div className="w-full max-w-2xl rounded-xl shadow p-6 mt-4 mb-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-primary mb-2">How it Works</h2>
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex-1 flex flex-col items-center">
            <span className="bg-emerald-500 text-primary rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2">1</span>
            <p className="font-semibold">Create or Join a Group</p>
            <span className="text-sm text-muted-foreground">Start a new group or join your friends via a code.</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="bg-emerald-500 text-primary rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2">2</span>
            <p className="font-semibold">Place Bets Together</p>
            <span className="text-sm text-muted-foreground">Make friendly wagers on anything you like.</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="bg-emerald-500 text-primary rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2">3</span>
            <p className="font-semibold">Split Winnings</p>
            <span className="text-sm text-muted-foreground">Winnings are split automatically and fairly.</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <a
          href="/groups"
          className="bg-primary text-background px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition"
        >
          View Groups
        </a>
        <a
          href="/bets"
          className="bg-secondary text-foreground px-6 py-2 rounded-lg font-semibold shadow hover:bg-secondary/80 transition"
        >
          My Bets
        </a>
        <a
          href="/groups/create"
          className="border border-primary text-primary px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/10 transition"
        >
          Create Group
        </a>
      </div>
    </div>
  );
}

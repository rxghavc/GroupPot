import Image from "next/image";
import { FaUserFriends } from "react-icons/fa";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <FaUserFriends className="w-14 h-14 text-emerald-500 drop-shadow mb-2" />
        <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
          Welcome to FriendsStake
        </h1>
      </div>
      <p className="text-lg text-muted-foreground max-w-xl">
        <span className="font-semibold text-primary">FriendsStake</span> lets you
        create private groups, place bets with friends, and split winnings
        automatically.
        <br className="hidden sm:block" />
        Use the sidebar to navigate between your dashboard, groups, bets, and
        settings.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
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

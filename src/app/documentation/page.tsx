import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function DocumentationPage() {
  return (
    <div className="w-full mx-auto px-4 flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">User Documentation & Help Center</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">App Overview</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="bets">Bets</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-2">App Overview</h2>
                  <p className="text-muted-foreground mb-2">
                    GroupPot is a social betting platform designed to bring friends and family together through friendly wagers and group challenges. The inspiration for this project comes from my father, who used polling systems on WhatsApp group chats in the past and he soon realised how ineffective it was. Building this website (and hopefully app in the future) is my way of sharing something special with him: a place where he and his friends can enjoy a little friendly competition, keep track of their bets, and celebrate their wins (or laugh off their losses) together.
                  </p>
                  <p className="text-muted-foreground mb-2">
                    At its heart, GroupPot is about connection. Whether you're betting on sports, trivia, or just who can finish their chores first, the app makes it easy to create groups, place bets, and track results. It's not about the money, it's about the memories, the banter, and the joy of sharing moments with people you care about. So go ahead, invite your friends, start a group, and let the games begin!
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Sign up or log in to access your betting portfolio and groups.</li>
                    <li>Use the sidebar or top navigation to switch between Dashboard, Groups, Bets, and Settings.</li>
                    <li>All pages are mobile-friendly and support real-time updates.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="dashboard">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    The Dashboard is your central hub for tracking betting activity, performance, and analytics. It provides a summary of your groups, bets, profit/loss, and recent activity, all in one place.
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Stats Cards:</b> See your total groups, active bets, and net profit at a glance.</li>
                    <li><b>Quick Actions:</b> Jump directly to Groups or Bets using shortcut buttons.</li>
                    <li><b>Activity Summary:</b> Review lifetime bets, biggest wager, and recent group activity.</li>
                    <li><b>Recent Bets Table:</b> View your most recent bets, including wager, payout, and status.</li>
                    <li><b>Performance Analytics:</b> Analyze your win rate and best wins.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">User Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Browse Groups:</b> Use the quick action to view and join groups.</li>
                    <li><b>View Bets:</b> Jump to your bets for more details and history.</li>
                    <li><b>Analyze Performance:</b> Check your win rate, profit, and biggest wins.</li>
                    <li><b>Review Activity:</b> See your most recent bets and group activity.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Dashboard for a quick summary of your betting journey.</li>
                    <li>
                      Visual cues make stats easy to scan: look for highlighted numbers and colored labels like
                      <span className="ml-2 font-semibold">
                        <span className="text-primary bg-primary/10 rounded px-2 py-0.5 mr-1">Groups</span>
                        <span className="text-green-700 bg-green-100 rounded px-2 py-0.5 mr-1">Active Bets</span>
                        <span className="text-yellow-700 bg-yellow-100 rounded px-2 py-0.5">Profit</span>
                      </span>
                      to quickly spot your totals and performance.
                    </li>
                    <li>Jump between Groups and Bets instantly using the quick action buttons.</li>
                    <li>Track your progress by reviewing win rate, biggest wins, and recent activity.</li>
                    <li>The Recent Bets table provides a clear audit trail of your latest wagers and outcomes.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="groups">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    The Groups page lets you organize betting communities with friends. You can create new groups, join existing ones using a code, and manage group memberships and bets. Each group has its own set of members, bets, and moderators.
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Group Cards:</b> See all groups you belong to, with member count, description, and quick actions.</li>
                    <li><b>Create Group:</b> Start a new group by entering a name and description. Share the generated code to invite friends.</li>
                    <li><b>Join Group:</b> Enter a group code to join an existing group.</li>
                    <li><b>Invite Friends:</b> Copy and share your group code for others to join.</li>
                    <li><b>Role Management:</b> Owners and moderators can manage members, promote/demote moderators, and settle bets.</li>
                    <li><b>Leave Group:</b> Remove yourself from a group at any time.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">User Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>View Groups:</b> Browse all your groups and see details for each.</li>
                    <li><b>Create New Group:</b> Use the 'Create Group' button to start a new community.</li>
                    <li><b>Join Group:</b> Enter a code to join a friend's group.</li>
                    <li><b>Invite Members:</b> Share your group code to invite others.</li>
                    <li><b>Manage Members:</b> Owners/moderators can remove members or promote them to moderator.</li>
                    <li><b>Leave Group:</b> Use the 'Leave Group' action to exit a group.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the group code to quickly invite friends to join your group.</li>
                    <li>
                      Check the color-coded badges for quick status:
                      <span className="ml-2 font-semibold">
                        <span className="text-yellow-800 bg-yellow-100 rounded px-2 py-0.5 mr-1">Owner</span>
                        <span className="text-blue-800 bg-blue-100 rounded px-2 py-0.5 mr-1">Moderator</span>
                        <span className="text-gray-800 bg-gray-100 rounded px-2 py-0.5">Member</span>
                      </span>
                    </li>
                    <li>Owners and moderators have special controls for managing group members and settling bets.</li>
                    <li>Use the 'View Group' button to see group-specific bets and member stats.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="bets">
              <div className=" space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    The Bets page is your personal betting portfolio. It provides a comprehensive view of all bets you've participated in, including active bets and settled bets, along with detailed analytics and history.
                  </p>
                  <span className="text-muted-foreground text-red-600">Disclaimer: Due to storage limitations at the moment, if bets are deleted by moderators in groups, they will no longer appear in your bet history.</span>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Financial Overview Cards:</b> See your Active Stakes, Net Profit/Loss, Win Rate, and Total Staked across all bets or filtered by group.</li>
                    <li><b>Performance Chart:</b> Visualize your profit/loss over time for each completed bet.</li>
                    <li><b>Active Bets:</b> View all bets that are currently open. See your picks, stakes, and deadlines for each bet.</li>
                    <li><b>Betting History:</b> Review all settled bets, including outcomes, payouts, net results, and settlement dates.</li>
                    <li><b>Group Filtering:</b> Filter bets and analytics by specific group using the group selector.</li>
                    <li><b>Tabs:</b> Switch between Overview (analytics) and History (detailed bet records).</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">User Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>View Bets:</b> Browse all your bets, both active and settled, with detailed information for each.</li>
                    <li><b>Filter by Group:</b> Use the dropdown to focus on bets from a specific group.</li>
                    <li><b>Switch Tabs:</b> Toggle between Overview (summary analytics) and History (detailed records).</li>
                    <li><b>Analyze Performance:</b> Use the chart and cards to track your profit/loss, win rate, and overall betting performance.</li>
                    <li><b>Review Outcomes:</b> For settled bets, see your picks, total stake, payout, net result, and settlement date. Refunds and outcomes are clearly marked.</li>
                    <li><b>Start New Bets:</b> If you have no bets yet, use the provided link to browse groups and start betting.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the group filter to compare your performance across different communities.</li>
                    <li>
                      Check the color-coded badges and icons for quick status:
                      <span className="ml-2 font-semibold">
                        <span className="text-orange-800 bg-orange-100 rounded px-2 py-0.5 mr-1">Active</span>
                        <span className="text-green-800 bg-green-100 rounded px-2 py-0.5 mr-1">Settled</span>
                        <span className="text-green-600 bg-green-50 rounded px-2 py-0.5 mr-1">Won</span>
                        <span className="text-red-600 bg-red-50 rounded px-2 py-0.5 mr-1">Lost</span>
                        <span className="text-blue-800 bg-blue-100 rounded px-2 py-0.5">Refunded</span>
                      </span>
                    </li>
                    <li>Review your net profit/loss and win rate regularly to track your progress.</li>
                    <li>Use the History tab for a detailed audit trail of all your betting activity.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    The Settings page is your personal control center for account management and privacy. Here, you can review your details, reset your password if needed, and take control of your data. All changes are protected by secure authentication.
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Account Info:</b> Instantly see your username and email for reference.</li>
                    <li><b>Password Reset:</b> Forgot your password? Start a secure reset in one click.</li>
                    <li><b>Delete Account:</b> Remove your account and all data permanently, no going back.</li>
                    <li><b>Danger Zone:</b> Account deletion is clearly marked and requires extra confirmation to prevent mistakes.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">User Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Review Details:</b> Double-check your username and email for accuracy.</li>
                    <li><b>Reset Password:</b> Use the reset button if you ever lose access, no need to contact support.</li>
                    <li><b>Delete Account:</b> Click the delete button in the Danger Zone if you want to remove your account. You'll be asked to confirm before anything happens.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Double-check your email for typos—it's used for password recovery and notifications.</li>
                    <li>Password reset is fast and secure; use it anytime you can't log in.</li>
                    <li>Deleting your account is final. Download any important info before you proceed.</li>
                    <li>All account changes are protected by authentication for your safety.</li>
                    <li>Look for the red Danger Zone before deleting your account—it's designed to prevent accidents.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="auth">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    Authentication is the gatekeeper for your GroupPot experience. It keeps your account private, your bets secure, and your groups protected. With simple sign up and login, you can focus on the fun while we handle the security behind the scenes.
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Easy Registration:</b> Sign up with your email and a strong password (at least 6 characters, including uppercase, lowercase, and a number).</li>
                    <li><b>Secure Login:</b> Access your account with JWT-based authentication for peace of mind.</li>
                    <li><b>Password Recovery:</b> Forgot your password? Use the reset flow to get back in quickly with no hassle.</li>
                    <li><b>Protected Actions:</b> Sensitive changes like deleting your account always require authentication.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">User Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Sign Up:</b> Create your account and join the fun.</li>
                    <li><b>Log In:</b> Enter your credentials to access your dashboard, groups, and bets.</li>
                    <li><b>Reset Password:</b> Use the password reset link if you ever forget your password, no need to contact support.</li>
                    <li><b>Log Out:</b> Click the logout button in the sidebar to keep your account safe when you're done.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Pick a password that's easy for you to remember but hard for others to guess. Mix letters and numbers for extra strength.</li>
                    <li>Keep your login details private, even among friends.</li>
                    <li>If you ever get locked out, use the password reset feature. It's quick and doesn't require help from support.</li>
                    <li>Always log out on shared or public devices to protect your privacy.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="faq">
              <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions (FAQs)</h2>
              <Accordion type="single" collapsible>
                <AccordionItem value="what-is-GroupPot">
                  <AccordionTrigger>What is GroupPot and who is it for?</AccordionTrigger>
                  <AccordionContent>GroupPot is a social betting platform for friends and family to create groups, place friendly bets, and track results. It's designed for anyone who wants to add a little fun and friendly competition to their group chats or gatherings.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-to-get-started">
                  <AccordionTrigger>How do I get started?</AccordionTrigger>
                  <AccordionContent>Sign up with your email, create or join a group, and start placing bets! The app is mobile-friendly and supports auto-updates.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="group-management">
                  <AccordionTrigger>How do I create, join, or leave a group?</AccordionTrigger>
                  <AccordionContent>Go to the Groups page. To create a group, click 'Create Group' and fill in the details. To join, enter a group code. To leave, use the 'Leave Group' button in your group card.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="invite-friends">
                  <AccordionTrigger>How do I invite friends to my group?</AccordionTrigger>
                  <AccordionContent>Share your group's unique code with friends. They can use it to join your group from the Groups page.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="account-management">
                  <AccordionTrigger>How do I reset my password or delete my account?</AccordionTrigger>
                  <AccordionContent>Go to the Settings page. Click 'Reset Password' to recover access, or use the Danger Zone to permanently delete your account and data.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="security-privacy">
                  <AccordionTrigger>Is my data secure and private?</AccordionTrigger>
                  <AccordionContent>Yes. All sensitive data is encrypted and protected by JWT authentication. Passwords are securely hashed and never stored in plain text. Only you can access your account and bets.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="mobile-support">
                  <AccordionTrigger>Can I use GroupPot on mobile?</AccordionTrigger>
                  <AccordionContent>Absolutely! The app is fully responsive and optimized for mobile devices, so you can bet and manage groups on the go.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="contact-support">
                  <AccordionTrigger>How can I contact support or report a bug?</AccordionTrigger>
                  <AccordionContent>Use the Support & Contact section at the bottom of this page to reach out via email or LinkedIn. I'm always happy to help and improve GroupPot!</AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Support & Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              If you have questions, feedback, or want to report a bug, feel free to reach out! I'm always happy to help and improve GroupPot for everyone.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Email:</span> <a href="mailto:r.commandur@gmail.com" className="text-blue-700 underline">r.commandur@gmail.com</a>
              </li>
              <li>
                <span className="font-semibold">LinkedIn:</span> <a href="https://www.linkedin.com/in/raghavcommandur/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">linkedin.com/in/raghavcommandur</a>
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">I'll do my best to respond quickly and address any issues or suggestions you have. Thanks for using GroupPot!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

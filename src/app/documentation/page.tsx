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
              <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Sign up or log in to access your betting portfolio and groups.</li>
                <li>Use the sidebar or top navigation to switch between Dashboard, Groups, Bets, and Settings.</li>
                <li>All pages are mobile-friendly and support real-time updates.</li>
              </ul>
            </TabsContent>
            <TabsContent value="dashboard">
              <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>View your overall betting performance, including active stakes, win rate, and net profit/loss.</li>
                <li>Switch between <b>Overview</b> and <b>History</b> tabs for analytics and detailed bet history.</li>
                <li>Analyze your performance with interactive charts and tables.</li>
                <li>Filter bets by group to see group-specific stats.</li>
              </ul>
            </TabsContent>
            <TabsContent value="groups">
              <h2 className="text-xl font-semibold mb-2">Groups</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Browse, join, or create private groups using unique access codes.</li>
                <li>View group members, group bets, and your role (Owner/Moderator/Member).</li>
                <li>Invite friends by sharing the group code.</li>
                <li>Moderators and owners can manage members and settle bets.</li>
              </ul>
            </TabsContent>
            <TabsContent value="bets">
              <div className=" space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground mb-2">
                    The Bets page is your personal betting portfolio. It provides a comprehensive view of all bets you've participated in, including active bets and settled bets, along with detailed analytics and history.
                  </p>
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
                    <li>Check the color-coded badges and icons for quick status (Active, Settled, Won, Lost, Refunded).</li>
                    <li>Review your net profit/loss and win rate regularly to track your progress.</li>
                    <li>Use the History tab for a detailed audit trail of all your betting activity.</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manage your account information (username, email).</li>
                <li>Reset your password securely.</li>
                <li>Permanently delete your account if needed.</li>
                <li>All changes are protected by secure authentication.</li>
              </ul>
            </TabsContent>
            <TabsContent value="auth">
              <h2 className="text-xl font-semibold mb-2">Authentication & Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sign up with a valid email and strong password (minimum 6 characters, uppercase, lowercase, number).</li>
                <li>Log in securely with JWT-based authentication.</li>
                <li>Forgot your password? Use the password reset flow to recover access.</li>
                <li>All sensitive actions require authentication for your protection.</li>
              </ul>
            </TabsContent>
            <TabsContent value="faq">
              <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions (FAQs)</h2>
              <Accordion type="single" collapsible>
                <AccordionItem value="join-group">
                  <AccordionTrigger>How do I join a group?</AccordionTrigger>
                  <AccordionContent>Go to the Groups page, enter the group code provided by your friend, and click Join.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="create-group">
                  <AccordionTrigger>How do I create a group?</AccordionTrigger>
                  <AccordionContent>On the Groups page, click 'Create Group', fill in the details, and share the generated code with friends.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="place-bet">
                  <AccordionTrigger>How do I place a bet?</AccordionTrigger>
                  <AccordionContent>Navigate to the Bets page or a specific group, select a bet, choose your options, and enter your stake.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="settle-bet">
                  <AccordionTrigger>Who can settle a bet?</AccordionTrigger>
                  <AccordionContent>Only group owners and moderators can settle bets once the outcome is known.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="payouts">
                  <AccordionTrigger>How are payouts calculated?</AccordionTrigger>
                  <AccordionContent>Payouts are pool-based and depend on your stake and the outcome. Partial matches and refunds are handled automatically by the system.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="refunds">
                  <AccordionTrigger>What happens if no one wins a bet?</AccordionTrigger>
                  <AccordionContent>All stakes are refunded to participants if there are no winners.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="reset-password">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>Go to the Settings page and click 'Reset Password' to start the password recovery process.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="delete-account">
                  <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                  <AccordionContent>Yes, you can permanently delete your account from the Settings page.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="security">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>All sensitive data is encrypted and protected by JWT authentication. Passwords are securely hashed and never stored in plain text.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="mobile">
                  <AccordionTrigger>Can I use the app on my phone?</AccordionTrigger>
                  <AccordionContent>Yes, the app is fully responsive and optimized for mobile devices.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Navigation</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Use the sidebar or top navigation to quickly switch between pages.</li>
              <li>Click your profile icon for account and settings options.</li>
              <li>Look for badges and icons for status indicators (e.g., Settled, Active, Won).</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Actions</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Invite friends by sharing your group code.</li>
              <li>Moderators can manage members and settle bets.</li>
              <li>Use filters and tabs to analyze your betting history and performance.</li>
              <li>Reset your password or delete your account from Settings.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

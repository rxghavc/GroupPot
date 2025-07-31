import { BetResult, Bet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

interface PayoutTableProps {
  bet: Bet;
  result: BetResult;
}

export function PayoutTable({ bet, result }: PayoutTableProps) {
  return (
    <div className="space-y-4">
      {/* Winning Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🏆 Winning Option
            <Badge variant="default" className="bg-green-100 text-green-800">
              {result.winningOptionText}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Pool:</span>
              <span className="ml-2">£{result.totalPool.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Total Winners:</span>
              <span className="ml-2">{result.winners.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners Table */}
      {result.winners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎉 Winners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Player</th>
                    <th className="text-left py-2 font-medium">Stake</th>
                    <th className="text-left py-2 font-medium">Payout</th>
                    <th className="text-left py-2 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {result.winners.map((winner, index) => (
                    <tr key={index} className="border-b hover:bg-green-50">
                      <td className="py-2 font-medium">{winner.username}</td>
                      <td className="py-2">£{winner.stake.toFixed(2)}</td>
                      <td className="py-2 text-green-600 font-medium">£{winner.payout.toFixed(2)}</td>
                      <td className="py-2 text-green-600 font-medium">
                        +£{(winner.payout - winner.stake).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Losers Table */}
      {result.losers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💸 Participants (No Payout)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Player</th>
                    <th className="text-left py-2 font-medium">Stake Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {result.losers.map((loser, index) => (
                    <tr key={index} className="border-b hover:bg-red-50">
                      <td className="py-2 font-medium">{loser.username}</td>
                      <td className="py-2 text-red-600">-£{loser.stake.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
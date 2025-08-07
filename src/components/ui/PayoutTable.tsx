import { BetResult, Bet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

interface PayoutTableProps {
  bet: Bet;
  result: BetResult;
}

export function PayoutTable({ bet, result }: PayoutTableProps) {
  const isRefund = result.isRefund || false;
  const isPartialMatch = (result as any).betType === 'partial_match';
  
  return (
    <div className="space-y-6">
      {/* Betting Type Explanation */}
      {isPartialMatch && (
        <Card className="border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <span>Partial Match Betting</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 px-3 py-1">
                {isPartialMatch && (result as any).winningOptionTexts?.length > 1 ? 'Multi-Option Win' : 'Stake Per Option'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 leading-relaxed">
                <strong>How it works:</strong> {(result as any).explanation || 'In partial match betting, your stake is split equally across all options you choose. You win based only on the portion placed on the winning option.'}
              </p>
              {(result as any).totalLosingStakesFromLosers !== undefined && (
                <div className="mt-4 text-xs text-blue-600 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span>Pure Losing Stakes:</span>
                    <span className="font-medium">£{((result as any).totalLosingStakesFromLosers || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Non-winning Portions:</span>
                    <span className="font-medium">£{((result as any).additionalLosingStakesFromWinners || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winning Option(s) or Refund Notice */}
      <Card className="border-green-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-3">
            {isRefund ? (
              <>
                <span className="text-2xl">🔄</span>
                <span>Stakes Refunded</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 px-3 py-1">
                  No Winners
                </Badge>
              </>
            ) : (
              <>
                <span className="text-2xl">🏆</span>
                <span>Winning Option{result.winningOptionTexts?.length > 1 ? 's' : ''}</span>
                <div className="flex flex-wrap gap-2">
                  {result.winningOptionTexts?.length > 0 
                    ? result.winningOptionTexts.map((text, index) => (
                        <Badge key={index} variant="default" className="bg-green-100 text-green-800 px-3 py-1">
                          {text}
                        </Badge>
                      ))
                    : (
                        <Badge variant="default" className="bg-green-100 text-green-800 px-3 py-1">
                          {result.winningOptionText}
                        </Badge>
                      )
                  }
                </div>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-600">Total Pool:</span>
              <span className="text-lg font-bold text-gray-900">£{result.totalPool.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-600">{isRefund ? 'Participants:' : 'Total Winners:'}</span>
              <span className="text-lg font-bold text-gray-900">{isRefund ? result.winners.length : result.winners.length}</span>
            </div>
          </div>
          {isRefund && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 leading-relaxed">
                <strong>No winners found:</strong> Since no one voted for the winning option(s), all participants have received their full stake back as a refund.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Winners/Refunds Table */}
      {result.winners.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <span className="text-2xl">{isRefund ? '🔄' : '🎉'}</span>
              <span>{isRefund ? 'Stake Refunds' : 'Winners'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-3 font-semibold text-gray-700">Player</th>
                    <th className="text-left py-4 px-3 font-semibold text-gray-700">
                      {isPartialMatch ? 'Winning Stake' : 'Stake'}
                    </th>
                    <th className="text-left py-4 px-3 font-semibold text-gray-700">{isRefund ? 'Refund' : 'Payout'}</th>
                    {!isRefund && <th className="text-left py-4 px-3 font-semibold text-gray-700">Profit</th>}
                    {isPartialMatch && !isRefund && <th className="text-left py-4 px-3 font-semibold text-gray-700">Original Stake</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.winners.map((winner, index) => (
                    <tr key={index} className={`border-b border-gray-100 transition-colors ${isRefund ? 'hover:bg-blue-50' : 'hover:bg-green-50'}`}>
                      <td className="py-4 px-3 font-medium text-gray-900">{winner.username}</td>
                      <td className="py-4 px-3 text-gray-700">£{winner.stake.toFixed(2)}</td>
                      <td className={`py-4 px-3 font-bold text-lg ${isRefund ? 'text-blue-600' : 'text-green-600'}`}>
                        £{winner.payout.toFixed(2)}
                      </td>
                      {!isRefund && (
                        <td className="py-4 px-3 font-semibold text-base">
                          {(() => {
                            const profit = isPartialMatch && (winner as any).totalOriginalStake 
                              ? winner.payout - (winner as any).totalOriginalStake 
                              : winner.payout - winner.stake;
                            return (
                              <span className={`${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {profit > 0 ? '+' : ''}£{profit.toFixed(2)}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      {isPartialMatch && !isRefund && (winner as any).totalOriginalStake && (
                        <td className="py-4 px-3">
                          <div className="text-gray-700">
                            <div className="font-medium">£{((winner as any).totalOriginalStake).toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              (Across {(winner as any).totalOptionsCount || Math.round((winner as any).totalOriginalStake / (winner.stake > 0 ? Math.min(winner.stake, (winner as any).totalOriginalStake) : 1))} options)
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isPartialMatch && !isRefund && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 leading-relaxed">
                  <strong>Partial Match Breakdown:</strong> Winners receive their stake back from {result.winningOptionTexts?.length > 1 ? 'any winning options' : 'the winning option'} plus a share of all losing stakes (including non-winning portions from other winners).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Losers Table */}
      {result.losers.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <span>Participants (No Payout)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-3 font-semibold text-gray-700">Player</th>
                    <th className="text-left py-4 px-3 font-semibold text-gray-700">Stake Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {result.losers.map((loser, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                      <td className="py-4 px-3 font-medium text-gray-900">{loser.username}</td>
                      <td className="py-4 px-3 text-red-600 font-bold text-lg">-£{loser.stake.toFixed(2)}</td>
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
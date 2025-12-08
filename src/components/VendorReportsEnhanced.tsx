import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorReportsData } from "@/hooks/useVendorReportsData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Target, DollarSign, BarChart3 } from "lucide-react";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";

export default function VendorReportsEnhanced() {
  const { rfqWinRate, milestonePerformance, monthlyFinancials, loading } = useVendorReportsData();

  if (loading) {
    return (
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="success">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </EnhancedPageBackground>
    );
  }

  return (
    <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="success">
      <div className="container mx-auto p-6 space-y-6">
        <PageHero
          title="Vendor Reports"
          description="Track your performance and financial metrics"
          icon={BarChart3}
          variant="gradient"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* RFQ Win Rate Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>RFQ Win Rate</CardTitle>
            </div>
            <CardDescription>
              Your success rate in winning bids
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(rfqWinRate as any).isEmpty ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-center space-y-4">
                <Target className="h-12 w-12 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start applying to projects to see your win rate statistics.
                  </p>
                </div>
              </div>
            ) : rfqWinRate.chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={rfqWinRate.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {rfqWinRate.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="font-semibold">{rfqWinRate.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Bids:</span>
                    <span className="font-semibold">{rfqWinRate.totalBids}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-chart-1/10">
                      {rfqWinRate.wonBids} Won
                    </Badge>
                    <Badge variant="outline" className="bg-chart-2/10">
                      {rfqWinRate.lostBids} Lost
                    </Badge>
                    {rfqWinRate.pendingBids > 0 && (
                      <Badge variant="outline" className="bg-chart-3/10">
                        {rfqWinRate.pendingBids} Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No bid data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* On-Time Milestone Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>On-Time Delivery</CardTitle>
            </div>
            <CardDescription>
              Milestones completed on or before deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(milestonePerformance as any)?.isEmpty ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-center space-y-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Milestones Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete project milestones to track your on-time delivery rate.
                  </p>
                </div>
              </div>
            ) : milestonePerformance ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {milestonePerformance.onTimeRate.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">On-Time Rate</p>
                </div>
                
                <Progress 
                  value={milestonePerformance.onTimeRate} 
                  className="h-3"
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {milestonePerformance.onTimeMilestones} on time
                  </span>
                  <span className="text-muted-foreground">
                    {milestonePerformance.totalMilestones} total
                  </span>
                </div>

                <div className="flex justify-center">
                  <Badge 
                    variant={
                      milestonePerformance.onTimeRate >= 80 ? 'default' : 
                      milestonePerformance.onTimeRate >= 60 ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {milestonePerformance.onTimeRate >= 80 ? 'Excellent' : 
                     milestonePerformance.onTimeRate >= 60 ? 'Good' : 
                     'Needs Improvement'}
                  </Badge>
                </div>

                {milestonePerformance.lateMilestones > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {milestonePerformance.lateMilestones} milestone{milestonePerformance.lateMilestones > 1 ? 's' : ''} completed late
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No milestone data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice vs Payout Chart */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Financial Summary</CardTitle>
            </div>
            <CardDescription>
              Month-to-date invoices and payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(monthlyFinancials as any).isEmpty ? (
              <div className="flex flex-col items-center justify-center h-[340px] text-center space-y-4">
                <DollarSign className="h-12 w-12 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Financial Data Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create invoices and receive payouts to see your financial summary.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyFinancials.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="category" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="invoiced" fill="hsl(var(--chart-1))" name="Total Invoiced" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill="hsl(var(--chart-2))" name="Paid Invoices" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payouts" fill="hsl(var(--chart-3))" name="Payouts Received" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-semibold">
                  ${monthlyFinancials.invoiced.total.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="bg-chart-2/10 text-xs">
                    ${monthlyFinancials.invoiced.paid.toLocaleString()} paid
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Payouts Received</p>
                <p className="text-lg font-semibold">
                  ${monthlyFinancials.payouts.completed.toLocaleString()}
                </p>
                {monthlyFinancials.payouts.pending > 0 && (
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="bg-chart-3/10 text-xs">
                      ${monthlyFinancials.payouts.pending.toLocaleString()} pending
                    </Badge>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </EnhancedPageBackground>
  );
}

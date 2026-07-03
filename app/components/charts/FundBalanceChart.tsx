"use client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { mockFundBalances } from "@/lib/mock-data/funds"

const formatY = (v: number) => `$${(v / 1000).toFixed(0)}k`

export function FundBalanceChart() {
  const plan1 = mockFundBalances.filter(b => b.strataplanId === "1")

  const data = plan1.map(b => ({
    month: b.month.replace(" 20", " '"),
    adminFund: b.adminFundBalance,
    capitalWorks: b.capitalWorksFundBalance,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          formatter={(value, name) => [
            `$${Number(value).toLocaleString("en-AU")}`,
            name === "adminFund" ? "Admin Fund" : "Capital Works Fund"
          ]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend
          formatter={(value) => value === "adminFund" ? "Admin Fund" : "Capital Works Fund"}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="adminFund" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="capitalWorks" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

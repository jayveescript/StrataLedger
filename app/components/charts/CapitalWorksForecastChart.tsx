"use client"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts"
import { mockCapitalWorksForecast } from "@/lib/mock-data/capital-works"

const formatY = (v: number) => `$${(v / 1000).toFixed(0)}k`

interface Props {
  levyPerLot?: number
}

export function CapitalWorksForecastChart({ levyPerLot = 400 }: Props) {
  const base = mockCapitalWorksForecast.filter(f => f.strataplanId === "1")
  const multiplier = levyPerLot / 400

  const data = base.map(f => ({
    year: f.year.toString(),
    balance: Math.round(f.projectedBalance + (f.projectedContributions * (multiplier - 1) * (f.year - 2025))),
    expenditure: f.projectedExpenditure,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          formatter={(value, name) => [
            `$${Number(value).toLocaleString("en-AU")}`,
            name === "balance" ? "Projected Balance" : "Planned Expenditure"
          ]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Fund depleted", position: "insideTopLeft", fontSize: 11, fill: "#dc2626" }} />
        <Area type="monotone" dataKey="balance" name="balance" stroke="#2563eb" fill="#dbeafe" fillOpacity={0.6} strokeWidth={2} />
        <Area type="monotone" dataKey="expenditure" name="expenditure" stroke="#dc2626" fill="#fee2e2" fillOpacity={0.4} strokeWidth={2} strokeDasharray="5 5" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

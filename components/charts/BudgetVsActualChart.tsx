"use client"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

const data = [
  { category: "Cleaning", budget: 12000, actual: 9850 },
  { category: "Insurance", budget: 28500, actual: 28500 },
  { category: "Gardening", budget: 6000, actual: 4750 },
  { category: "Mgmt Fee", budget: 42000, actual: 38500 },
  { category: "Utilities", budget: 8000, actual: 7240 },
  { category: "Maintenance", budget: 15000, actual: 18200 },
  { category: "Legal", budget: 3000, actual: 4500 },
]

const formatY = (v: number) => `$${(v / 1000).toFixed(0)}k`

export function BudgetVsActualChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          formatter={(value) => `$${Number(value).toLocaleString("en-AU")}`}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="budget" name="Budget" fill="#dbeafe" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" name="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

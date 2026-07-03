"use client"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { name: "Insurance", value: 28500, color: "#2563eb" },
  { name: "Cleaning", value: 9850, color: "#0891b2" },
  { name: "Mgmt Fees", value: 38500, color: "#7c3aed" },
  { name: "Utilities", value: 7240, color: "#d97706" },
  { name: "Maintenance", value: 18200, color: "#16a34a" },
  { name: "Other", value: 6410, color: "#94a3b8" },
]

export function ExpensePieChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `$${Number(value).toLocaleString("en-AU")}`}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

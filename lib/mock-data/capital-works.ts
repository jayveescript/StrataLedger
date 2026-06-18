export const mockCapitalWorksItems = [
  // Southbank Residences
  { id: "cw-001", strataplanId: "1", item: "Roof inspection and repair", estimatedCost: 15000, plannedYear: 2027, priority: "high", notes: "Annual inspection required. Minor repairs identified." },
  { id: "cw-002", strataplanId: "1", item: "External painting — full building", estimatedCost: 45000, plannedYear: 2028, priority: "high", notes: "Last painted 2018. Paint degrading on north and west faces." },
  { id: "cw-003", strataplanId: "1", item: "Lift modernisation (2 lifts)", estimatedCost: 120000, plannedYear: 2029, priority: "high", notes: "Lifts approaching end of service life. Compliance upgrade required." },
  { id: "cw-004", strataplanId: "1", item: "Car park resurfacing", estimatedCost: 28000, plannedYear: 2030, priority: "medium", notes: "Concrete deterioration in B2 level. Expansion joints failing." },
  { id: "cw-005", strataplanId: "1", item: "Fire system upgrade", estimatedCost: 35000, plannedYear: 2026, priority: "high", notes: "Required under updated Building Code provisions." },
  { id: "cw-006", strataplanId: "1", item: "Intercom and access system replacement", estimatedCost: 18000, plannedYear: 2031, priority: "medium", notes: "Current system end-of-life 2031." },
  { id: "cw-007", strataplanId: "1", item: "Lobby renovation", estimatedCost: 40000, plannedYear: 2032, priority: "low", notes: "Cosmetic upgrade to match building refurbishment." },
  { id: "cw-008", strataplanId: "1", item: "Hot water system replacement (central)", estimatedCost: 22000, plannedYear: 2028, priority: "high", notes: "Central system installed 2009. Expected life 20 years." },
  { id: "cw-009", strataplanId: "1", item: "Window resealing — all floors", estimatedCost: 32000, plannedYear: 2033, priority: "medium", notes: "Seal degradation causing water ingress complaints." },
  { id: "cw-010", strataplanId: "1", item: "Pool and gym equipment upgrade", estimatedCost: 25000, plannedYear: 2034, priority: "low", notes: "Level 2 amenities refresh." },
  // Collins St
  { id: "cw-011", strataplanId: "2", item: "Roof membrane replacement", estimatedCost: 38000, plannedYear: 2028, priority: "high", notes: "Membrane warranty expires 2027." },
  { id: "cw-012", strataplanId: "2", item: "External painting", estimatedCost: 22000, plannedYear: 2030, priority: "medium", notes: "Periodic maintenance cycle." },
  { id: "cw-013", strataplanId: "2", item: "Lift service life extension", estimatedCost: 55000, plannedYear: 2032, priority: "high", notes: "Component upgrade to extend life 10 years." },
  // St Kilda
  { id: "cw-014", strataplanId: "3", item: "Pool equipment replacement", estimatedCost: 18000, plannedYear: 2027, priority: "high", notes: "Pump and filtration system failing." },
  { id: "cw-015", strataplanId: "3", item: "Fence and gate replacement", estimatedCost: 12000, plannedYear: 2026, priority: "medium", notes: "Security perimeter upgrade required." },
  { id: "cw-016", strataplanId: "3", item: "External painting", estimatedCost: 25000, plannedYear: 2028, priority: "high", notes: "Salt air damage accelerating deterioration." },
  { id: "cw-017", strataplanId: "3", item: "Roof tiles — partial replacement", estimatedCost: 32000, plannedYear: 2029, priority: "high", notes: "Storm damage assessment completed June 2026." },
];

export const mockCapitalWorksForecast = [
  // Southbank Residences 10-year projection
  { strataplanId: "1", year: 2026, projectedBalance: 187000, projectedExpenditure: 35000, projectedContributions: 10000, surplusDeficit: -25000 },
  { strataplanId: "1", year: 2027, projectedBalance: 162000, projectedExpenditure: 15000, projectedContributions: 10000, surplusDeficit: -5000 },
  { strataplanId: "1", year: 2028, projectedBalance: 157000, projectedExpenditure: 67000, projectedContributions: 10000, surplusDeficit: -57000 },
  { strataplanId: "1", year: 2029, projectedBalance: 100000, projectedExpenditure: 120000, projectedContributions: 10000, surplusDeficit: -110000 },
  { strataplanId: "1", year: 2030, projectedBalance: -10000, projectedExpenditure: 28000, projectedContributions: 10000, surplusDeficit: -18000 },
  { strataplanId: "1", year: 2031, projectedBalance: -18000, projectedExpenditure: 18000, projectedContributions: 10000, surplusDeficit: -8000 },
  { strataplanId: "1", year: 2032, projectedBalance: -16000, projectedExpenditure: 40000, projectedContributions: 10000, surplusDeficit: -30000 },
  { strataplanId: "1", year: 2033, projectedBalance: -36000, projectedExpenditure: 32000, projectedContributions: 10000, surplusDeficit: -22000 },
  { strataplanId: "1", year: 2034, projectedBalance: -48000, projectedExpenditure: 25000, projectedContributions: 10000, surplusDeficit: -15000 },
  { strataplanId: "1", year: 2035, projectedBalance: -53000, projectedExpenditure: 0, projectedContributions: 10000, surplusDeficit: 10000 },
  // St Kilda (worse position)
  { strataplanId: "3", year: 2026, projectedBalance: 12000, projectedExpenditure: 12000, projectedContributions: 3200, surplusDeficit: -8800 },
  { strataplanId: "3", year: 2027, projectedBalance: 3200, projectedExpenditure: 18000, projectedContributions: 3200, surplusDeficit: -14800 },
  { strataplanId: "3", year: 2028, projectedBalance: -11600, projectedExpenditure: 25000, projectedContributions: 3200, surplusDeficit: -21800 },
  { strataplanId: "3", year: 2029, projectedBalance: -30200, projectedExpenditure: 32000, projectedContributions: 3200, surplusDeficit: -28800 },
  { strataplanId: "3", year: 2030, projectedBalance: -55000, projectedExpenditure: 0, projectedContributions: 3200, surplusDeficit: 3200 },
];

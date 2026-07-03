export interface Company {
  id: string
  name: string
  abn: string
  states: string[]
  planIds: string[]
  contact: string
  email: string
  phone: string
}

export const mockCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'Premier Strata VIC',
    abn: '12 345 678 901',
    states: ['VIC'],
    planIds: ['1', '2'],
    contact: 'Sarah Johnson',
    email: 'info@premierstrata.com.au',
    phone: '(03) 9000 1234',
  },
  {
    id: 'comp-2',
    name: 'ABC Strata NSW/VIC',
    abn: '98 765 432 109',
    states: ['NSW', 'VIC'],
    planIds: ['3', '4'],
    contact: 'Michael Chen',
    email: 'admin@abcstrata.com.au',
    phone: '(02) 8100 5678',
  },
  {
    id: 'comp-3',
    name: 'Metro Property Management',
    abn: '55 123 456 789',
    states: ['QLD'],
    planIds: ['5'],
    contact: 'Lisa Nguyen',
    email: 'enquiries@metroproperty.com.au',
    phone: '(07) 3100 9999',
  },
]

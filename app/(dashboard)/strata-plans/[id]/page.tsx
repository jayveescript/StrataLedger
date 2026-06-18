import StrataPlanDetail from "./StrataPlanDetail"

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }]
}

export default function StrataPlansDetailPage({ params }: { params: { id: string } }) {
  return <StrataPlanDetail params={params} />
}

import StrataPlanDetail from "./StrataPlanDetail"

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]
}

export default async function StrataPlansDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <StrataPlanDetail params={resolvedParams} />
}

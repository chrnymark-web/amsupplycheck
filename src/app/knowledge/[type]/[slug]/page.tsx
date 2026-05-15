import { permanentRedirect } from "next/navigation"

export default async function KnowledgeDetailRedirect({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}) {
  await params
  permanentRedirect("/suppliers")
}

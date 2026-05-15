import { permanentRedirect } from "next/navigation"

export default async function GuideSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await params
  permanentRedirect("/suppliers")
}

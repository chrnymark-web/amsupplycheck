import { permanentRedirect } from "next/navigation"

export default async function CategoryTechnologyRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  permanentRedirect(`/suppliers?tech=${encodeURIComponent(slug)}`)
}

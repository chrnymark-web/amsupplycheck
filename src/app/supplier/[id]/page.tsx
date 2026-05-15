import { permanentRedirect } from "next/navigation";

export default async function LegacySupplierRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/suppliers/${id}`);
}

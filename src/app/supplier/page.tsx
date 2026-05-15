import { permanentRedirect } from "next/navigation";

export default function LegacySupplierIndex() {
  permanentRedirect("/suppliers");
}

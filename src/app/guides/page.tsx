import { permanentRedirect } from "next/navigation"

export default function GuidesIndexRedirect() {
  permanentRedirect("/suppliers")
}

import { permanentRedirect } from "next/navigation"

export default function InstantQuotesRedirect() {
  permanentRedirect("/match")
}

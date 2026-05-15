import { permanentRedirect } from "next/navigation"

export default function NearMeRedirect() {
  permanentRedirect("/suppliers")
}

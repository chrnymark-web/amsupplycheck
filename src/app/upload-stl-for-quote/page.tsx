import { permanentRedirect } from "next/navigation"

export default function UploadStlRedirect() {
  permanentRedirect("/stl-match")
}

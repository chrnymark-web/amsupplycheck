// Map task errors to short, user-safe Danish messages.
// Why: the Anthropic SDK's APIError.message is "<status> <raw-body>", which
// leaks JSON like 'credit balance too low' straight into the UI's red panel.
// We sanitize at the source (Trigger.dev catch blocks) before persisting to
// search_results.error_message, so the UI never has to know about API shapes.

import Anthropic from "@anthropic-ai/sdk";

const GENERIC_FALLBACK = "Noget gik galt. Prøv igen.";

export function mapTaskErrorToUserMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    const body = typeof error.message === "string" ? error.message : "";

    if (error instanceof Anthropic.BadRequestError) {
      if (body.includes("credit balance")) {
        return "Søgningen er midlertidigt ude af drift. Vi arbejder på det — prøv igen om lidt.";
      }
      return "Vi kunne ikke fuldføre søgningen. Prøv igen.";
    }

    if (error instanceof Anthropic.RateLimitError) {
      return "Vi er overbelastede lige nu. Prøv igen om et øjeblik.";
    }

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return "Søgningen tog for lang tid. Prøv igen.";
    }

    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      return "Søgningen er midlertidigt ude af drift. Vi arbejder på det — prøv igen om lidt.";
    }

    return "Vi kunne ikke fuldføre søgningen. Prøv igen.";
  }

  if (error instanceof Error) {
    if (/^\d{3}\s/.test(error.message) || error.message.includes("credit balance")) {
      return "Søgningen er midlertidigt ude af drift. Vi arbejder på det — prøv igen om lidt.";
    }
    return error.message || GENERIC_FALLBACK;
  }

  return GENERIC_FALLBACK;
}

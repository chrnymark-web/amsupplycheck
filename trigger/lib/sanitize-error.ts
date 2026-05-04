// Map task errors to short, user-safe English messages.
// Why: the Anthropic SDK's APIError.message is "<status> <raw-body>", which
// leaks JSON like 'credit balance too low' straight into the UI's red panel.
// We sanitize at the source (Trigger.dev catch blocks) before persisting to
// search_results.error_message, so the UI never has to know about API shapes.

import Anthropic from "@anthropic-ai/sdk";

const GENERIC_FALLBACK = "Something went wrong. Please try again.";
const SERVICE_UNAVAILABLE = "Search is temporarily unavailable. We're working on it — please try again shortly.";
const COULD_NOT_COMPLETE = "We couldn't complete the search. Please try again.";

export function mapTaskErrorToUserMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    const body = typeof error.message === "string" ? error.message : "";

    if (error instanceof Anthropic.BadRequestError) {
      if (body.includes("credit balance")) {
        return SERVICE_UNAVAILABLE;
      }
      return COULD_NOT_COMPLETE;
    }

    if (error instanceof Anthropic.RateLimitError) {
      return "We're overloaded right now. Please try again in a moment.";
    }

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return "Search took too long. Please try again.";
    }

    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      return SERVICE_UNAVAILABLE;
    }

    return COULD_NOT_COMPLETE;
  }

  if (error instanceof Error) {
    if (/^\d{3}\s/.test(error.message) || error.message.includes("credit balance")) {
      return SERVICE_UNAVAILABLE;
    }
    return error.message || GENERIC_FALLBACK;
  }

  return GENERIC_FALLBACK;
}

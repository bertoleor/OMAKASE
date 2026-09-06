export const MIN_ELAPSED_MS = 3000;

export interface SubmissionForm {
  honeypot?: string;
  renderedAt?: string;
}

export type AntiAbuseVerdict =
  | { ok: true }
  | { ok: false; reason: "honeypot" | "time-trap" };

export interface AntiAbuseOptions {
  minElapsedMs: number;
}

export function validateSubmission(
  form: SubmissionForm,
  opts: AntiAbuseOptions,
): AntiAbuseVerdict {
  if (form.honeypot && form.honeypot.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }
  if (form.renderedAt) {
    const renderedAtMs = Date.parse(form.renderedAt);
    if (Number.isFinite(renderedAtMs)) {
      const elapsedMs = Date.now() - renderedAtMs;
      if (elapsedMs < opts.minElapsedMs) {
        return { ok: false, reason: "time-trap" };
      }
    }
  }
  return { ok: true };
}
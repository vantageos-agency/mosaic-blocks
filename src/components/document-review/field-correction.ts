/**
 * The write path of a field correction: validate, write, and on failure hand back
 * the row from BEFORE.
 *
 * A failed write must never leave the screen showing a value the store does not
 * hold. The function is pure with respect to its input: it never mutates the row,
 * it returns a new one, so the caller replaces what it displays with what comes
 * back and has no decision to take.
 *
 * Provenance: the ORIGINAL value is kept (the first one, across successive
 * corrections), next to the corrected value, who made it, when, and the host's
 * provenance tag.
 */
import type { FieldValue } from "./column-model.js";

export interface CorrectionRecord {
  original: FieldValue;
  corrected: FieldValue;
  by: string;
  /** ISO-8601 instant. */
  at: string;
  provenance: string;
}

export interface ReviewRow {
  id: string;
  values: Readonly<Record<string, FieldValue>>;
  corrections?: Readonly<Record<string, CorrectionRecord>>;
}

/** What the correction UI hands to the host, and what the host passes on to the writer. */
export interface FieldCorrectionRequest {
  rowId: string;
  field: string;
  /** The user's raw input. */
  input: string;
  by: string;
  provenance: string;
}

/**
 * `value` is the value as the store re-read it. It is OPTIONAL on purpose: a store
 * that does not echo it yields an unconfirmed result, never a silent success.
 * Presence is what counts (`"value" in response`): `null` confirms an erasure.
 */
export type FieldWriteResponse = { ok: true; value?: FieldValue } | { ok: false; message: string };

export type FieldValidation = { ok: true; value: FieldValue } | { ok: false; message: string };

export type FieldValidator = (field: string, input: string, row: ReviewRow) => FieldValidation;

export interface ApplyFieldCorrectionArgs extends Omit<FieldCorrectionRequest, "rowId"> {
  row: ReviewRow;
  write: (request: FieldCorrectionRequest) => Promise<FieldWriteResponse>;
  /** Defaults to accepting the raw input as the value. */
  validate?: FieldValidator;
  /** Injectable clock, ISO-8601. Defaults to the current instant. */
  now?: () => string;
}

export type FieldCorrectionResult =
  | { ok: true; row: ReviewRow; confirmed: boolean }
  | { ok: false; row: ReviewRow; message: string };

export async function applyFieldCorrection(
  args: ApplyFieldCorrectionArgs,
): Promise<FieldCorrectionResult> {
  const { row, field, input, by, provenance, write, validate, now } = args;

  const checked: FieldValidation = validate
    ? validate(field, input, row)
    : { ok: true, value: input };
  if (!checked.ok) return { ok: false, row, message: checked.message };

  let response: FieldWriteResponse;
  try {
    response = await write({ rowId: row.id, field, input, by, provenance });
  } catch (e) {
    // The thrown message is kept verbatim: rewording it would remove what lets the user fix it.
    return { ok: false, row, message: e instanceof Error ? e.message : String(e) };
  }
  if (!response.ok) return { ok: false, row, message: response.message };

  const confirmed = "value" in response;
  // Unconfirmed: show what was sent, and say so through `confirmed: false`.
  const corrected: FieldValue = confirmed ? (response.value ?? null) : checked.value;
  const original = row.corrections?.[field]?.original ?? row.values[field] ?? null;
  const record: CorrectionRecord = {
    original,
    corrected,
    by,
    at: now ? now() : new Date().toISOString(),
    provenance,
  };
  return {
    ok: true,
    confirmed,
    row: {
      ...row,
      values: { ...row.values, [field]: corrected },
      corrections: { ...row.corrections, [field]: record },
    },
  };
}

/** Three outcomes, never two: "uncertain" is a write that succeeded but was not read back. */
export function correctionOutcome(result: FieldCorrectionResult): "ok" | "uncertain" | "failed" {
  if (!result.ok) return "failed";
  return result.confirmed ? "ok" : "uncertain";
}

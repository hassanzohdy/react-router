export function isUrl(value: any) {
  return new RegExp(
    "^(https?:\\/\\/||//)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%@_.~+&:]*)*(\\?[;&a-z\\d%@_.,~+&:=-]*)?(\\#[-a-z\\d_]*)?$",
    "i"
  ).test(value);
}

export function isNumeric(value: any) {
  return /^[+-]?\d+(\.\d+)?([Ee][+-]?\d+)?$/g.test(String(value));
}

/**
 * Whether the given path is safe to treat as an internal (same-origin) route.
 *
 * A leading "/" alone isn't enough: browsers treat a backslash as equivalent
 * to "/" for special schemes, so paths like "/\evil.com" or "//evil.com"
 * still resolve to an external origin even though they "start with /".
 */
export function isInternalPath(value: string) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;

  return true;
}

export const NAVIGATING = <></>;

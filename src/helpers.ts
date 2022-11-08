export function isUrl(value: any) {
  return new RegExp(
    "^(https?:\\/\\/||//)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%@_.~+&:]*)*(\\?[;&a-z\\d%@_.,~+&:=-]*)?(\\#[-a-z\\d_]*)?$",
    "i"
  ).test(value);
}

export function isNumeric(value: any) {
  return /^[+-]?\d+(\.\d+)?([Ee][+-]?\d+)?$/g.test(String(value));
}

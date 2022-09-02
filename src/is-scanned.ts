let _isScanned = false;

export function isScanned(): boolean {
  return _isScanned;
}

export function markAsScanned(): void {
  _isScanned = true;
}

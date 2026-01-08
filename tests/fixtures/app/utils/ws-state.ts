let closeCount = 0;

export function incrementClose(): void {
  closeCount += 1;
}

export function resetClose(): void {
  closeCount = 0;
}

export function getCloseCount(): number {
  return closeCount;
}

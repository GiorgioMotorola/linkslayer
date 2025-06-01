export function getTodayChain() {
  const today = new Date().toISOString().split('T')[0];
  const targets = {
    '2025-05-31': ['The_Boat_Race_2018', 'Melon'],
    '2025-06-01': ['Viagra_Boys', 'I_Think_You_Should_Leave_with_Tim_Robinson', 'Mammal', 'Jurassic'],
    '2025-06-02': ['Basketball', 'Milwaukee', 'Arcade_cabinet', 'Airplane'],
  };
  return targets[today] || ['Wikipedia', 'Sorry'];
}

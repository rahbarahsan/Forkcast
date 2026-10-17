export function quantities(amounts: Record<string, number>, category = ''): string {
  return Object.entries(amounts)
    .map(([unit, quantity]) => {
      if (!quantity) return 'amount to check';
      let value = quantity;
      let label = unit;
      if (unit === 'g' && quantity >= 1000) {
        value /= 1000;
        label = 'kg';
      }
      if (unit === 'ml' && /spice|seasoning/i.test(category)) {
        value /= 5;
        label = 'tsp';
      } else if (unit === 'ml' && quantity >= 1000) {
        value /= 1000;
        label = 'l';
      } else if (unit === 'ml' && quantity >= 240 && quantity % 240 === 0) {
        value /= 240;
        label = value === 1 ? 'cup' : 'cups';
      }
      if (label === 'pcs') label = quantity === 1 ? 'piece' : 'pieces';
      if (label === 'clove' && quantity !== 1) label = 'cloves';
      return Number(value.toFixed(3)) + ' ' + label;
    })
    .join(' + ');
}

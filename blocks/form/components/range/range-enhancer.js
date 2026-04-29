export function formatValue(input, value) {
  const max = parseInt(input.max);

  // Loan Tenure
  if (max <= 120) {
    return `${value} months`;
  }

  // Loan Amount
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export function addTicks(wrapper) {
  const slider = wrapper.querySelector('input[type="range"]');
  if (!slider) return;

  const min = parseInt(slider.min);
  const max = parseInt(slider.max);

  // remove old ticks
  let existing = wrapper.querySelector('.range-ticks');
  if (existing) existing.remove();

  const ticks = document.createElement('div');
  ticks.className = 'range-ticks';

  const steps = 5;

  for (let i = 0; i <= steps; i++) {
    const val = min + ((max - min) / steps) * i;
    const span = document.createElement('span');

    if (max <= 120) {
      span.textContent = `${Math.round(val)}m`;
    } else {
      if (val >= 100000) {
        span.textContent = Math.round(val / 100000) + 'L';
      } else {
        span.textContent = Math.round(val / 1000) + 'K';
      }
    }

    ticks.appendChild(span);
  }

  wrapper.appendChild(ticks);
}
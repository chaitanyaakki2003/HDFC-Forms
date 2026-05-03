import { formatValue, addTicks } from './range-enhancer.js';

function getActualValue(input, rawValue) {
  const name = input.name;

  // 🔥 LOAN AMOUNT SCALE
  if (name === "loan_amount_inr") {
    const values = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
    const index = Math.round((rawValue / 100) * (values.length - 1));
    return values[index];
  }

  // 🔥 TENURE SCALE
  if (name === "loan_tenure_months") {
    const values = [12, 24, 36, 48, 60, 72, 84];
    const index = Math.round((rawValue / 100) * (values.length - 1));
    return values[index];
  }

  return rawValue;
}

function updateBubble(input, element) {
  const bubble = element.querySelector('.range-bubble');

  const rawValue = Number(input.value);
  const actualValue = getActualValue(input, rawValue);

  // 🔥 SHOW CORRECT VALUE
  bubble.innerText = formatValue(input, actualValue);

  // 🔥 SAVE REAL VALUE INTO FIELD (VERY IMPORTANT FOR EMI)
  input.dataset.actualValue = actualValue;

  const percent = rawValue;

  bubble.style.left = `calc(${percent}% - ${(percent * 0.3)}px)`;
}

export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');

  input.type = 'range';

  // 🔥 KEEP RANGE 0–100 (for mapping)
  input.min = 0;
  input.max = 100;
  input.step = 1;

  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';

  input.after(div);

  const hover = document.createElement('span');
  hover.className = 'range-bubble';

  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';

  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';

  div.appendChild(hover);
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);

  // 🔥 ADD CORRECT TICKS
  addTicks(div, input.name);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });

  updateBubble(input, div);

  return fieldDiv;
}
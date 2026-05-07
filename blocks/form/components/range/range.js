import { formatValue, addTicks } from './range-enhancer.js';
function updateBubble(input, element) {
  const step = input.step || 1;
  const max = Number(input.max) || 100;
  const min = Number(input.min) || 0;
  const value = Number(input.value) || 0;

  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);

  const bubble = element.querySelector('.range-bubble');

  const bubbleWidth = bubble.getBoundingClientRect().width || 31;

  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  const fieldName = input.name;

  let actualValue = value;

  // ✅ LOAN AMOUNT = SMOOTH
  if (fieldName === "loan_amount_inr") {

    const MIN_AMOUNT = 50000;
    const MAX_AMOUNT = 1500000;

    const ratio = (value - min) / (max - min);

    actualValue =
      MIN_AMOUNT + ratio * (MAX_AMOUNT - MIN_AMOUNT);

    // ✅ ROUND TO 1000
    actualValue = Math.round(actualValue / 1000) * 1000;

    bubble.innerText =
      `₹${actualValue.toLocaleString('en-IN')}`;
  }

  // ✅ TENURE = FIXED
  else if (fieldName === "loan_tenure_months") {

    const tenureValues = [12, 24, 36, 48, 60, 72, 84];

    const index = Math.round(
      (value / 100) * (tenureValues.length - 1)
    );

    actualValue = tenureValues[index];

    bubble.innerText = `${actualValue} months`;
  }

  // ✅ SAVE REAL VALUE
  input.dataset.actualValue = actualValue;

  const steps = {
    '--total-steps': Math.ceil((max - min) / step),
    '--current-steps': Math.ceil((value - min) / step),
  };

  const style = Object.entries(steps)
    .map(([varName, varValue]) =>
      `${varName}:${varValue}`
    )
    .join(';');

  bubble.style.left = `calc(${left})`;

  element.setAttribute('style', style);
}
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  // modify the type in case it is not range.
  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;
  // create a wrapper div to provide the min/max and current value
  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';
  input.after(div);
  const hover = document.createElement('span');
  hover.className = 'range-bubble';
  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';
  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';
  rangeMinEl.innerText = `${input.min || 1}`;
  rangeMaxEl.innerText = `${input.max}`;
  div.appendChild(hover);
  // move the input element within the wrapper div
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);
  addTicks(div);
  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });
  updateBubble(input, div);

return fieldDiv;
}

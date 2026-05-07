import {
  formatValue,
  addTicks
} from './range-enhancer.js';

function updateBubble(input, element) {

  const step = Number(input.step) || 1;
  const max = Number(input.max) || 100;
  const min = Number(input.min) || 0;
  const value = Number(input.value) || 0;

  const current =
    Math.ceil((value - min) / step);

  const total =
    Math.ceil((max - min) / step);

  const bubble =
    element.querySelector('.range-bubble');

  // during initial render width becomes 0
  const bubbleWidth =
    bubble.getBoundingClientRect().width || 31;

  const left =
    `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  /* =========================
     IMPORTANT
     VALUE COMES FROM
     range-enhancer.js
  ========================= */

  bubble.innerText =
    formatValue(input, value);

  const steps = {
    '--total-steps':
      Math.ceil((max - min) / step),

    '--current-steps':
      Math.ceil((value - min) / step),
  };

  const style =
    Object.entries(steps)
      .map(([varName, varValue]) =>
        `${varName}:${varValue}`
      )
      .join(';');

  bubble.style.left = `calc(${left})`;

  element.setAttribute('style', style);
}

export default async function decorate(
  fieldDiv,
  fieldJson
) {

  const input =
    fieldDiv.querySelector('input');

  // ✅ RANGE TYPE
  input.type = 'range';

  /* =========================
     LOAN AMOUNT
  ========================= */

  if (input.name === "loan_amount_inr") {

    input.min = 0;
    input.max = 100;

    // smooth movement
    input.step = 1;

    // initial position
    if (!input.value) {
      input.value = 50;
    }
  }

  /* =========================
     TENURE
  ========================= */

  if (input.name === "loan_tenure_months") {

    input.min = 0;
    input.max = 100;

    // fixed snapping
    input.step = 16.6666667;

    if (!input.value) {
      input.value = 50;
    }
  }

  /* =========================
     CREATE WRAPPER
  ========================= */

  const div = document.createElement('div');

  div.className =
    'range-widget-wrapper decorated';

  input.after(div);

  const hover =
    document.createElement('span');

  hover.className = 'range-bubble';

  const rangeMinEl =
    document.createElement('span');

  rangeMinEl.className = 'range-min';

  const rangeMaxEl =
    document.createElement('span');

  rangeMaxEl.className = 'range-max';

  rangeMinEl.innerText =
    `${input.min || 0}`;

  rangeMaxEl.innerText =
    `${input.max || 100}`;

  div.appendChild(hover);

  // move slider into wrapper
  div.appendChild(input);

  div.appendChild(rangeMinEl);

  div.appendChild(rangeMaxEl);

  /* =========================
     ADD FIXED LABELS
  ========================= */

  addTicks(div);

  /* =========================
     INPUT EVENT
  ========================= */

  input.addEventListener('input', (e) => {

    // ✅ tenure exact snap
    if (
      input.name === "loan_tenure_months"
    ) {

      const values = [
        12, 24, 36, 48, 60, 72, 84
      ];

      const segment =
        100 / (values.length - 1);

      e.target.value =
        Math.round(
          e.target.value / segment
        ) * segment;
    }

    updateBubble(e.target, div);
  });

  /* =========================
     INITIAL RENDER
  ========================= */

  updateBubble(input, div);

  return fieldDiv;
}
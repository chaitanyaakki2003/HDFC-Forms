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

    // ✅ allow exact snapping
input.step = 1;

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
    // ✅ tenure exact snap
if (
  input.name === "loan_tenure_months"
) {

  const values = [
    12, 24, 36, 48, 60, 72, 84
  ];

  const segment =
    100 / (values.length - 1);

  let snapped =
    Math.round(
      e.target.value / segment
    ) * segment;

  // ✅ FIX LAST VALUE
  if (snapped > 99) {
    snapped = 100;
  }

  e.target.value = snapped;
}
// =========================
// GET EXACT VALUES
// =========================

const loanAmount =
  Number(
    document.querySelector('[name="loan_amount_inr"]')
      ?.dataset?.actualValue
  ) || 0;

const tenure =
  Number(
    document.querySelector('[name="loan_tenure_months"]')
      ?.dataset?.actualValue
  ) || 0;

// =========================
// UPDATE LOAN OFFER
// =========================

const loanOffer =
  document.querySelector('.loan-offer-amount');

if (loanOffer) {

  loanOffer.innerText =
    `₹${loanAmount.toLocaleString('en-IN')}`;
}

// =========================
// EMI CALCULATION
// =========================

if (loanAmount && tenure) {

  const annualRate = 10.09;

  const monthlyRate =
    annualRate / (12 * 100);

  const emi =
    (
      loanAmount *
      monthlyRate *
      Math.pow(
        1 + monthlyRate,
        tenure
      )
    ) /
    (
      Math.pow(
        1 + monthlyRate,
        tenure
      ) - 1
    );

  const emiRounded =
    Math.round(emi);

  // =========================
  // UPDATE EMI
  // =========================

  const emiField =
    document.querySelector('.emi-amount');

  if (emiField) {

    emiField.innerText =
      `₹${emiRounded.toLocaleString('en-IN')}`;
  }
}
    updateBubble(e.target, div);
  });

  /* =========================
     INITIAL RENDER
  ========================= */

  updateBubble(input, div);

  return fieldDiv;
}
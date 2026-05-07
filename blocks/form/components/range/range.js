import {
  formatValue,
  addTicks
} from './range-enhancer.js';

/* =========================
   UPDATE LOAN DETAILS
========================= */

function updateLoanDetails() {

  // =========================
  // GET EXACT VALUES
  // =========================

  const loanAmount =
    Number(
      document.querySelector(
        '[name="loan_amount_inr"]'
      )?.dataset?.actualValue
    ) || 0;

  const tenure =
    Number(
      document.querySelector(
        '[name="loan_tenure_months"]'
      )?.dataset?.actualValue
    ) || 0;

  // =========================
  // EMI CALCULATION
  // =========================

  const annualRate = 10.09;

  const monthlyRate =
    annualRate / (12 * 100);

  let emi = 0;

  if (loanAmount && tenure) {

    emi =
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
  }

  // =========================
  // FIND CARD VALUES
  // =========================

  const allDivs =
    document.querySelectorAll('div');

  let amountField = null;
  let emiField = null;

  allDivs.forEach((el) => {

    const text =
      el.innerText?.trim();

    // LOAN OFFER AMOUNT
    if (
      text === '₹15,00,000' ||
      text.includes('₹')
    ) {

      const parentText =
        el.parentElement?.innerText || '';

      if (
        parentText.includes(
          'Avail XPRESS Personal Loan'
        )
      ) {

        amountField = el;
      }
    }

    // EMI FIELD
    if (
      text.includes('2518') ||
      text.includes('₹')
    ) {

      const parentText =
        el.parentElement?.innerText || '';

      if (
        parentText.includes('EMI Amount')
      ) {

        emiField = el;
      }
    }
  });

  // =========================
  // UPDATE LOAN AMOUNT
  // =========================

  if (amountField) {

    amountField.innerText =
      `₹${loanAmount.toLocaleString('en-IN')}`;
  }

  // =========================
  // UPDATE EMI
  // =========================

  if (emiField) {

    emiField.innerText =
      `₹${Math.round(emi).toLocaleString('en-IN')}`;
  }
}

/* =========================
   UPDATE BUBBLE
========================= */

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

  const bubbleWidth =
    bubble.getBoundingClientRect().width || 31;

  const left =
    `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

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

/* =========================
   MAIN DECORATE
========================= */

export default async function decorate(
  fieldDiv,
  fieldJson
) {

  const input =
    fieldDiv.querySelector('input');

  input.type = 'range';

  /* =========================
     LOAN AMOUNT
  ========================= */

  if (input.name === "loan_amount_inr") {

    input.min = 0;
    input.max = 100;
    input.step = 1;

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

    // =========================
    // TENURE SNAP FIX
    // =========================

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

      // LAST VALUE FIX
      if (snapped > 99) {
        snapped = 100;
      }

      e.target.value = snapped;
    }

    // =========================
    // UPDATE UI
    // =========================

    updateBubble(e.target, div);

    updateLoanDetails();
  });

  /* =========================
     INITIAL RENDER
  ========================= */

  updateBubble(input, div);

  updateLoanDetails();

  return fieldDiv;
}
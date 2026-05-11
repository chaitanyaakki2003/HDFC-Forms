import {
  formatValue,
  addTicks
} from './range-enhancer.js';

/* =========================
   EMI + CARD UPDATE
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

 // =========================
// GET EXACT TENURE VALUE
// =========================

const tenureSlider =
  document.querySelector(
    '[name="loan_tenure_months"]'
  );

const tenureValues = [
  12, 24, 36, 48, 60, 72, 84
];

const segment =
  100 / (tenureValues.length - 1);

let tenureIndex =
  Math.round(
    Number(tenureSlider.value) / segment
  );

if (tenureIndex >= tenureValues.length) {
  tenureIndex = tenureValues.length - 1;
}

const tenure =
  tenureValues[tenureIndex];

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
  // SAFE ELEMENT SELECTION
  // =========================

  const cards =
    document.querySelectorAll(
      '.right-side-card, .loan-card, .card'
    );

  let amountField = null;
  let emiField = null;

  cards.forEach((card) => {

    // FIND ₹ VALUE
    const rupeeEls =
      card.querySelectorAll('*');

    rupeeEls.forEach((el) => {

      const text =
        el.innerText?.trim();

      // LOAN AMOUNT
// LOAN AMOUNT FIELD
if (
  text &&
  text.match(/^₹[\d,]+$/)
) {

  // BIGGEST ₹ VALUE IN CARD
  const fontSize =
    window.getComputedStyle(el)
      .fontSize;

  if (
    parseFloat(fontSize) > 30
  ) {

    amountField = el;
  }
}

      // EMI
      if (
        card.innerText.includes('EMI Amount')
      ) {

        const all =
          card.querySelectorAll('*');

        all.forEach((item) => {

          const val =
            item.innerText?.trim();

          if (
            val &&
            (
              val.includes('₹') ||
              !isNaN(val.replace(/,/g, ''))
            )
          ) {

            emiField = item;
          }
        });
      }
    });
  });

  // =========================
  // FALLBACK SAFE QUERY
  // =========================

  if (!amountField) {

    amountField =
      document.querySelector(
        '.eligibility-amount'
      );
  }

  if (!emiField) {

    emiField =
      document.querySelector(
        '.emi-value'
      );
  }

  // =========================
  // UPDATE VALUES
  // =========================

  if (amountField) {

    amountField.innerText =
      `₹${loanAmount.toLocaleString('en-IN')}`;
  }

  if (emiField) {

    emiField.innerText =
      `₹${Math.round(emi).toLocaleString('en-IN')}`;
  }
  // =========================
// UPDATE REVIEW TENURE ONLY
// =========================

const reviewTenureField =
  document.querySelector(
    '.panel-wrapper .field-loan-tenure-months input[type="text"]'
  );

if (reviewTenureField) {

  reviewTenureField.value = tenure;
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
     FIXED LABELS
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

  let index =
    Math.round(
      e.target.value / segment
    );

  // FIX LAST VALUE
  if (index >= values.length) {
    index = values.length - 1;
  }

  // EXACT VALUE
  const actualValue =
    values[index];

  // EXACT SLIDER POSITION
  if (index === values.length - 1) {
    e.target.value = 100;
  } else {
    e.target.value =
      index * segment;
  }

  // ✅ VERY IMPORTANT FIX
  e.target.dataset.actualValue =
    actualValue;
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

  setTimeout(() => {
    updateLoanDetails();
  }, 300);

  return fieldDiv;
}
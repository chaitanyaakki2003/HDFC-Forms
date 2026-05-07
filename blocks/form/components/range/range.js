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

  const fieldName = input.name;

  let actualValue = value;

  /* =========================
     LOAN AMOUNT
  ========================= */

  if (fieldName === "loan_amount_inr") {

    // ✅ DIRECT VALUE
    actualValue = value;

    // ✅ SAVE
    input.dataset.actualValue = actualValue;

    // ✅ DISPLAY
    bubble.innerText =
      `₹${actualValue.toLocaleString('en-IN')}`;
  }

  /* =========================
     TENURE
  ========================= */

  else if (fieldName === "loan_tenure_months") {

    const tenureValues = [
      12, 24, 36, 48, 60, 72, 84
    ];

    // ✅ FIND NEAREST
    let nearest =
      tenureValues.reduce((prev, curr) => {
        return (
          Math.abs(curr - value) <
          Math.abs(prev - value)
            ? curr
            : prev
        );
      });

    actualValue = nearest;

    // ✅ SNAP
    input.value = nearest;

    // ✅ SAVE
    input.dataset.actualValue = actualValue;

    // ✅ DISPLAY
    bubble.innerText =
      `${actualValue} months`;
  }

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

  input.type = 'range';

  /* =========================
     LOAN AMOUNT
  ========================= */

  if (input.name === "loan_amount_inr") {

    input.min = 50000;
    input.max = 1500000;

    // ✅ SMOOTH
    input.step = 1000;

    // ✅ INITIAL
    if (!input.value) {
      input.value = 500000;
    }
  }

  /* =========================
     TENURE
  ========================= */

  if (input.name === "loan_tenure_months") {

    input.min = 12;
    input.max = 84;

    // ✅ SNAP ONLY
    input.step = 12;

    if (!input.value) {
      input.value = 48;
    }
  }

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
    `${input.min}`;

  rangeMaxEl.innerText =
    `${input.max}`;

  div.appendChild(hover);

  div.appendChild(input);

  div.appendChild(rangeMinEl);

  div.appendChild(rangeMaxEl);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });

  updateBubble(input, div);

  return fieldDiv;
}
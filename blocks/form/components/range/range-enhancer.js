/* =========================
   FORMAT VALUE
========================= */
export function formatValue(input, value) {

  const fieldName = input.name;

  value = Number(value);

  // ✅ LOAN AMOUNT
  if (fieldName === "loan_amount_inr") {

  // ✅ IF EXACT VALUE EXISTS
  // RETURN IT DIRECTLY
  if (input.dataset.actualValue) {

    const exactValue =
      Number(input.dataset.actualValue);

    // ✅ CHECK IF SLIDER IS ON FIXED POINT
    const values = [
      50000,
      200000,
      400000,
      600000,
      800000,
      1000000,
      1500000
    ];

    const segmentSize =
      100 / (values.length - 1);

    const exactPositions =
      values.map((_, i) => i * segmentSize);

    const isExact =
  exactPositions.some(
    pos => Math.abs(pos - value) < 0.5
  );

    // ✅ RETURN EXACT VALUE
    if (isExact) {
      return `₹${exactValue.toLocaleString('en-IN')}`;
    }
  }

    // ✅ FIXED VALUES ONLY
  const values = [
    50000,
    200000,
    400000,
    600000,
    800000,
    1000000,
    1500000
  ];

  const segmentSize =
    100 / (values.length - 1);

  // FIND EXACT INDEX
  let index =
    Math.round(value / segmentSize);

  // FIX LAST VALUE
  if (index >= values.length) {
    index = values.length - 1;
  }

  const actualValue =
    values[index];

  // SAVE EXACT VALUE
  input.dataset.actualValue =
    actualValue;

  // FORCE EXACT POSITION
  if (index === values.length - 1) {

    input.value = 100;

  } else {

    input.value =
      index * segmentSize;
  }

  return `₹${actualValue.toLocaleString('en-IN')}`;

  // ✅ TENURE FIXED VALUES ONLY
if (fieldName === "loan_tenure_months") {

  const tenureValues = [
    12, 24, 36, 48, 60, 72, 84
  ];

  const segmentSize =
    100 / (tenureValues.length - 1);

  let index = Math.round(
  value / segmentSize
);

// ✅ FIX LAST VALUE (84m)
if (index >= tenureValues.length) {
  index = tenureValues.length - 1;
}

  const actualValue =
    tenureValues[index];

  // ✅ FORCE SLIDER POSITION
if (index === tenureValues.length - 1) {
  input.value = 100;
} else {
  input.value =
    index * segmentSize;
}

  // ✅ SAVE EXACT VALUE
  input.dataset.actualValue =
    actualValue;

  return `${actualValue} months`;
}

return value;
}

/* =========================
   SET STEP
========================= */
export function setupSliderSteps(slider) {
  const max = parseInt(slider.max);

  if (max > 120) {
    slider.step = 100000; // 1L FIX
  } else {
    slider.step = 1;
  }
}


/* =========================
   ADD TICKS (FIXED VALUES)
========================= */
export function addTicks(wrapper) {

  const slider =
    wrapper.querySelector('input[type="range"]');

  if (!slider) return;

  // =========================
  // FIELD NAME
  // =========================

  const fieldName = slider.name;

  // REMOVE OLD TICKS
  let existing =
    wrapper.querySelector('.range-ticks');

  if (existing) {
    existing.remove();
  }

  // CREATE TICKS WRAPPER
  const ticks =
    document.createElement('div');

  ticks.className = 'range-ticks';

  // =========================
  // VALUES
  // =========================

  let values = [];

  if (fieldName === "loan_amount_inr") {

    values = [
      50000,
      200000,
      400000,
      600000,
      800000,
      1000000,
      1500000
    ];

  } else {

    values = [
      12,
      24,
      36,
      48,
      60,
      72,
      84
    ];
  }

  // =========================
  // CREATE LABELS
  // =========================

  values.forEach((val, index) => {

    const span =
      document.createElement('span');

    // =========================
    // LABEL TEXT
    // =========================

    if (fieldName === "loan_amount_inr") {

      if (val >= 100000) {

        span.textContent =
          (val / 100000) + 'L';

      } else {

        span.textContent =
          (val / 1000) + 'K';
      }

    } else {

      span.textContent =
        val + 'm';
    }

    // =========================
    // CLICK EVENT
    // =========================

    span.addEventListener('click', () => {

      // =========================
      // LOAN AMOUNT
      // =========================

      if (fieldName === "loan_amount_inr") {

        const amountValues = [
          50000,
          200000,
          400000,
          600000,
          800000,
          1000000,
          1500000
        ];

        // SAVE EXACT VALUE
        slider.dataset.actualValue =
          amountValues[index];

        // EXACT POSITION
        slider.value =
          (index / (amountValues.length - 1)) * 100;

        // UPDATE BUBBLE
        const bubble =
          wrapper.querySelector('.range-bubble');

        if (bubble) {

          bubble.innerText =
            `₹${amountValues[index].toLocaleString('en-IN')}`;
        }
      }

      // =========================
      // TENURE
      // =========================

      else {

        const tenureValues = [
          12,
          24,
          36,
          48,
          60,
          72,
          84
        ];

        slider.dataset.actualValue =
          tenureValues[index];

        const segmentSize =
          100 / (tenureValues.length - 1);

        // FIX LAST VALUE
        if (index === tenureValues.length - 1) {

          slider.value = 100;

        } else {

          slider.value =
            index * segmentSize;
        }

        // UPDATE BUBBLE
        const bubble =
          wrapper.querySelector('.range-bubble');

        if (bubble) {

          bubble.innerText =
            `${tenureValues[index]} months`;
        }
      }

      // =========================
      // IMPORTANT
      // FIRE INPUT EVENT
      // =========================

      setTimeout(() => {

        slider.dispatchEvent(
          new Event('input', {
            bubbles: true
          })
        );

      }, 0);

    });

    // APPEND LABEL
    ticks.appendChild(span);

  });

  // =========================
  // APPEND TICKS
  // =========================

  wrapper.appendChild(ticks);
}

/* =========================
   INIT
========================= */
 export function initRangeSliders(container = document) {
  const wrappers = container.querySelectorAll('.field-wrapper');

  wrappers.forEach((wrapper) => {
    const slider = wrapper.querySelector('input[type="range"]');
    const output = wrapper.querySelector('input[type="text"]');

    if (!slider || !output) return;

    setupSliderSteps(slider);
    addTicks(wrapper);

    // Initial value
    output.value = formatValue(slider, slider.value);

    slider.addEventListener('input', () => {
      output.value = formatValue(slider, slider.value);
    });
  });
}


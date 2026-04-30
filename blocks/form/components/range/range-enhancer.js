/* =========================
   FORMAT VALUE
========================= */
export function formatValue(input, value) {
  const max = parseInt(input.max);

  if (max <= 120) {
    return `${value} months`;
  }

  return `₹${Number(value).toLocaleString('en-IN')}`;
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
  const slider = wrapper.querySelector('input[type="range"]');
  if (!slider) return;

  const min = parseInt(slider.min);
  const max = parseInt(slider.max);

  // Remove old ticks
  let existing = wrapper.querySelector('.range-ticks');
  if (existing) existing.remove();

  const ticks = document.createElement('div');
  ticks.className = 'range-ticks';

  let values = [];

  /* 🔥 IMPORTANT FIX */
  if (max > 120) {
    // Loan Amount → exact lakhs
    values = [
      50000,
      300000,
      600000,
      900000,
      1200000,
      1500000
    ];
  } else {
    // Tenure
    values = [
      12,
      26,
      41,
      55,
      70,
      84
    ];
  }

  values.forEach((val) => {
    const span = document.createElement('span');

    // Label
    if (max > 120) {
      if (val >= 100000) {
        span.textContent = val / 100000 + 'L';
      } else {
        span.textContent = val / 1000 + 'K';
      }
    } else {
      span.textContent = val + 'm';
    }

    /* 🔥 CLICK → EXACT VALUE */
    span.addEventListener('click', () => {
      slider.value = val;

      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });

    ticks.appendChild(span);
  });

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
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

  // 🔥 detect by field name instead of max
  const fieldName = slider.name;

  let existing = wrapper.querySelector('.range-ticks');
  if (existing) existing.remove();

  const ticks = document.createElement('div');
  ticks.className = 'range-ticks';

  let values = [];

  // ✅ CORRECT LOGIC
  if (fieldName === "loan_amount_inr") {
    values = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
  } else {
    values = [12, 24, 36, 48, 60, 72, 84];
  }

  values.forEach((val, index) => {
    const span = document.createElement('span');

    // ✅ LABEL FORMAT
    if (fieldName === "loan_amount_inr") {
      if (val >= 100000) {
        span.textContent = val / 100000 + 'L';
      } else {
        span.textContent = val / 1000 + 'K';
      }
    } else {
      span.textContent = val + 'm';
    }

    // 🔥 CLICK FIX (IMPORTANT)
    span.addEventListener('click', () => {
      const percent = (index / (values.length - 1)) * 100;
      slider.value = percent;

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
/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

/**
 * @param {scope} globals
 * @returns {string}
 */

function handleOtpFlow(globals) {
  const form = globals.form;

  // CONFIG
  const TIMER_SECONDS = 30;

  // INITIAL STATE
  let timeLeft = TIMER_SECONDS;
  let attemptsLeft = 3;

  // Disable resend initially
  globals.functions.setProperty(form.resend_otp, {
    enabled: false
  });

  // Set attempts text
  globals.functions.setProperty(form.attempts, {
    value: `${attemptsLeft}/3`
  });

  // TIMER FUNCTION
  const timerInterval = setInterval(() => {
    timeLeft--;

    // Optional: show timer in UI (if you have a label)
    // globals.functions.setProperty(form.timer_label, {
    //   value: `Resend OTP in ${timeLeft}s`
    // });

    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      // Enable resend button
      globals.functions.setProperty(form.resend_otp, {
        enabled: true
      });
    }
  }, 1000);

  // RESEND BUTTON CLICK HANDLER
  form.resend_otp?.$on('click', () => {
    if (timeLeft > 0) return;

    // Reset timer
    timeLeft = TIMER_SECONDS;

    // Disable again
    globals.functions.setProperty(form.resend_otp, {
      enabled: false
    });

    // Decrease attempts
    attemptsLeft--;

    globals.functions.setProperty(form.attempts, {
      value: `${attemptsLeft}/3`
    });

    // OPTIONAL: call your API again (already configured in AEM rule)
    // New OTP will come via success handler

    // Restart timer
    const newTimer = setInterval(() => {
      timeLeft--;

      if (timeLeft <= 0) {
        clearInterval(newTimer);

        globals.functions.setProperty(form.resend_otp, {
          enabled: true
        });
      }
    }, 1000);
  });

  // OPTIONAL: HANDLE SUBMIT (OTP validation attempt)
  form.submit?.$on('click', () => {
    attemptsLeft--;

    globals.functions.setProperty(form.attempts, {
      value: `${attemptsLeft}/3`
    });

    if (attemptsLeft <= 0) {
      // Disable everything
      globals.functions.setProperty(form.resend_otp, {
        enabled: false
      });

      globals.functions.setProperty(form.otp_code, {
        enabled: false
      });

      alert("Maximum attempts reached");
    }
  });
}

/**
 * Update Loan Offer Card
 * @param {scope} globals
 */
function updateLoanOffer(globals) {

  // 1. READ LOAN AMOUNT
  const loanAmount =
    globals.form.get_loan.offer_panel.loan_amount.valueOf();

  if (!loanAmount) return;

  // 2. GET TARGET FIELD (YOUR TEXT INPUT)
  const targetField =
    globals.form.get_loan.offer_display
      .loan_offer_summary
      .avail_XPRESS_Personal_Loan_of;

  if (!targetField) {
    console.log("❌ Target field not found");
    return;
  }

  // 3. SET VALUE (CORRECT WAY)
  globals.functions.setProperty(targetField, {
    value: "₹ " + loanAmount.toLocaleString()
  });

  console.log("✅ Value updated");
}


/**
 * EMI Calculation (FINAL FIXED PATH)
 * @param {scope} globals
 */
function calculateEMI(globals) {
  try {
    const form = globals.form;

    const amountSlider = document.querySelector('[name="loan_amount_inr"]');
    const tenureSlider = document.querySelector('[name="loan_tenure_months"]');

    const percent = Number(amountSlider?.value) || 0;

    const MIN = 50000;
    const MAX = 1500000;

    // ✅ SMOOTH VALUE
    let loanAmount = MIN + (percent / 100) * (MAX - MIN);

    // ✅ ROUND LIKE BANK UI
    loanAmount = Math.round(loanAmount / 1000) * 1000;

    const tenure = Number(
      tenureSlider?.dataset?.actualValue
    ) || 0;

    if (!loanAmount || !tenure) return;

    // ✅ INTEREST
    const annualRate = 10.97;
    const monthlyRate = annualRate / (12 * 100);

    const emi =
      (loanAmount *
        monthlyRate *
        Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);

    const emiRounded = Math.floor(emi);

    const tax = 4000;

    // 🔥🔥🔥 IMPORTANT FIX (FOR BUBBLE / INPUT DISPLAY)
    const displayAmount = "₹" + loanAmount.toLocaleString("en-IN");

    // 👉 FORCE UPDATE TEXT INPUT (THIS FIXES YOUR ISSUE)
    const amountInputBox = amountSlider
      ?.closest('.field-wrapper')
      ?.querySelector('input[type="text"]');

    if (amountInputBox) {
      amountInputBox.value = displayAmount;
    }

    // 👉 ALSO UPDATE BUBBLE
    const bubble = amountSlider
      ?.closest('.range-widget-wrapper')
      ?.querySelector('.range-bubble');

    if (bubble) {
      bubble.innerText = displayAmount;
    }

    // ✅ UPDATE RIGHT PANEL
    globals.functions.setProperty(
      form.amount_display.personal_loan,
      { value: displayAmount }
    );

    globals.functions.setProperty(
      form.amount_display.amount_emi,
      { value: "₹" + emiRounded.toLocaleString("en-IN") }
    );

    globals.functions.setProperty(
      form.amount_display.rate_interest,
      { value: annualRate.toFixed(2) + "%" }
    );

    globals.functions.setProperty(
      form.amount_display.tax,
      { value: "₹" + tax.toLocaleString("en-IN") }
    );

  } catch (e) {
    console.error("EMI ERROR:", e);
  }
}
 
// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer, calculateEMI,
};










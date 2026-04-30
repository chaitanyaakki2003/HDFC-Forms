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
 * @param {scope} globals
 * @returns {string}
 */
function updateLoanOffer(globals) {
  try {
    // ===== GET VALUES =====
    const loanAmount = Number(globals.form.loan_amount.value || 0);
    const tenure = Number(globals.form.loan_tenure.value || 0);

    if (!loanAmount || !tenure) return;

    // ===== CONSTANTS =====
    const rate = 10.97;
    const taxes = 4000;

    const r = rate / 12 / 100;
    const n = tenure;

    // ===== EMI =====
    const emi =
      (loanAmount * r * Math.pow(1 + r, n)) /
      (Math.pow(1 + r, n) - 1);

    // ===== FORMAT =====
    const formattedLoan = `₹${loanAmount.toLocaleString("en-IN")}`;
    const formattedEmi = `₹${Math.round(emi).toLocaleString("en-IN")}`;
    const formattedRate = `${rate}%`;
    const formattedTaxes = `₹${taxes.toLocaleString("en-IN")}`;

    // ===== UPDATE CARD =====

    // 👉 Loan Amount Title
    globals.functions.setProperty(
      globals.form.offer_display.loan_offer_summary.avail_XPRESS_Personal_Loan_of,
      {
        label: { value: formattedLoan }
      }
    );

    // 👉 EMI
    globals.functions.setProperty(
      globals.form.offer_display.loan_offer_summary.loan_offer_details.emi_amount,
      {
        label: { value: formattedEmi }
      }
    );

    // 👉 Interest
    globals.functions.setProperty(
      globals.form.offer_display.loan_offer_summary.loan_offer_details.rate_of_interest,
      {
        label: { value: formattedRate }
      }
    );

    // 👉 Taxes
    globals.functions.setProperty(
      globals.form.offer_display.loan_offer_summary.loan_offer_details.taxes,
      {
        label: { value: formattedTaxes }
      }
    );

  } catch (e) {
    console.log("ERROR:", e);
  }
}


// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer,
};










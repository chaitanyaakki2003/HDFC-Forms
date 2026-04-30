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

  console.log("✅ FUNCTION RUNNING");

  // ===== GET VALUES =====
  const loanAmount = Number(globals.form.get_loan.loan_amount?.value || 0);
  const tenureMonths = Number(globals.form.get_loan.loan_tenure?.value || 0);

  console.log("Loan:", loanAmount, "Tenure:", tenureMonths);

  // ===== CONSTANTS =====
  const annualInterestRate = 10.97;
  const taxes = 4000;

  const r = annualInterestRate / 12 / 100;

  // ===== EMI =====
  let emi = 0;
  if (loanAmount > 0 && tenureMonths > 0) {
    const pow = Math.pow(1 + r, tenureMonths);
    emi = (loanAmount * r * pow) / (pow - 1);
  }

  emi = Math.round(emi);

  // ===== FORMAT =====
  const formattedLoan = `₹${loanAmount.toLocaleString("en-IN")}`;
  const formattedEmi = `₹${emi.toLocaleString("en-IN")}`;
  const formattedInterest = `${annualInterestRate}%`;
  const formattedTaxes = `₹${taxes.toLocaleString("en-IN")}`;

  // ===== CORRECT PATH =====
  const root = globals.form.personal_loan_offer;

  console.log("Root:", root);

  // 👉 go step by step safely
  const offerDisplay = root?.offer_display;
  const loanCard = offerDisplay?.avail_XPRESS_Person;

  console.log("Loan Card:", loanCard);

  if (!loanCard) {
    console.log("❌ loanCard path wrong — fix name");
    return;
  }

  // ===== UPDATE UI =====

  // Title
  globals.functions.setProperty(loanCard, {
    value: `Avail XPRESS Personal Loan of ${formattedLoan}`
  });

  // EMI
  globals.functions.setProperty(
    loanCard.loan_offer_details.emi_amount,
    { value: formattedEmi }
  );

  // Interest
  globals.functions.setProperty(
    loanCard.loan_offer_details.rate_of_interest,
    { value: formattedInterest }
  );

  // Taxes
  globals.functions.setProperty(
    loanCard.loan_offer_details.taxes,
    { value: formattedTaxes }
  );
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer,
};










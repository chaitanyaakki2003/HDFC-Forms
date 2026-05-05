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

    // ✅ GET REAL VALUES FROM SLIDER (FIX)
    const loanAmount = Number(
      document.querySelector('[name="loan_amount_inr"]')?.dataset?.actualValue
    ) || 0;
    const tenure = Number(
      document.querySelector('[name="loan_tenure_months"]')?.dataset?.actualValue
    ) || 0;
    console.log("✅ Loan:", loanAmount, "Tenure:", tenure);
    if (!loanAmount || !tenure) return;
    // ✅ INTEREST
    const annualRate = 10.97;
    const monthlyRate = annualRate / (12 * 100);
    // ✅ EMI FORMULA
    const emi =
      (loanAmount *
        monthlyRate *
        Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);

    const emiRounded = Math.round(emi);
    const tax = 4000;
    // ✅ UPDATE UI
    globals.functions.setProperty(
      form.amount_display.personal_loan,
      {
        value: "₹" + loanAmount.toLocaleString("en-IN"),
      }
    );
    globals.functions.setProperty(
      form.amount_display.amount_emi,
      {
        value: "₹" + emiRounded.toLocaleString("en-IN"),
      }
    );
    globals.functions.setProperty(
    form.amount_display.rate_interest,
      {
        value: annualRate + "%",
      }
    );
    globals.functions.setProperty(
      form.amount_display.tax,
      {
        value: "₹" + tax.toLocaleString("en-IN"),
      }
    );
  } catch (e) {
    console.error("EMI ERROR:", e);
  }
}
function initSalaryBankUI() {
  const panel = document.querySelector(".field-salary-bank-selection");
  const radioGroup = panel?.querySelector(".radio-group-wrapper");
  const dropdown = document.querySelector(".drop-down-wrapper.field-salary-bank select");

  if (!panel || !radioGroup || panel.dataset.ready === "true") return;
  panel.dataset.ready = "true";

  const bankLogos = {
  "hdfc_bank": "/content/dam/akki/hdfc.png",
  "icici_bank": "/content/dam/akki/icici.png",
  "axis_bank": "/content/dam/akki/axis.png",
  "kotak_bank": "/content/dam/akki/kotak.png",
  "sbi": "/content/dam/akki/sbi.png",
  "bank_of_baroda": "/content/dam/akki/bob.jpeg",
  "idfc_first_bank": "/content/dam/akki/idfc.png"
};

  const container = document.createElement("div");
  container.className = "salary-bank-content-row";

  const cards = document.createElement("div");
  cards.className = "bank-card-container";

  container.appendChild(cards);

  // ✅ keep dropdown inside same row
  if (dropdown) {
    container.appendChild(dropdown.parentElement);
  }

  radioGroup.parentNode.insertBefore(container, radioGroup);
  radioGroup.style.display = "none";

  const radios = radioGroup.querySelectorAll("input[type='radio']");

  radios.forEach((radio) => {
    const value = radio.value.trim(); // ✅ FIX
    const labelText = radio.nextElementSibling?.innerText || value;

    const card = document.createElement("div");
    card.className = "bank-card";

    card.innerHTML = `
      <img src="${bankLogos[value] || ''}" 
           onerror="this.style.display='none'" />
      <span>${labelText}</span>
    `;

    if (radio.checked) card.classList.add("active");

    card.onclick = () => {
      radios.forEach(r => r.checked = false);
      radio.checked = true;

      document.querySelectorAll(".bank-card")
        .forEach(c => c.classList.remove("active"));

      card.classList.add("active");

      if (dropdown) dropdown.value = value;
    };

    cards.appendChild(card);
  });
}

/* SAFE LOAD */
document.addEventListener("DOMContentLoaded", initSalaryBankUI);
window.addEventListener("load", initSalaryBankUI);
setTimeout(initSalaryBankUI, 500);
setTimeout(initSalaryBankUI, 1500);


/**
 * Generate OTP API Call
 * @param {scope} globals
 */
function generateOtp(globals) {

  const form = globals.form;

  // 👉 Read values using full path (UPDATE paths as per your form)
  const mobile = form.mobile?.value;
  const dob = form.dob?.value;
  const pan = form.pan?.value;

  const payload = {
    mobile: mobile,
    dob: dob || null,
    pan: pan || null
  };

  fetch("https://craftsman-resonant-asparagus.ngrok-free.dev/generate-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {

    console.log("OTP Response:", data);

    if (data.status === "success") {

      // ✅ Store OTP (for testing only)
      globals.functions.setProperty(form.generatedOtp, {
        value: data.otp
      });

      // ✅ Show OTP panel
      globals.functions.setProperty(form.enter_otp_panel, {
        visible: true
      });

      // ✅ Success message
      globals.functions.setProperty(form.otp_status, {
        value: "OTP Sent Successfully"
      });

    } else {

      globals.functions.setProperty(form.otp_status, {
        value: data.message
      });

    }
  })
  .catch(err => {
    console.error(err);

    globals.functions.setProperty(form.otp_status, {
      value: "API Error"
    });
  });
}

/**
 * Verify OTP API Call
 * @param {scope} globals
 */
function verifyOtp(globals) {

  const form = globals.form;

  const payload = {
    mobile: form.mobile?.value,
    otp: form.otp?.value,
    dob: form.dob?.value || null,
    pan: form.pan?.value || null
  };

  fetch("https://craftsman-resonant-asparagus.ngrok-free.dev/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {

    console.log("Verify Response:", data);

    if (data.status === "success") {

      // ✅ Success message
      globals.functions.setProperty(form.otp_status, {
        value: "OTP Verified Successfully"
      });

      // ✅ Enable next step / button
      globals.functions.setProperty(form.view_loan_eligibility, {
        enabled: true
      });

    } else {

      globals.functions.setProperty(form.otp_status, {
        value: data.message
      });

    }
  })
  .catch(err => {
    console.error(err);

    globals.functions.setProperty(form.otp_status, {
      value: "Verification Failed"
    });
  });
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer, calculateEMI, initSalaryBankUI, generateOtp, verifyOtp, 
};










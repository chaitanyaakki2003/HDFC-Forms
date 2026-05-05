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

  if (!panel || !radioGroup || panel.dataset.ready === "true") return;
  panel.dataset.ready = "true";

  const dropdownWrapper = panel.querySelector(".drop-down-wrapper");
  const dropdown = dropdownWrapper?.querySelector("select");

  const bankLogos = {
    hdfc_bank: "/content/dam/akki/hdfc.png",
    icici_bank: "/content/dam/akki/icici.png",
    axis_bank: "/content/dam/akki/axis.png",
    kotak_bank: "/content/dam/akki/kotak.png",
    sbi: "/content/dam/akki/sbi.png",
    bank_of_baroda: "/content/dam/akki/bob.jpeg",
    idfc_first_bank: "/content/dam/akki/idfc.png"
  };

  const container = document.createElement("div");
  container.className = "salary-bank-content-row";

  const cards = document.createElement("div");
  cards.className = "bank-card-container";

  container.appendChild(cards);

  if (dropdownWrapper) {
  dropdownWrapper.classList.remove("col-4");   // ❌ remove AEM grid
  dropdownWrapper.style.gridColumn = "unset";
  dropdownWrapper.style.width = "230px";
  dropdownWrapper.style.marginLeft = "auto";
  dropdownWrapper.style.flex = "0 0 230px";

  container.appendChild(dropdownWrapper);
}

  radioGroup.parentNode.insertBefore(container, radioGroup);
  radioGroup.style.display = "none";

  const radios = radioGroup.querySelectorAll("input[type='radio']");

  if (dropdown) dropdown.innerHTML = "";

  radios.forEach((radio) => {
    const value = radio.value.trim();
    const labelText = radio.nextElementSibling?.innerText || value;

    const imgSrc = bankLogos[value];

    const card = document.createElement("div");
    card.className = "bank-card";

    card.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" />` : ""}
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

    if (dropdown) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = labelText;
      dropdown.appendChild(option);
    }
  });

  if (dropdown) {
    const other = document.createElement("option");
    other.value = "other_bank";
    other.textContent = "Other Bank";
    dropdown.appendChild(other);
  }
}

/* AEM SAFE LOAD */
function waitForAEM() {
  const panel = document.querySelector(".field-salary-bank-selection");
  if (!panel) return setTimeout(waitForAEM, 300);
  initSalaryBankUI();
}

waitForAEM();

/**
 * Generate OTP API call
 * @param {scope} globals
 * @returns {string}
 */
function generateOtp(globals) {

  const form = globals.form;

  // ✅ YOUR PANEL
  const otpPanel = form.enter_otp_panel;

  // ✅ GET VALUES (CORRECT AEM WAY)
  const mobile =
    form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    form.personal_loan_offer.date_of_birth?.$value || "";

  const pan =
    form.personal_loan_offer.pan?.$value || "";

  console.log("📤 Generate Payload:", { mobile, dob, pan });

  // ✅ VALIDATION
  if (!mobile) {
    globals.functions.setProperty(otpPanel.otp_help_text, {
      value: "Mobile is required",
      visible: true
    });
    return "Mobile missing";
  }

  if (!dob && !pan) {
    globals.functions.setProperty(otpPanel.otp_help_text, {
      value: "Enter DOB or PAN",
      visible: true
    });
    return "DOB/PAN missing";
  }

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
    .then((res) => res.json())
    .then((response) => {

      console.log("✅ OTP Response:", response);

      // ✅ SHOW MESSAGE
      globals.functions.setProperty(otpPanel.otp_help_text, {
        value: response.message || "OTP Sent",
        visible: true
      });

      if (response.status === "success") {

        // ✅ SHOW OTP PANEL
        globals.functions.setProperty(otpPanel, {
          visible: true
        });

        // ✅ AUTO FILL OTP (TEST ONLY)
        if (response.otp) {
          globals.functions.setProperty(otpPanel.otp_code, {
            value: String(response.otp)
          });
        }

      }
    })
    .catch((error) => {

      console.error("❌ Generate OTP error:", error);

      globals.functions.setProperty(otpPanel.otp_help_text, {
        value: "OTP generation failed",
        visible: true
      });
    });

  return "OTP request sent";
}
 
/**
 * Verify OTP API call
 * @param {scope} globals
 * @returns {string}
 */
function verifyOtp(globals) {

  const form = globals.form;
  const otpPanel = form.enter_otp_panel;

  const mobile =
    form.personal_loan_offer.mobile_number?.$value || "";

  const otp =
    otpPanel.otp_code?.$value || "";

  const dob =
    form.personal_loan_offer.date_of_birth?.$value || null;

  const pan =
    form.personal_loan_offer.pan?.$value || null;

  console.log("📤 Verify Payload:", { mobile, otp, dob, pan });

  if (!mobile || !otp) {
    globals.functions.setProperty(otpPanel.otp_help_text, {
      value: "Enter OTP",
      visible: true
    });
    return "Missing OTP";
  }

  fetch("https://craftsman-resonant-asparagus.ngrok-free.dev/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mobile,
      otp,
      dob,
      pan
    })
  })
    .then(res => res.json())
    .then(response => {

      console.log("✅ Verify Response:", response);

      if (response.status === "success") {

        globals.functions.setProperty(otpPanel.success_msg, {
          value: "OTP Verified ✅",
          visible: true
        });

      } else {
        globals.functions.setProperty(otpPanel.otp_help_text, {
          value: "Invalid OTP",
          visible: true
        });
      }
    })
    .catch(err => {
      console.error("❌ Verify error:", err);
    });

  return "OTP verification triggered";
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer, calculateEMI, initSalaryBankUI, generateOtp, verifyOtp, 
};










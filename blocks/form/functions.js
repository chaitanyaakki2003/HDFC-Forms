// GLOBAL STATE (MANDATORY)
window.otpState = {
  attempts: 3,
  timer: null,
  timeLeft: 5
};

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
  const radioGroup = panel?.querySelector(
  ".radio-group-wrapper.field-salary-bank"
);

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
  // 🔥 completely detach from AEM layout
  dropdownWrapper.removeAttribute("class");

  dropdownWrapper.className = "drop-down-wrapper"; // reset clean class

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

// ✅ GLOBAL STATE (MANDATORY)
window.otpState = {
  attempts: 3,
  timer: null,
  timeLeft: 30
};

// ✅ GLOBAL STATE (MANDATORY)
window.otpState = {
  attempts: 3,
  timer: null,
  timeLeft: 30
};

/**
 * Generate OTP
 * @param {scope} globals
 */
function generateOtp(globals) {

  const mobile =
    globals.form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    globals.form.personal_loan_offer.date_of_birth?.$value || "";

  const pan =
    globals.form.personal_loan_offer.pan?.$value || "";

  if (!mobile) {
    globals.functions.setProperty(
      globals.form.enter_otp_panel.otp_help_text,
      { value: "Mobile is required", visible: true }
    );
    return;
  }

  if (!dob && !pan) {
    globals.functions.setProperty(
      globals.form.enter_otp_panel.otp_help_text,
      { value: "Enter DOB or PAN", visible: true }
    );
    return;
  }

  fetch("https://craftsman-resonant-asparagus.ngrok-free.dev/generate-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, dob, pan })
  })
  .then(res => res.json())
  .then(response => {

    globals.functions.setProperty(
      globals.form.enter_otp_panel.otp_help_text,
      { value: response.message || "OTP Sent", visible: true }
    );

    if (response.status === "success") {

      // ✅ ONLY FIRST TIME
      if (window.otpState.attempts === undefined) {
        window.otpState.attempts = 3;
      }

      globals.functions.setProperty(
        globals.form.enter_otp_panel,
        { visible: true }
      );

      if (response.otp) {
        globals.functions.setProperty(
          globals.form.enter_otp_panel.otp_code,
          { value: String(response.otp) }
        );
      }

      globals.functions.setProperty(
        globals.form.enter_otp_panel.attempts,
        {
          value: window.otpState.attempts + "/3 attempts left"
        }
      );

      globals.functions.setProperty(
        globals.form.enter_otp_panel.resend_otp,
        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }
      );

      startOtpTimer(globals);
    }
  });

  return "OTP generated";
}


/**
 * Verify OTP
 * @param {scope} globals
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

  // =========================
  // HIDE CUSTOMER DETAILS INITIALLY
  // =========================

  globals.functions.setProperty(
    form.customer_details,
    {
      visible: false
    }
  );

  if (!mobile || !otp) {

    globals.functions.setProperty(
      form.enter_otp_panel.otp_help_text,
      {
        value: "Enter OTP",
        visible: true
      }
    );

    return;
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

  .then(async (res) => {

    const response = await res.json();

    console.log("VERIFY RESPONSE:", response);

    // =========================
    // SUCCESS
    // =========================

    if (res.ok && response.status === "success") {

      // SHOW CUSTOMER DETAILS PANEL
      globals.functions.setProperty(
        form.customer_details,
        {
          visible: true
        }
      );

      // SUCCESS MESSAGE
      globals.functions.setProperty(
        form.enter_otp_panel.success_msg,
        {
          value: "OTP Verified",
          visible: true
        }
      );

      // FULL NAME
      globals.functions.setProperty(
        form.customer_details.full_name,
        {
          value: response.customer.fullName || "",
          visible: true,
          enabled: true
        }
      );

      // AADHAAR ADDRESS
      globals.functions.setProperty(
        form.customer_details.address_details.aadhaar_address,
        {
          value: response.customer.aadhaarAddress || "",
          visible: true,
          enabled: true
        }
      );

    }

    // =========================
    // INVALID OTP
    // =========================

    else {

      // HIDE CUSTOMER DETAILS PANEL
      globals.functions.setProperty(
        form.customer_details,
        {
          visible: false
        }
      );

      // CLEAR FULL NAME
      globals.functions.setProperty(
        form.customer_details.full_name,
        {
          value: ""
        }
      );

      // CLEAR ADDRESS
      globals.functions.setProperty(
        form.customer_details.address_details.aadhaar_address,
        {
          value: ""
        }
      );

      // REDUCE ATTEMPTS
      window.otpState.attempts--;

      globals.functions.setProperty(
        form.enter_otp_panel.attempts,
        {
          value:
            window.otpState.attempts + "/3 attempts left"
        }
      );

      // INVALID MESSAGE
      globals.functions.setProperty(
        form.enter_otp_panel.success_msg,
        {
          value: "Invalid OTP",
          visible: true
        }
      );
    }

  })

  .catch(err => {

    console.error("Verify error:", err);

    // HIDE PANEL ON ERROR
    globals.functions.setProperty(
      form.customer_details,
      {
        visible: false
      }
    );

  });

  return "OTP verification triggered";
}

/**
 * OTP TIMER
 * @param {scope} globals
 */
function startOtpTimer(globals) {

  window.otpState.timeLeft = 5;

  if (window.otpState.timer) {
    clearInterval(window.otpState.timer);
  }

  window.otpState.timer = setInterval(() => {

    window.otpState.timeLeft--;

    globals.functions.setProperty(
      globals.form.enter_otp_panel.resend_otp,
      {
        value: "Resend OTP in : " + window.otpState.timeLeft + " sec",
        enabled: false
      }
    );

    if (window.otpState.timeLeft <= 0) {

      clearInterval(window.otpState.timer);

      globals.functions.setProperty(
        globals.form.enter_otp_panel.resend_otp,
        {
          enabled: true,
          value: "Resend OTP"
        }
      );
    }

  }, 1000);
}


/**
 * Resend OTP
 * @param {scope} globals
 */
function resendOtp(globals) {

  if (window.otpState.attempts <= 0) {

    globals.functions.setProperty(
      globals.form.enter_otp_panel.success_msg,
      { value: "No attempts left", visible: true }
    );

    return;
  }

  // ✅ REDUCE ATTEMPTS FIRST
  window.otpState.attempts--;

  globals.functions.setProperty(
    globals.form.enter_otp_panel.attempts,
    {
      value: window.otpState.attempts + "/3 attempts left"
    }
  );

  // ✅ CALL API DIRECTLY (NOT generateOtp)
  fetch("https://craftsman-resonant-asparagus.ngrok-free.dev/generate-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile: globals.form.personal_loan_offer.mobile_number?.$value,
      dob: globals.form.personal_loan_offer.date_of_birth?.$value || null,
      pan: globals.form.personal_loan_offer.pan?.$value || null
    })
  })
  .then(res => res.json())
  .then(response => {

    if (response.status === "success") {

      if (response.otp) {
        globals.functions.setProperty(
          globals.form.enter_otp_panel.otp_code,
          { value: String(response.otp) }
        );
      }

      globals.functions.setProperty(
        globals.form.enter_otp_panel.resend_otp,
        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }
      );

      startOtpTimer(globals);
    }
  });

  return "Resend triggered";
}

/**
 * Review Details API Call
 * @param {scope} globals
 */
function getReviewDetails(globals) {

  const mobile =
    globals.form.personal_loan_offer.mobile_number?.$value || "";

  if (!mobile) {

    console.log("Mobile number missing");

    return;
  }

  fetch(
    "https://craftsman-resonant-asparagus.ngrok-free.dev/review-details",
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        mobile: mobile
      })

    }
  )

  .then(res => res.json())

  .then(response => {

    console.log("API RESPONSE:", response);

    if (response.status === "success") {

      const data = response.reviewDetails;

      /* =========================
         LOAN DETAILS
      ========================= */

      globals.form.review_details.loan_details.processing_fee.$value =
        data.processing_fee || "";

      globals.form.review_details.loan_details.schedule_of_charges.$value =
        data.schedule_of_charges || "";

      globals.form.review_details.loan_details.loan_number.$value =
        data.loan_number || "";

      /* =========================
         PERSONAL DETAILS
      ========================= */

      globals.form.review_details.personal_details.residence_type.$value =
        data.residence_type || "";

      /* =========================
         SALARY ACCOUNT DETAILS
      ========================= */

      globals.form.review_details.salary_account_details.salary_ac_number.$value =
        data.salary_ac_number || "";

      globals.form.review_details.salary_account_details.ifsc.$value =
        data.ifsc || "";

      globals.form.review_details.salary_account_details.bank_name.$value =
        data.bank_name || "";

      /* =========================
         OFFICE ADDRESS
      ========================= */

      globals.form.review_details.office_address.current_employer_address.$value =
        data.current_employer_address || "";

      /* =========================
         REFERENCE DETAILS
      ========================= */

      globals.form.review_details.reference_details.ref_name.$value =
        data.ref_name || "";

      console.log(
        "ALL REVIEW DETAILS FILLED SUCCESSFULLY"
      );

    }

  })

  .catch(error => {

    console.error(
      "Review Details API Error:",
      error
    );

  });

}

/**
 * Generate OTP Tier1
 * @param {scope} globals
 */
function generateOtpTier1(globals) {

  // INIT OTP STATE
  if (!window.otpStateTier1) {

    window.otpStateTier1 = {
      attempts: 3,
      timer: null,
      timeLeft: 5
    };

  }

  const mobile =
    globals.form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    globals.form.personal_loan_offer.date_of_birth?.$value || "";

  // VALIDATION
  if (!mobile) {

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "Mobile number is required",
        visible: true
      }

    );

    return;
  }

  if (!dob) {

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "Date of birth is required",
        visible: true
      }

    );

    return;
  }

  // API CALL
  fetch(
    "https://craftsman-resonant-asparagus.ngrok-free.dev/api/initiateCustomerIdentification",
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        requestString: {

          mobileNo: mobile,

          identifierValue: dob

        }

      })

    }
  )

  .then(res => res.json())

  .then(response => {

    console.log("GENERATE OTP RESPONSE:", response);

    if (
      response.status.responseCode === "0"
    ) {

      // SHOW OTP PANEL
      globals.functions.setProperty(

        globals.form.enter_otp_panel,

        {
          visible: true
        }

      );

      // SET OTP
      globals.functions.setProperty(

        globals.form.enter_otp_panel.otp_code,

        {
          value:
            response.responseString.otpValue || ""
        }

      );

      // ATTEMPTS
      globals.functions.setProperty(

        globals.form.enter_otp_panel.attempts,

        {
          value:
            window.otpStateTier1.attempts +
            "/3 attempts left"
        }

      );

      // SUCCESS MESSAGE
      globals.functions.setProperty(

        globals.form.enter_otp_panel.success_msg,

        {
          value: "OTP Sent Successfully",
          visible: true
        }

      );

      // DISABLE RESEND
      globals.functions.setProperty(

        globals.form.enter_otp_panel.resend_otp,

        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }

      );

      // START TIMER
      startOtpTimerTier1(globals);

    }

    else {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.success_msg,

        {
          value: "Failed to generate OTP",
          visible: true
        }

      );

    }

  })

  .catch(error => {

    console.error("Generate OTP Error:", error);

  });

}

/**
 * Verify OTP Tier1
 * @param {scope} globals
 */
function verifyOtpTier1(globals) {

  // KEEP SUBMIT BUTTON ENABLED
  globals.functions.setProperty(

    globals.form.enter_otp_panel.submit,

    {
      enabled: true
    }

  );

  const mobile =
    globals.form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    globals.form.personal_loan_offer.date_of_birth?.$value || "";

  const otp =
    globals.form.enter_otp_panel.otp_code?.$value || "";

  // VALIDATION
  if (!otp) {

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "Please enter OTP",
        visible: true
      }

    );

    return;
  }

  // API CALL
  fetch(
    "https://craftsman-resonant-asparagus.ngrok-free.dev/api/validateOtp",
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        requestString: {

          mobileNo: mobile,

          identifierValue: dob,

          otpValue: otp

        }

      })

    }
  )

  .then(res => res.json())

  .then(response => {

    console.log(
      "VERIFY OTP RESPONSE:",
      response
    );

    // KEEP BUTTON ENABLED AGAIN
    globals.functions.setProperty(

      globals.form.enter_otp_panel.submit,

      {
        enabled: true
      }

    );

    // SUCCESS
    if (
      response.status.responseCode === "0"
    ) {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.success_msg,

        {
          value: "OTP Verified Successfully",
          visible: true
        }

      );

    }

    // FAILED
    else {

      window.otpStateTier1.attempts--;

      globals.functions.setProperty(

        globals.form.enter_otp_panel.attempts,

        {
          value:
            window.otpStateTier1.attempts +
            "/3 attempts left"
        }

      );

      globals.functions.setProperty(

        globals.form.enter_otp_panel.success_msg,

        {
          value: "Invalid OTP",
          visible: true
        }

      );

    }

  })

  .catch(error => {

    console.error(
      "Verify OTP Error:",
      error
    );

    // KEEP ENABLED EVEN ON ERROR
    globals.functions.setProperty(

      globals.form.enter_otp_panel.submit,

      {
        enabled: true
      }

    );

  });

}

/**
 * OTP TIMER Tier1
 * @param {scope} globals
 */
function startOtpTimerTier1(globals) {

  window.otpStateTier1.timeLeft = 5;

  if (window.otpStateTier1.timer) {

    clearInterval(
      window.otpStateTier1.timer
    );

  }

  window.otpStateTier1.timer =
    setInterval(() => {

      window.otpStateTier1.timeLeft--;

      globals.functions.setProperty(

        globals.form.enter_otp_panel.resend_otp,

        {
          enabled: false,
          value:
            "Resend OTP in : " +
            window.otpStateTier1.timeLeft +
            " sec"
        }

      );

      if (
        window.otpStateTier1.timeLeft <= 0
      ) {

        clearInterval(
          window.otpStateTier1.timer
        );

        globals.functions.setProperty(

          globals.form.enter_otp_panel.resend_otp,

          {
            enabled: true,
            value: "Resend OTP"
          }

        );

      }

    }, 1000);
}

/**
 * Resend OTP Tier1
 * @param {scope} globals
 */
function resendOtpTier1(globals) {

  if (
    window.otpStateTier1.attempts <= 0
  ) {

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "No attempts left",
        visible: true
      }

    );

    return;
  }

  // REDUCE ATTEMPTS
  window.otpStateTier1.attempts--;

  globals.functions.setProperty(

    globals.form.enter_otp_panel.attempts,

    {
      value:
        window.otpStateTier1.attempts +
        "/3 attempts left"
    }

  );

  const mobile =
    globals.form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    globals.form.personal_loan_offer.date_of_birth?.$value || "";

  fetch(
    "https://craftsman-resonant-asparagus.ngrok-free.dev/api/initiateCustomerIdentification",
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        requestString: {

          mobileNo: mobile,

          identifierValue: dob

        }

      })

    }
  )

  .then(res => res.json())

  .then(response => {

    if (
      response.status.responseCode === "0"
    ) {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.otp_code,

        {
          value:
            response.responseString.otpValue || ""
        }

      );

      globals.functions.setProperty(

        globals.form.enter_otp_panel.resend_otp,

        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }

      );

      startOtpTimerTier1(globals);

    }

  })

  .catch(error => {

    console.error("Resend OTP Error:", error);

  });

}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, handleOtpFlow, updateLoanOffer, calculateEMI, initSalaryBankUI, generateOtp, verifyOtp, startOtpTimer,resendOtp, generateOtpTier1, verifyOtpTier1, startOtpTimerTier1, resendOtpTier1
};










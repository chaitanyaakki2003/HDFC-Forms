// GLOBAL STATE (MANDATORY)
window.otpState = {
  attempts: 3,
  timer: null,
  timeLeft: 5
};

window.otpStateTier1 = {
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
    // ✅ UPDATE REVIEW TENURE FIELD

const tenureField =
  globals.form.review_details
    ?.loan_details
    ?.tenure;

if (tenureField) {

  globals.functions.setProperty(
    tenureField,
    {
      value: String(tenure)
    }
  );
}
  } catch (e) {
    console.error("EMI ERROR:", e);
  }
}



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
    console.log("Mobile missing");
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

    if (response.status !== "success") {
      console.log("API failed");
      return;
    }

    const data = response.reviewDetails;

    /* =========================
   LOAN APPLICATION NUMBER
========================= */

globals.functions.setProperty(
  globals.form.thank_you.loan_application_number,
  {
    value: data.loan_number
  }
);


    /* =========================
       LOAN DETAILS
    ========================= */

    globals.functions.setProperty(
      globals.form.review_details.loan_details.processing_fee,
      {
        value: data.processing_fee || ""
      }
    );

    globals.functions.setProperty(
      globals.form.review_details.loan_details.schedule_of_charges,
      {
        value: data.schedule_of_charges || ""
      }
    );

    /* =========================
       PERSONAL DETAILS
    ========================= */

    globals.functions.setProperty(
      globals.form.review_details.personal_details.residence_type,
      {
        value: data.residence_type || ""
      }
    );

    /* =========================
       SALARY ACCOUNT DETAILS
    ========================= */

    globals.functions.setProperty(
      globals.form.review_details.salary_account_details.salary_ac_number,
      {
        value: data.salary_ac_number || ""
      }
    );

    globals.functions.setProperty(
      globals.form.review_details.salary_account_details.ifsc,
      {
        value: data.ifsc || ""
      }
    );

    globals.functions.setProperty(
      globals.form.review_details.salary_account_details.bank_name,
      {
        value: data.bank_name || ""
      }
    );

    /* =========================
       OFFICE ADDRESS
    ========================= */

    globals.functions.setProperty(
      globals.form.review_details.office_address.current_employer_address,
      {
        value: data.current_employer_address || ""
      }
    );

    /* =========================
       REFERENCE DETAILS
    ========================= */

    globals.functions.setProperty(
      globals.form.review_details.reference_details.ref_name,
      {
        value: data.ref_name || ""
      }
    );

    console.log("REVIEW DETAILS FILLED SUCCESSFULLY");

  })

  .catch(error => {

    console.error(
      "Review Details Error:",
      error
    );

  });

  return "Review details fetched";
}

/**
 * Generate OTP Tier1
 * @param {scope} globals
 */
function generateOtpTier1(globals) {

  const form = globals.form;

  // RESET STATE FIRST TIME
  window.otpStateTier1.attempts = 3;

  const mobile =
    form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    form.personal_loan_offer.date_of_birth?.$value || "";

  if (!mobile || !dob) {

    globals.functions.setProperty(
      form.enter_otp_panel.success_msg,
      {
        value: "Enter Mobile Number and DOB",
        visible: true
      }
    );

    return;
  }

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

    console.log("GENERATE OTP:", response);

    if (response.status.responseCode === "0") {

      // SHOW OTP PANEL
      globals.functions.setProperty(
        form.enter_otp_panel,
        {
          visible: true
        }
      );

      // SET OTP
      globals.functions.setProperty(
        form.enter_otp_panel.otp_code,
        {
          value: response.responseString.otpValue || ""
        }
      );

      // SUCCESS MESSAGE
      globals.functions.setProperty(
        form.enter_otp_panel.success_msg,
        {
          value: "OTP Sent Successfully",
          visible: true
        }
      );

      // ATTEMPTS
      globals.functions.setProperty(
        form.enter_otp_panel.attempts,
        {
          value:
            window.otpStateTier1.attempts +
            "/3 attempts left"
        }
      );

      // DISABLE RESEND
      globals.functions.setProperty(
        form.enter_otp_panel.resend_otp,
        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }
      );

      // ENABLE SUBMIT
      globals.functions.setProperty(
        form.enter_otp_panel.submit_otp,
        {
          enabled: true
        }
      );

      // START TIMER
      startOtpTimerTier1(globals);

    }

  })

  .catch(error => {

    console.error(
      "Generate OTP Error:",
      error
    );

  });

}
function verifyOtpTier1(globals) {

  const form = globals.form;

  const mobile =
    form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    form.personal_loan_offer.date_of_birth?.$value || "";

  const otp =
    form.enter_otp_panel.otp_code?.$value || "";

  // VALIDATION
  if (!otp) {

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "Please Enter OTP",
        visible: true
      }

    );

    globals.functions.setProperty(

      globals.form.enter_otp_panel.submit_otp,

      {
        enabled: true,
        visible: true
      }

    );

    return false;
  }

  // DISABLE DURING API CALL
  globals.functions.setProperty(

    globals.form.enter_otp_panel.submit_otp,

    {
      enabled: false,
      visible: true
    }

  );

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

  .then(function(res) {

    return res.json();

  })

  .then(function(response) {

    console.log("VERIFY RESPONSE:", response);

    // SUCCESS
    if (
      response.status &&
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

    // INVALID
    else {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.success_msg,

        {
          value: "Invalid OTP",
          visible: true
        }

      );

    }

    // VERY IMPORTANT
    // FORCE ENABLE AGAIN
    setTimeout(function() {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.submit_otp,

        {
          enabled: true,
          visible: true
        }

      );

    }, 300);

  })

  .catch(function(error) {

    console.error(
      "Verify OTP Error:",
      error
    );

    globals.functions.setProperty(

      globals.form.enter_otp_panel.success_msg,

      {
        value: "Server Error",
        visible: true
      }

    );

    // FORCE ENABLE AGAIN
    setTimeout(function() {

      globals.functions.setProperty(

        globals.form.enter_otp_panel.submit_otp,

        {
          enabled: true,
          visible: true
        }

      );

    }, 300);

  });

  return false;
}
/**
 * OTP TIMER Tier1
 * @param {scope} globals
 */
function startOtpTimerTier1(globals) {

  const form = globals.form;

  // RESET TIMER
  window.otpStateTier1.timeLeft = 5;

  // CLEAR OLD TIMER
  if (window.otpStateTier1.timer) {

    clearInterval(
      window.otpStateTier1.timer
    );

  }

  // DISABLE INITIALLY
  globals.functions.setProperty(
    form.enter_otp_panel.resend_otp,
    {
      enabled: false,
      visible: true,
      value: "Resend OTP in : 5 sec"
    }
  );

  // START TIMER
  window.otpStateTier1.timer =
    setInterval(() => {

      window.otpStateTier1.timeLeft--;

      // UPDATE TIMER TEXT
      globals.functions.setProperty(
        form.enter_otp_panel.resend_otp,
        {
          enabled: false,
          visible: true,
          value:
            "Resend OTP in : " +
            window.otpStateTier1.timeLeft +
            " sec"
        }
      );

      // TIMER COMPLETED
      if (
        window.otpStateTier1.timeLeft <= 0
      ) {

        clearInterval(
          window.otpStateTier1.timer
        );

        // IMPORTANT FIX
        setTimeout(() => {

          globals.functions.setProperty(
            form.enter_otp_panel.resend_otp,
            {
              enabled: true,
              visible: true,
              value: "Resend OTP"
            }
          );

        }, 200);

      }

    }, 1000);

}

/**
 * Resend OTP Tier1
 * @param {scope} globals
 */
function resendOtpTier1(globals) {

  const form = globals.form;

  // NO ATTEMPTS LEFT
  if (
    window.otpStateTier1.attempts <= 1
  ) {

    globals.functions.setProperty(
      form.enter_otp_panel.success_msg,
      {
        value: "No attempts left",
        visible: true
      }
    );

    globals.functions.setProperty(
      form.enter_otp_panel.resend_otp,
      {
        enabled: false
      }
    );

    globals.functions.setProperty(
      form.enter_otp_panel.submit_otp,
      {
        enabled: false
      }
    );

    return;
  }

  // REDUCE ATTEMPTS
  window.otpStateTier1.attempts--;

  globals.functions.setProperty(
    form.enter_otp_panel.attempts,
    {
      value:
        window.otpStateTier1.attempts +
        "/3 attempts left"
    }
  );

  const mobile =
    form.personal_loan_offer.mobile_number?.$value || "";

  const dob =
    form.personal_loan_offer.date_of_birth?.$value || "";

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

    console.log("RESEND RESPONSE:", response);

    if (
      response.status.responseCode === "0"
    ) {

      // UPDATE OTP FIELD
      globals.functions.setProperty(
        form.enter_otp_panel.otp_code,
        {
          value:
            response.responseString.otpValue || ""
        }
      );

      // SUCCESS MESSAGE
      globals.functions.setProperty(
        form.enter_otp_panel.success_msg,
        {
          value: "OTP Sent Successfully",
          visible: true
        }
      );

      // DISABLE RESEND AGAIN
      globals.functions.setProperty(
        form.enter_otp_panel.resend_otp,
        {
          enabled: false,
          value: "Resend OTP in : 5 sec"
        }
      );

      // RESTART TIMER
      startOtpTimerTier1(globals);
      // ENABLE SUBMIT AGAIN
globals.functions.setProperty(
  form.enter_otp_panel.submit_otp,
  {
    enabled: true
  }
);

    }

  })

  .catch(error => {

    console.error(
      "Resend OTP Error:",
      error
    );

  });

}

 /**
 * Fetch Review Details
 * @param {scope} globals
 */
function loadReviewDetails(globals) {

  const form = globals.form;

  /* =========================
     GET MOBILE NUMBER
  ========================= */

  const mobile =
    form.personal_loan_offer.mobile_number?.$value || '';

  console.log("MOBILE:", mobile);

  if (!mobile) {
    console.log("Mobile number missing");
    return;
  }

  /* =========================
     API CALL
  ========================= */

  fetch(
    "https://craftsman-resonant-asparagus.ngrok-free.dev/review-details",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        phone: mobile
      })
    }
  )

  .then((res) => res.json())

  .then((response) => {

    console.log("REVIEW DETAILS RESPONSE:", response);

    if (!response.success) {
      console.log("API FAILED");
      return;
    }

    const data = response.data;

    /* =========================================
       LOAN DETAILS
    ========================================= */

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.loan_details.processing_fee,
      {
        value: data.processingFees || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.loan_details.employer_name,
      {
        value: data.employerName || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.loan_details.schedule_of_charges,
      {
        value: data.scheduleOfCharges || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.loan_details.type_of_loan,
      {
        value: data.typeOfLoan || ""
      }
    );

    /* =========================================
       PERSONAL DETAILS
    ========================================= */

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.personal_details.full_name,
      {
        value: data.name || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.personal_details.mobile_number,
      {
        value: mobile || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.personal_details.pan,
      {
        value: data.pan || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.personal_details.current_address,
      {
        value: data.currentAddress || ""
      }
    );

    globals.functions.setProperty(
      form.review.form_fragment.form_accordion1776858819829.personal_details.residence_type,
      {
        value: data.residenceType || ""
      }
    );

    console.log("REVIEW DETAILS POPULATED SUCCESSFULLY");

  })

  .catch((error) => {

    console.error(
      "REVIEW DETAILS ERROR:",
      error
    );

  });

  return "Review Details Loaded";
}

/**
 * Generate Loan Application Number
 * @param {scope} globals
 */
function generateLoanApplicationNumber(globals) {

  try {

    /* =====================================
       GENERATE LOAN APPLICATION NUMBER
    ===================================== */

    const loanApplicationNumber =
      Math.floor(10000000 + Math.random() * 90000000);

    /* =====================================
       SET LOAN APPLICATION NUMBER
    ===================================== */

    if (
      globals.form
        ?.thank_you
        ?.loan_application_number
    ) {

      globals.functions.setProperty(

        globals.form.thank_you.loan_application_number,

        {
          value: String(loanApplicationNumber)
        }

      );

    }

    console.log(
      "LOAN APPLICATION NUMBER GENERATED:",
      loanApplicationNumber
    );

    return '';

  }

  catch (error) {

    console.error(
      'Error in generateLoanApplicationNumber:',
      error
    );

    return '';

  }

}


/* ---------------------------------bureaupage----------------------------------------------*/

/**
 * Returns bank logo based on value
 */
function getBankLogo(bank) {
    const logos = {
        hdfc_bank: '/content/dam/s_hdfc_capstone/hdfc.png',
        icici_bank: '/content/dam/s_hdfc_capstone/icici.png',
        axis_bank: '/content/dam/s_hdfc_capstone/axis.png',
        kotak: '/content/dam/s_hdfc_capstone/kotak.png',
        sbi: '/content/dam/s_hdfc_capstone/sbi.png',
        bank_of_baroda: '/content/dam/s_hdfc_capstone/bob.jpeg',
        idfc_first: '/content/dam/s_hdfc_capstone/idfc.png'
    };

    return logos[bank] || '';
}

/**
 * Create bank card
 */
function createBankItem(option, select) {

    const item = document.createElement('div');
    item.className = 'bank-item';
    item.dataset.value = option.value;

    item.innerHTML = `
        <img src="${getBankLogo(option.value)}" alt="${option.text}">
        <span>${option.text}</span>
    `;

    item.addEventListener('click', () => {
        updateActiveBank(item, select);
    });

    return item;
}

/**
 * Active selection
 */
function updateActiveBank(selectedItem, select) {

    document.querySelectorAll('.bank-item').forEach((el) => {
        el.classList.remove('active');
    });

    selectedItem.classList.add('active');

    select.value = selectedItem.dataset.value;

    select.dispatchEvent(new Event('change'));
}

/**
 * Initialize UI
 */
function initBankSelection() {

    const select = document.querySelector("select[name='salary_bank']");

    if (!select || select.dataset.initialized) return;

    select.dataset.initialized = 'true';

    /* hide original dropdown */
    select.style.display = 'none';

    const container = document.createElement('div');
    container.className = 'bank-container';

    const left = document.createElement('div');
    left.className = 'bank-left';

    const row = document.createElement('div');
    row.className = 'bank-row';

    const defaultValue = select.value || 'hdfc_bank';

    const defaultOption = Array.from(select.options)
        .find((o) => o.value === defaultValue);

    /* show default icon */
    const defaultItem = createBankItem(defaultOption, select);

    defaultItem.classList.add('active');

    row.appendChild(defaultItem);

    left.appendChild(row);

    /* dropdown */
    const dropdown = document.createElement('select');

    dropdown.className = 'bank-other-dropdown';

    const hdfcOpt = document.createElement('option');
    hdfcOpt.value = defaultOption.value;
    hdfcOpt.text = defaultOption.text;

    dropdown.appendChild(hdfcOpt);

    const otherOpt = document.createElement('option');
    otherOpt.value = 'other_bank';
    otherOpt.text = 'Other Bank';

    dropdown.appendChild(otherOpt);

    const right = document.createElement('div');
    right.className = 'bank-right';

    right.appendChild(dropdown);

    container.appendChild(left);
    container.appendChild(right);

    select.parentNode.appendChild(container);

    /* dropdown change */
    dropdown.addEventListener('change', () => {

        if (dropdown.value === 'other_bank') {

            row.innerHTML = '';

            Array.from(select.options).forEach((opt) => {

                if (!opt.value || opt.value === 'other_bank') return;

                const item = createBankItem(opt, select);

                row.appendChild(item);
            });

            dropdown.innerHTML = '';

            Array.from(select.options).forEach((opt) => {

                if (!opt.value || opt.value === 'other_bank') return;

                const option = document.createElement('option');

                option.value = opt.value;
                option.text = opt.text;

                dropdown.appendChild(option);
            });

        } else {

            select.value = dropdown.value;
        }
    });
}

/**
 * AEM render safe
 */
function observeBankField() {

    const observer = new MutationObserver(() => {

        if (document.querySelector("select[name='salary_bank']")) {
            initBankSelection();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

observeBankField();


// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, 
  maskMobileNumber, handleOtpFlow, updateLoanOffer, calculateEMI, 
  generateOtp, verifyOtp, startOtpTimer,resendOtp, generateOtpTier1,
   verifyOtpTier1, startOtpTimerTier1, resendOtpTier1, loadReviewDetails,
    getReviewDetails, generateLoanApplicationNumber, getBankLogo, 
    observeBankField, updateActiveBank, createBankItem, initBankSelection,
};








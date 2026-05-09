export function handleAccordionNavigation(panel, tab, forceOpen = false) {
  const accordionTabs = panel?.querySelectorAll(':scope > fieldset');
 
  accordionTabs.forEach((otherTab) => {
    if (otherTab !== tab) {
      otherTab.classList.add('accordion-collapse');
    }
  });
 
  if (forceOpen) {
    tab.classList.remove('accordion-collapse');
  } else {
    tab.classList.toggle('accordion-collapse');
  }
}
 
/* =========================================================
   ADD VERIFY BUTTON
========================================================= */
function addVerifyButton(panel) {
 
  const emailFields = panel.querySelectorAll(
    '.field-user-email-id, .field-work-email-id'
  );
 
  emailFields.forEach((emailField) => {
 
    const input = emailField.querySelector('input[type="email"]');
 
    if (!input) return;
 
    // prevent duplicate button
    if (emailField.querySelector('.email-verify-btn')) return;
 
    /* ===== VERIFY BUTTON ===== */
    const btn = document.createElement('button');
 
    btn.type = 'button';
    btn.className = 'email-verify-btn';
    btn.textContent = 'Verify';
 
    emailField.appendChild(btn);
 
    /* =========================================================
       SEND OTP
    ========================================================= */
    btn.addEventListener('click', async () => {
 
      const email = input.value.trim();
 
      // validate empty
      if (!email) {
 
        btn.textContent = 'Enter Email';
        btn.style.color = '#dc2626';
 
        return;
      }
 
      // validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
      if (!emailRegex.test(email)) {
 
        btn.textContent = 'Invalid Email';
        btn.style.color = '#dc2626';
 
        return;
      }
 
      try {
 
        btn.disabled = true;
        btn.textContent = 'Sending...';
 
const res = await fetch(
  'https://craftsman-resonant-asparagus.ngrok-free.dev/api/sendEmailOtp',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestString: {
        email: email
      }
    })
  }
);
 
        const data = await res.json();
 
        /* ===== SUCCESS ===== */
        if (data?.status?.responseCode === "0") {
 
  // store email
  emailField.setAttribute('data-email', email);
 
  // restore button
  btn.textContent = 'Verify';
  btn.style.color = '#5a78ff';
  btn.disabled = false;
 
  // show otp field + autofill otp
  showOtpField(
    emailField,
    input,
    data?.responseString?.otpValue || ''
  );
 
} else {
 
          btn.textContent = 'Failed';
          btn.style.color = '#dc2626';
          btn.disabled = false;
 
        }
 
      } catch (e) {
 
        console.error(e);
 
        btn.textContent = 'Error';
        btn.style.color = '#dc2626';
        btn.disabled = false;
 
      }
 
    });
 
  });
 
}
 
function showOtpField(emailField, input, serverOtp = '') {
 
  if (emailField.querySelector('.otp-container')) return;
 
  /* ===== OTP CONTAINER ===== */
  const container = document.createElement('div');
  container.className = 'otp-container';
 
  /* ===== OTP INPUT ===== */
  const otpInput = document.createElement('input');
 
  otpInput.type = 'text';
  otpInput.placeholder = 'Enter OTP';
  otpInput.className = 'otp-input';
 
  otpInput.setAttribute('autocomplete', 'off');
  otpInput.setAttribute('data-ignore', 'true');
  otpInput.setAttribute('data-aem-ignore', 'true');
 
  otpInput.setAttribute('inputmode', 'numeric');
  otpInput.setAttribute('maxlength', '6');
 
  /* ===== AUTO OTP ===== */
  if (serverOtp) {
    otpInput.value = serverOtp;
  }
 
  /* ===== VERIFY BUTTON ===== */
  const verifyBtn = document.createElement('button');
 
  verifyBtn.type = 'button';
  verifyBtn.className = 'otp-submit-btn';
  verifyBtn.textContent = 'Submit OTP';
 
  /* ===== APPEND ===== */
  container.appendChild(otpInput);
  container.appendChild(verifyBtn);
 
  emailField.appendChild(container);
 
  /* =====================================================
     VERIFY OTP
  ===================================================== */
  verifyBtn.addEventListener('click', async () => {
 
    const otp = otpInput.value.trim();
 
    const email =
      emailField.getAttribute('data-email');
 
    if (!otp) {
 
      verifyBtn.textContent = 'Enter OTP';
      verifyBtn.style.background = '#dc2626';
 
      return;
    }
 
    try {
 
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying...';
 
  const res = await fetch(
  'https://craftsman-resonant-asparagus.ngrok-free.dev/api/verifyEmailOtp',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestString: {
        email: email,
        otpValue: otp
      }
    })
  }
);
 
      const data = await res.json();
 
      /* =====================================================
         VERIFIED
      ===================================================== */
      if (data?.responseString?.otpValid === "Y") {
 
        /* IMPORTANT */
        emailField.setAttribute(
          'data-email-verified',
          'Y'
        );
 
        input.readOnly = true;
 
        const mainBtn =
          emailField.querySelector('.email-verify-btn');
 
        if (mainBtn) {
 
          mainBtn.textContent = 'Verified';
          mainBtn.style.color = 'green';
          mainBtn.disabled = true;
        }
 
        otpInput.disabled = true;
 
        verifyBtn.textContent = 'Verified';
        verifyBtn.style.background = '#16a34a';
 
      } else {
 
        verifyBtn.disabled = false;
 
        verifyBtn.textContent = 'Invalid OTP';
        verifyBtn.style.background = '#dc2626';
      }
 
    } catch (e) {
 
      console.error(e);
 
      verifyBtn.disabled = false;
 
      verifyBtn.textContent = 'Error';
      verifyBtn.style.background = '#dc2626';
    }
 
  });
 
}
 
/* =========================================================
   EMAIL SUGGESTIONS
========================================================= */
function addEmailSuggestions(panel) {
 
  const emailFields = panel.querySelectorAll('.field-user-email-id');
 
  emailFields.forEach((emailField) => {
 
    const wrapper = emailField.closest('.field-wrapper');
 
    const input = emailField.querySelector('input[type="email"]');
 
    if (!wrapper || !input) return;
 
    // prevent duplicate
    if (wrapper.querySelector('.email-suggestions-js')) return;
 
    /* ===== CONTAINER ===== */
    const container = document.createElement('div');
 
    container.className = 'email-suggestions-js';
 
    const domains = [
      '@gmail.com',
      '@outlook.com',
      '@yahoo.com'
    ];
 
    domains.forEach((domain) => {
 
      const chip = document.createElement('span');
 
      chip.textContent = domain;
 
      chip.addEventListener('click', () => {
 
        let value = input.value;
 
        if (value.includes('@')) {
          value = value.split('@')[0];
        }
 
        input.value = value + domain;
 
        input.focus();
 
      });
 
      container.appendChild(chip);
 
    });
 
    wrapper.appendChild(container);
 
  });
 
}
 
/* =========================================================
   MAIN
========================================================= */
export default function decorate(panel) {
 
  panel.classList.add('accordion');
 
  const accordionTabs = panel?.querySelectorAll(':scope > fieldset');
 
  accordionTabs?.forEach((tab, index) => {
 
    tab.dataset.index = index;
 
    const legend = tab.querySelector(':scope > legend');
 
    legend?.classList.add('accordion-legend');
 
    if (index !== 0) {
      tab.classList.add('accordion-collapse');
    }
 
    legend?.addEventListener('click', () => {
      handleAccordionNavigation(panel, tab);
    });
 
  });
 
  // wait for AEM render
  setTimeout(() => {
 
    addVerifyButton(panel);
    addEmailSuggestions(panel);
 
  }, 300);
 
  return panel;
 
}
 
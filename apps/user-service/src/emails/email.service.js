// Placeholder email transport. Replace the body of each function with a real
// provider call (SMTP/Resend/SendGrid/etc) later — keep the signatures the
// same so callers never need to change.

function logEmail(event, payload) {
  console.log(`[email.service] ${event}`, JSON.stringify(payload));
}

async function sendVerificationEmail({ to, firstName, token }) {
  logEmail('verification_email', {
    to,
    subject: 'Verify your email address',
    firstName,
    token,
  });
}

async function sendPasswordResetEmail({ to, firstName, token }) {
  logEmail('password_reset_email', {
    to,
    subject: 'Reset your password',
    firstName,
    token,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

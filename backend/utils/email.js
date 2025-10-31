const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

// Initialize Brevo Client
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// Brevo Email API Instance
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send Email using Brevo
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML Body
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const emailData = {
      to: [{ email: to }],
      sender: { email: process.env.EMAIL_SENDER },
      subject,
      htmlContent,
    };

    await emailApi.sendTransacEmail(emailData);

    console.log("✅ Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message || error);
    return false;
  }
};

module.exports = { sendEmail };

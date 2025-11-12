/**
 * Notification Service
 * Handles SMS and email notifications
 * Twilio integration for SMS (optional)
 */

interface SMSParams {
  to: string;
  message: string;
}

/**
 * Send SMS via Twilio
 * Sign up at https://www.twilio.com/ to get credentials
 */
export const sendSMS = async (params: SMSParams): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Twilio credentials not set, SMS sending disabled');
    console.log(`[MOCK SMS] To: ${params.to}, Message: ${params.message}`);
    return false;
  }

  try {
    // Uncomment when ready to use Twilio
    /*
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: params.message,
      from: fromNumber,
      to: params.to
    });
    
    console.log(`✅ SMS sent to ${params.to}`);
    */

    console.log(`[MOCK SMS] To: ${params.to}, Message: ${params.message}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
};

/**
 * Send alert notification to users
 */
export const sendAlertNotification = async (
  phoneNumber: string,
  alertTitle: string,
  severity: string
): Promise<boolean> => {
  const message = `🚨 ${severity.toUpperCase()} ALERT: ${alertTitle}. Check the Disaster Hub app for details.`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
};

/**
 * Send safety check notification
 */
export const sendSafetyCheckNotification = async (
  phoneNumber: string,
  userName: string
): Promise<boolean> => {
  const message = `Hi ${userName}, there's an emergency alert in your area. Please mark your status on the Disaster Hub app.`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
};

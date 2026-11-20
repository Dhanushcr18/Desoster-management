import axios from 'axios';
import env from '../config/env';
import Shipment from '../models/Shipment.model';

const REQUEST_TIMEOUT_MS = 8000;

interface SMSParams {
  to: string;
  message: string;
}

export interface AgentNotificationParams {
  shipment: Shipment;
  decision: 'REROUTE' | 'HOLD' | 'ESCALATE' | 'CONTINUE';
  explanation: string;
  driverMessage: string;
  extraMinutes: number;
  delayAvoidedMin: number;
}

/**
 * Send message via Telegram Bot API (Keyless fallback / optional)
 * Skips silently when TELEGRAM_BOT_TOKEN is not configured
 */
export const sendTelegramMessage = async (
  message: string,
  chatId?: string | null
): Promise<boolean> => {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || env.TELEGRAM_DEFAULT_CHAT_ID;

  if (!botToken || !targetChatId) {
    // Graceful skip
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(
      url,
      {
        chat_id: targetChatId,
        text: message,
        parse_mode: 'Markdown',
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );
    console.log(`✅ [Telegram] Message delivered to chat ${targetChatId}`);
    return true;
  } catch (err: any) {
    console.warn(`[Telegram] Delivery failed: ${err.message}`);
    return false;
  }
};

/**
 * Send SMS via Twilio (Optional)
 */
export const sendSMS = async (params: SMSParams): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  try {
    console.log(`[MOCK SMS] To: ${params.to}, Message: ${params.message}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
};

export const sendAlertNotification = async (
  phoneNumber: string,
  alertTitle: string,
  severity: string
): Promise<boolean> => {
  const message = `🚨 ${severity.toUpperCase()} ALERT: ${alertTitle}. Check the Disaster Hub app for details.`;
  return sendSMS({ to: phoneNumber, message });
};

export const sendSafetyCheckNotification = async (
  phoneNumber: string,
  userName: string
): Promise<boolean> => {
  const message = `Hi ${userName}, there's an emergency alert in your area. Please mark your status on the Disaster Hub app.`;
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Notify driver and admin on agent routing decisions
 */
export const notifyAgentDecision = async (params: AgentNotificationParams): Promise<void> => {
  const { shipment, decision, explanation, driverMessage, extraMinutes, delayAvoidedMin } = params;

  // Log decision clearly
  console.log(`📢 [NOTIFY] [${decision}] Shipment ${shipment.code}: ${driverMessage}`);

  // Build Telegram payload
  const telegramText =
    `*🚨 Supply Resilience Agent Action: ${decision}*\n\n` +
    `*Truck:* \`${shipment.code}\`\n` +
    `*Cargo:* ${shipment.cargoType.toUpperCase()} (${shipment.priority})\n` +
    `*Driver Instruction:* ${driverMessage}\n\n` +
    `*Reasoning:* ${explanation}\n` +
    `*Estimated Delay Avoided:* ${(delayAvoidedMin / 60).toFixed(1)} hrs\n` +
    `*Detour Added:* +${extraMinutes} mins\n\n` +
    `_Live tracker: /driver/${shipment.code}_`;

  await sendTelegramMessage(telegramText, shipment.telegramChatId);
};

export default {
  sendSMS,
  sendAlertNotification,
  sendSafetyCheckNotification,
  sendTelegramMessage,
  notifyAgentDecision,
};

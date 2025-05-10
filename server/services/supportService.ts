/**
 * Support service for handling support messages from users
 */

// This would typically use an email service like SendGrid, but we'll
// use a simpler implementation for now
export interface SupportMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send a support message
 * @param data - Support message data
 * @returns Success status
 */
export async function sendSupportMessage(data: SupportMessage): Promise<boolean> {
  try {
    // Log the message for demonstration
    console.log('Support message received:', data);
    
    // Here you would typically send an email using SendGrid or similar service
    // For example:
    // await sendEmail(process.env.SENDGRID_API_KEY, {
    //   to: 'support@ewasl.com',
    //   from: 'noreply@ewasl.com',
    //   subject: `Support Request: ${data.subject}`,
    //   text: `From: ${data.name} (${data.email})\n\n${data.message}`,
    //   html: `<p><strong>From:</strong> ${data.name} (${data.email})</p><p>${data.message}</p>`,
    // });
    
    // For now, we'll simulate a successful send
    return true;
  } catch (error) {
    console.error('Support message error:', error);
    return false;
  }
}
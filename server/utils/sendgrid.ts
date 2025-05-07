import { MailService } from '@sendgrid/mail';

// Initialize SendGrid mail service - placeholder for API key
const mailService = new MailService();
let sendgridApiKeySet = false;

/**
 * Initialize SendGrid API with the provided key
 * This function should be called when the API key is available
 */
export function initializeSendGrid(apiKey: string): void {
  try {
    mailService.setApiKey(apiKey);
    sendgridApiKeySet = true;
    console.log('SendGrid API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SendGrid API:', error);
    sendgridApiKeySet = false;
  }
}

// Try to initialize with environment variable if available
try {
  if (process.env.SENDGRID_API_KEY) {
    initializeSendGrid(process.env.SENDGRID_API_KEY);
  } else {
    console.log('SendGrid API key not found in environment variables. Email functionality will be limited.');
  }
} catch (error) {
  console.error('Error initializing SendGrid:', error);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * @returns A promise that resolves to a success boolean and a message
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
  // Check if SendGrid is initialized
  if (!sendgridApiKeySet) {
    console.warn('SendGrid API key not set. Would have sent the following email:', params);
    return { 
      success: false, 
      message: 'SendGrid API key not configured. Email sharing is not available.' 
    };
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return { 
      success: false, 
      message: 'Failed to send email. Please try again later.' 
    };
  }
}

/**
 * Send an event invitation email
 */
export async function sendEventInvitation({
  to,
  from,
  eventName,
  eventDate,
  eventLocation,
  eventUrl,
  personalMessage,
}: {
  to: string;
  from: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventUrl: string;
  personalMessage?: string;
}): Promise<{ success: boolean; message: string }> {
  const subject = `Invitation: ${eventName}`;
  
  const text = `
    You've been invited to ${eventName}
    
    Event Details:
    Date: ${eventDate}
    Location: ${eventLocation}
    
    ${personalMessage ? `Message: ${personalMessage}\n\n` : ''}
    
    View the event here: ${eventUrl}
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">You've been invited to an event!</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #4f46e5; margin-top: 0;">${eventName}</h2>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${eventLocation}</p>
        </div>
        
        ${personalMessage ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">${personalMessage}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${eventUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Event Details</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          This invitation was sent via Flypside, the premier platform for business event management.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    from,
    subject,
    text,
    html
  });
}
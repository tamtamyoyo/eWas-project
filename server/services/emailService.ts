import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key from environment variables
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not defined');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Common email types
export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface PasswordResetOptions {
  email: string;
  resetToken: string;
  resetUrl: string;
  expiresInHours: number;
}

export interface TeamInvitationOptions {
  email: string;
  invitedBy: string;
  teamName?: string;
  inviteToken: string;
  inviteUrl: string;
  role: string;
  expiresInHours: number;
}

class EmailService {
  private async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY is not defined');
      return false;
    }

    try {
      const msg = {
        to: emailData.to,
        from: 'notifications@ewasl.com', // Change to your verified sender
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      await sgMail.send(msg);
      console.log(`Email sent to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(options: PasswordResetOptions): Promise<boolean> {
    const subject = 'إعادة تعيين كلمة المرور - وصل';
    
    const text = `
      مرحبًا،
      
      لقد تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك على منصة وصل.
      
      الرجاء النقر على الرابط التالي لإعادة تعيين كلمة المرور:
      ${options.resetUrl}
      
      هذا الرابط سينتهي صلاحيته خلال ${options.expiresInHours} ساعة.
      
      إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.
      
      مع تحيات،
      فريق وصل
    `;

    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:
      600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">وصل</h1>
          <p style="color: #6B7280; margin-top: 5px;">منصة إدارة وسائل التواصل الاجتماعي</p>
        </div>
        
        <div style="background-color: #F9FAFB; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1F2937; margin-top: 0; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
          
          <p style="color: #4B5563; line-height: 1.6;">مرحبًا،</p>
          
          <p style="color: #4B5563; line-height: 1.6;">لقد تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك على منصة وصل.</p>
          
          <p style="color: #4B5563; line-height: 1.6;">الرجاء النقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${options.resetUrl}" style="background-color: #8B5CF6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">إعادة تعيين كلمة المرور</a>
          </div>
          
          <p style="color: #4B5563; line-height: 1.6;">أو يمكنك نسخ ولصق الرابط التالي في متصفحك:</p>
          
          <p style="background-color: #E5E7EB; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${options.resetUrl}</p>
          
          <p style="color: #4B5563; line-height: 1.6;">هذا الرابط سينتهي صلاحيته خلال <strong>${options.expiresInHours} ساعة</strong>.</p>
          
          <p style="color: #4B5563; line-height: 1.6;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px;">
          <p>&copy; 2025 وصل. كل الحقوق محفوظة.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: options.email,
      subject,
      text,
      html,
    });
  }

  async sendTeamInvitationEmail(options: TeamInvitationOptions): Promise<boolean> {
    const subject = 'دعوة للانضمام إلى فريق على منصة وصل';
    
    const text = `
      مرحبًا،
      
      لقد تمت دعوتك من قبل ${options.invitedBy} للانضمام إلى فريق على منصة وصل بدور ${options.role}.
      
      الرجاء النقر على الرابط التالي لقبول الدعوة:
      ${options.inviteUrl}
      
      هذه الدعوة ستنتهي صلاحيتها خلال ${options.expiresInHours} ساعة.
      
      مع تحيات،
      فريق وصل
    `;

    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">وصل</h1>
          <p style="color: #6B7280; margin-top: 5px;">منصة إدارة وسائل التواصل الاجتماعي</p>
        </div>
        
        <div style="background-color: #F9FAFB; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1F2937; margin-top: 0; margin-bottom: 20px;">دعوة للانضمام إلى فريق</h2>
          
          <p style="color: #4B5563; line-height: 1.6;">مرحبًا،</p>
          
          <p style="color: #4B5563; line-height: 1.6;">لقد تمت دعوتك من قبل <strong>${options.invitedBy}</strong> للانضمام إلى فريق على منصة وصل بدور <strong>${options.role}</strong>.</p>
          
          <p style="color: #4B5563; line-height: 1.6;">الرجاء النقر على الزر أدناه لقبول الدعوة:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${options.inviteUrl}" style="background-color: #8B5CF6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">قبول الدعوة</a>
          </div>
          
          <p style="color: #4B5563; line-height: 1.6;">أو يمكنك نسخ ولصق الرابط التالي في متصفحك:</p>
          
          <p style="background-color: #E5E7EB; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${options.inviteUrl}</p>
          
          <p style="color: #4B5563; line-height: 1.6;">هذه الدعوة ستنتهي صلاحيتها خلال <strong>${options.expiresInHours} ساعة</strong>.</p>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px;">
          <p>&copy; 2025 وصل. كل الحقوق محفوظة.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: options.email,
      subject,
      text,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'مرحبًا بك في وصل!';
    
    const text = `
      مرحبًا ${name}،
      
      نشكرك على التسجيل في منصة وصل لإدارة وسائل التواصل الاجتماعي.
      
      يمكنك الآن البدء في ربط حساباتك وإدارة محتواك من مكان واحد.
      
      مع تحيات،
      فريق وصل
    `;

    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">وصل</h1>
          <p style="color: #6B7280; margin-top: 5px;">منصة إدارة وسائل التواصل الاجتماعي</p>
        </div>
        
        <div style="background-color: #F9FAFB; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1F2937; margin-top: 0; margin-bottom: 20px;">مرحبًا بك في وصل!</h2>
          
          <p style="color: #4B5563; line-height: 1.6;">مرحبًا ${name}،</p>
          
          <p style="color: #4B5563; line-height: 1.6;">نشكرك على التسجيل في منصة وصل لإدارة وسائل التواصل الاجتماعي.</p>
          
          <p style="color: #4B5563; line-height: 1.6;">مع وصل، يمكنك:</p>
          
          <ul style="color: #4B5563; line-height: 1.6;">
            <li>ربط حسابات التواصل الاجتماعي المختلفة في مكان واحد</li>
            <li>إنشاء وجدولة المحتوى لجميع منصاتك</li>
            <li>تحليل أداء منشوراتك وحساباتك</li>
            <li>التعاون مع فريقك لإدارة محتواك بكفاءة</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.ewasl.com" style="background-color: #8B5CF6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">الدخول إلى حسابك</a>
          </div>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px;">
          <p>&copy; 2025 وصل. كل الحقوق محفوظة.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendGridService {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
  }

  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const msg = {
      to,
      from: this.configService.get('SENDGRID_SENDER'),
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
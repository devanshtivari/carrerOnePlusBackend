import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Brevo transactional-email payload as documented at
 * https://developers.brevo.com/reference/sendtransacemail. We only model the
 * fields the app actually sends — inline HTML content + a sender/recipient
 * pair — which matches the working `curl` recipe:
 *
 *   curl -X POST https://api.brevo.com/v3/smtp/email
 *        -H 'accept: application/json'
 *        -H 'api-key: xkeysib-…'
 *        -H 'content-type: application/json'
 *        -d '{ "sender":{"name":"…","email":"…"},
 *              "to":[{"email":"…","name":"…"}],
 *              "subject":"…",
 *              "htmlContent":"…" }'
 *
 * Templates were intentionally removed: every production call-site builds its
 * own HTML so we have zero dependency on template IDs (which frequently don't
 * exist in fresh Brevo accounts and were the root cause of silent failures).
 */
interface BrevoSendPayload {
  sender: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}

interface BrevoSuccessResponse {
  messageId?: string;
  messageIds?: string[];
}

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly requestTimeoutMs = 15_000;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.configService.get<string>('brevo.apiKey');
    const fromEmail = this.configService.get<string>('brevo.fromEmail');
    const fromName = this.configService.get<string>('brevo.fromName');

    if (!apiKey) {
      this.logger.error(
        'BREVO_API_KEY is not set — outgoing emails will be skipped.',
      );
      return;
    }
    if (!apiKey.startsWith('xkeysib-')) {
      this.logger.warn(
        'BREVO_API_KEY does not start with "xkeysib-"; Brevo v3 API keys typically do. Verify the key in the Brevo dashboard.',
      );
    }
    if (!fromEmail) {
      this.logger.error(
        'BREVO_FROM_EMAIL is not set — Brevo will reject requests with no sender.',
      );
    }
    this.logger.log(
      `Brevo mailer ready (from="${fromName ?? ''} <${fromEmail ?? 'UNSET'}>"). Ensure the sender domain is authenticated in Brevo.`,
    );
  }

  private buildSender(): { email: string; name?: string } {
    const email = this.configService.get<string>('brevo.fromEmail') as string;
    const name = this.configService.get<string>('brevo.fromName') || undefined;
    return name ? { email, name } : { email };
  }

  private appName(): string {
    return this.configService.get<string>('app.name') || 'CareerOne Academy';
  }

  private frontendUrl(): string {
    return (
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:3000'
    );
  }

  private wrapHtml(title: string, bodyHtml: string): string {
    // Keep the template minimal and email-client-safe — inline styles only,
    // no external CSS, no images that depend on the user's auth session.
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0B0B0F;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#F2F2F2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#15151B;border:1px solid #26262E;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#A1A1AA;font-weight:700;">
                  ${this.appName()}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px 28px;font-size:15px;line-height:1.6;color:#E5E5EA;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <div style="height:1px;background:#26262E;margin:4px 0 18px 0;"></div>
                <div style="font-size:12px;color:#A1A1AA;line-height:1.6;">
                  You received this email because it was requested from your
                  ${this.appName()} account. If this wasn't you, you can safely
                  ignore it.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private toPlainText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private async sendEmail(
    payload: BrevoSendPayload,
    context: string,
  ): Promise<BrevoSuccessResponse | null> {
    const apiKey = this.configService.get<string>('brevo.apiKey');
    if (!apiKey) {
      this.logger.error(
        `[${context}] Aborted: BREVO_API_KEY is missing. to=${JSON.stringify(payload.to)}`,
      );
      return null;
    }

    if (!payload.sender?.email) {
      this.logger.error(
        `[${context}] Aborted: sender.email is empty. Set BREVO_FROM_EMAIL.`,
      );
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const rawBody = await response.text();
      let parsed: BrevoSuccessResponse & { code?: string; message?: string } =
        {};
      try {
        parsed = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        parsed = {};
      }

      if (!response.ok) {
        this.logger.error(
          `[${context}] Brevo API error ${response.status} ${response.statusText}: ${rawBody || '<empty body>'} | to=${JSON.stringify(payload.to)} sender=${JSON.stringify(payload.sender)}`,
        );
        return null;
      }

      const messageId =
        parsed.messageId ??
        (parsed.messageIds ? parsed.messageIds[0] : undefined);
      this.logger.log(
        `[${context}] Brevo accepted email (${response.status}) messageId=${messageId ?? 'n/a'} to=${payload.to
          .map((t) => t.email)
          .join(',')}`,
      );
      return parsed;
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') {
        this.logger.error(
          `[${context}] Brevo request aborted after ${this.requestTimeoutMs}ms. Check network/firewall access to api.brevo.com.`,
        );
      } else {
        this.logger.error(
          `[${context}] Unexpected error calling Brevo: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async sendVerificationEmail(
    to: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    const subject = `Verify your ${this.appName()} account`;
    const html = this.wrapHtml(
      subject,
      `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#FFFFFF;">Hi ${fullName.split(' ')[0] || 'there'},</h1>
        <p style="margin:0 0 18px 0;">Welcome to ${this.appName()}! Use the verification code below to confirm your email address.</p>
        <div style="margin:20px 0;padding:18px 20px;background:#0B0B0F;border:1px solid #26262E;border-radius:12px;text-align:center;">
          <div style="font-size:32px;letter-spacing:0.18em;font-weight:800;color:#FFFFFF;">${otp}</div>
          <div style="margin-top:6px;font-size:12px;color:#A1A1AA;">Expires in 10 minutes</div>
        </div>
        <p style="margin:0;color:#A1A1AA;">If you didn't create an account, you can safely ignore this email.</p>
      `,
    );

    await this.sendEmail(
      {
        sender: this.buildSender(),
        to: [{ email: to, name: fullName }],
        subject,
        htmlContent: html,
        textContent: this.toPlainText(html),
        tags: ['verify-email'],
      },
      `verifyEmail:${to}`,
    );
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    const subject = `Reset your ${this.appName()} password`;
    const html = this.wrapHtml(
      subject,
      `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#FFFFFF;">Hi ${fullName.split(' ')[0] || 'there'},</h1>
        <p style="margin:0 0 18px 0;">We received a request to reset the password on your ${this.appName()} account. Enter the code below to continue.</p>
        <div style="margin:20px 0;padding:18px 20px;background:#0B0B0F;border:1px solid #26262E;border-radius:12px;text-align:center;">
          <div style="font-size:32px;letter-spacing:0.18em;font-weight:800;color:#FFFFFF;">${otp}</div>
          <div style="margin-top:6px;font-size:12px;color:#A1A1AA;">Expires in 10 minutes</div>
        </div>
        <p style="margin:0;color:#A1A1AA;">If you didn't request a reset, no changes have been made — you can ignore this email.</p>
      `,
    );

    await this.sendEmail(
      {
        sender: this.buildSender(),
        to: [{ email: to, name: fullName }],
        subject,
        htmlContent: html,
        textContent: this.toPlainText(html),
        tags: ['password-reset'],
      },
      `passwordReset:${to}`,
    );
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    const subject = `Welcome to ${this.appName()}!`;
    const url = this.frontendUrl();
    const html = this.wrapHtml(
      subject,
      `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#FFFFFF;">Welcome, ${fullName.split(' ')[0] || 'friend'} 👋</h1>
        <p style="margin:0 0 14px 0;">Your ${this.appName()} account is ready. You can head to your dashboard to start exploring courses, track progress, and take tests.</p>
        <p style="margin:22px 0;">
          <a href="${url}" style="display:inline-block;padding:12px 20px;background:#FFFFFF;color:#000000;border-radius:10px;font-weight:700;text-decoration:none;">Open dashboard →</a>
        </p>
        <p style="margin:0;color:#A1A1AA;">Tip: complete your profile and pick your first course to unlock your personalised learning path.</p>
      `,
    );

    await this.sendEmail(
      {
        sender: this.buildSender(),
        to: [{ email: to, name: fullName }],
        subject,
        htmlContent: html,
        textContent: this.toPlainText(html),
        tags: ['welcome'],
      },
      `welcome:${to}`,
    );
  }

  async sendPasswordChangedEmail(
    to: string,
    fullName: string,
    ip: string,
  ): Promise<void> {
    const subject = `Your ${this.appName()} password was changed`;
    const when = new Date().toUTCString();
    const html = this.wrapHtml(
      subject,
      `
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#FFFFFF;">Hi ${fullName.split(' ')[0] || 'there'},</h1>
        <p style="margin:0 0 14px 0;">This is a quick confirmation that your ${this.appName()} account password was successfully changed.</p>
        <ul style="margin:0 0 18px 18px;padding:0;color:#A1A1AA;">
          <li>When: ${when}</li>
          <li>From IP: ${ip || 'unknown'}</li>
        </ul>
        <p style="margin:0;color:#A1A1AA;">If you didn't make this change, please reset your password immediately and contact support.</p>
      `,
    );

    await this.sendEmail(
      {
        sender: this.buildSender(),
        to: [{ email: to, name: fullName }],
        subject,
        htmlContent: html,
        textContent: this.toPlainText(html),
        tags: ['password-changed'],
      },
      `passwordChanged:${to}`,
    );
  }
}

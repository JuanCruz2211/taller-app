import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@tallerapp.com";

export async function sendVerificationEmail(params: {
  email: string;
  name: string;
  url: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping verification email");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject: "Verificá tu email — Taller App",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 1.5rem; color: #1e3a5f;">Verificá tu email</h1>
        <p style="color: #374151;">Hola <strong>${params.name}</strong>,</p>
        <p style="color: #374151;">
          Hacé clic en el botón de abajo para verificar tu dirección de email
          y activar tu cuenta en Taller App.
        </p>
        <a
          href="${params.url}"
          style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          "
        >
          Verificar email
        </a>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Si no solicitaste esto, ignorá este mensaje.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Error sending verification email:", error);
  }
}

export async function sendResetPasswordEmail(params: {
  email: string;
  name: string;
  url: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset email");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject: "Restablecé tu contraseña — Taller App",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 1.5rem; color: #1e3a5f;">Restablecer contraseña</h1>
        <p style="color: #374151;">Hola <strong>${params.name}</strong>,</p>
        <p style="color: #374151;">
          Recibimos una solicitud para restablecer tu contraseña.
          Hacé clic en el botón de abajo para crear una nueva.
        </p>
        <a
          href="${params.url}"
          style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          "
        >
          Restablecer contraseña
        </a>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Si no solicitaste esto, ignorá este mensaje.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Error sending password reset email:", error);
  }
}

import { Resend } from "resend";

interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM_DOMAIN: string;
}

type SendBody = {
  name?: string;
  fromLocal?: string;
  to?: string;
  subject?: string;
  html?: string;
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sanitizeLocalPart(input: string) {
  return input.trim().replace(/\s+/g, "").replace(/@/g, "");
}

async function parseJsonBody(req: Request): Promise<SendBody | null> {
  const data = await req.json().catch(() => null);
  if (!data || typeof data !== "object") {
    return null;
  }

  return data as SendBody;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/from-domain" && req.method === "GET") {
      return json({ ok: true, fromDomain: env.RESEND_FROM_DOMAIN }, 200);
    }

    if (url.pathname === "/api/send" && req.method === "POST") {
      const body = await parseJsonBody(req);
      if (!body) {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
      }

      const name = body.name?.trim() ?? "";
      const fromLocal = sanitizeLocalPart(body.fromLocal ?? "");
      const to = body.to?.trim() ?? "";
      const subject = body.subject?.trim() ?? "";
      const html = body.html ?? "";

      if (!name || !fromLocal || !to || !subject || !html) {
        return json(
          {
            ok: false,
            error: "Fields required: name, fromLocal, to, subject, html",
          },
          400,
        );
      }

      const from = `${name} <${fromLocal}@${env.RESEND_FROM_DOMAIN}>`;
      const resend = new Resend(env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        return json(
          {
            ok: false,
            error: error.message,
            details: error,
          },
          502,
        );
      }

      return json({ ok: true, data }, 200);
    }

    return new Response("Not Found", { status: 404 });
  },
};

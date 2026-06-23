import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";

// Clerk -> our DB sync. Configure this URL as a webhook endpoint in the Clerk
// Dashboard and set CLERK_WEBHOOK_SIGNING_SECRET. verifyWebhook() validates the
// Svix signature for us and returns the typed event.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        return new Response("No email address on user", { status: 400 });
      }

      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email: primaryEmail, name },
        create: { clerkId: id, email: primaryEmail, name },
      });
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      if (id) {
        await prisma.user.deleteMany({ where: { clerkId: id } });
      }
      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
}

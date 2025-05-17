import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
// Remove unused Id import

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request: Request) => { // Add explicit Request type
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
        }

        // Header validation
        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("Missing svix headers", { status: 400 });
        }

        // Webhook verification
        const payload = await request.json();
        const body = JSON.stringify(payload);
        const wh = new Webhook(webhookSecret);

        try {
            const evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;

            // User event handling
            if (evt.type === "user.created" || evt.type === "user.updated") {
                const { id, first_name, last_name, image_url, email_addresses } = evt.data;
                const email = email_addresses[0]?.email_address;
                const name = `${first_name || ""} ${last_name || ""}`.trim();

                if (!email) throw new Error("Missing email address");

                // Type-safe mutation call
                await ctx.runMutation(
                    evt.type === "user.created" ? api.users.syncUser : api.users.updateUser,
                    {
                        clerkId: id,
                        email,
                        name,
                        image: image_url,
                    }
                );
            }

            return new Response("Webhook processed", { status: 200 });
        } catch (error) {
            console.error("Webhook error:", error);
            return new Response("Invalid webhook", { status: 400 });
        }
    }),
});

export default http;
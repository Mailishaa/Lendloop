import { httpActionGeneric, httpRouter, makeFunctionReference, type FunctionReference } from "convex/server";
import { isValidWebhookRequest } from "./lib/hmac";

const listOverdueRef = makeFunctionReference<
  "query",
  Record<string, unknown>
>("loans:listOverdueForReminders") as unknown as FunctionReference<
  "query",
  "internal",
  Record<string, unknown>,
  unknown
>;
const recordRef = makeFunctionReference<
  "mutation",
  { key: string; loanId: string; status: string; detail?: string }
>("reminders:record") as unknown as FunctionReference<
  "mutation",
  "internal",
  { key: string; loanId: string; status: string; detail?: string },
  unknown
>;

const http = httpRouter();

http.route({
  method: "GET",
  path: "/n8n/overdue-loans",
  handler: httpActionGeneric(async (ctx, request) => {
    const secret = process.env.HMAC_SECRET ?? "";
    const valid = await isValidWebhookRequest(request, secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const loans = await ctx.runQuery(listOverdueRef, {});
    return new Response(JSON.stringify(loans), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  method: "POST",
  path: "/n8n/reminder-result",
  handler: httpActionGeneric(async (ctx, request) => {
    const secret = process.env.HMAC_SECRET ?? "";
    const valid = await isValidWebhookRequest(request, secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = (await request.json()) as {
      key: string;
      loanId: string;
      status: string;
      detail?: string;
    };
    const result = await ctx.runMutation(recordRef, {
      key: body.key,
      loanId: body.loanId,
      status: body.status,
      detail: body.detail,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;

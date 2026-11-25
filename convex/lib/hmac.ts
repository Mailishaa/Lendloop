const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha512(secret: string, data: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(data));
}

export async function sign(rawBody: string, secret: string): Promise<string> {
  const signature = await hmacSha512(secret, rawBody);
  return toHex(signature);
}

export async function verify(
  rawBody: string,
  secret: string,
  signature: string,
): Promise<boolean> {
  const expectedBytes = await hmacSha512(secret, rawBody);
  const expectedHex = toHex(expectedBytes);
  const expectedChars = encoder.encode(expectedHex);
  const signatureChars = encoder.encode(signature);
  if (expectedChars.length !== signatureChars.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expectedChars.length; i++) {
    diff |= expectedChars[i] === signatureChars[i] ? 0 : 1;
  }
  return diff === 0;
}

export async function isValidWebhookRequest(
  request: Request,
  secret: string,
): Promise<boolean> {
  const timestamp = request.headers.get("X-LendLoop-Timestamp");
  const signature = request.headers.get("X-LendLoop-Signature");
  if (!timestamp || !signature) {
    return false;
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > 300) {
    return false;
  }
  const rawBody = await request.text();
  return verify(rawBody, secret, signature);
}

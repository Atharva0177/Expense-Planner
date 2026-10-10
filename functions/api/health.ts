export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok", environment: "Cloudflare Pages" }), {
    headers: { "Content-Type": "application/json" }
  });
}
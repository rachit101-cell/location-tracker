// api/locations.js
// GET  /api/locations  → return all entries newest-first
// DELETE /api/locations → wipe all entries

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const HEADERS = {
  "apikey":         SUPABASE_ANON,
  "Authorization": `Bearer ${SUPABASE_ANON}`,
  "Content-Type":  "application/json",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: return all rows newest first ──────────────────────────────────────
  if (req.method === "GET") {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/locations?order=id.desc&limit=500`,
        { headers: HEADERS }
      );
      const data = await r.json();
      return res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      return res.status(500).json([]);
    }
  }

  // ── DELETE: wipe everything ────────────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      // Supabase requires a filter to delete; `id=gte.0` matches all rows
      await fetch(`${SUPABASE_URL}/rest/v1/locations?id=gte.0`, {
        method:  "DELETE",
        headers: HEADERS,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ ok: false });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

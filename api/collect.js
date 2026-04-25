// api/collect.js
// Vercel Serverless Function — receives location data and stores in Supabase

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_ANON   = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Allow the tracker page (same origin) to POST here
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};

    // Real visitor IP (Vercel sets this header)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      "unknown";

    const entry = {
      source:    body.source    || "UNKNOWN",
      lat:       body.lat       ?? null,
      lng:       body.lng       ?? null,
      accuracy:  body.accuracy  ?? null,
      city:      body.city      || null,
      region:    body.region    || null,
      country:   body.country   || null,
      isp:       body.isp       || null,
      ip:        body.ip        || ip,
      maps:      (body.lat && body.lng)
                   ? `https://maps.google.com/?q=${body.lat},${body.lng}`
                   : null,
      user_agent: req.headers["user-agent"] || null,
    };

    // Insert into Supabase via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":         SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase insert failed: ${err}`);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("[collect]", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

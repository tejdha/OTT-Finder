const UPSTREAM = "https://api.movieofthenight.com/v4";

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Service not configured" });
  }

  const tmdbId = first(req.query.tmdbId);
  const mediaType = first(req.query.mediaType);
  const country = first(req.query.country);

  // Only accept exactly what the app sends; reject everything else.
  if (
    !/^\d{1,9}$/.test(tmdbId || "") ||
    !["movie", "tv"].includes(mediaType) ||
    !/^[a-zA-Z]{2}$/.test(country || "")
  ) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const upstream = await fetch(
      `${UPSTREAM}/shows/${mediaType}/${tmdbId}?country=${country.toLowerCase()}`,
      { headers: { "X-API-Key": apiKey } }
    );

    if (!upstream.ok) {
      return res
        .status(upstream.status === 404 ? 404 : 502)
        .json({ error: `Upstream error ${upstream.status}` });
    }

    const data = await upstream.json();
    // Cache at Vercel's edge for 1 hour. This also saves your API quota.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
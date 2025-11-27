import clientPromise from "../../../lib/mongodb";

/**
 * Access Rules:
 * ✔ header: x-allow-fetch: true
 * ✔ query:   ?key=ACCESS_KEY
 * ✔ UA:      contains "roblox"
 */

export default async function handler(req, res) {
  const { id } = req.query || {};

  const headerAllow = req.headers["x-allow-fetch"];
  if (headerAllow && String(headerAllow).toLowerCase() === "true") {
    return serveScript(id, res);
  }

  const key = req.query?.key;
  if (key && process.env.ACCESS_KEY && key === process.env.ACCESS_KEY) {
    return serveScript(id, res);
  }

  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (ua.includes("roblox")) {
    return serveScript(id, res);
  }

  return res
    .status(403)
    .setHeader("content-type", "text/plain")
    .send("ACCESS DENIED");
}

async function serveScript(id, res) {
  if (!id) {
    return res
      .status(400)
      .setHeader("content-type", "text/plain")
      .send("BAD REQUEST");
  }

  try {
    const db = (await clientPromise).db("robloxkeys");
    const scripts = db.collection("scripts");

    const doc = await scripts.findOne({ _id: id });
    if (!doc) {
      return res
        .status(404)
        .setHeader("content-type", "text/plain")
        .send("NOT FOUND");
    }

    return res
      .status(200)
      .setHeader("content-type", "text/plain; charset=utf-8")
      .send(doc.script);
  } catch (err) {
    console.error("RAW API error:", err);
    return res
      .status(500)
      .setHeader("content-type", "text/plain")
      .send("DB ERROR");
  }
}

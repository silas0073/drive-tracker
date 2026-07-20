import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("drives");
  const url = new URL(req.url);

  try {
    if (req.method === "GET") {
      const { blobs } = await store.list();
      const drives = [];
      for (const b of blobs) {
        const d = await store.get(b.key, { type: "json" });
        if (d) drives.push(d);
      }
      drives.sort((a, b) => b.startedAt - a.startedAt);
      return new Response(JSON.stringify(drives), {
        headers: { "content-type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body || !body.id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      await store.setJSON(body.id, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      await store.delete(id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config = { path: "/api/drives" };

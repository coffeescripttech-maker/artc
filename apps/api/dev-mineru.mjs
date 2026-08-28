// DEV MinerU bridge — stand-in for a real `mineru-api` service.
// Parses the UPLOADED PDF's real text (via unpdf, same lib the API uses) and
// returns it in MinerU's /file_parse ZIP contract (md + content_list + middle).
// Limitations vs real MinerU: no OCR (text-based PDFs only), no figure/image
// extraction, no table HTML / formula LaTeX. Swap in real MinerU for that.
import http from "http";
import { getDocumentProxy } from "unpdf";

// ---------- ZIP writer (store-only, like the sample mock) ----------
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zipStore(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    chunks.push(lh, nameBuf, data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(data.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cdStart = offset;
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(cdStart, 16);
  return Buffer.concat([...chunks, cdBuf, eocd]);
}

// ---------- Real PDF parsing (unpdf) ----------
async function parsePdf(buf) {
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const pages = [];
  const contentList = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const lines = tc.items
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

    pages.push(lines.join("\n"));
    if (contentList.length >= 4000) continue; // cap for very dense docs
    for (const line of lines) {
      contentList.push({ type: "text", text: line, page_idx: i - 1 });
      if (contentList.length >= 4000) break;
    }
  }

  const markdown = pages
    .map((t, i) => (pages.length > 1 ? `<!-- page ${i + 1} -->\n${t}` : t))
    .join("\n\n");

  const middle = {
    pdf_info: pages.map((_, i) => ({ page_idx: i })), // no figures → no bboxes
  };

  return { markdown, contentList, middle, pageCount: pages.length };
}

// ---------- HTTP service ----------
http
  .createServer(async (req, res) => {
    if (req.method !== "POST" || !req.url?.includes("/file_parse")) {
      res.writeHead(404).end();
      return;
    }

    try {
      // Re-wrap the raw Node stream in an undici Request to parse multipart.
      const wrapped = new Request("http://bridge/file_parse", {
        method: "POST",
        headers: { "content-type": req.headers["content-type"] || "" },
        body: req,
        duplex: "half",
      });
      const form = await wrapped.formData();
      const file = form.get("files") ?? form.get("file");
      if (!file || typeof file === "string") {
        res.writeHead(400).end(JSON.stringify({ error: "no file" }));
        return;
      }

      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
        res.writeHead(400).end(JSON.stringify({ error: "not a pdf" }));
        return;
      }

      const { markdown, contentList, middle, pageCount } = await parsePdf(buf);
      if (!markdown.trim()) {
        res.writeHead(422).end(
          JSON.stringify({ error: "no extractable text (scanned PDF? this dev bridge has no OCR)" })
        );
        return;
      }

      const zip = zipStore([
        ["doc.md", Buffer.from(markdown, "utf8")],
        ["doc_content_list.json", Buffer.from(JSON.stringify(contentList), "utf8")],
        ["doc_middle.json", Buffer.from(JSON.stringify(middle), "utf8")],
      ]);

      res.writeHead(200, { "Content-Type": "application/zip" });
      res.end(zip);
      console.log(
        `[dev-mineru] parsed ${pageCount} page(s), ${markdown.length} chars, ${contentList.length} blocks`
      );
    } catch (err) {
      console.error("[dev-mineru] parse error:", err?.message || err);
      res.writeHead(500).end(JSON.stringify({ error: String(err?.message || err) }));
    }
  })
  .listen(9000, "127.0.0.1", () =>
    console.log("[dev-mineru] real-PDF bridge listening on http://127.0.0.1:9000")
  );

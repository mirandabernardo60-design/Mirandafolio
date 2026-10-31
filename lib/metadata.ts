import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";

export type FetchedMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  canonical: string | null;
  screenshot: string | null;
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

/** Throws if the URL is not a public http(s) URL. */
export async function assertPublicUrl(raw: string) {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("Invalid URL"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http(s) URLs are allowed");
  if (u.username || u.password) throw new Error("Credentials in URL are not allowed");
  if (u.port && !["80", "443"].includes(u.port)) throw new Error("Non-standard ports are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Internal hosts are not allowed");
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("This host resolves to a private network address");
  }
  return u;
}

/** Fetch with manual redirects so every hop is re-validated (SSRF protection). */
async function safeFetch(raw: string, accept: string) {
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "MirandaBot/1.0 (+metadata preview)", accept },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, current).toString();
      continue;
    }
    return { res, finalUrl: current };
  }
  throw new Error("Too many redirects");
}

async function readCapped(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
    if (total > MAX_BYTES) { await reader.cancel(); break; }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

function attr(tag: string, name: string) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function metaContent(html: string, keys: string[]) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (keys.includes(key)) {
      const c = attr(tag, "content");
      if (c) return c;
    }
  }
  return null;
}

function linkHref(html: string, rels: string[]) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/);
    if (rels.some((r) => rel.includes(r))) {
      const h = attr(tag, "href");
      if (h) return h;
    }
  }
  return null;
}

function abs(href: string | null, base: string) {
  if (!href) return null;
  try {
    const u = new URL(href, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : null;
  } catch { return null; }
}

export async function fetchMetadata(rawUrl: string): Promise<FetchedMeta> {
  const { res, finalUrl } = await safeFetch(rawUrl, "text/html,application/xhtml+xml");
  if (!res.ok) throw new Error(`Site responded with ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("html")) throw new Error("URL did not return an HTML page");
  const html = await readCapped(res);
  const head = html.slice(0, 400_000);

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const meta: FetchedMeta = {
    title: metaContent(head, ["og:title", "twitter:title"]) ?? (titleTag ? decode(titleTag) : null),
    description: metaContent(head, ["og:description", "description", "twitter:description"]),
    image: abs(metaContent(head, ["og:image", "og:image:url", "twitter:image"]), finalUrl),
    favicon:
      abs(linkHref(head, ["apple-touch-icon"]) ?? linkHref(head, ["icon", "shortcut"]), finalUrl) ??
      abs("/favicon.ico", finalUrl),
    canonical: abs(linkHref(head, ["canonical"]) ?? metaContent(head, ["og:url"]), finalUrl),
    screenshot: null,
  };
  meta.screenshot = await screenshotUrl(finalUrl);
  return meta;
}

const DEFAULT_SCREENSHOT_SERVICE =
  "https://api.microlink.io/?url={url}&screenshot=true&meta=false&viewport.width=1440&viewport.height=900&waitUntil=networkidle2&waitForTimeout=3000";

/**
 * Screenshot of the live site via a screenshot service (Microlink free tier by default,
 * override with SCREENSHOT_SERVICE_URL). Returns a public image URL or null.
 */
export async function screenshotUrl(target: string) {
  const tpl = process.env.SCREENSHOT_SERVICE_URL || DEFAULT_SCREENSHOT_SERVICE;
  // Always capture the site's home page, even when a deeper link was pasted.
  let home = target;
  try { home = new URL(target).origin + "/"; } catch { /* keep as is */ }
  const url = tpl.replace("{url}", encodeURIComponent(home));
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(25000) });
    if (res.status >= 300 && res.status < 400) return res.headers.get("location");
    if (!res.ok) return null;
    if ((res.headers.get("content-type") ?? "").startsWith("image/")) return url;
    const json = (await res.json().catch(() => null)) as { data?: { screenshot?: { url?: string } } } | null;
    return json?.data?.screenshot?.url ?? null;
  } catch {
    return null;
  }
}

/** Download a remote image safely (public hosts only, image types, max 5 MB). */
export async function downloadImage(raw: string): Promise<File | null> {
  try {
    const { res } = await safeFetch(raw, "image/*");
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 5 * 1024 * 1024) return null;
    return new File([buf], `screenshot.${type.split("/")[1]}`, { type });
  } catch {
    return null;
  }
}

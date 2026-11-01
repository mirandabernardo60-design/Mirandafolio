import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, safe Markdown renderer for articles (no raw HTML is ever rendered).
 * Supports: ## / ### headings, paragraphs, - and 1. lists, > quotes, **bold**, *italic*, `code`,
 * [links](https://…), images ![alt](https://…) on their own line, and --- rules.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0], k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const [, label, href] = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : "#";
      out.push(safe.startsWith("/")
        ? <Link key={k} href={safe}>{label}</Link>
        : <a key={k} href={safe} target="_blank" rel="noopener noreferrer">{label}</a>);
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0, n = 0;
  while (i < lines.length) {
    const line = lines[i];
    const k = `b${n++}`;
    if (!line.trim()) { i++; continue; }
    if (/^###\s/.test(line)) { blocks.push(<h3 key={k}>{inline(line.slice(4), k)}</h3>); i++; continue; }
    if (/^##\s/.test(line)) { blocks.push(<h2 key={k} id={line.slice(3).toLowerCase().replace(/[^a-z0-9]+/g, "-")}>{inline(line.slice(3), k)}</h2>); i++; continue; }
    if (/^---+\s*$/.test(line)) { blocks.push(<hr key={k} />); i++; continue; }
    const img = line.match(/^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)\s*$/);
    if (img) {
      // eslint-disable-next-line @next/next/no-img-element
      blocks.push(<figure key={k}><img src={img[2]} alt={img[1]} loading="lazy" />{img[1] && <figcaption>{img[1]}</figcaption>}</figure>);
      i++; continue;
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k}>{inline(q.join(" "), k)}</blockquote>); continue;
    }
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\.\s/ : /^[-*]\s/).test(lines[i])) items.push(lines[i++].replace(/^([-*]|\d+\.)\s/, ""));
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={k}>{lis}</ol> : <ul key={k}>{lis}</ul>); continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|[-*]\s|\d+\.\s|---|!\[)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k}>{inline(para.join(" "), k)}</p>);
  }
  return <div className="md">{blocks}</div>;
}

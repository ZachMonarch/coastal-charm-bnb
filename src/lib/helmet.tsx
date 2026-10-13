/**
 * Minimal drop-in replacement for react-helmet-async.
 *
 * react-helmet-async is CommonJS and breaks SSR module evaluation on TanStack
 * Start. In the Classic SPA, Helmet only ever ran in the browser, so this shim
 * keeps that exact behaviour: on the client it applies <title>, <meta>, <link>,
 * <script> and <html> attributes to the document and reverts them on unmount.
 * Server-rendered head tags come from the route `head()` options instead.
 */
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
} from "react";

type AnyProps = Record<string, unknown> & { children?: ReactNode };

const ATTR_ALIASES: Record<string, string> = {
  className: "class",
  httpEquiv: "http-equiv",
  charSet: "charset",
  crossOrigin: "crossorigin",
  hrefLang: "hreflang",
  itemProp: "itemprop",
  fetchPriority: "fetchpriority",
};

function flatten(children: ReactNode): ReactElement<AnyProps>[] {
  const out: ReactElement<AnyProps>[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<AnyProps>(child)) return;
    if (child.type === Fragment) out.push(...flatten(child.props.children));
    else out.push(child);
  });
  return out;
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

function attrsOf(props: AnyProps): [string, string][] {
  return Object.entries(props)
    .filter(([key, value]) => key !== "children" && key !== "dangerouslySetInnerHTML" && value !== undefined && value !== null && value !== false)
    .map(([key, value]) => [ATTR_ALIASES[key] ?? key, String(value)]);
}

function selectorFor(tag: string, props: AnyProps): string | null {
  const esc = (v: unknown) => String(v).replace(/"/g, '\\"');
  if (tag === "meta") {
    if (props["name"]) return `meta[name="${esc(props["name"])}"]`;
    if (props["property"]) return `meta[property="${esc(props["property"])}"]`;
    if (props["httpEquiv"]) return `meta[http-equiv="${esc(props["httpEquiv"])}"]`;
    if (props["charSet"]) return "meta[charset]";
    if (props["itemProp"]) return `meta[itemprop="${esc(props["itemProp"])}"]`;
  }
  if (tag === "link" && props["rel"] === "canonical") return 'link[rel="canonical"]';
  return null;
}

export function Helmet({ children }: { children?: ReactNode; [key: string]: unknown }) {
  const elements = flatten(children);
  const signature = JSON.stringify(
    elements.map((el) => [typeof el.type === "string" ? el.type : "", attrsOf(el.props), textOf(el.props.children)]),
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const created: Element[] = [];
    const restored: Array<() => void> = [];
    const previousTitle = document.title;
    let titleChanged = false;

    for (const el of elements) {
      const tag = typeof el.type === "string" ? el.type : null;
      if (!tag) continue;
      const props = el.props;

      if (tag === "title") {
        document.title = textOf(props.children);
        titleChanged = true;
        continue;
      }

      if (tag === "html" || tag === "body") {
        const target = tag === "html" ? document.documentElement : document.body;
        for (const [name, value] of attrsOf(props)) {
          const prev = target.getAttribute(name);
          target.setAttribute(name, value);
          restored.push(() => (prev === null ? target.removeAttribute(name) : target.setAttribute(name, prev)));
        }
        continue;
      }

      if (tag !== "meta" && tag !== "link" && tag !== "script" && tag !== "style" && tag !== "base" && tag !== "noscript") {
        continue;
      }

      const selector = selectorFor(tag, props);
      const existing = selector ? document.head.querySelector(selector) : null;
      if (existing) {
        const snapshot = Array.from(existing.attributes).map((a) => [a.name, a.value] as const);
        for (const [name, value] of attrsOf(props)) existing.setAttribute(name, value);
        restored.push(() => {
          for (const a of Array.from(existing.attributes)) existing.removeAttribute(a.name);
          for (const [name, value] of snapshot) existing.setAttribute(name, value);
        });
        continue;
      }

      const node = document.createElement(tag);
      for (const [name, value] of attrsOf(props)) node.setAttribute(name, value);
      const inner = props["dangerouslySetInnerHTML"] as { __html?: string } | undefined;
      const text = inner?.__html ?? textOf(props.children);
      if (text) node.textContent = text;
      node.setAttribute("data-helmet", "true");
      document.head.appendChild(node);
      created.push(node);
    }

    return () => {
      created.forEach((node) => node.remove());
      restored.reverse().forEach((fn) => fn());
      if (titleChanged) document.title = previousTitle;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return null;
}

export function HelmetProvider({ children }: { children?: ReactNode; context?: unknown }) {
  return <>{children}</>;
}

export type HelmetServerState = Record<string, never>;

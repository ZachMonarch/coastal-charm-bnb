/**
 * react-router-dom compatibility layer over @tanstack/react-router.
 *
 * Keeps existing call sites (`navigate("/path")`, `<Link to="/x">`,
 * `useParams<{ id: string }>()`, `useSearchParams()`, `location.state`) working
 * with react-router-dom calling conventions after the TanStack Start migration.
 * New code should prefer native @tanstack/react-router APIs.
 */
import * as React from "react";
import {
  Outlet,
  useLocation as useTanstackLocation,
  useParams as useTanstackParams,
  useRouter,
  type HistoryState,
} from "@tanstack/react-router";

export { Outlet };

export type To = string | { pathname?: string; search?: string; hash?: string };

export interface NavigateOptions {
  replace?: boolean;
  // react-router types state as `any`; keep parity so existing reads compile.
  state?: any;
}

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
}

function resolveRelative(path: string, currentPathname: string): string {
  if (path.startsWith("/") || /^[a-z]+:/i.test(path)) return path;
  const base = currentPathname.endsWith("/") ? currentPathname : `${currentPathname}/`;
  const segments = (base + path).split("/");
  const out: string[] = [];
  for (const seg of segments) {
    if (seg === "..") out.pop();
    else if (seg !== ".") out.push(seg);
  }
  const joined = out.join("/");
  return joined.startsWith("/") ? joined : `/${joined}`;
}

export function toHref(to: To, currentPathname = "/"): string {
  if (typeof to === "string") {
    if (to.startsWith("?") || to.startsWith("#")) return `${currentPathname}${to}`;
    return resolveRelative(to, currentPathname);
  }
  const pathname = to.pathname ? resolveRelative(to.pathname, currentPathname) : currentPathname;
  const search = to.search ? (to.search.startsWith("?") ? to.search : `?${to.search}`) : "";
  const hash = to.hash ? (to.hash.startsWith("#") ? to.hash : `#${to.hash}`) : "";
  return `${pathname}${search}${hash}`;
}

function toHistoryState(state: unknown): HistoryState | undefined {
  if (state === undefined || state === null) return undefined;
  // Strip non-serializable values (e.g. nested location objects keep only plain data)
  try {
    return JSON.parse(JSON.stringify(state)) as HistoryState;
  } catch {
    return undefined;
  }
}

export function useLocation(): Location {
  const loc = useTanstackLocation();
  const state = loc.state as unknown as Record<string, unknown> | undefined;
  return React.useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ?? "",
      hash: loc.hash ? `#${loc.hash}` : "",
      state: state ?? null,
      key: (state?.["__TSR_key"] as string | undefined) ?? (state?.["key"] as string | undefined) ?? "default",
    }),
    [loc.pathname, loc.searchStr, loc.hash, state],
  );
}

export type NavigateFunction = {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
};

export function useNavigate(): NavigateFunction {
  const router = useRouter();
  return React.useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        router.history.go(to);
        return;
      }
      const current = router.state.location.pathname;
      const href = toHref(to, current);
      if (/^https?:\/\//i.test(href)) {
        window.location.assign(href);
        return;
      }
      const state = toHistoryState(options?.state);
      void router.navigate({
        href,
        replace: options?.replace ?? false,
        ...(state ? { state } : {}),
      });
    },
    [router],
  ) as NavigateFunction;
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): Readonly<Partial<T>> {
  const params = useTanstackParams({ strict: false }) as Record<string, string | undefined>;
  // TanStack names the splat param "_splat"; react-router used "*"
  const out: Record<string, string | undefined> = { ...params };
  if ("_splat" in params) out["*"] = params["_splat"];
  return out as Readonly<Partial<T>>;
}

type SearchInit =
  | URLSearchParams
  | string
  | Record<string, string | string[]>
  | [string, string][];

function toSearchParams(init: SearchInit): URLSearchParams {
  if (init instanceof URLSearchParams) return new URLSearchParams(init);
  if (typeof init === "string" || Array.isArray(init)) return new URLSearchParams(init);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(init)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }
  return params;
}

export type SetURLSearchParams = (
  next: SearchInit | ((prev: URLSearchParams) => SearchInit),
  options?: NavigateOptions,
) => void;

export function useSearchParams(): [URLSearchParams, SetURLSearchParams] {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setSearchParams = React.useCallback<SetURLSearchParams>(
    (next, options) => {
      const resolved = toSearchParams(typeof next === "function" ? next(new URLSearchParams(location.search)) : next);
      const qs = resolved.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`, options);
    },
    [location.pathname, location.search, location.hash, navigate],
  );
  return [searchParams, setSearchParams];
}

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  state?: any;
}

function isModifiedEvent(event: React.MouseEvent) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, onClick, target, ...rest },
  ref,
) {
  const router = useRouter();
  const location = useLocation();
  const navigate = useNavigate();
  const href = toHref(to, location.pathname);
  const isExternal = /^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      isModifiedEvent(event) ||
      isExternal ||
      (target && target !== "_self")
    ) {
      return;
    }
    event.preventDefault();
    navigate(href, { replace: replace ?? false, state });
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    rest.onMouseEnter?.(event);
    if (!isExternal) {
      void router.preloadRoute({ href } as Parameters<typeof router.preloadRoute>[0]).catch(() => undefined);
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      target={target}
      {...rest}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    />
  );
});

export interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

export interface NavLinkProps extends Omit<LinkProps, "className" | "style" | "children"> {
  className?: string | ((props: NavLinkRenderProps) => string | undefined);
  style?: React.CSSProperties | ((props: NavLinkRenderProps) => React.CSSProperties | undefined);
  children?: React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode);
  end?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { className, style, children, end, to, ...rest },
  ref,
) {
  const location = useLocation();
  const target = toHref(to, location.pathname).split(/[?#]/)[0] ?? "/";
  const isActive = end || target === "/"
    ? location.pathname === target
    : location.pathname === target || location.pathname.startsWith(`${target}/`);
  const renderProps: NavLinkRenderProps = { isActive, isPending: false };
  const resolvedClassName = typeof className === "function" ? className(renderProps) : className;
  const resolvedStyle = typeof style === "function" ? style(renderProps) : style;
  const resolvedChildren = typeof children === "function" ? children(renderProps) : children;
  return (
    <Link
      ref={ref}
      to={to}
      aria-current={isActive ? "page" : undefined}
      {...rest}
      {...(resolvedClassName !== undefined ? { className: resolvedClassName } : {})}
      {...(resolvedStyle !== undefined ? { style: resolvedStyle } : {})}
    >
      {resolvedChildren}
    </Link>
  );
});

export interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: any;
}

export function Navigate({ to, replace, state }: NavigateProps): null {
  const navigate = useNavigate();
  const location = useLocation();
  const href = toHref(to, location.pathname);
  React.useEffect(() => {
    navigate(href, { replace: replace ?? false, state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href]);
  return null;
}

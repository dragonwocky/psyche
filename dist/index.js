import { n as e, t } from "./match-DEiHNNFI.js";
// src/href.ts
var n = "psyche:/", r = (e, t = "") => new URL(e, new URL(t, n)), i = (e, t = "") => {
	let n = r(e, t);
	return n.protocol === "psyche:" ? n.pathname + n.search + n.hash : n.href;
}, a = (e, t = "", n = t) => {
	if (!e) return;
	let i = r(e, t), a = r(n);
	return i.hash && i.origin === a.origin && i.pathname === a.pathname ? decodeURIComponent(i.hash.slice(1)) : void 0;
}, o = (e) => {
	let { href: t = "", match: n, matches: r } = e, a = n && r[n.key], o = Array.isArray(a) ? a[n.index] : a;
	return o?.href ? i(o.href, t) : t;
}, s = {
	"“": "\"",
	"”": "\"",
	"‘": "'",
	"’": "'"
}, c = /\s/, l = (e) => s[e] ?? e, u = (e) => {
	let t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n = [];
	for (; t.nextNode();) n.push(t.currentNode);
	return n;
}, d = (e, t) => {
	if (!e || !t) return;
	let n = t.split("").filter((e) => !c.test(e)).map(l).join("");
	if (!n) return;
	let r = "", i = [];
	for (let t of u(e)) for (let e = 0; e < t.data.length; e++) c.test(t.data[e]) || (r += l(t.data[e]), i.push([t, e]));
	let a = r.indexOf(n);
	if (a === -1) return;
	let o = new Range(), s = i[a + n.length - 1];
	return o.setStart(...i[a]), o.setEnd(s[0], s[1] + 1), o;
}, f = (e) => typeof e?.value == "string", p = (e) => typeof Element < "u" && e instanceof Element, m = (e, t) => {
	let n = d(e, t);
	return n ? [n] : [];
}, h = (e) => Object.entries("matches" in e ? e.matches : e), g = (e, t, n, r) => {
	let o = t.href;
	return n = o ? i(o, n) : n, r ??= n, h(t).flatMap(([, t]) => (Array.isArray(t) ? t : [t]).flatMap((i) => {
		let o = a(i?.href, n, r), s = o ? e.ownerDocument.getElementById(o) : void 0;
		return s ? f(i) ? m(s, i.match) : g(s, i, n, r) : Array.isArray(t) || !i ? [] : f(i) ? m(e, i.match) : g(e, i, n, r);
	}));
}, _ = (e, t) => {
	if (!t) return [];
	if (Array.isArray(t)) {
		let n = Array.isArray(e) ? e : [];
		return t.flatMap((e, t) => _(n[t], e));
	}
	if (f(t)) return m(Array.isArray(e) ? e[0] : e, t.match);
	if (Array.isArray(e) || !e) return [];
	if (p(e)) return g(e, t);
	let n = e;
	return h(t).flatMap(([e, t]) => _(n[e], t));
}, v = (e) => {
	if (typeof CSS > "u" || !("highlights" in CSS)) return;
	let t = CSS.highlights.get(e);
	return t || CSS.highlights.set(e, t = new Highlight()), t;
}, y = (e, t = "psyche") => {
	let n = [...e];
	for (let e of n) v(t)?.add(e);
	return () => {
		for (let e of n) v(t)?.delete(e);
		n = [];
	};
}, b = (e, t, n = {}) => e.key.toLowerCase() === t.toLowerCase() && (e.metaKey || e.ctrlKey) === !!n.mod && e.shiftKey === !!n.shift && e.altKey === !!n.alt, x = () => (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase(), S = () => x().startsWith("mac") || x().includes("darwin") || /iphone|ipad/.test(x()) ? "⌘" : "CTRL", C = (e) => e.replace(/#.*$/, ""), w = (e) => {
	let t = e?.nodeType === Node.ELEMENT_NODE ? e : e?.parentElement;
	for (; t && !t.getClientRects().length;) t = t.parentElement;
	return t;
}, T = (e, t, n) => {
	let r = new URL(e, location.href);
	return n && r.searchParams.set("search", n), r.href;
}, E = (e, t) => {
	let n = /* @__PURE__ */ new Map();
	return e.forEach((e, r) => {
		let i = t ? e.value[t] : void 0;
		n.has(i) || n.set(i, {
			group: i,
			results: []
		}), n.get(i).results.push({
			result: e,
			index: r
		});
	}), [...n.values()];
}, D = (Worker) => new Worker(new URL("./worker.js", import.meta.url), { type: "module" }), O = () => class extends Worker {
	constructor(e, t) {
		let { pathname: n, search: r } = new URL(e, location.href);
		super(new URL(n + r, location.origin), t);
	}
}, k = (e) => {
	let { fields: t, group: n, navigate: r = (e) => location.assign(e), onOpen: i, onLoad: a, root: s = "article", loadEvent: c = "load" } = e, l = () => {
		let { index: t, limit: n, excerpt: r, threshold: i } = e;
		return {
			index: typeof t == "function" ? t : new URL(t, location.href).href,
			limit: n,
			excerpt: r,
			threshold: i
		};
	}, u, d, f = 0, p = /* @__PURE__ */ new Map(), m = (n) => {
		if (e.worker === !1) return d ??= import("./handler-BkaCda3I.js").then((e) => e.n).then(async ({ createHandler: e }) => {
			let n = e();
			return await n({
				type: "init",
				fields: t,
				options: l()
			}), n;
		}), d.then((e) => e(n));
		if (!u) {
			let Worker = e.origin ? O() : globalThis.Worker;
			u = e.worker ? new Worker(new URL(e.worker, location.href), { type: "module" }) : D(Worker), u.onmessage = ({ data: e }) => {
				p.get(e.id)?.(e.response), p.delete(e.id);
			}, u.postMessage({
				type: "init",
				fields: t,
				options: l(),
				id: 0
			});
		}
		let r = ++f;
		return u.postMessage({
			...n,
			id: r
		}), new Promise((e) => p.set(r, e));
	}, h = {
		open: !1,
		query: "",
		loading: !1,
		results: [],
		groups: [],
		selected: 0,
		page: { query: "" }
	}, g = /* @__PURE__ */ new Set(), v = (e) => {
		e.results && (e.groups = E(e.results, n), S.length = 0, k.clear()), h = {
			...h,
			...e
		};
		for (let e of g) e(h);
		(e.results || e.open) && queueMicrotask(P);
	}, x, S = [], k = /* @__PURE__ */ new Map(), A = {
		input: (e) => {
			x = e;
		},
		result: (e) => (t) => {
			S[e] = t;
		},
		field: (e, t, n) => (r) => {
			let i = `${e}:${t}`, a = k.get(i);
			n === void 0 ? k.set(i, r) : Array.isArray(a) ? a[n] = r : k.set(i, Object.assign([], { [n]: r }));
		}
	}, j = () => {
		let e = () => {};
		return (t) => {
			e(), e = y(t);
		};
	}, M = j(), N = j(), P = () => M(h.results.flatMap((e, n) => _(Object.fromEntries(t.map(({ key: e }) => [e, k.get(`${n}:${e}`)])), e))), F = () => S[h.selected]?.scrollIntoView({ block: "center" }), I = ({ href: t, ...n }, r) => ({
		...n,
		href: new URL((e.href ?? T)(o({
			...n,
			href: t
		}), n, r), location.href).href
	}), L = async (t) => {
		v({ loading: !0 });
		let n = await m(t ? {
			type: "search",
			query: t
		} : { type: "sitemap" });
		if (t !== h.query) return;
		let r = n.map((e) => I(e, t));
		!t && e.sitemap && (r = r.filter(e.sitemap)), v({
			loading: !1,
			results: r,
			selected: Math.max(Math.min(h.selected, r.length - 1), 0)
		}), F();
	}, R = (e) => {
		v({ query: e }), L(e);
	}, z = () => {
		h.open || (v({ open: !0 }), m({ type: "load" }), !h.query && !h.results.length && L(""), i?.(), x?.focus());
	}, B = () => {
		h.open && (v({ open: !1 }), x?.blur());
	}, V = () => h.open ? B() : z(), H = (e) => v({ selected: Math.max(Math.min(e, h.results.length - 1), 0) }), U = () => {
		x?.focus(), H(h.selected - 1), F();
	}, W = () => {
		x?.focus(), H(h.selected + 1), F();
	}, G = (e = h.selected) => {
		let t = h.results[e];
		if (!t) return;
		let n = S[e], i = C(t.href) === C(location.href);
		v({
			query: "",
			results: []
		}), r(t.href, { sourceElement: n }), B(), i && setTimeout(() => Y(!0));
	}, K, q, J = async (e, t) => {
		let n = await m({
			type: "locate",
			query: t,
			href: location.href
		});
		if (t !== new URL(location.href).searchParams.get("search")) return;
		if (v({ page: {
			query: t,
			located: n
		} }), a?.({
			query: t,
			located: n
		}) === !0 || !n) return N([]);
		let r = _(e, n);
		N(r), w(r[0]?.commonAncestorContainer)?.scrollIntoView(), q = new MutationObserver(() => {
			r.some((e) => e.collapsed) && (r = _(e, n), N(r));
		}), q.observe(e, {
			childList: !0,
			subtree: !0,
			characterData: !0
		});
	}, Y = (e = !1) => {
		if (!e && K === location.href) return;
		K = location.href, q?.disconnect();
		let t = new URL(location.href).searchParams.get("search") ?? "", n = document.querySelector(s);
		v({ page: { query: t } }), t && n ? J(n, t) : (N([]), a?.({ query: t })), t && R(t);
	};
	return {
		getState: () => h,
		subscribe: (e) => (g.add(e), () => void g.delete(e)),
		open: z,
		close: B,
		toggle: V,
		input: R,
		select: H,
		selectPrevious: U,
		selectNext: W,
		visit: G,
		connect: () => {
			let e = (e) => {
				h.open && (b(e, "Escape") && B(), b(e, "ArrowUp") && (e.preventDefault(), U()), b(e, "ArrowDown") && (e.preventDefault(), W()), b(e, "Enter") && document.activeElement === x && (e.preventDefault(), G()), b(e, "/") && document.activeElement !== x && (e.preventDefault(), x?.focus()));
			}, t = (e) => {
				e.target instanceof Element || (queueMicrotask(P), Y());
			};
			return document.addEventListener("keydown", e), addEventListener(c, t, { capture: !0 }), document.readyState === "complete" ? Y() : c !== "load" && addEventListener("load", t, { once: !0 }), () => {
				document.removeEventListener("keydown", e), removeEventListener(c, t, { capture: !0 }), removeEventListener("load", t), q?.disconnect(), M([]), N([]), K = void 0;
			};
		},
		refs: A
	};
};
export { k as createSearch, y as highlight, b as isShortcut, t as match, S as platformModifier, _ as rangesOf, e as rank };

//# sourceMappingURL=index.js.map
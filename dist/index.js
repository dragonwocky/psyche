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
}, b = (e) => {
	let t = e?.nodeType === Node.ELEMENT_NODE ? e : e?.parentElement;
	for (; t && !t.getClientRects().length;) t = t.parentElement;
	return t;
}, x = (e, t, n = "psyche") => {
	let r = _(e, t), i = y(r, n);
	b(r[0]?.commonAncestorContainer)?.scrollIntoView();
	let a = new MutationObserver(() => {
		r.some((e) => e.collapsed) && (i(), r = _(e, t), i = y(r, n));
	});
	return a.observe(e, {
		childList: !0,
		subtree: !0,
		characterData: !0
	}), () => {
		a.disconnect(), i();
	};
}, S = (e, t, n = {}) => e.key.toLowerCase() === t.toLowerCase() && (e.metaKey || e.ctrlKey) === !!n.mod && e.shiftKey === !!n.shift && e.altKey === !!n.alt, C = () => (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase(), w = () => C().startsWith("mac") || C().includes("darwin") || /iphone|ipad/.test(C()) ? "⌘" : "CTRL", T = (e) => e.replace(/#.*$/, ""), E = (e, t, n) => {
	let r = new URL(e, location.href);
	return n && r.searchParams.set("search", n), r.href;
}, D = (e, t) => {
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
}, O = (Worker) => new Worker(new URL("./worker.js", import.meta.url), { type: "module" }), k = () => class extends Worker {
	constructor(e, t) {
		let { pathname: n, search: r } = new URL(e, location.href);
		super(new URL(n + r, location.origin), t);
	}
}, A = (e) => {
	let { fields: t, group: n } = e, r = () => {
		let { index: t, limit: n, excerpt: r, threshold: i } = e;
		return {
			index: typeof t == "function" ? t : new URL(t, location.href).href,
			limit: n,
			excerpt: r,
			threshold: i
		};
	}, i, a, s = 0, c = /* @__PURE__ */ new Map(), l = (n) => {
		if (e.worker === !1) return a ??= import("./handler-BkaCda3I.js").then((e) => e.n).then(async ({ createHandler: e }) => {
			let n = e();
			return await n({
				type: "init",
				fields: t,
				options: r()
			}), n;
		}), a.then((e) => e(n));
		if (!i) {
			let Worker = e.origin ? k() : globalThis.Worker;
			i = e.worker ? new Worker(new URL(e.worker, location.href), { type: "module" }) : O(Worker), i.onmessage = ({ data: e }) => {
				c.get(e.id)?.(e.response), c.delete(e.id);
			}, i.postMessage({
				type: "init",
				fields: t,
				options: r(),
				id: 0
			});
		}
		let o = ++s;
		return i.postMessage({
			...n,
			id: o
		}), new Promise((e) => c.set(o, e));
	}, u = {
		open: !1,
		query: "",
		loading: !1,
		results: [],
		groups: [],
		selected: 0,
		page: { query: "" }
	}, d = /* @__PURE__ */ new Set(), f = (e) => {
		e.results && (e.groups = D(e.results, n)), u = {
			...u,
			...e
		};
		for (let e of d) e(u);
	}, p = ({ href: t, ...n }, r) => ({
		...n,
		href: new URL((e.href ?? E)(o({
			...n,
			href: t
		}), n, r), location.href).href
	}), m = async (t) => {
		f({ loading: !0 });
		let n = await l(t ? {
			type: "search",
			query: t
		} : { type: "sitemap" });
		if (t !== u.query) return;
		let r = n.map((e) => p(e, t));
		!t && e.sitemap && (r = r.filter(e.sitemap)), f({
			loading: !1,
			results: r,
			selected: Math.max(Math.min(u.selected, r.length - 1), 0)
		});
	}, h = (e) => {
		f({ query: e }), m(e);
	}, g = () => {
		u.open || (f({ open: !0 }), l({ type: "load" }), !u.query && !u.results.length && m(""));
	}, _ = () => {
		u.open && f({ open: !1 });
	}, v = () => u.open ? _() : g(), y = (e) => f({ selected: Math.max(Math.min(e, u.results.length - 1), 0) }), b = () => y(u.selected - 1), x = () => y(u.selected + 1), S = (e = u.selected) => {
		let t = u.results[e];
		if (!t) return;
		let n = !!u.page.href && T(t.href) === T(u.page.href);
		return f({
			query: "",
			results: []
		}), _(), n && w(t.href), t.href;
	}, C = 0, w = async (e) => {
		let t = new URL(e, location.href).searchParams.get("search") ?? "", n = ++C;
		if (f({ page: {
			href: e,
			query: t
		} }), !t) return;
		h(t);
		let r = await l({
			type: "locate",
			query: t,
			href: e
		});
		n === C && f({ page: {
			href: e,
			query: t,
			located: r
		} });
	};
	return {
		getState: () => u,
		subscribe: (e) => (d.add(e), () => void d.delete(e)),
		open: g,
		close: _,
		toggle: v,
		input: h,
		select: y,
		selectPrevious: b,
		selectNext: x,
		visit: S,
		load: w
	};
};
export { A as createSearch, y as highlight, x as highlightPage, S as isShortcut, t as match, w as platformModifier, _ as rangesOf, e as rank };

//# sourceMappingURL=index.js.map
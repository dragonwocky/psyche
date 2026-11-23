import { n as e, r as t } from "./match-gKepVH0L.js";
// \0rolldown/runtime.js
var n = Object.defineProperty, r = /* @__PURE__ */ ((e, t) => {
	let r = {};
	for (var i in e) n(r, i, {
		get: e[i],
		enumerable: !0
	});
	return t || n(r, Symbol.toStringTag, { value: "Module" }), r;
})({ createHandler: () => o }), i = (e) => e.pathname.replace(/(.)\/$/, "$1"), a = (e, t) => {
	let n, r = -1;
	for (let a of e) {
		let e = new URL(a.href, t), o = [...e.searchParams];
		i(e) !== i(t) || o.length <= r || o.every(([e, n]) => t.searchParams.getAll(e).includes(n)) && (n = a, r = o.length);
	}
	return n;
}, o = () => {
	let n = [], r, i, o = () => r ? i ??= (typeof r.index == "function" ? r.index() : fetch(r.index).then((e) => e.ok ? e.json() : Promise.reject(e))).catch(() => (i = void 0, [])) : Promise.resolve([]), s = (t, i) => i.map(({ value: i, href: a }) => ({
		...e(t, i, {
			...r,
			fields: n
		}),
		href: a
	})), c = ({ value: e, ...t }) => {
		let r = {};
		for (let [t, i] of Object.entries(e)) n.some((e) => e.key === t) || (r[t] = i);
		return {
			...t,
			value: r
		};
	};
	return async (e) => {
		if (e.type === "init") {
			({fields: n} = e), r = e.options;
			return;
		}
		let i = await o();
		if (e.type === "search") return t(s(e.query, i), r?.limit ?? 6).map(c);
		if (e.type === "sitemap") return s("", i).map(c);
		if (e.type === "locate") {
			let t = a(i, new URL(e.href));
			return t && c(s(e.query, [t])[0]);
		}
	};
};
export { r as n, o as t };

//# sourceMappingURL=handler-jxPS3QJx.js.map
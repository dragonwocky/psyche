import { n as e, r as t } from "./match-BqyF2nb4.js";
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
	let n = [], r, i, o = () => r ? i ??= (typeof r.index == "string" ? fetch(r.index).then((e) => e.ok ? e.json() : Promise.reject(e)) : r.index()).catch(() => (i = void 0, [])) : Promise.resolve([]), s = (e, i) => t(e, i, {
		...r,
		fields: n
	}), c = ({ value: e, ...t }) => {
		let r = {};
		for (let [t, i] of Object.entries(e)) n.some((e) => e.key === t) || (r[t] = i);
		return {
			...t,
			value: r
		};
	};
	return async (t) => {
		if (t.type === "init") {
			({fields: n} = t), r = t.options;
			return;
		}
		let i = await o();
		if (t.type === "search") return e(s(t.query, i), r?.limit ?? 6).map(c);
		if (t.type === "sitemap") return s("", i).map(c);
		if (t.type === "locate") {
			let e = a(i, new URL(t.href));
			return e && s(t.query, [e])[0];
		}
	};
};
export { r as n, o as t };

//# sourceMappingURL=handler-BDsgsEi2.js.map
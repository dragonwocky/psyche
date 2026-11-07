// src/fuzz.ts
var e = (e) => {
	let t = /* @__PURE__ */ new Map();
	return (n = "") => {
		let r = t.get(n);
		return r === void 0 && t.set(n, r = e(n)), r;
	};
}, t = e((e) => e.trim().replace(/\n+/g, "\n").replace(/[^\S\n]+/g, " ").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'")), n = (e = "") => {
	e.startsWith("...") && (e = e.slice(3));
	let t = 0;
	for (; t < e.length && /[^\s]/.test(e[t]);) t++;
	return e = e.slice(t).trimStart(), e ? "..." + e : "";
}, r = (e = "") => {
	e.endsWith("...") && (e = e.slice(0, -3));
	let t = e.length - 1;
	for (; t > 0 && /[^\s]/.test(e[t]);) t--;
	return e = e.slice(0, t).trimEnd(), e ? e + "..." : "";
}, i = [
	0,
	-1,
	-1
], a = .25, o = e((e) => t(e).replace(/\n+/g, " ").toLocaleLowerCase()), s = (e, t, n) => {
	let r = n, i = -1;
	for (let n = 0; n < e.length; n++, r++) {
		if (r = t.indexOf(e[n], r), r < 0) return;
		n || (i = r);
	}
	let a = r;
	for (let n = e.length - 1; n >= 0; n--) a = t.lastIndexOf(e[n], a - 1);
	return {
		match: [
			e.length / (r - a),
			a,
			r
		],
		first: i
	};
}, c = (e, t, n = .4) => {
	if (!e) return i;
	e = o(e), t = o(t);
	let r = i;
	for (let i = 0; t.length - i >= e.length;) {
		let a = s(e, t, i);
		if (!a || (a.match[0] > n && a.match[0] > r[0] && (r = a.match), r[0] === 1)) break;
		i += (Math.floor((a.first - i) / e.length) + 1) * e.length;
	}
	return r;
}, l = (e, t) => e.length > t * 2 ? e.slice(0, t * 2) : e, u = (e, t) => e.length > t * 2 ? e.slice(-t * 2) : e, d = ([e, i, o], s, { excerpt: c = 192 } = {}) => {
	if (s = t(s), !e) {
		let e = l(s, c);
		for (; e.length > c;) e = r(e);
		return { text: e };
	}
	if (o > i + c) {
		let e = l(s.slice(i, o), c);
		for (; e.length > c;) e = r(e);
		return {
			text: e,
			match: e.replace(/\.\.\.$/, "")
		};
	}
	{
		let e = s.slice(0, i), t = s.slice(o), d = t.indexOf("\n"), f = s.slice(i, o), p = e.lastIndexOf("\n"), m = c - f.length, h = m * a, g = m - h;
		for (d > 0 && !f.includes("\n") && (d = t.indexOf("\n", d + 1)), d > 0 && (t = t.slice(0, d)), p > 0 && (e = e.slice(p + 1)), e = u(e, c), t = l(t, c); e.length > h;) e = n(e);
		for (; t.length > g;) t = r(t);
		return {
			text: e + f + t,
			match: f
		};
	}
}, f = (e) => typeof e == "object" && !!e && !Array.isArray(e), p = (e) => f(e) && typeof e.href == "string" && (typeof e.value == "string" || f(e.value)) && Object.keys(e).length === 2, m = (e, t, n, r) => {
	let i = c(e, t, n.threshold), a = d(i, t, n);
	return {
		value: r ? t : a.text,
		...a.match === void 0 ? {} : { match: a.match },
		score: i[0]
	};
}, h = (e, t, n, r, i) => {
	if (p(t)) {
		let a = h(e, t.value, n, r, i);
		return a && {
			...a,
			href: t.href
		};
	}
	if (typeof t == "string") return m(e, t, n, r);
	if (f(t)) return g(e, t, n, i);
}, g = (e, t, n, r) => {
	let i = {}, a = {
		value: t,
		matches: i,
		score: 0
	}, o = (e, t, n) => {
		!e || e <= a.score || (a.score = e, a.match = n === void 0 ? { key: t } : {
			key: t,
			index: n
		});
	};
	for (let { key: a, tier: s } of n.fields ?? []) {
		let c = t[a], l = r ? 0 : s;
		if (Array.isArray(c)) {
			let t = c.map((t) => h(e, t, n, !0, !0)).filter((e) => e !== void 0);
			i[a] = t, t.forEach((e, t) => o(e.score && e.score + l, a, t));
		} else {
			let t = h(e, c, n, !1, !0);
			if (!t) continue;
			i[a] = t, o(t.score && t.score + l, a);
		}
	}
	return a;
}, _ = (e, t, n) => t.map(({ value: t, href: r }) => ({
	...g(e, t, n, !1),
	href: r
})), v = (e, t, ...[n = {}]) => Array.isArray(t) ? t.map((t) => h(e, t, n, !0, !1)) : h(e, t, n, !1, !1), y = (e, t = Infinity) => e.filter(({ score: e }) => e).sort((e, t) => t.score - e.score).slice(0, t);
export { y as n, _ as r, v as t };

//# sourceMappingURL=match-DEiHNNFI.js.map
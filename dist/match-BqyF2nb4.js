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
], a = e((e) => t(e).replace(/\n+/g, " ").toLocaleLowerCase()), o = (e, t, n) => {
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
}, s = (e, t, n = .4) => {
	if (!e) return i;
	e = a(e), t = a(t);
	let r = i;
	for (let i = 0; t.length - i >= e.length;) {
		let a = o(e, t, i);
		if (!a || (a.match[0] > n && a.match[0] > r[0] && (r = a.match), r[0] === 1)) break;
		i += (Math.floor((a.first - i) / e.length) + 1) * e.length;
	}
	return r;
}, c = (e, t) => e.length > t * 2 ? e.slice(0, t * 2) : e, l = (e, t) => e.length > t * 2 ? e.slice(-t * 2) : e, u = ([e, i, a], o, { excerpt: s = 192, lead: u = .25 } = {}) => {
	if (o = t(o), !e) {
		let e = c(o, s);
		for (; e.length > s;) e = r(e);
		return { text: e };
	}
	if (a > i + s) {
		let e = c(o.slice(i, a), s);
		for (; e.length > s;) e = r(e);
		return {
			text: e,
			match: e.replace(/\.\.\.$/, "")
		};
	}
	{
		let e = o.slice(0, i), t = o.slice(a), d = t.indexOf("\n"), f = o.slice(i, a), p = e.lastIndexOf("\n"), m = s - f.length, h = m * u, g = m - h;
		for (d > 0 && !f.includes("\n") && (d = t.indexOf("\n", d + 1)), d > 0 && (t = t.slice(0, d)), p > 0 && (e = e.slice(p + 1)), e = l(e, s), t = c(t, s); e.length > h;) e = n(e);
		for (; t.length > g;) t = r(t);
		return {
			text: e + f + t,
			match: f
		};
	}
}, d = (e) => typeof e == "object" && !!e && !Array.isArray(e), f = (e) => d(e) && typeof e.href == "string" && (typeof e.value == "string" || d(e.value)) && Object.keys(e).length === 2, p = (e, t, n, r) => {
	let i = s(e, t, n.threshold), a = u(i, t, n);
	return {
		value: r ? t : a.text,
		...a.match === void 0 ? {} : { match: a.match },
		score: i[0]
	};
}, m = (e, t, n, r, i) => {
	if (f(t)) {
		let a = m(e, t.value, n, r, i);
		return a && {
			...a,
			href: t.href
		};
	}
	if (typeof t == "string") return p(e, t, n, r);
	if (d(t)) return h(e, t, n, i);
}, h = (e, t, n, r) => {
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
			let t = c.map((t) => m(e, t, n, !0, !0)).filter((e) => e !== void 0);
			i[a] = t, t.forEach((e, t) => o(e.score && e.score + l, a, t));
		} else {
			let t = m(e, c, n, !1, !0);
			if (!t) continue;
			i[a] = t, o(t.score && t.score + l, a);
		}
	}
	return a;
}, g = (e, t, n) => t.map(({ value: t, href: r }) => ({
	...h(e, t, n, !1),
	href: r
})), _ = (e, t, ...[n = {}]) => Array.isArray(t) ? t.map((t) => m(e, t, n, !0, !1)) : m(e, t, n, !1, !1), v = (e, t = Infinity) => e.filter(({ score: e }) => e).sort((e, t) => t.score - e.score).slice(0, t);
export { v as n, g as r, _ as t };

//# sourceMappingURL=match-BqyF2nb4.js.map
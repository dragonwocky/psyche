// src/fuzz.ts
var e = (e) => {
	let t = /* @__PURE__ */ new Map();
	return (n = "") => {
		let r = t.get(n);
		return r === void 0 && t.set(n, r = e(n)), r;
	};
}, t = e((e) => e.trim().replace(/\n+/g, "\n").replace(/[^\S\n]+/g, " ")), n = e((e) => t(e).replace(/\n/g, " ").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").toLowerCase()), r = (e) => e.split("").reverse().join(""), i = (e, t) => {
	if (t <= 0) return "";
	if (e.length <= t) return e;
	let n = "...";
	t <= n.length && (n = ""), e = e.slice(e.length - (t - n.length));
	let r = e.search(/\s/);
	return r !== -1 && (e = e.slice(r)), n + e.replace(/^[.\s]+/, "");
}, a = (e, t) => r(i(r(e), t)), o = (e, n, r = 192) => {
	if (e = t(e), !n) return { haystack: a(e, r) };
	let o = e.slice(n[0], n[1]);
	if (n[1] - n[0] >= r) {
		let e = a(o, r);
		return {
			haystack: e,
			match: e.replace(/\.\.\.$/, "")
		};
	}
	let s = r - o.length, c = e.indexOf("\n", n[1]), l = c >= 0 && !o.includes("\n") ? e.indexOf("\n", c + 1) : c, u = e.slice(n[1], l >= 0 ? l : void 0), d = e.slice(e.lastIndexOf("\n", n[0] - 1) + 1, n[0]);
	return u = a(u, s - i(d, s * .25).length), d = i(d, s - u.length), {
		haystack: d + o + u,
		match: o
	};
}, s = (e, t) => e.length / (t[1] - t[0]), c = (e, t, n) => {
	let r = n;
	for (let n = 0; n < e.length; n++, r++) if (r = t.indexOf(e[n], r), r < 0) return;
	let i = r;
	for (let n = e.length - 1; n >= 0; n--) i = t.lastIndexOf(e[n], i - 1);
	return {
		score: s(e, [i, r]),
		match: [i, r]
	};
}, l = (e, t) => {
	if (!e) return;
	let r;
	e = n(e), t = n(t);
	for (let n = 0; t.length - n >= e.length;) {
		let i = c(e, t, n);
		if (!i) break;
		if (i.score === 1) return i;
		(!r || i.score > r.score) && (r = i), n += (Math.floor((i.match[0] - n) / e.length) + 1) * e.length;
	}
	return r;
}, u = (e) => typeof e == "object" && !!e && !Array.isArray(e), d = (e) => u(e) && typeof e.href == "string" && (typeof e.value == "string" || u(e.value)) && Object.keys(e).length === 2, f = (e, t, n, r, i) => {
	if (Array.isArray(t)) return t.map((t) => f(e, t, n, !0, i)).filter((e) => e !== void 0);
	if (d(t)) {
		let a = f(e, t.value, n, r, i);
		return a && {
			...a,
			href: t.href
		};
	}
	if (typeof t == "string") {
		let i = l(e, t);
		i && i.score < (n.threshold ?? .4) && (i = void 0);
		let a = o(t, i?.match, n.length);
		return {
			value: r ? t : a.haystack,
			...a.match === void 0 ? {} : { match: a.match },
			score: i?.score ?? 0
		};
	}
	if (u(t)) return p(e, t, n, i);
}, p = (e, t, n, r = !1) => {
	let i = {}, a = {
		value: t,
		matches: i,
		score: 0
	}, o = (e, t, n, r) => {
		let i = e.score && e.score + t;
		!i || i <= a.score || (a.score = i, a.match = r === void 0 ? { key: n } : {
			key: n,
			index: r
		});
	};
	for (let { key: a, tier: s } of n.fields ?? []) {
		let c = f(e, t[a], n, !1, !0);
		c && (i[a] = c, Array.isArray(c) ? c.forEach((e, t) => o(e, r ? 0 : s, a, t)) : o(c, r ? 0 : s, a));
	}
	return a;
}, m = (e, t, ...[n = {}]) => f(e, t, n, !1, !1), h = (e, t = Infinity) => e.filter(({ score: e }) => e).sort((e, t) => t.score - e.score).slice(0, t);
export { p as n, h as r, m as t };

//# sourceMappingURL=match-9CZE6ooY.js.map
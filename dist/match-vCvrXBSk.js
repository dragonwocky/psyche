// src/fuzz.ts
var e = (e) => {
	let t = /* @__PURE__ */ new Map();
	return (n = "") => {
		let r = t.get(n);
		return r === void 0 && t.set(n, r = e(n)), r;
	};
}, t = e((e) => e.trim().replace(/\n+/g, "\n").replace(/[^\S\n]+/g, " ")), n = e((e) => t(e).replace(/\n/g, " ").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").toLowerCase()), r = (e, t) => {
	if (t <= 0) return "";
	if (e.length <= t) return e;
	let n = "...";
	t <= n.length && (n = ""), e = e.slice(e.length - (t - n.length));
	let r = e.search(/\s/);
	return r !== -1 && (e = e.slice(r)), n + e.replace(/^[.\s]+/, "");
}, i = (e, t) => {
	if (t <= 0) return "";
	if (e.length <= t) return e;
	let n = "...";
	t <= n.length && (n = ""), e = e.slice(0, t - n.length);
	let r = e.search(/\s\S*$/);
	return r !== -1 && (e = e.slice(0, r + 1)), e.replace(/[.\s]+$/, "") + n;
}, a = (e, n, a = 192) => {
	if (e = t(e), !n) return { haystack: i(e, a) };
	let o = e.slice(n[0], n[1]);
	if (n[1] - n[0] >= a) {
		let e = i(o, a);
		return {
			haystack: e,
			match: e.replace(/\.\.\.$/, "")
		};
	}
	let s = a - o.length, c = e.indexOf("\n", n[1]), l = c >= 0 && !o.includes("\n") ? e.indexOf("\n", c + 1) : c, u = e.slice(n[1], l >= 0 ? l : void 0), d = e.slice(e.lastIndexOf("\n", n[0] - 1) + 1, n[0]);
	return u = i(u, s - r(d, s * .25).length), d = r(d, s - u.length), {
		haystack: d + o + u,
		match: o
	};
}, o = (e, t) => e.length / (t[1] - t[0]), s = (e, t, n) => {
	let r = n;
	for (let n = 0; n < e.length; n++, r++) if (r = t.indexOf(e[n], r), r < 0) return;
	let i = r;
	for (let n = e.length - 1; n >= 0; n--) i = t.lastIndexOf(e[n], i - 1);
	return {
		score: o(e, [i, r]),
		match: [i, r]
	};
}, c = (e, t) => {
	if (!e) return;
	let r;
	e = n(e), t = n(t);
	for (let n = 0; t.length - n >= e.length;) {
		let i = s(e, t, n);
		if (!i) break;
		if (i.score === 1) return i;
		(!r || i.score > r.score) && (r = i), n = i.match[0] + 1;
	}
	return r;
}, l = (e) => typeof e == "object" && !!e && !Array.isArray(e), u = (e) => l(e) && typeof e.href == "string" && (typeof e.value == "string" || l(e.value)) && Object.keys(e).length === 2, d = (e, t, n, r, i) => {
	if (Array.isArray(t)) return t.map((t) => d(e, t, n, !0, i)).filter((e) => e !== void 0);
	if (u(t)) {
		let a = d(e, t.value, n, r, i);
		return a && {
			...a,
			href: t.href
		};
	}
	if (typeof t == "string") {
		let i = c(e, t);
		i && i.score < (n.threshold ?? .4) && (i = void 0);
		let o = a(t, i?.match, n.length);
		return {
			value: r ? t : o.haystack,
			...o.match === void 0 ? {} : { match: o.match },
			score: i?.score ?? 0
		};
	}
	if (l(t)) return f(e, t, n, i);
}, f = (e, t, n, r = !1) => {
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
		let c = d(e, t[a], n, !1, !0);
		c && (i[a] = c, Array.isArray(c) ? c.forEach((e, t) => o(e, r ? 0 : s, a, t)) : o(c, r ? 0 : s, a));
	}
	return a;
}, p = (e, t, ...[n = {}]) => d(e, t, n, !1, !1), m = (e, t = Infinity) => e.filter(({ score: e }) => e).sort((e, t) => t.score - e.score).slice(0, t);
export { f as n, m as r, p as t };

//# sourceMappingURL=match-vCvrXBSk.js.map
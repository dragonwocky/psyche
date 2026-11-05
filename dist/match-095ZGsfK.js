// src/fuzz.ts
var memo = (fn) => {
	const cache = /* @__PURE__ */ new Map();
	return (str = "") => {
		let result = cache.get(str);
		if (result === void 0) cache.set(str, result = fn(str));
		return result;
	};
};
var sanitise = memo((str) => str.trim().replace(/\n+/g, "\n").replace(/[^\S\n]+/g, " ").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'"));
var trimStart = (str = "") => {
	if (str.startsWith("...")) str = str.slice(3);
	let i = 0;
	while (i < str.length && /[^\s]/.test(str[i])) i++;
	str = str.slice(i).trimStart();
	return str ? "..." + str : "";
};
var trimEnd = (str = "") => {
	if (str.endsWith("...")) str = str.slice(0, -3);
	let i = str.length - 1;
	while (i > 0 && /[^\s]/.test(str[i])) i--;
	str = str.slice(0, i).trimEnd();
	return str ? str + "..." : "";
};
var NO_MATCH = [
	0,
	-1,
	-1
];
var searchitise = memo((str) => sanitise(str).replace(/\n+/g, " ").toLocaleLowerCase());
var find = (needle, haystack, from) => {
	let end = from, first = -1;
	for (let i = 0; i < needle.length; i++, end++) {
		end = haystack.indexOf(needle[i], end);
		if (end < 0) return;
		if (!i) first = end;
	}
	let start = end;
	for (let i = needle.length - 1; i >= 0; i--) start = haystack.lastIndexOf(needle[i], start - 1);
	return {
		match: [
			needle.length / (end - start),
			start,
			end
		],
		first
	};
};
var fuzz = (needle, haystack, threshold = .4) => {
	if (!needle) return NO_MATCH;
	needle = searchitise(needle);
	haystack = searchitise(haystack);
	let best = NO_MATCH;
	for (let i = 0; haystack.length - i >= needle.length;) {
		const found = find(needle, haystack, i);
		if (!found) break;
		if (found.match[0] > threshold && found.match[0] > best[0]) best = found.match;
		if (best[0] === 1) break;
		i += (Math.floor((found.first - i) / needle.length) + 1) * needle.length;
	}
	return best;
};
var head = (str, length) => str.length > length * 2 ? str.slice(0, length * 2) : str;
var tail = (str, length) => str.length > length * 2 ? str.slice(-length * 2) : str;
var balance = ([fscore, f0, f1], haystack, { excerpt = 192, lead = .25 } = {}) => {
	haystack = sanitise(haystack);
	if (!fscore) {
		let h = head(haystack, excerpt);
		while (h.length > excerpt) h = trimEnd(h);
		return { text: h };
	} else if (f1 > f0 + excerpt) {
		let h = head(haystack.slice(f0, f1), excerpt);
		while (h.length > excerpt) h = trimEnd(h);
		return {
			text: h,
			match: h.replace(/\.\.\.$/, "")
		};
	} else {
		let h0 = haystack.slice(0, f0), h1 = haystack.slice(f1), line1 = h1.indexOf("\n");
		const h = haystack.slice(f0, f1), line0 = h0.lastIndexOf("\n"), context = excerpt - h.length, context0 = context * lead, context1 = context - context0;
		if (line1 > 0 && !h.includes("\n")) line1 = h1.indexOf("\n", line1 + 1);
		if (line1 > 0) h1 = h1.slice(0, line1);
		if (line0 > 0) h0 = h0.slice(line0 + 1);
		h0 = tail(h0, excerpt);
		h1 = head(h1, excerpt);
		while (h0.length > context0) h0 = trimStart(h0);
		while (h1.length > context1) h1 = trimEnd(h1);
		return {
			text: h0 + h + h1,
			match: h
		};
	}
};
// src/matcher.ts
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isLinked = (value) => isRecord(value) && typeof value.href === "string" && (typeof value.value === "string" || isRecord(value.value)) && Object.keys(value).length === 2;
var matchText = (query, text, options, whole) => {
	const fuzzed = fuzz(query, text, options.threshold), excerpt = balance(fuzzed, text, options);
	return {
		value: whole ? text : excerpt.text,
		...excerpt.match === void 0 ? {} : { match: excerpt.match },
		score: fuzzed[0]
	};
};
var matchValue = (query, value, options, whole, nested) => {
	if (isLinked(value)) {
		const matched = matchValue(query, value.value, options, whole, nested);
		return matched && {
			...matched,
			href: value.href
		};
	}
	if (typeof value === "string") return matchText(query, value, options, whole);
	if (isRecord(value)) return matchRecord(query, value, options, nested);
};
var matchRecord = (query, record, options, nested) => {
	const matches = {}, result = {
		value: record,
		matches,
		score: 0
	}, best = (score, key, index) => {
		if (!score || score <= result.score) return;
		result.score = score;
		result.match = index === void 0 ? { key } : {
			key,
			index
		};
	};
	for (const { key, tier: fieldTier } of options.fields ?? []) {
		const value = record[key], tier = nested ? 0 : fieldTier;
		if (Array.isArray(value)) {
			const items = value.map((item) => matchValue(query, item, options, true, true)).filter((item) => item !== void 0);
			matches[key] = items;
			items.forEach((item, index) => best(item.score && item.score + tier, key, index));
		} else {
			const item = matchValue(query, value, options, false, true);
			if (!item) continue;
			matches[key] = item;
			best(item.score && item.score + tier, key);
		}
	}
	return result;
};
var matchEntries = (query, entries, options) => entries.map(({ value, href }) => ({
	...matchRecord(query, value, options, false),
	href
}));
// src/match.ts
var match = (query, input, ...[options = {}]) => Array.isArray(input) ? input.map((item) => matchValue(query, item, options, true, false)) : matchValue(query, input, options, false, false);
var rank = (matches, limit = Infinity) => matches.filter(({ score }) => score).sort((a, b) => b.score - a.score).slice(0, limit);
export { rank as n, matchEntries as r, match as t };

//# sourceMappingURL=match-095ZGsfK.js.map
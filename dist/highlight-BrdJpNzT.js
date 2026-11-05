// src/href.ts
var BASE = "psyche:/";
var url = (href, base = "") => new URL(href, new URL(base, BASE));
var resolve = (href, base = "") => {
	const resolved = url(href, base);
	return resolved.protocol === "psyche:" ? resolved.pathname + resolved.search + resolved.hash : resolved.href;
};
var fragmentOf = (href, base = "", page = base) => {
	if (!href) return;
	const resolved = url(href, base), on = url(page);
	return resolved.hash && resolved.origin === on.origin && resolved.pathname === on.pathname ? decodeURIComponent(resolved.hash.slice(1)) : void 0;
};
var linkOf = (match) => {
	const { href = "", match: best, matches } = match, field = best && matches[best.key], value = Array.isArray(field) ? field[best.index] : field;
	return value?.href ? resolve(value.href, href) : href;
};
// src/highlight.ts
var QUOTES = {
	"“": "\"",
	"”": "\"",
	"‘": "'",
	"’": "'"
};
var SPACE = /\s/;
var normalise = (char) => QUOTES[char] ?? char;
var textNodes = ($root) => {
	const tree = document.createTreeWalker($root, NodeFilter.SHOW_TEXT), nodes = [];
	while (tree.nextNode()) nodes.push(tree.currentNode);
	return nodes;
};
var rangeOf = ($root, text) => {
	if (!$root || !text) return;
	const needle = text.split("").filter((char) => !SPACE.test(char)).map(normalise).join("");
	if (!needle) return;
	let haystack = "";
	const at = [];
	for (const node of textNodes($root)) for (let i = 0; i < node.data.length; i++) {
		if (SPACE.test(node.data[i])) continue;
		haystack += normalise(node.data[i]);
		at.push([node, i]);
	}
	const index = haystack.indexOf(needle);
	if (index === -1) return;
	const range = new Range(), end = at[index + needle.length - 1];
	range.setStart(...at[index]);
	range.setEnd(end[0], end[1] + 1);
	return range;
};
var isValue = (match) => typeof match?.value === "string";
var isElement = (target) => typeof Element !== "undefined" && target instanceof Element;
var select = ($el, text) => {
	const range = rangeOf($el, text);
	return range ? [range] : [];
};
var fieldsOf = (match) => Object.entries("matches" in match ? match.matches : match);
var inPage = ($page, match, base, page) => {
	const href = match.href;
	base = href ? resolve(href, base) : base;
	page ??= base;
	return fieldsOf(match).flatMap(([, value]) => (Array.isArray(value) ? value : [value]).flatMap((item) => {
		const id = fragmentOf(item?.href, base, page), $el = id ? $page.ownerDocument.getElementById(id) : void 0;
		if ($el) return isValue(item) ? select($el, item.match) : inPage($el, item, base, page);
		if (Array.isArray(value) || !item) return [];
		return isValue(item) ? select($page, item.match) : inPage($page, item, base, page);
	}));
};
var rangesOf = (target, match) => {
	if (!match) return [];
	if (Array.isArray(match)) {
		const $items = Array.isArray(target) ? target : [];
		return match.flatMap((item, i) => rangesOf($items[i], item));
	}
	if (isValue(match)) return select(Array.isArray(target) ? target[0] : target, match.match);
	if (Array.isArray(target) || !target) return [];
	if (isElement(target)) return inPage(target, match);
	const $fields = target;
	return fieldsOf(match).flatMap(([key, value]) => rangesOf($fields[key], value));
};
var registry = (name) => {
	if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
	let highlight = CSS.highlights.get(name);
	if (!highlight) CSS.highlights.set(name, highlight = new Highlight());
	return highlight;
};
var highlight = (ranges, name = "psyche") => {
	let added = [...ranges];
	for (const range of added) registry(name)?.add(range);
	return () => {
		for (const range of added) registry(name)?.delete(range);
		added = [];
	};
};
export { rangesOf as n, linkOf as r, highlight as t };

//# sourceMappingURL=highlight-BrdJpNzT.js.map
import { n as rank, r as matchEntries } from "./match-095ZGsfK.js";
// \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
// src/handler.ts
var handler_exports = /* @__PURE__ */ __exportAll({ createHandler: () => createHandler });
var path = (url) => url.pathname.replace(/(.)\/$/, "$1");
var locate = (entries, url) => {
	let found, most = -1;
	for (const entry of entries) {
		const link = new URL(entry.href, url), params = [...link.searchParams];
		if (path(link) !== path(url) || params.length <= most) continue;
		if (!params.every(([key, value]) => url.searchParams.getAll(key).includes(value))) continue;
		found = entry;
		most = params.length;
	}
	return found;
};
var createHandler = () => {
	let fields = [], options, entries;
	const load = () => !options ? Promise.resolve([]) : entries ??= (typeof options.index === "string" ? fetch(options.index).then((res) => res.ok ? res.json() : Promise.reject(res)) : options.index()).catch(() => {
		entries = void 0;
		return [];
	}), matchAll = (query, entries) => matchEntries(query, entries, {
		...options,
		fields
	}), toResult = ({ value, ...match }) => {
		const rest = {};
		for (const [key, item] of Object.entries(value)) if (!fields.some((field) => field.key === key)) rest[key] = item;
		return {
			...match,
			value: rest
		};
	};
	return async (request) => {
		if (request.type === "init") {
			({fields} = request);
			options = request.options;
			return;
		}
		const all = await load();
		if (request.type === "search") return rank(matchAll(request.query, all), options?.limit ?? 6).map(toResult);
		if (request.type === "sitemap") return matchAll("", all).map(toResult);
		if (request.type === "locate") {
			const entry = locate(all, new URL(request.href));
			return entry && matchAll(request.query, [entry])[0];
		}
	};
};
export { handler_exports as n, createHandler as t };

//# sourceMappingURL=handler-DEbkHyaf.js.map
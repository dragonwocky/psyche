import { n as rangesOf, r as linkOf, t as highlight } from "./highlight-BrdJpNzT.js";
import { isShortcut } from "./keys.js";
// src/store.ts
var withoutHash = (href) => href.replace(/#.*$/, "");
var boxOf = (node) => {
	let $el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
	while ($el && !$el.getClientRects().length) $el = $el.parentElement;
	return $el;
};
var searchHref = (link, _result, query) => {
	const url = new URL(link, location.href);
	if (query) url.searchParams.set("search", query);
	return url.href;
};
var groupsOf = (results, group) => {
	const groups = /* @__PURE__ */ new Map();
	results.forEach((result, index) => {
		const key = group ? result.value[group] : void 0;
		if (!groups.has(key)) groups.set(key, {
			group: key,
			results: []
		});
		groups.get(key).results.push({
			result,
			index
		});
	});
	return [...groups.values()];
};
var startWorker = (Worker) => new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
var originWorker = () => class extends Worker {
	constructor(url, options) {
		const { pathname, search } = new URL(url, location.href);
		super(new URL(pathname + search, location.origin), options);
	}
};
var createSearch = (options) => {
	const { fields, group, navigate = (href) => location.assign(href), onOpen, onLoad, root = "article", loadEvent = "load" } = options;
	const indexOptions = () => {
		const { index, limit, excerpt, lead, threshold } = options;
		return {
			index: typeof index === "function" ? index : new URL(index, location.href).href,
			limit,
			excerpt,
			lead,
			threshold
		};
	};
	let worker, handler, requests = 0;
	const pending = /* @__PURE__ */ new Map(), ask = (request) => {
		if (options.worker === false) {
			handler ??= import("./handler-DEbkHyaf.js").then((n) => n.n).then(async ({ createHandler }) => {
				const handle = createHandler();
				await handle({
					type: "init",
					fields,
					options: indexOptions()
				});
				return handle;
			});
			return handler.then((handle) => handle(request));
		}
		if (!worker) {
			const Worker = options.origin ? originWorker() : globalThis.Worker;
			worker = options.worker ? new Worker(new URL(options.worker, location.href), { type: "module" }) : startWorker(Worker);
			worker.onmessage = ({ data }) => {
				pending.get(data.id)?.(data.response);
				pending.delete(data.id);
			};
			worker.postMessage({
				type: "init",
				fields,
				options: indexOptions(),
				id: 0
			});
		}
		const id = ++requests;
		worker.postMessage({
			...request,
			id
		});
		return new Promise((resolve) => pending.set(id, resolve));
	};
	let state = {
		open: false,
		query: "",
		loading: false,
		results: [],
		groups: [],
		selected: 0,
		page: { query: "" }
	};
	const listeners = /* @__PURE__ */ new Set(), set = (patch) => {
		if (patch.results) {
			patch.groups = groupsOf(patch.results, group);
			$results.length = 0;
			$fields.clear();
		}
		state = {
			...state,
			...patch
		};
		for (const listener of listeners) listener(state);
		if (patch.results || patch.open) queueMicrotask(highlightResults);
	};
	let $input;
	const $results = [], $fields = /* @__PURE__ */ new Map(), refs = {
		input: (el) => $input = el,
		result: (i) => (el) => $results[i] = el,
		field: (i, key, item) => (el) => {
			const id = `${i}:${key}`;
			if (item === void 0) return $fields.set(id, el);
			const items = $fields.get(id);
			if (Array.isArray(items)) items[item] = el;
			else $fields.set(id, Object.assign([], { [item]: el }));
		}
	};
	const replacing = () => {
		let remove = () => {};
		return (ranges) => {
			remove();
			remove = highlight(ranges);
		};
	}, resultHighlights = replacing(), pageHighlights = replacing(), highlightResults = () => resultHighlights(state.results.flatMap((result, i) => rangesOf(Object.fromEntries(fields.map(({ key }) => [key, $fields.get(`${i}:${key}`)])), result))), scrollToSelected = () => $results[state.selected]?.scrollIntoView({ block: "center" });
	const href = (result) => {
		return new URL((options.href ?? searchHref)(linkOf(result), result, state.query), location.href).href;
	}, search = async (query) => {
		set({ loading: true });
		let results = await ask(query ? {
			type: "search",
			query
		} : { type: "sitemap" });
		if (query !== state.query) return;
		if (!query && options.sitemap) results = results.filter(options.sitemap);
		set({
			loading: false,
			results,
			selected: Math.max(Math.min(state.selected, results.length - 1), 0)
		});
		scrollToSelected();
	}, input = (query) => {
		set({ query });
		search(query);
	};
	const open = () => {
		if (state.open) return;
		set({ open: true });
		ask({ type: "load" });
		if (!state.query && !state.results.length) search("");
		onOpen?.();
		$input?.focus();
	}, close = () => {
		if (!state.open) return;
		set({ open: false });
		$input?.blur();
	}, toggle = () => state.open ? close() : open(), select = (i) => set({ selected: Math.max(Math.min(i, state.results.length - 1), 0) }), selectPrevious = () => {
		$input?.focus();
		select(state.selected - 1);
		scrollToSelected();
	}, selectNext = () => {
		$input?.focus();
		select(state.selected + 1);
		scrollToSelected();
	}, visit = (i = state.selected) => {
		const result = state.results[i];
		if (!result) return;
		const url = href(result), $a = $results[i], here = withoutHash(url) === withoutHash(location.href);
		set({
			query: "",
			results: []
		});
		navigate(url, { sourceElement: $a });
		close();
		if (here) setTimeout(() => onPageLoad(true));
	};
	let loaded, observer;
	const searchPage = async ($page, query) => {
		const located = await ask({
			type: "locate",
			query,
			href: location.href
		});
		if (query !== new URL(location.href).searchParams.get("search")) return;
		set({ page: {
			query,
			located
		} });
		if (onLoad?.({
			query,
			located
		}) === true || !located) return pageHighlights([]);
		let ranges = rangesOf($page, located);
		pageHighlights(ranges);
		boxOf(ranges[0]?.commonAncestorContainer)?.scrollIntoView();
		observer = new MutationObserver(() => {
			if (!ranges.some((range) => range.collapsed)) return;
			ranges = rangesOf($page, located);
			pageHighlights(ranges);
		});
		observer.observe($page, {
			childList: true,
			subtree: true,
			characterData: true
		});
	}, onPageLoad = (force = false) => {
		if (!force && loaded === location.href) return;
		loaded = location.href;
		observer?.disconnect();
		const query = new URL(location.href).searchParams.get("search") ?? "", $page = document.querySelector(root);
		set({ page: { query } });
		if (query && $page) searchPage($page, query);
		else {
			pageHighlights([]);
			onLoad?.({ query });
		}
		if (query) input(query);
	};
	const connect = () => {
		const onKeydown = (event) => {
			if (!state.open) return;
			if (isShortcut(event, "Escape")) close();
			if (isShortcut(event, "ArrowUp")) {
				event.preventDefault();
				selectPrevious();
			}
			if (isShortcut(event, "ArrowDown")) {
				event.preventDefault();
				selectNext();
			}
			if (isShortcut(event, "Enter") && document.activeElement === $input) {
				event.preventDefault();
				visit();
			}
			if (isShortcut(event, "/") && document.activeElement !== $input) {
				event.preventDefault();
				$input?.focus();
			}
		}, onLoadEvent = (event) => {
			if (event.target instanceof Element) return;
			queueMicrotask(highlightResults);
			onPageLoad();
		};
		document.addEventListener("keydown", onKeydown);
		addEventListener(loadEvent, onLoadEvent, { capture: true });
		if (document.readyState === "complete") onPageLoad();
		else if (loadEvent !== "load") addEventListener("load", onLoadEvent, { once: true });
		return () => {
			document.removeEventListener("keydown", onKeydown);
			removeEventListener(loadEvent, onLoadEvent, { capture: true });
			removeEventListener("load", onLoadEvent);
			observer?.disconnect();
			resultHighlights([]);
			pageHighlights([]);
			loaded = void 0;
		};
	};
	return {
		getState: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => void listeners.delete(listener);
		},
		open,
		close,
		toggle,
		input,
		select,
		selectPrevious,
		selectNext,
		visit,
		href,
		connect,
		refs,
		fields
	};
};
export { createSearch };

//# sourceMappingURL=index.js.map
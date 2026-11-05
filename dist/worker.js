import { t as createHandler } from "./handler-DEbkHyaf.js";
// src/worker.ts
var handle = createHandler();
self.onmessage = async ({ data }) => {
	self.postMessage({
		id: data.id,
		response: await handle(data)
	});
};

//# sourceMappingURL=worker.js.map
import { t as e } from "./handler-65JZJ8fG.js";
// src/worker.ts
var t = e();
self.onmessage = async ({ data: e }) => {
	self.postMessage({
		id: e.id,
		response: await t(e)
	});
};

//# sourceMappingURL=worker.js.map
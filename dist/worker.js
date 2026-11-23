import { t as e } from "./handler-_yQu_JCW.js";
// src/worker.ts
var t = e();
self.onmessage = async ({ data: e }) => {
	self.postMessage({
		id: e.id,
		response: await t(e)
	});
};

//# sourceMappingURL=worker.js.map
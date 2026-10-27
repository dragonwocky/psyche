import { mount, openSearch } from "psyche";

mount({ worker: "/search.worker.js" });
document.querySelector("#search")?.addEventListener("click", openSearch);

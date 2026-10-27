import { mount, openSearch } from "psyche";

mount({ worker: "/search.worker.js", darkMode: "media" });
document.querySelector("#search")?.addEventListener("click", openSearch);

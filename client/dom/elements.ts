/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

/// <reference lib="dom" />

import type { ClientConfig, Result } from "../../types.d.ts";
import { feather, html, isMac, render, safe } from "../util.ts";
import { properties, scoped } from "./styles.ts";
import { clearInput, close, search } from "./triggers.ts";

class SearchComponent extends HTMLElement {}

customElements.define("psyche-search", SearchComponent);

const highlightContent = (content: string, query: string) => {
  if (!query.length) return safe(content);
  const caseInsensitiveQuery = `(${
    safe(query).replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
  })`;
  return safe(content).replace(
    new RegExp(caseInsensitiveQuery, "ig"),
    (match) => html`<mark class="search-result-highlight">${match}</mark>`,
  );
};

const constructResult = (result: Result, query: string) => {
  let icon = result.icon;
  if (!icon) {
    switch (result.type) {
      case "page":
        icon = "file-text";
        break;
      case "heading":
        icon = "hash";
        break;
      case "list":
        icon = "list";
        break;
      case "code":
        icon = "code";
        break;
      case "paragraph":
      default:
        icon = "align-left";
    }
  }
  const description = result.description
    ? html`<p class="psyche-result-desc">${safe(result.description)}</p>`
    : "";
  /* deno-fmt-ignore */
  return html`<li><a class=psyche-result href=${safe(result.url)}>${feather(icon, "psyche-result-icon")}<div><p class=psyche-result-content>${highlightContent(result.content, query)}</p>${description}</div></a>`;
};

const constructSection = (
  section: string,
  results: Result[],
  query: string,
) => {
  /* deno-fmt-ignore */
  return html`<ul class=psyche-result-list><li class=psyche-result-section>${safe(section)}</li>${results.map((r) => constructResult(r, query)).join("")}</ul>`;
};

const construct = (config: ClientConfig) => {
  const $ = <SearchComponent> render(html`<psyche-search></psyche-search>`);
  $.append(render(html`<style>${properties(config)}</style>`));
  $.attachShadow({ mode: "open" });
  const $root = $.shadowRoot!;

  const modifier = isMac ? "⌘" : "CTRL",
    hotkeys = config.hotkeys.map(({ kbd, label }) => {
      kbd = kbd.replaceAll("{{platformModifier}}", modifier);
      return html`<p class="psyche-hotkey"><kbd>${kbd}</kbd> ${label}</p>`;
    }).join("");

  /* deno-fmt-ignore */
  const branding = html`<svg fill=none viewBox="0 0 128 128"xmlns=http://www.w3.org/2000/svg><mask fill=#fff id=a><path d="M84.5 113c11.3218 0 20.5-7.611 20.5-17 0-9.3888-9.1782-17-20.5-17-9.9433 0-18.2331 5.8705-20.1045 13.66C63.3648 92.2366 62.214 92 61 92c-4.4183 0-8 3.134-8 7s3.5817 7 8 7c2.118 0 4.0437-.72 5.4748-1.896C69.9464 109.403 76.7167 113 84.5 113Z"clip-rule=evenodd fill-rule=evenodd /></mask><path d="M84.5 113c11.3218 0 20.5-7.611 20.5-17 0-9.3888-9.1782-17-20.5-17-9.9433 0-18.2331 5.8705-20.1045 13.66C63.3648 92.2366 62.214 92 61 92c-4.4183 0-8 3.134-8 7s3.5817 7 8 7c2.118 0 4.0437-.72 5.4748-1.896C69.9464 109.403 76.7167 113 84.5 113Z"clip-rule=evenodd fill-rule=evenodd fill=#EA596E /><path d="m64.3955 92.66-.3799.925 1.0796.4435.2727-1.1349-.9724-.2336Zm2.0793 11.444.8365-.548-.6105-.932-.8608.707.6348.773ZM104 96c0 8.669-8.5471 16-19.5 16v2c11.6907 0 21.5-7.892 21.5-18h-2ZM84.5 80c10.9529 0 19.5 7.3305 19.5 16h2c0-10.1082-9.8093-18-21.5-18v2ZM65.3679 92.8936C67.1065 85.6564 74.9042 80 84.5 80v-2c-10.2907 0-19.0728 6.0846-21.0768 14.4264l1.9447.4672ZM61 93c1.0839 0 2.1056.2112 3.0156.585l.7599-1.85C63.624 91.262 62.3441 91 61 91v2Zm-7 6c0-3.1925 3.0044-6 7-6v-2c-4.841 0-9 3.4605-9 8h2Zm7 6c-3.9956 0-7-2.808-7-6h-2c0 4.54 4.159 8 9 8v-2Zm4.84-1.669C64.5923 104.357 62.8923 105 61 105v2c2.3437 0 4.4952-.797 6.1096-2.123l-1.2696-1.546ZM84.5 112c-7.4908 0-13.9251-3.463-17.1887-8.444l-1.6729 1.096C69.318 110.268 76.4241 114 84.5 114v-2Z"fill=#DD2E44 mask=url(#a) /><mask fill=#fff id=b><path d="M21.3427 86.2292c-6.4975-1.5231-11.78647-4.8396-14.99071-9.943-9.03094-14.3837 1.91792-37.5149 24.45501-51.665 17.2077-10.8042 36.1959-13.2487 48.2337-7.3981 8.1126-.4664 14.7956 1.8449 18.0416 7.0147.3061.4877.5761.9918.8106 1.5109 6.3311 1.1548 11.1791 4.1222 13.3411 8.7969.557 1.2044.912 2.4712 1.077 3.7837 3.184 1.8554 5.56 4.3954 6.819 7.5697 1.038 2.6159 1.228 5.4381.676 8.3277 2.479 3.0397 4.028 6.534 4.382 10.3349.221 2.3841-.042 4.7363-.732 7.0087 1.299 4.018 1.36 8.1894-.081 12.0941-4.211 11.4127-19.658 16.2245-34.5001 10.7476-.5675-.2094-1.1259-.4308-1.6749-.6636-3.8364.2209-7.5576.0353-11.0735-.5069-3.6235 3.3388-7.9933 5.9853-12.967 7.6535-15.9883 5.363-33.0938-1.1017-41.8168-14.6658Z"clip-rule=evenodd fill-rule=evenodd /></mask><path d="M21.3427 86.2292c-6.4975-1.5231-11.78647-4.8396-14.99071-9.943-9.03094-14.3837 1.91792-37.5149 24.45501-51.665 17.2077-10.8042 36.1959-13.2487 48.2337-7.3981 8.1126-.4664 14.7956 1.8449 18.0416 7.0147.3061.4877.5761.9918.8106 1.5109 6.3311 1.1548 11.1791 4.1222 13.3411 8.7969.557 1.2044.912 2.4712 1.077 3.7837 3.184 1.8554 5.56 4.3954 6.819 7.5697 1.038 2.6159 1.228 5.4381.676 8.3277 2.479 3.0397 4.028 6.534 4.382 10.3349.221 2.3841-.042 4.7363-.732 7.0087 1.299 4.018 1.36 8.1894-.081 12.0941-4.211 11.4127-19.658 16.2245-34.5001 10.7476-.5675-.2094-1.1259-.4308-1.6749-.6636-3.8364.2209-7.5576.0353-11.0735-.5069-3.6235 3.3388-7.9933 5.9853-12.967 7.6535-15.9883 5.363-33.0938-1.1017-41.8168-14.6658Z"clip-rule=evenodd fill-rule=evenodd fill=#F4ABBA /><path d="m6.35199 76.2862-.84691.5317.84691-.5317Zm14.99071 9.943.8411-.5409-.2189-.3403-.3939-.0924-.2283.9736Zm9.4643-61.608.5317.8469-.5317-.8469Zm48.2337-7.3981-.4371.8994.2344.1139.2601-.0149-.0574-.9984Zm18.0416 7.0147-.847.5318.847-.5318Zm.8106 1.5109-.9112.4118.2159.4778.5159.0941.1794-.9837Zm13.3411 8.7969.907-.4198-.907.4198Zm1.077 3.7837-.992.125.062.4903.427.2487.503-.864Zm6.819 7.5697.93-.3687-.93.3687Zm.676 8.3277-.982-.1874-.088.458.295.3614.775-.632Zm4.382 10.3349-.996.0926.996-.0926Zm-.732 7.0087-.956-.2904-.091.2998.096.2981.951-.3075Zm-.081 12.0941.938.3462-.938-.3462ZM88.8749 94.412l.3461-.9381-.3461.9381ZM87.2 93.7484l.3905-.9206-.2149-.0912-.2331.0134.0575.9984Zm-11.0735-.5069.1525-.9884-.4759-.0733-.3542.3262.6776.7355Zm-12.967 7.6535.318.948-.318-.948ZM5.50508 76.8179c3.3742 5.3741 8.91612 8.8159 15.60942 10.3849l.4565-1.9472c-6.3019-1.4772-11.3378-4.6685-14.3721-9.5012l-1.69382 1.0635ZM30.2752 23.7743C18.87 30.9351 10.3563 40.3918 5.83762 49.9383c-4.51287 9.5341-5.092122 19.299-.33254 26.8796l1.69382-1.0635c-4.27136-6.803-3.89165-15.7955.44643-24.9604C11.9776 41.6414 20.2068 32.4574 31.3387 25.4681l-1.0635-1.6938Zm49.2027-7.4506c-12.463-6.0572-31.83-3.4571-49.2027 7.4506l1.0635 1.6938c17.0429-10.7006 35.6521-12.9896 47.2649-7.3456l.8743-1.7988Zm18.4513 7.3824c-3.5256-5.6151-10.6652-7.9574-18.9459-7.4813l.1148 1.9967c7.9446-.4568 14.1709 1.8235 17.1372 6.5481l1.6939-1.0635Zm.875 1.6308c-.2531-.5602-.5445-1.1044-.875-1.6308l-1.6939 1.0635c.2819.4488.5304.9128.7464 1.3909l1.8225-.8236Zm13.3368 8.7889c-2.347-5.0761-7.553-8.1724-14.0686-9.3609l-.3589 1.9675c6.1465 1.1212 10.6365 3.9596 12.6125 8.233l1.815-.8396Zm1.162 4.0785c-.177-1.4106-.56-2.7773-1.162-4.0785l-1.815.8396c.512 1.1076.84 2.2746.993 3.4889l1.984-.25Zm6.757 7.326c-1.356-3.4172-3.903-6.1173-7.245-8.065l-1.007 1.728c3.026 1.7631 5.23 4.1431 6.393 7.0743l1.859-.7373Zm.728 8.8838c.583-3.0523.388-6.07-.728-8.8838l-1.859.7373c.959 2.418 1.143 5.0448.623 7.7717l1.964.3748Zm4.395 10.055c-.373-4.0213-2.013-7.6993-4.602-10.8744l-1.55 1.264c2.369 2.9044 3.828 6.2149 4.161 9.7955l1.991-.1851Zm-.77 7.3917c.726-2.39 1.005-4.8723.77-7.3917l-1.991.1851c.209 2.2487-.038 4.4709-.692 6.6257l1.913.5809Zm-.1 12.1498c1.528-4.1396 1.454-8.5431.095-12.7477l-1.903.6149c1.238 3.8312 1.286 7.7707-.068 11.4404l1.876.6924ZM88.5287 95.3502c7.6102 2.8082 15.4093 2.9923 21.8803.9763 6.473-2.0163 11.669-6.2581 13.904-12.3159l-1.876-.6924c-1.976 5.3548-6.609 9.2254-12.623 11.0989-6.015 1.8738-13.3606 1.7255-20.593-.9432l-.6923 1.8763Zm-1.7192-.6812c.5636.239 1.1368.4663 1.7192.6812l.6923-1.8763c-.5525-.2039-1.0962-.4195-1.6305-.6461l-.781 1.8412Zm-10.8354-.4392c3.5866.5531 7.3782.7418 11.2834.5169l-.115-1.9967c-3.7676.217-7.4184.0345-10.8635-.4969l-.3049 1.9767Zm-.5252-1.7238c-3.522 3.2453-7.7698 5.8183-12.6074 7.4409l.636 1.8961c5.1098-1.714 9.6016-4.4338 13.3267-7.8661l-1.3553-1.4709Zm-12.6074 7.4409c-15.5439 5.2141-32.1763-1.0703-40.6577-14.2586l-1.6822 1.0818c8.9647 13.9399 26.5432 20.5849 42.9759 15.0729l-.636-1.8961Z"fill=#DD2E44 mask=url(#b) /></svg>`;

  /* deno-fmt-ignore */
  $root.append(render(html`<style>${scoped(config)}</style><div class="psyche-wrapper psyche-wrapper-hidden"><div class=psyche-shadow></div><div class=psyche-bubble><label class=psyche-input-label><input class=psyche-input placeholder=${safe(config.messages.inputPlaceholder)} type=search> ${feather("x", "psyche-input-clear")} ${feather("search", "psyche-input-icon")}</label><div class=psyche-result-scroller></div><footer class=psyche-footer><div class=psyche-hotkey-list>${hotkeys}</div><p class=psyche-copyright><span>Search by</span> <a href=https://github.com/dragonwocky/psyche>${branding}<span>psyche</span></a></footer></div></div>`));

  const $shadow = $root.querySelector(".psyche-shadow")!,
    $input = $root.querySelector(".psyche-input")!,
    $clear = $root.querySelector(".psyche-input-clear")!;
  $shadow.addEventListener("click", () => void close($));
  $input.addEventListener("input", () => void search($, config.index));
  $clear.addEventListener("click", () => void clearInput($));

  search($, config.index);
  return $;
};

const isHidden = ($: SearchComponent) => {
  const $wrapper = $.shadowRoot!.querySelector(".psyche-wrapper")!,
    isHidden = $wrapper.classList.contains("psyche-wrapper-hidden");
  return isHidden;
};

const inputHasFocus = ($: SearchComponent) => {
  const $root = $.shadowRoot!,
    $input = $root.querySelector(".psyche-input")!;
  return document.activeElement === $ && $root.activeElement === $input;
};

const getActiveResult = ($: SearchComponent) => {
  const $root = $.shadowRoot!,
    $active =
      $root.activeElement && $root.activeElement.matches(".psyche-result")
        ? <HTMLElement> $root.activeElement
        : null;
  return $active;
};

export {
  construct,
  constructSection,
  getActiveResult,
  inputHasFocus,
  isHidden,
  SearchComponent,
};

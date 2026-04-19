import {exportIndexedDB} from "../utils/export_indexeddb.js";
import {createFloatingActionButton} from "./float_btn.js";
import { createConfigWindow } from "./config_window.js";
import {download} from "../utils/download.js";
const exportTemplate = `%%%__EAGLER_TEMPLATE_HTML__%%%`;
const loaderTemplate = `%%%__LOADER_TEMPLATE_HTML__%%%`;

createFloatingActionButton(() => {
  createConfigWindow(async (title, icon, reset_on_start)=>{
    const gameData = await exportIndexedDB(["EaglerLoaderCache"]);
    const finalHTML = exportTemplate
    .replace(`\`%%%__EAGLER_GAME_MAKER_GAME_DATA__%%%\``, gameData)
    .replace(`\`%%%__EAGLER_GAME_MAKER_CONFIG__%%%\``, JSON.stringify({reset_on_start: reset_on_start}))
    .replace(/<title>.*?<\/title>/, `<title>${title || "Empty Game"}</title>`)
    .replace(/<link.*?rel="shortcut icon"[^>]*>/, `<link type="image/png" rel="shortcut icon" href="${icon}">`);
    download(finalHTML, `${title || "eagler_game_data"}.html`);
    const loaderHTML = loaderTemplate
    .replace("%%%___SAMPLE_FILE___%%%", `${title || "eagler_game_data"}.html`)
    .replace(/<title>.*?<\/title>/, `<title>${title || "Eagler Game Data Loader"}</title>`)
    .replace(/<link.*?rel="shortcut icon"[^>]*>/, `<link type="image/png" rel="shortcut icon" href="${icon}">`);
    download(loaderHTML, `index.html`);
  });
});
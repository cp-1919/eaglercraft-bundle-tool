import {importIndexedDB} from "../utils/import_indexeddb.js";

const gameData = `%%%__EAGLER_GAME_MAKER_GAME_DATA__%%%`;
const config = `%%%__EAGLER_GAME_MAKER_CONFIG__%%%`;

if(window.location.search.indexOf("noInitialModGui=true") === -1) {
    window.location.search = "noInitialModGui=true";
}

importIndexedDB(gameData, replace=config.reset_on_start);
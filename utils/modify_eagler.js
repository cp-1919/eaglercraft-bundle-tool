import {read, write} from "./utils.js";

const html = read("html/game.html")
    .replace(/<title>.*?<\/title>/, `<title>EFWC</title>`)
    .replace("EF_MODS", "EFWC_MODS");
write(html, "temp/template.html");

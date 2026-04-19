import {inject, read, write} from "./utils.js";

const js = read("temp/template/setup.iife.js");
const html = read("html/game.html");
const finalHtml = inject(js, html);
write(finalHtml, "temp/template.html");

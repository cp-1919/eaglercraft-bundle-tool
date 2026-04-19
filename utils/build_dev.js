import {inject, replace, modify, read, write} from "./utils.js";

const template = modify(read("temp/template.html"));
const loaderTemplate = modify(read("html/loader.html"));

let js = read("temp/dev/dev.iife.js");
js = replace("%%%__EAGLER_TEMPLATE_HTML__%%%", template, js);
js = replace("%%%__LOADER_TEMPLATE_HTML__%%%", loaderTemplate, js);

const html = read("html/game.html");
const finalHtml = inject(js, html);
write(finalHtml, "dist/index.html");
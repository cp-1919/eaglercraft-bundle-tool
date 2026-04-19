import fs from "fs";
import path from "path";

export function inject(js, html) {
    // Replace the first <script type="module"> tag with an inline script containing the JS
    const parts = html.split("<head>");
    parts[1] = `<script>${js}</script>` + parts[1];
    const newHtml = parts.join("<head>");
    // Write the output file
    return newHtml;
}

export function replace(pattern, replacement, str) {
    // Replace the first <script type="module"> tag with an inline script containing the JS
    const parts = str.split(pattern);
    parts[1] = replacement + parts[1];
    const newHtml = parts.join("");
    // Write the output file
    return newHtml;
}

export function modify(str) {
    return str.replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("$", "\\$")
    .replaceAll("</script>", "<\\/script>");
}

export function read(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at "${filePath}"`);
        process.exit(1);
    }
    return fs.readFileSync(filePath, "utf-8");
}

export function write(data, outputPath) {
    // Ensure the output directory exists (create recursively if needed)
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created directory: ${outputDir}`);
    }
    fs.writeFileSync(outputPath, data);
}
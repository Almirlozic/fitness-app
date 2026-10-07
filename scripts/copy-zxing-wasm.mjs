// Kopierer ZXing's WebAssembly-fil til public/, så stregkodescanneren henter den
// fra vores eget domæne i stedet for et eksternt CDN. Køres automatisk ved npm install.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const source = "node_modules/zxing-wasm/dist/reader/zxing_reader.wasm";
const target = "public/zxing/zxing_reader.wasm";

if (existsSync(source)) {
  mkdirSync("public/zxing", { recursive: true });
  copyFileSync(source, target);
  console.log(`Kopierede ${source} → ${target}`);
} else {
  console.warn(`Fandt ikke ${source} – stregkodescanneren virker ikke på iPhone`);
}

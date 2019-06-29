import { SphericalHarmonics } from "/dist/index.js";

const S = new SphericalHarmonics(5);

for (const [l, m, Slm] of S) {
  console.log(`${l} ${m} ${Slm}`);
}

console.log(S.toFunction);

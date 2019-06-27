#!/usr/bin/env node

("use strict");

const { SolidHarmonics } = require("./harmonics");

function main() {
  const lmax = 3;
  const S = new SolidHarmonics(lmax);

  for (const [l, m, Slm] of S) {
    console.log(`${l} ${m} ${Slm}`);
  }

  // Evaluate the set on grid
  const R = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
  ];

  const f = S.toFunction();
  const result = f(R);

  let i = 0;
  for (const v of result) {
    console.log(`${R[i++]} => ${v.map(x => x.toFixed(3).padStart(6, " ")).join(" ")}`);
  }

}

main();

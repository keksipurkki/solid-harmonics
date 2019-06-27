#!/usr/bin/env node

("use strict");

const { SolidHarmonicArray } = require("./harmonics");

function main() {
  const lmax = 3;
  const S = new SolidHarmonicArray(lmax);

  for (const [l, m, Slm] of S) {
    console.log(`${l} ${m} ${JSON.stringify(Slm.terms)}`);
  }

  // const Sfun = SolidHarmonics(lmax);
  // // Evaluate the set at (0,0,0), (1,0,0) and (1,1,1)
  // console.log(Sfun([[0, 0, 0], [1, 0, 0], [1, 1, 1]]));
}

main();

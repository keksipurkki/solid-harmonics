var expect    = require("chai").expect;
var SolidHarmonics = require("../");

describe("Recurrence relations", _ => {

  it("lmax = 2", done => {

    const LMAX = 2;

    var s = new SolidHarmonics(LMAX);
    done();
  
  });

  it("lmax = 10", done => {

    const LMAX = 10;

    var s = new SolidHarmonics(LMAX);
    done();

  
  });

});

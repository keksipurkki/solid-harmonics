var expect    = require("chai").expect;
var HomogeneousPolynomial = require("../lib/homogeneous-polynomial");

describe("Polynomial", _ => {

  it("terms", done => {

    const ORDER = [0, 2, 10];
    const NUMBER_OF_TERMS = [1, 6, 66];

    let p;

    for (let i=0; i < 3; i++) {

      p = new HomogeneousPolynomial(ORDER[i], 1.0);

      let termCount = 0;

      for (let term of p.terms()) {
        termCount++;
      }

      expect(termCount).to.equal(NUMBER_OF_TERMS[i]); // iterator works

      termCount = HomogeneousPolynomial.numberOfTerms(p.order);
      expect(termCount).to.equal(NUMBER_OF_TERMS[i]); // the static method works

    }

    done();
  
  });

  it("addition", done => {

    let p_1 = new HomogeneousPolynomial(3, 2.0);
    let p_2 = new HomogeneousPolynomial(3, -2.0);

    p_1.add(p_2);

    for (let term of p_1.terms()) {
      expect(term.coeff()).to.equal(0.0);
    }

    p_2 = new HomogeneousPolynomial(3, 1.0);

    p_1.add(p_2);

    for (let term of p_1.terms()) {
      expect(term.coeff()).to.equal(1.0);
    }

    p_2 = new HomogeneousPolynomial(4, 0.0);

    try {
      p_1.add(p_2);
    } catch (error) {
      expect(error).to.be.an('error');
    }

    done();
  
  });

  it("multiplication x(x + y + z)", done => {

    const P_1_ORDER = 1;
    const P_2_ORDER = 1;

    var p_1 = new HomogeneousPolynomial(P_1_ORDER);
    p_1.addTerm(1.0, [1,0,0]);

    var p_2 = new HomogeneousPolynomial(P_2_ORDER);
    p_2.addTerm(1.0, [1, 0, 0])
       .addTerm(1.0, [0, 1, 0])
       .addTerm(1.0, [0, 0, 1]);

    p_1.mul(p_2);

    expect(p_1.order).to.equal(P_1_ORDER + P_2_ORDER);

    done();
  
  });

});

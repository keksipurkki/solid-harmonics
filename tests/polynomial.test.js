const test = require("tape");
const { Monomial3D, Polynomial3D } = require("../polynomial");

test("Polynomial3D", describe => {

  describe.test("constructor / no arguments / no terms", it => {
    it.plan(1);
    const poly = new Polynomial3D();
    it.equal(poly.length, 0, "expected to have zero terms in the polynomial");
  });

  describe.test("constructor / attempt to feed in zero / ignored", it => {
    it.plan(1);
    const poly = new Polynomial3D([[1,1,1], 0]);
    it.equal(poly.length, 0, "expected to have zero terms in the polynomial");
  });

  describe.test("constructor / one term given / one term", it => {
    it.plan(1);
    const poly = new Polynomial3D([[1,2,4], 4646]);
    it.equal(poly.length, 1, "expected to have one term in the polynomial");
  });

  describe.test("constructor / polynomial / copied correctly", it => {
    it.plan(2);
    const poly_a = new Polynomial3D([[1,2,4], 4646]);
    const poly_b = new Polynomial3D(poly_a);
    const [ term, ...rest ] = poly_b.terms;
    it.deepEqual(rest, [], "expected to have one term in the polynomial");
    it.deepEqual(term, [[1,2,4], 4646], "expected to have one term in the polynomial");
  });

  describe.test("constructor / bad input / error", it => {
    it.plan(1);
    it.throws(() => new Polynomial3D(null));
  });

  describe.test("times / some value / polynomial is immutable", it => {
    it.plan(2);
    const multiplicand = new Polynomial3D([[1,0,0], 1]);
    const multiplier = new Monomial3D([1,0,0], 4);
    const { terms } = multiplicand.times(multiplier);
    it.deepEqual(terms, [[[2,0,0], 4]]);
    it.deepEqual(multiplicand.terms, [[[1,0,0], 1]]);
  });

});

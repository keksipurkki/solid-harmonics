module.exports = (_ => {

  const ndarray = require("ndarray");
  const ops = require("ndarray-ops");
  const fac = require("math-factorial");

  const DIMENSION = 3;

  function coefficientTensorOfOrder(order, value) {
    let coeff = new Float64Array( Math.pow(order + 1, DIMENSION) );
    return ndarray(coeff.fill(value), Array(DIMENSION).fill(order + 1));
  }

  class Term {

    constructor (coeff, exponents) {
      this.term = [coeff, exponents];
    }

    [Symbol.iterator]() {
      return this.term.values();
    }

    coeff() {
      return this.term[0];
    }

    exponents() {
      return this.term[1];
    }
  
  } 

  /**
   * 
   * Addition operations preserve order (= homogeneity)
   * Multiplications change the order
   * Division are not supported
   *
   */
  class HomogeneousPolynomial {

    constructor (order, value = 0.0) {

      this.order = Number(order);

      if (isNaN(this.order) || !Number.isInteger(this.order) || this.order < 0) {
        throw new TypeError("The order of a polynomial is a positive integer");
      }

      if (value.constructor == Number) {

        this._coeff = coefficientTensorOfOrder(this.order, value);

      } else {
      
        this._coeff = value;
      }
    
    }

    *terms () {

      let coeff;
      let ord = this.order + 1;

      for (let a=0; a < ord; a++) {
        for (let b=0; b < ord; b++) {
          for (let c=0; c < ord; c++) {

            if (a+b+c !== this.order) 
              continue;
           
            coeff = this._coeff.get(a,b,c);

            if ( coeff > Number.MIN_VALUE ) 
              yield new Term(coeff, [a,b,c]);

          }
        }
      }

    }

    // Addition must preserve homogeneity
    add(polynomial) {

      if (!(polynomial instanceof HomogeneousPolynomial)) 
        throw new TypeError("Polynomial addition is only supported for HomogeneousPolynomials");

      if (polynomial.order !== this.order) {
        throw new TypeError("Cannot add polynomials. The result is not a HomogeneousPolynomial");
      }

      ops.add(this._coeff, this._coeff, polynomial._coeff);
      return this;

    }

    addTerm(coeff, [a_, b_, c_]) {

      if (a_ + b_ + c_ !== this.order) {
        throw new TypeError(`Cannot add a term. The result is not a HomogeneousPolynomial of order ${this.order}`);
      }

      coeff += this._coeff.get(a_, b_, c_);
      this._coeff.set(a_, b_, c_, coeff);

      return this;
    
    }

    // Multiplication steps ups the order
    mul(polynomial) {

      if (polynomial instanceof HomogeneousPolynomial) {

        let polys = [];
        for (let term of polynomial.terms()) {
          polys.push(this.mul(term));
        }

        let newPoly = polys.shift();
        for (let poly of polys) {
          newPoly.add(poly);
        }

        this.order = newPoly.order;
        this._coeff = newPoly._coeff;

        return;

      }

      if (!(polynomial instanceof Term)) {
        throw new TypeError("Cannot multiply by a monomial. Input is not a Term.");
      }

      let coeff_ = polynomial.coeff();

      let [a_, b_, c_] = polynomial.exponents();
      let a,b,c;

      let newOrder = this.order + a_ + b_ + c_;
      let tmp = coefficientTensorOfOrder(newOrder, 0.0);

      for (let term of this.terms()) {

        [a, b, c] = term.exponents();

        tmp.set(a + a_, b + b_, c + c_, term.coeff()*coeff_);

      }


      return new HomogeneousPolynomial(newOrder, tmp);
    
    }

    // Scale all coefficients by a scalar
    scale(scalar) {
      scalar = Number(scalar);

      if (isNaN(scalar))
        throw new TypeError("Input is not a number");

      ops.mulseq(this._coeff, scalar);

    }

    static numberOfTerms(order) {
      let variables = DIMENSION - 1; 
      return fac(order + variables)/(fac(order) * fac(variables));
    }
  
  }

  return HomogeneousPolynomial;


})();

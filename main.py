#!/usr/bin/env python2

from __future__ import division
from numpy import *
import itertools as it

"""

  Fast evaluation of solid harmonics in a 3D grid of points

  Cryptic number crunching to the fullest!

"""

_idx = lambda l,m: l*(l+1) + m
_ij = lambda i,j: 1 if i==j else 0

# Fast evaluation of a set of solid harmonics
class SolidHarmonics(object):
    """
    See:

      Trygve Helgaker, Poul Jorgensen, Jeppe Olsen
      ``Molecular Electronic-Structure Theory``
      p. 215
      ISBN: 978-0-471-96755-2

      for the derivation of the recurrence relations (rec1, rec2, rec3)



    """

    def __init__(self, lmax):
      self.lmax = lmax

      self.S = self.generate(lmax)

      nrow = (lmax + 1)**2
      ncol = (lmax + 1)*(lmax + 2)*(lmax + 3)/6
      self.cache = zeros((nrow, ncol))
      self.kappa = array(list(SolidHarmonics.cartiter(lmax)))

      for l in range(0, lmax+1):
        for m in range(-l, l+1):
          for k, v in self.S[l][m].items():
            i = _idx(l,m)
            j = self.lexicopos(k, lmax)
            # Cache the coefficients
            self.cache[i,j] = v

      return

    def eval_algo__1(self, R):
      R = array(R)
      R = R.astype(float)
      S = R[:,None] ** self.kappa
      S = self.cache[:, None] * prod(S, -1)
      S = sum(S, -1)
      return S

    @staticmethod
    def lexicopos(kappa,lmax):
      a = kappa[0]
      b = kappa[1]
      c = kappa[2]
      pos = 6 + 11*a -6*a*a+a*a*a + 9*b -6*a*b -3*b*b + 6*c
      pos = pos + 12*a*lmax - 3*a*a*lmax + 6*b*lmax + 3*a*lmax*lmax
      pos = pos/6
      return pos - 1

    @staticmethod
    def cartiter(lmax):
      return it.ifilter(lambda x: x[0]+x[1]+x[2]<=lmax,
                        it.product(range(0,lmax+1),range(0,lmax+1),range(0,lmax+1)))

    @staticmethod
    def A(l):
      return sqrt( 2**(_ij(l,0))*(2*l+1.)/(2*l+2.) )

    @staticmethod
    def add_poly(a, b):
      c = a
      for k,v in b.items():
        if k in c:
          c[k] += b[k]
        else:
          c[k] = b[k]
      return c

    @staticmethod
    def rec1(S, l):
      a = array(S[l][l].keys())
      a[:,0] += 1
      v = array(S[l][l].values())
      v *= SolidHarmonics.A(l)
      Slp1lp1 = {key:val for key, val in
                 zip(map(tuple,a),v) if val}

      a = array(S[l][-l].keys())
      a[:,1] += 1
      v = array(S[l][-l].values())
      v *= - SolidHarmonics.A(l)
      p = {key:val for key, val in
           zip(map(tuple,a),v) if val}
      Slp1lp1 = SolidHarmonics.add_poly(Slp1lp1, p)
      return Slp1lp1

    @staticmethod
    def rec2(S, l):
      a = array(S[l][l].keys())
      a[:,1] += 1
      v = array(S[l][l].values())
      v *= SolidHarmonics.A(l)
      Slp1lm1 = {key:val for key, val in
                 zip(map(tuple,a),v) if val}

      a = array(S[l][-l].keys())
      a[:,0] += 1
      v = array(S[l][-l].values())
      v *= SolidHarmonics.A(l)
      p = {key:val for key, val in
           zip(map(tuple,a), v) if val}
      Slp1lm1 = SolidHarmonics.add_poly(Slp1lm1, p)
      return Slp1lm1

    @staticmethod
    def rec3(S,l,m):

        a = array(S[l][m].keys())
        a[:,2] += 1
        v = array(S[l][m].values())
        v *= (2.0*l + 1.0)/sqrt((l + m + 1.0)*(l - m + 1.0))
        Slp1m = {key:val for key, val in
                 zip(map(tuple,a),v) if val}

        if -l <= m+1 <= l:
          v = array(S[l-1][m].values())
          # Floating point division must be used
          v *= -sqrt((l + m)*(l - m)/((l + m + 1.0)*(l - m + 1.0)))
          for i in range(3):
            a = array(S[l-1][m].keys())
            # Multiplication with r**2 = x*x + y*y + z*z
            a[:,i] += 2
            p = {key:val for key, val in
                 zip(map(tuple,a),v) if val}
            Slp1m = SolidHarmonics.add_poly(Slp1m, p)

        return Slp1m


    @staticmethod
    def generate(lmax):
      """
        Recursively generate the solid harmonics

        Each monomial is identified as (i,j,k):c
        where i, j, k are exponents and c is the
        coefficient; a polynomial is then a dictionary
        of these monomials

        The solid harmonics are indexed with 0 <= l <= lmax and abs(m) <= l:
        S[l][m]

      """
      S = [ range(2*l+1) for l in range(lmax+1) ]
      S[0][0] = {(0,0,0):1.0}
      S[1][-1] = {(0,1,0):1.0}
      S[1][1] = {(1,0,0):1.0}
      S[1][0] = {(0,0,1):1.0}

      # Vertical recursion
      for l in range(1, lmax):
        S[l+1][-(l+1)] = SolidHarmonics.rec2(S,l)
        S[l+1][l+1] = SolidHarmonics.rec1(S,l)
        # Horizontal recursion
        for m in range(-l, l+1):
          S[l+1][m] = SolidHarmonics.rec3(S,l,m)

      return S

    def __call__(self, R):
      return self.eval_algo__1(R)


def main():
  lmax = 15
  S = SolidHarmonics(15)
  # Evaluate the set at (0,0,0), (1,0,0) and (1,1,1)
  print S([[0,0,0], [1,0,0], [1,1,1]])

if __name__ == '__main__':
  main()

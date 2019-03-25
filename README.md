matlab-to-julia
===============

Translates MATLAB source code into Julia.

Some of the fields that could most benefit from parallelization primarily use programming languages that were not designed with parallel computing in mind. This MATLAB-to-Julia translator begins to approach the problem starting with MATLAB, which is syntactically close to Julia.

The goal of this project is to build an easy-to-use tool for translating MATLAB source code into Julia. The translator is not comprehensive, but it should accurately translate enough of the most common statements that most of the tedious work of translating the code by hand is eliminated. The hope is that the user can then review the translated Julia code and perhaps make minor corrections, but be able to quickly move on to the more interesting task of parallelizing their code.

The translator can be accessed here: https://lakras.github.io/matlab-to-julia

My hope is that other Julia users will find this project as interesting as I have and help to make it a truly powerful tool. Thank you to anyone who contributes to this project and helps it grow and improve. I am excited to see where you take it and I'm glad to have your invaluable help.


[![Build Status](https://travis-ci.com/lakras/matlab-to-julia.svg?branch=master)](https://travis-ci.com/lakras/matlab-to-julia)


- `matlab_to_julia_translator.js` contains the translator itself; the `translate` function can be used independently of `index.html` and `web_page_functions.js` (see `tests.js` for an example of import and use)
- `tests.js` contains the tests run by Travis CI on all commits and pull requests; tests for unimplemented Julia 1.x features are commented out and marked `TODO`
- `index.html` is the web page accessed at https://lakras.github.io/matlab-to-julia
- `web_page_functions.js` contains all code that interacts with `index.html`

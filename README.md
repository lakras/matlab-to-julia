matlab-to-julia
===============

Translates MATLAB source code into Julia.

Some of the fields that could most benefit from parallelization primarily use programming languages that were not designed with parallel computing in mind. This MATLAB-to-Julia translator begins to approach the problem starting with MATLAB, which is syntactically close to Julia.

The goal of this project is to build an easy-to-use tool for translating MATLAB source code into Julia. The translator is not comprehensive, but it should accurately translate enough of the most common statements that most of the tedious work of translating the code by hand is eliminated. The hope is that the user can then review the translated Julia code and perhaps make minor corrections, but be able to quickly move on to the more interesting task of parallelizing their code.

The translator can be accessed here: https://lakras.github.io/matlab-to-julia

My hope is that other Julia users will find this project as interesting as I have and help to make it a truly powerful tool. Thank you to anyone who contributes to this project and helps it grow and improve. I am excited to see where you take it and I'm glad to have your invaluable help.
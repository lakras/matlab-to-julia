matlab-to-julia
===============

Translates MATLAB source code into Julia.

Some of the fields that could most benefit from parallelization primarily use programming languages that were not designed with parallel computing in mind. The MATLAB-to-Julia translator proposed here begins to approach this problem starting with MATLAB, which is syntactically close to Julia. The translator does much of the tedious work of converting source code from MATLAB to Julia, in hopes that a MATLAB user who is curious about Julia could then spend most of their first moments with the language exploring its capacity to improve their existing programs rather than wrangling with bugs or a new syntax. Hopefully with time and input from other Julia users this translator will become a powerful tool and perhaps lower the barrier to switching to Julia.

The goal of this project is to build an easy-to-use tool for translating MATLAB source code into Julia. The translator does not need to be comprehensive, but it does need to be able to accurately translate enough of the most common statements that most of the tedious work of translating the code by hand is eliminated. The hope is that the user can then review the translated Julia code and perhaps make minor corrections, but be able to quickly move on to the more interesting task of parallelizing their code.

The translator consists of two parts: the first is a front end user interface, written in Java; the second is the back end translator, written in Perl.

The Java (.java) source code and the Perl (.pl) source code must be located in the same directory. If you are running the translator for the first time or after editing the Java source code, enter into the terminal
javac TranslatorGUI.java
from the directory in which they are located to build the class file. Enter
java TranslatorGUI
to launch the program. The Perl script will be run by the Java interface that has just been launched. Note that the Java interface and the Perl script will be saving and deleting temporary files within the folder that contains the source code.

If for some reason the Perl script freezes, the Java interface may continue to wait for it until it is terminated. Terminate the Perl script; you do not need to close or restart the Java interface.

This project gave me an exciting and unique opportunity to become closer acquainted with Julia, MATLAB, Perl, Java, and LaTeX. My hope is that other Julia users will find it as interesting as I have and help to make it a truly powerful tool. 

Please read summary_paper.pdf for more information.

Thank you to anyone who contributes to this project in the future and helps it grow and improve. I am excited to see where you take it and I'm glad to have your invaluable help.
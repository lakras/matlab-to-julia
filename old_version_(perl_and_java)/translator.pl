# This is the backend of the program. It reads in MATLAB code
# from a file, translates it into Julia, and saves the Julia
# version of the code to another file.
# 
# Before this script is called, the MATLAB code read from the
# frontend interface is saved to a temp file in the same directory
# as the class file (and this Perl script). This Perl script reads
# from the MATLAB temp file and saves the Julia translation to a
# second temp file. After this script is finished translating, the
# interface reads in and displays the Julia temp file and deletes
# both temp files.

$directory = "";
$matlab_temp_file = $directory."MATLAB_temp.txt";
$julia_temp_file = $directory."Julia_temp.txt";

# opens input and output files
open IN_MATLAB, "<$matlab_temp_file" || die "Could not open $matlab_temp_file to read; terminating =(\n";
open OUT_JULIA, ">$julia_temp_file" || die "Could not open $julia_temp_file to write; terminating =(\n";

# reads in contents of input file
$contents = "";
while(<IN_MATLAB>)
{
    chomp;
    $line = $_;
    $contents = $contents."$line\n";
}

# SAVES NAMES OF PROBABLE FUNCTIONS
#        function_name = @(anything)
#        function [anything] = function_name(anything)

# object = @(anything)
%functions = ();
while($contents =~ /([^\s]*)(\s*=)\s*@\s*\((.*)\)/g)
{
    $function_name = $1;
    $function_location = $-[1];
    $functions{$function_name} = $function_location;
}
# function [anything] = object(anything)
while($contents =~ /function\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)/g)
{
    $function_name = $2;
    $function_location = $-[2];
    $functions{$function_name} = $function_location;
}

# SAVES NAMES OF PROBABLE MATRICES
#        matrix_name = load anything
#        matrix_name = load(anything)
#        matrix_name = function_name
#        matrix_name = function_name(anything)
#        matrix_name = other_matrix_name(anything)
#        matrix_name = other_matrix_name
#        matrix_name = something not defined

# matrix_name = load anything
%matrixes = ();
while($contents =~ /(\w+)\s*=\s*load\s+\w+/g)
{
    $matrix_name = $1;
    $matrix_location = $-[1];
    $matrixes{$matrix_name} = $matrix_location;
}
# matrix_name = load(anything)
while($contents =~ /(\w+)\s*=\s*load\s*\(\w+\)/g)
{
    $matrix_name = $1;
    $matrix_location = $-[1];
    $matrixes{$matrix_name} = $matrix_location;
}
# matrix_name = function_name(anything)
# matrix_name = other_matrix_name(anything)
while($contents =~ /(\w+)\s*=\s*(\w+)\s*\(.*\)/g)
{
    $matrix_name = $1;
    $matrix_location = $-[1];
    $other_name = $2;
    if($functions{$other_name} || $matrixes{$other_name})
    {
        $matrixes{$matrix_name} = $matrix_location;
    }
}
# matrix_name = function_name
# matrix_name = something not defined
# matrix_name = other_matrix_name
while($contents =~ /(\w+)\s*=\s*(\w+)/g)
{
    $matrix_name = $1;
    $other_name = $2;
    $matrixes{$matrix_name} = $matrix_location;
}

# BLOCK COMMENTS:
#     add # to the start of every line between %{ and }%,
#     delete %{ and }%
@split_contents = split(/\n/, $contents);
$contents = "";
$in_block_comment = 0;
foreach my $line(@split_contents)
{
    if($in_block_comment)
    {
        $line = "#".$line;
    }
    if($line =~ m/%{/)
    {
        $in_block_comment = 1;
        $line =~ s/%{/#/g;
    }
    if($line =~ m/.*%}(.*)/)
    {
        if(length($1) > 0)
        {
            $line =~ s/%}\s*/\n/g;
        }
        else
        {
            $line =~ s/%}//g;
        }
        $in_block_comment = 0;
    }

    $contents = $contents."$line\n";
}

# COMMENTS:
#     replace all instances of % with #
$contents =~ s/%/#/g;

# SEMICOLONS:
#      Julia does not need semicolons at the ends of statements
$contents =~ s/;(\n+)/$1/g;        # removes semicolons at the ends of lines

# COMMAS
#      for x='a':'d',x,end,  -> for x='a':'d'; x; end
$contents =~ s/,(\n+)/$1/g;        # removes commas at the ends of lines

# replaces commas at the middles of lines (but not between parentheses or curly or square brackets) with semicolons
$contents =~ s/(^[^\(\[\{]*?),([^\)\]\}]*?\n+)/$1;$2/g; # first occurrence
while($contents =~ /(\n+[^\(\[\{]*?),([^\)\]\}]*?\n+)/)    # all other occurrences
{
    $contents =~ s/(\n+[^\(\[\{]*?),([^\)\]\}]*?\n+)/$1;$2/g;
}

# IMAGINARY UNIT:
#     sqrt(-1) -> im
$contents =~ s/sqrt\(-1\)/im/g;

# MODULUS:
#          mod(a, b) -> a % b
# mod(a + b, c + d) -> (a + b) % (c + d)
$contents =~ s/mod\s*\((\w*),(\s*)(\w*)\)/$1$2\%$2$3/g;
$contents =~ s/mod\s*\((.*),(\s*)(.*)\)/\($1\)$2\&$2($3\)/g;

# BITWISE OR
#               bitxor(a, b) -> a $ b
#     bitxor(a + b, c + d) -> (a + b) $ (c + d)
$contents =~ s/bitxor\s*\((\w*),(\s*)(\w*)\)/$1$2\$$2$3/g;
$contents =~ s/bitxor\s*\((.*),(\s*)(.*)\)/\($1\)$2\$$2($3\)/g;

# BITWISE AND
#               bitand(a, b) -> a & b
#     bitand(a + b, c + d) -> (a + b) & (c + d)
$contents =~ s/bitand\s*\((\w*),(\s*)(\w*)\)/$1$2\&$2$3/g;
$contents =~ s/bitand\s*\((.*),(\s*)(.*)\)/\($1\)$2\&$2($3\)/g;

# BITWISE OR
#      bitor(a, b) -> a | b
$contents =~ s/bitor\s*\((\w*),(\s*)(\w*)\)/$1$2\|$2$3/g;
$contents =~ s/bitor\s*\((.*),(\s*)(.*)\)/\($1\)$2\|$2($3\)/g;

# FORMATTED PRINTING:
#     MATLAB:
#         fprintf('My age is %d and my salary is %.2f\n', age, salary)
#     Julia:
#         @sprintf("My age is %d and my salary is %.2f\n", age, salary)
# undoes % -> # from comments
while($contents =~ /(fprintf\('.*)#(.*'.*\))/)
{
    $contents =~ s/(fprintf\('.*)#(.*'.*\))/$1%$2/g;
}
# reformats fprintf statement
$contents =~ s/fprintf\('(.*)'(.*)\)/\@sprintf\("$1"$2\)/g;

# IN-LINE FUNCTIONS:
#     h = @(x, y) x * y  ->  h(x, y) = x * y
$contents =~ s/([^\s]*)(\s*=)\s*@\s*\((.*)\)/$1\($3\)$2/g;

# FUNCTIONS:
#     MATLAB:                                  |  Julia:
#        function [a b] = sum_product(x, y)    |     function sum_product(x,y)
#            a = x + y;                        |         a = x + y;
#            if a > 5                          |            if a > 5
#                a = 0                         |                a = 0
#            end                               |            end
#            b = x * y;                        |         b = x * y;        
#        end <- optional                       |         [a b];
#                                              |     end
if($contents =~ m/function\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*(\s*)((\n*.*)*)/)
{
    # locates all end keywords
    @end_locations;
    while($contents =~ /(\wend\w)|(end\w)|(\wend)|(end)/g)
    {
        if(length($4) > 0)
        {
            push @end_locations, $-[4];
        }
    }
    
    # locates all if, for, while, and function statements
    @loop_locations;
    while($contents =~ /(\w(if|while|function|for)\w)|((if|while|function|for)\w)|(\w(if|while|function|for))|(if|while|function|for)/g)
    {
        if(length($7) > 0)
        {
            push @loop_locations, $-[7];
        }
    }
    
    # adds extra end statement if necessary
    if(scalar(@end_locations) < scalar(@loop_locations))
    {
        $addition = "end";
        $contents = $contents.$addition;
        push @end_locations, length($contents) - length($addition);
    }
    
    # only proceeds if there are as many end statements as starts of for, if, or while loops or functions
    if(scalar(@end_locations) == scalar(@loop_locations))
    {
        # finds places to add function return statements
        @return_statements;
        @return_locations;
        while($contents =~ /(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/g)
        {
            $location = $-[1];
            $return_statement = $2;
            $whitespace = $5;
            $whitespace =~ s/\n//g;
        
            # progresses indexes to next after (and including) function start
            $loop_index = 0;
            $end_index = 0;
            while($loop_index < scalar(@loop_locations) && $loop_locations[$loop_index] <= $location)
            {
                $loop_index = $loop_index + 1;
            }
            while($end_index < scalar(@end_locations) && $end_locations[$end_index] <= $location)
            {
                $end_index = $end_index + 1;
            }
            
            # matches end statements with loops or functions
            $depth = 1;
            while($depth > 0 && $end_index <= scalar(@end_locations))
            {
                # next closest item is an end
                if($loop_index >= scalar(@end_locations) || $end_locations[$end_index] < $loop_locations[$loop_index])
                {
                    $end_index = $end_index + 1;
                    $depth = $depth - 1;
                }
                
                # next item is the start of a loop or a function
                else
                {
                    $loop_index = $loop_index + 1;
                    $depth = $depth + 1;
                }
            }
            
            # saves return statement (with end statements added if necessary) and location to add it to
            $return_location = $end_locations[$end_index - 1] - 1;
            $whitespace =~ s/^\n(\s*)/$1/g;
            $whitespace =~ s/(\s*)\n$/$1/g;
            $return_statement = "$whitespace"."\[$return_statement\]";
            @moo;
            if(substr($contents, $return_location - 1, 1) !~ /\s/g)
            {
                $return_statement = "\n".$return_statement;
            }
            if(substr($contents, $return_location, 1) !~ /\n/g)
            {
                $return_statement = $return_statement."\n";
            }
            
            push @return_statements, $return_statement;
            push @return_locations, $return_location;
        }
        
        # sorts return statements by location (largest first)
        @sorted_return_statements;
        @sorted_return_locations;
        for($index = 0; $index < scalar(@return_statements); $index++)
        {
            my $max_index = 0;
            for($indexj = 1; $indexj < scalar(@return_locations); $indexj++)
            {
                if($return_locations[$indexj] > $return_locations[$max_index])
                {
                    $max_index = $indexj;
                }
            }
            
            $sorted_return_statements[$index] = $return_statements[$max_index];
            $sorted_return_locations[$index] = $return_locations[$max_index];
            
            $return_locations[$max_index] = -1;
        }
        @return_statements = @sorted_return_statements;
        @return_locations = @sorted_return_locations;
    
        # inserts return statements (and end statements, if necessary) in reverse order by location
        for(0 .. scalar(@return_locations))
        {
            $return_statement = $return_statements[$_];
            $return_location = $return_locations[$_];
            
            $contents_pt1 = substr($contents, 0, $return_location);
            $contents_pt2 = substr($contents, $return_location, length($contents));
            $contents = $contents_pt1.$return_statement.$contents_pt2;
        }

        # translates function headers
        $contents =~ s/(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/function $3\($4\)$5$6/g;
    }
}

# FUNCTION CALL WITHOUT PARAMETERS
#    f -> f()
foreach $function_name(keys %functions)
{
    $contents =~ s/(^($function_name))(\s*\n+)/$1\(\)$3/g;
    $contents =~ s/([\s\n]+($function_name))(\s*\n+)/$1\(\)$3/g;
    $contents =~ s/([\s\n]+($function_name))(\s*$)/$1\(\)$3/g;
}

# MATRIX INDEXING:
#       A(0) -> A[0]
#     A(0:2) -> A[0:2]
# locates and processes all possible matrix indexings (all of which might be function calls)
while($contents =~ /\s*([^@\s]+)\s*\(.*\)/g)
{
    $possible_matrix_name = $1;
    $possible_matrix_name_starts = $-[1];
    $possible_matrix_name_ends = $+[1];
    
    # not defined as matrix, but defined as function
    if($matrixes{$possible_matrix_name})
    {
        $contents =~ s/(\s*($possible_matrix_name)\s*)\((.*)\)/$1\[$3\]/g
    }
    # defined as function or function by default
    elsif($functions{$possible_matrix_name})
    {
        # do nothing
    }
}

# QUOTES
# 'bla' -> "bla"
$contents =~ s/'([^\n]{2,})'/"$1"/g;

# adds PLOTTING PACKAGE if necessary
if($contents =~ m/plot\((.*)\)/)
{
    $contents = "using PyPlot\n\n".$contents;
}

# prints result to file
print OUT_JULIA $contents;

# closes I/O streams
close IN_MATLAB;
close OUT_JULIA;
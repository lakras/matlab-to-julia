translate = function(input)
{
	// SAVES USER-INPUTTED FUNCTION NAMES
	var functions = {};
	var split_regex = /\s*[,\s]\s*/;
	var function_names_input = document.getElementById("functionNamesField").value;
	if(function_names_input != default_function_names_field_value)
	{
		var split_function_names_input = function_names_input.split(split_regex);
		for(var i = 0; i < split_function_names_input.length; i++)
		{
			var function_name = split_function_names_input[i];
			if(function_name.length > 0)
			{
				functions[function_name] = -1;
			}
		}
	}
	
	// SAVES USER-INPUTTED VALUES NOT TO BE INTERPRETED AS FUNCTIONS
	var matrixes = {};
	var non_function_names_input = document.getElementById("notFunctionNamesField").value;
	if(non_function_names_input != default_not_function_names_field_value)
	{
		var split_non_function_names_input = non_function_names_input.split(split_regex);
		for(var i = 0; i < split_non_function_names_input.length; i++)
		{
			var non_function_name = split_non_function_names_input[i];
			if(non_function_name.length > 0 && !(non_function_name in functions))
			{
				matrixes[non_function_name] = -1;
			}
		}
	}
	
	// SAVES NAMES OF KNOWN FUNCTIONS
	for(var i = 0; i < known_functions.length; i++)
	{
		var known_function = known_functions[i];
		if(!(known_function in matrixes))
		{
			functions[known_function] = -1;
		}
	}
	for(var i = 0; i < more_known_functions.length; i++)
	{
		var known_function = more_known_functions[i];
		if(!(known_function in matrixes))
		{
			functions[known_function] = -1;
		}
	}
	
	// SAVES NAMES OF KNOWN NOT-FUNCTIONS
	for(var i = 0; i < known_non_functions.length; i++)
	{
		var known_non_function = known_non_functions[i];
		if(!(known_non_function in functions))
		{
			matrixes[known_non_function] = -1;
		}
	}
	
	// SAVES NAMES OF PROBABLE FUNCTIONS
	//        function_name = @(anything)
	//        function [anything] = function_name(anything)
	
	// object = @(anything)
	var regex = /([^\s]*)(\s*=)\s*@\s*\((.*)\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var function_name = match[1];
		var function_location = match.index;
		if(!(function_name in matrixes))
		{
			functions[function_name] = function_location;
		}
	}
	// function [anything] = object(anything)
	var regex = /(function\s*?\[)(.*?)(\]\s*?=\s*)(.*?)\s*?\((.*?)\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var function_name = match[4];
		var function_location = indexOfGroup(match, 4);
		if(!(function_name in matrixes))
		{
			functions[function_name] = function_location;
		}
	}
	
	// SAVES NAMES OF PROBABLE MATRICES
	//        matrix_name = load anything
	//        matrix_name = load(anything)
	//        matrix_name = function_name
	//        matrix_name = function_name(anything)
	//        matrix_name = other_matrix_name(anything)
	//        matrix_name = other_matrix_name
	//        matrix_name = something not defined

	// matrix_name = load anything
	var regex = /(\w+)\s*=\s*load\s+\w+/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrix_name = match[1];
		var matrix_location = match.index;
		if(!(matrix_name in functions))
		{
			matrixes[matrix_name] = matrix_location;
		}
	}
	// matrix_name = load(anything)
	var regex = /(\w+)\s*=\s*load\s*\(\w+\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrix_name = match[1];
		var matrix_location = match.index;
		if(!(matrix_name in functions))
		{
			matrixes[matrix_name] = matrix_location;
		}
	}
	// matrix_name = function_name(anything)
	// matrix_name = other_matrix_name(anything)
	var regex = /(\w+)\s*=\s*(\w+)\s*\(.*\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrix_name = match[1];
		var matrix_location = match.index;
		var other_name = match[2];
		if(other_name in functions || other_name in matrixes)
		{
			if(!(matrix_name in functions))
			{
				matrixes[matrix_name] = matrix_location;
			}
		}
	}
	// matrix_name = function_name
	// matrix_name = something not defined
	// matrix_name = other_matrix_name
	var regex = /(\w+)\s*=\s*(\w+)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrix_name = match[1];
		var matrix_location = match.index;
		var other_name = match[2];
		if(!(matrix_name in functions))
		{
			matrixes[matrix_name] = matrix_location;
		}
	}
	
	// BLOCK COMMENTS
	//     add # to the start of every line between %{ and }%,
	//     delete %{ and }%
	var split_contents = input.split("\n");
	var contents = "";
	var in_block_comment = false;
 	for(var i = 0; i < split_contents.length; i++)
 	{
 		var line = split_contents[i];
 		if(in_block_comment == true)
 		{
 			line = "#" + line;
 		}
 		
		if(/%{/.test(line))
 		{
 			in_block_comment = true;
 			line = line.replace(/%{/g, "#");
 		}
		
		var regex = /.*%}(.*)/;
		var match;
		if(match = regex.exec(line))
		{
			if(match[1].length > 0)
			{
				line = line.replace(/%}\s*/g, "\n");
			}
			else
			{
				line = line.replace(/%}/g, "");
			}
			in_block_comment = false;
		}
		contents = contents + line + "\n";
 	}
 	// extra newline added to end so we don't have to deal with end of string
 	
 	// adds newline to start so we don't have to deal with start of string
 	contents = "\n" + contents;
 	 	
 	// COMMENTS
	//     replace all instances of % with #
	contents = contents.replace(/%/g, "#");
	
	// SEMICOLONS
	//      Julia does not need semicolons at the ends of statements
	if(document.getElementById("removeSemicolonsCheckbox").checked == true)
	{
		contents = contents.replace(/;(\n+)/g, "$1");	// removes semicolons at the ends of lines
	}

	// COMMAS
	//      for x='a':'d',x,end,  -> for x='a':'d'; x; end
	contents = contents.replace(/,(\n+)/g, "$1");		// removes commas at the ends of lines
	
	// replaces commas at the middles of lines (but not between parentheses or
	// curly or square brackets) with semicolons
	contents = contents.replace(/(^[^\(\[\{]*?),([^\)\]\}]*?\n+)/g, "$1;$2"); // first occurrence
	if(/%{/.test(line))
	while(/(\n+[^\(\[\{]*?),([^\)\]\}]*?\n+)/.test(contents)) // all other occurrences
	{
		contents = contents.replace(/(\n+[^\(\[\{]*?),([^\)\]\}]*?\n+)/g, "$1;$2");
	}
	
	// IMAGINARY UNIT
	//     sqrt(-1) -> im
	contents = contents.replace(/([^\w\d_])sqrt\(-1\)/g, "$1im");

	// MODULUS
	//          mod(a, b) -> a % b
	// mod(a + b, c + d) -> (a + b) % (c + d)
	contents = contents.replace(/([^\w\d_])mod\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\%$3$4");
	contents = contents.replace(/([^\w\d_])mod\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\%$3($4\)");

	// DIAGONAL MATRIX
	//		diag([1 2 3]) -> diagm([1; 2; 3])
	contents = contents.replace(/([^\w\d_])diag(\s*\(.*\))/g, "$1diagm$2");
	
	// CONCATENATION
	//		horzcat([1 2], [1 2]) -> hcat([1 2], [1 2])
	//		vertcat([1 2], [1 2]) -> vcat([1 2], [1 2])
	contents = contents.replace(/([^\w\d_])horzcat(\s*\(.*\))/g, "$1hcat$2");
	contents = contents.replace(/([^\w\d_])vertcat(\s*\(.*\))/g, "$1vcat$2");
	
	// FLIP
	//		fliplr(A) -> flipdim(A, 2)
	//		flipud(A) -> flipdim(A, 1)
	contents = contents.replace(/([^\w\d_])fliplr(\s*)\((.*)\)/g, "$1flipdim$2($3, 2)");
	contents = contents.replace(/([^\w\d_])flipud(\s*)\((.*)\)/g, "$1flipdim$2($3, 1)");
	
	// MAXIMUM AND MINIMUM
	//		max(A, [], 1) -> maximum(A, 1)
	//		max(A, [], 2) -> maximum(A, 2)
	//		min(A, [], 1) -> minimum(A, 1)
	//		min(A, [], 2) -> minimum(A, 2)
	contents = contents.replace(/([^\w\d_])max(\s*\(\s*\w+\s*,\s*)\[\s*\]\s*,\s*(\d+\s*\))/g, "$1maximum$2$3");
	contents = contents.replace(/([^\w\d_])min(\s*\(\s*\w+\s*,\s*)\[\s*\]\s*,\s*(\d+\s*\))/g, "$1minimum$2$3");
	
	// SUM, MAX, MIN on entire matrix
	// 		sum(A(:)) -> sum(A)
	//		max(A(:)) -> maximum(A)
	//		min(A(:)) -> minimum(A)
	contents = contents.replace(/([^\w\d_])(sum\s*\(\s*\w+)\s*\(\s*:\s*\)(\s*\))/g, "$1$2$3");
	contents = contents.replace(/([^\w\d_])max(\s*\(\s*\w+)\s*\(\s*:\s*\)(\s*\))/g, "$1maximum$2$3");
	contents = contents.replace(/([^\w\d_])min(\s*\(\s*\w+)\s*\(\s*:\s*\)(\s*\))/g, "$1minimum$2$3");
	
	// FORMATTED PRINTING
	//     MATLAB:
	//         fprintf('My age is %d and my salary is %.2f\n', age, salary)
	//     Julia:
	//         @sprintf("My age is %d and my salary is %.2f\n", age, salary)
	// undoes % -> # from comments
	while(/([^\w\d_])(fprintf\('.*)#(.*'.*\))/.test(contents))
	{
		contents = contents.replace(/([^\w\d_])(fprintf\('.*)#(.*'.*\))/g, "$1$2%$3");
	}
	// reformats fprintf statement
	contents = contents.replace(/([^\w\d_])fprintf\('(.*)'(.*)\)/g, "$1\@sprintf\(\"$2\"$3\)");

	// ANONYMOUS FUNCTIONS
	//     h = @(x, y) x * y  ->  h(x, y) = x * y
	//     h = @(x, y) x * y  ->  h = (x, y) -> x*y 
	if(document.getElementById("nonanonymousOneLinersButton").checked == true)
	{
		// translate to h(x, y) = x * y
		contents = contents.replace(/([^\s]*)(\s*=)\s*@\s*\(([^()]*)\)/g, "$1\($3\)$2");
	}
	else
	{
		// translate to h = (x, y) -> x*y 
		contents = contents.replace(/([^\s]*)(\s*)=\s*@\s*\(([^()]*)\)/g, "$1$2=$2\($3\)$2->");
	}

	// FUNCTIONS
	//     MATLAB:                                  |  Julia:
	//         function [a b] = sum_product(x, y)   |     function sum_product(x,y)
	//            a = x + y;                        |         a = x + y;
	//            if a > 5                          |            if a > 5
	//                a = 0                         |                a = 0
	//            end                               |            end
	//            b = x * y;                        |         b = x * y;        
	//         end <- optional                      |         [a b];
	//                                              |     end
	if(/function\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*(\s*)((\n*.*)*)/.test(contents))
	{
		// locates all end keywords
		var end_locations = [];
		var regex = /(\wend\w)|(end\w)|(\wend)|(end)/g;
		var match;
		while(match = regex.exec(contents))
		{
			if(match[4] != null && match[4].length > 0)
			{
				end_locations.push(match.index);
			}
		}
	
		// locates all if, for, while, and function statements
		var loop_locations = [];
		var regex = /(\w(if|while|function|for)\w)|((if|while|function|for)\w)|(\w(if|while|function|for))|(if|while|function|for)/g;
		var match;
		while(match = regex.exec(contents))
		{
  			if(match[7] != null && match[7].length > 0)
			{
				loop_locations.push(match.index);
			}
		}
	
		// adds extra end statement if necessary
		if(end_locations.length < loop_locations.length)
		{
			var addition = "end\n";
			contents = contents + addition;
			end_locations.push(contents.length - addition.length);
		}
	
		// only proceeds if there are as many end statements as starts of for, if, or while loops or functions
		if(end_locations.length == loop_locations.length)
		{
			// finds places to add function return statements
			var return_statements = [];
			var return_locations = [];
			var regex = /(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/g;
			var match;
			while(match = regex.exec(contents))
			{
				var location = match.index;
				var return_statement = match[2];
				var whitespace = match[5];
				whitespace = whitespace.replace(/\n/g, "");
		
				// progresses indexes to next after (and including) function start
				var loop_index = 0;
				var end_index = 0;
				while(loop_index < loop_locations.length && loop_locations[loop_index] <= location)
				{
					loop_index = loop_index + 1;
				}
				while(end_index < end_locations.length && end_locations[end_index] <= location)
				{
					end_index = end_index + 1;
				}
			
				// matches end statements with loops or functions
				var depth = 1;
				while(depth > 0 && end_index <= end_locations.length)
				{
					// next closest item is an end
					if(loop_index >= end_locations.length || end_locations[end_index] < loop_locations[loop_index])
					{
						end_index = end_index + 1;
						depth = depth - 1;
					}
				
					// next item is the start of a loop or a function
					else
					{
						loop_index = loop_index + 1;
						depth = depth + 1;
					}
				}
			
 				// saves return statement (with end statements added if necessary) and location to add it to
 				var return_location = end_locations[end_index - 1] - 1;
 				whitespace = whitespace.replace(/^\n(\s*)/g, "$1");
 				whitespace = whitespace.replace(/(\s*)\n$/g, "$1");
				var return_statement = whitespace + "\[" + return_statement + "\]";
				if(!(/\s/.test(contents.substring(return_location - 1, 1))))
				{
					return_statement = "\n" + return_statement;
				}
				if(!(/\n/g.test(contents.substring(return_location, 1))))
				{
					return_statement = return_statement + "\n";
				}
			
				return_statements.push(return_statement);
				return_locations.push(return_location);
			}
		
			// sorts return statements by location (largest first)
			var sorted_return_statements = [];
			var sorted_return_locations = [];
			for(var index = 0; index < return_statements.length; index++)
			{
				var max_index = 0;
				for(var indexj = 1; indexj < return_locations.length; indexj++)
				{
					if(return_locations[indexj] > return_locations[max_index])
					{
						max_index = indexj;
					}
				}
			
				sorted_return_statements[index] = return_statements[max_index];
				sorted_return_locations[index] = return_locations[max_index];
			
				return_locations[max_index] = -1;
			}
			return_statements = sorted_return_statements;
			return_locations = sorted_return_locations;
	
			// inserts return statements (and end statements, if necessary) in reverse order by location
			for(var index = 0; index < return_locations.length; index++)
			{
				var return_statement = return_statements[index];
				var return_location = return_locations[index];
				
				var contents_pt1 = contents.substring(0, return_location+1);
				var contents_pt2 = contents.substring(return_location+1, contents.length);
				
				if(contents_pt1.length > 0 && contents_pt1.charAt(contents_pt1.length - 1) != "\n")
				{
					return_statement = "\n"+return_statement;
				}
				if(contents_pt2.length > 0 && contents_pt2.charAt(0) != "\n")
				{
					return_statement = return_statement + "\n";
				}
				contents = contents_pt1 + return_statement + contents_pt2;
			}

			// translates function headers
			contents = contents.replace(/(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/g, "function $3\($4\)$5$6");
		}
	}

	// FUNCTION CALL WITHOUT PARAMETERS
	//    f -> f()
	for(var function_name in functions)
 	{
		var regex = new RegExp("([^\\w\\d_])("+function_name+")(\\s*[^\\w\\d_(=\\s])");
 		while(regex.test(contents))
 		{
 			contents = contents.replace(regex, "$1$2\(\)$3");
 		}
 		
 		var regex = new RegExp("([^\\w\\d_])("+function_name+")(\\s*\\n)");
 		while(regex.test(contents))
 		{
 			contents = contents.replace(regex, "$1$2\(\)$3");
 		}
 	}
 	
 	// ELSE IF STATEMENTS
	// else if -> elseif
	contents = contents.replace(/([^\w\d_])else if([^\w\d_])/g, "$1elseif$2");
 	
 	// MAXIMUM AND MINIMUM OF MATRICES
	//		max(A) -> maximum(A)
	//		min(A) -> minimum(A)
	var regex = /([^\w\d_])(min|max)\s*\(\s*([a-zA-Z][^@\s()]*)\s*\)/g;
	var match;
	while(match = regex.exec(contents))
	{
		var possible_matrix_name = match[3];
		
		// not defined as matrix, but defined as function
		if(!(possible_matrix_name in matrixes) && (possible_matrix_name in functions))
		{
			// leave as is
		}
		// defined as matrix or matrix by default
		else
		{
			var inner_regex = new RegExp("([^\\w\\d_])(min|max)(\\s*[(]\\s*" + possible_matrix_name + "\\s*[)]\\s*)");
			while(inner_regex.test(contents))
			{
 				contents = contents.replace(inner_regex, "$1$2imum$3");
 			}
		}
	}

 	// MATRIX INDEXING:
	//      A(0)   -> A[0]
	//     	A(0:2) -> A[0:2]
	// locates and processes all possible matrix indexings (all of which might be function calls)
	var regex = /[^\w\d_]([\w\d_]+)\s*\(.*\)/g;
	var match;
	while(match = regex.exec(contents))
	{
		var possible_matrix_name = match[1];
		var possible_matrix_name_end = match.index + possible_matrix_name.length;
	
		// not defined as matrix, but defined as function
		if(!(possible_matrix_name in matrixes) && (possible_matrix_name in functions))
		{
			// leave as is
			
			// look again right after the function name, just in case there's more inside
			// the function call
			regex.lastIndex = possible_matrix_name_end+1;
		}
		// defined as matrix or matrix by default
		else
		{
			// matrix indexing (one level of parentheses--no parentheses inside the parentheses)
			var inner_regex = new RegExp("([^\\w\\d_])(" + possible_matrix_name + "\\s*)[(]([^()]*)[)]");
			while(inner_regex.test(contents))
			{
 				contents = contents.replace(inner_regex, "$1$2\[$3\]");
 				
 				// forces detection to start over so we don't miss nested parentheses
 				regex.lastIndex = 0;
 			}
 			
 			// matrix indexing (two levels of parentheses)
 			var o = "[^()]*";
 			var p1 = "[(]";
 			var p2 = "[)]";
			var inner_regex = new RegExp("([^\\w\\d_])(" + possible_matrix_name + "\\s*)" + p1+"(("+o+p1+o+p2+o+")+)"+p2);
			while(inner_regex.test(contents))
			{
 				contents = contents.replace(inner_regex, "$1$2\[$3\]");
 				
 				// forces detection to start over so we don't miss nested parentheses
 				regex.lastIndex = 0;
 			}
 			
 			// more than two levels of parentheses
 			var inner_regex = new RegExp("([^\\w\\d_]" + possible_matrix_name + "\\s*[(])");
 			var match;
  			if(match = inner_regex.exec(contents))
 			{
 				var index_after_opening_paren = match.index + match[0].length;
 				var index_of_opening_paren = index_after_opening_paren - 1;
 				var paren_depth = 0;
 				for(var i = index_after_opening_paren; i < contents.length && paren_depth > -1; i++)
 				{
 					if(contents.charAt(i) == '(')
 					{
 						paren_depth++;
 					}
 					if(contents.charAt(i) == ')')
 					{
 						paren_depth--;
 						if(paren_depth == -1)
 						{
 							contents = contents.substring(0, i) + "]" + contents.substring(i+1, contents.length);
 							contents = contents.substring(0, index_of_opening_paren) + "[" + contents.substring(index_of_opening_paren+1, contents.length);
 						}
 					}
 				}
 				
 				// forces detection to start over so we don't miss nested parentheses
 				regex.lastIndex = 0;
 			}
		}
	}

	// QUOTES
	// 'bla' -> "bla"
	contents = contents.replace(/'([^\n]{2,})'/g, "\"$1\"");
	
	// BITWISE OR
	//               bitxor(a, b) -> a $ b
	//     bitxor(a + b, c + d) -> (a + b) $ (c + d)
	contents = contents.replace(/([^\w\d_])bitxor\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\$ $3$4");
	contents = contents.replace(/([^\w\d_])bitxor\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\$ $3($4\)");

	// BITWISE AND
	//               bitand(a, b) -> a & b
	//     bitand(a + b, c + d) -> (a + b) & (c + d)
	contents = contents.replace(/([^\w\d_])bitand\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\&$3$4");
	contents = contents.replace(/([^\w\d_])bitand\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\&$3($4\)");

	// BITWISE OR
	//      bitor(a, b) -> a | b
	contents = contents.replace(/([^\w\d_])bitor\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\|$3$4");
	contents = contents.replace(/([^\w\d_])bitor\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\|$3($4\)");
	
	// removes newline artificially added to start and end
 	contents = contents.substring(1, contents.length - 1);
	
	// adds PLOTTING PACKAGE if necessary
	if(/([^\w\d_])plot\((.*)\)/.test(contents) || /^plot\((.*)\)/.test(contents))
	{
		contents = "using PyPlot\n\n" + contents;
	}
	
	return contents;
};

// from first answer in:
// 		http://stackoverflow.com/questions/1985594/how-to-find-indices-of-groups-in-javascript-regular-expressions-match
indexOfGroup = function(match, n)
{
	var ix = match.index;
	for (var i = 1; i < n; i++)
	{
		ix += match[i].length;
	}
    return ix;
}


// KNOWN MATLAB FUNCTIONS
// from http://www.ece.northwestern.edu/local-apps/matlabhelp/techdoc/ref/refbookl.html
var known_functions = ["abs", "acos", "acosh", "acot", "acoth", "acsc", "acsch",
	"actxcontrol", "actxserver", "addframe", "addpath", "addproperty", "airy", "alim", "all",
	"allchild", "alpha", "alphamap", "angle", "ans", "any", "area", "asec", "asech", "asin",
	"asinh", "assignin", "atan", "atan2", "atanh", "audiodevinfo", "audioplayer",
	"audiorecorder", "auread", "auwrite", "avifile", "aviinfo", "aviread", "axes", "axis",
	"balance", "bar", "barh", "bar3", "bar3h", "base2dec", "beep", "besselh", "besseli",
	"besselj", "besselk", "bessely", "beta", "betainc", "betaln", "bicg", "bicgstab",
	"bin2dec", "bitand", "bitcmp", "bitget", "bitmax", "bitor", "bitset", "bitshift",
	"bitxor", "blanks", "blkdiag", "box", "break", "brighten", "builtin", "bvp4c", "bvpget",
	"bvpinit", "bvpset", "bvpval", "calendar", "camdolly", "camlight", "camlookat",
	"camorbit", "campan", "campos", "camproj", "camroll", "camtarget", "camup", "camva",
	"camzoom", "capture", "cart2pol", "cart2sph", "case", "cat", "catch", "caxis", "cd",
	"cdf2rdf", "cdfepoch", "cdfinfo", "cdfread", "cdfwrite", "ceil", "cell", "cell2mat",
	"cell2struct", "celldisp", "cellfun", "cellplot", "cellstr", "cgs", "char", "checkin",
	"checkout", "chol", "cholinc", "cholupdate", "circshift", "cla", "clabel", "class",
	"clc", "clear", "clear", "clf", "clipboard", "clock", "close", "close", "closereq",
	"cmopts", "colamd", "colmmd", "colorbar", "colordef", "colormap", "colormapeditor",
	"ColorSpec", "colperm", "comet", "comet3", "compan", "compass", "complex", "computer",
	"cond", "condeig", "condest", "coneplot", "conj", "continue", "contour", "contour3",
	"contourc", "contourf", "contourslice", "contrast", "conv", "conv2", "convhull",
	"convhulln", "convn", "copyfile", "copyobj", "corrcoef", "cos", "cosh", "cot", "coth",
	"cov", "cplxpair", "cputime", "cross", "csc", "csch", "csvread", "csvwrite", "cumprod",
	"cumsum", "cumtrapz", "curl", "customverctrl", "cylinder", "daspect", "date", "datenum",
	"datestr", "datetick", "datevec", "dbclear", "dbcont", "dbdown", "dblquad", "dbmex",
	"dbquit", "dbstack", "dbstatus", "dbstep", "dbstop", "dbtype", "dbup", "dde23", "ddeadv",
	"ddeexec", "ddeget", "ddeinit", "ddepoke", "ddereq", "ddeset", "ddeterm", "ddeunadv",
	"deal", "deblank", "dec2base", "dec2bin", "dec2hex", "deconv", "del2", "delaunay",
	"delaunay3", "delaunayn", "delete", "deleteproperty",
	"demo", "depdir", "depfun", "det", "detrend", "deval", "diag", "dialog", "diary", "diff",
	"dir", "disp", "display", "divergence", "dlmread", "dlmwrite", "dmperm",
	"doc", "docopt", "docroot", "dos", "dot", "double", "dragrect", "drawnow", "dsearch",
	"dsearchn", "echo", "edit", "eig", "eigs", "ellipj", "ellipke", "ellipsoid", "else",
	"eomday", "eps", "erf", "erfc", "erfcx", "erfinv", "erfcinv", "error",
	"errorbar", "errordlg", "etime", "etree", "etreeplot", "eval", "evalc", "evalin",
	"eventlisteners", "events", "exist", "exit", "exp", "expint", "expm", "eye", "ezcontour",
	"ezcontourf", "ezmesh", "ezmeshc", "ezplot", "ezplot3", "ezpolar", "ezsurf", "ezsurfc",
	"factor", "factorial", "fclose", "fclose", "feather", "feof", "ferror", "feval",
	"fft", "fft2", "fftn", "fftshift", "fgetl", "fgets", "fieldnames",
	"figflag", "figure", "fileattrib", "filebrowser", "fileparts", "filesep", "fill",
	"fill3", "filter", "filter2", "find", "findall", "findfigs", "findobj", "findstr",
	"finish", "fitsinfo", "fitsread", "fix", "flipdim", "fliplr", "flipud", "floor", "flops",
	"flow", "fmin", "fminbnd", "fmins", "fminsearch", "fopen", "fopen", "format",
	"fplot", "fprintf", "fprintf", "frame2im", "frameedit", "fread", "fread", "freeserial",
	"freqspace", "frewind", "fscanf", "fscanf", "fseek", "ftell", "full", "fullfile",
	"func2str", "function", "function_handle", "functions", "funm", "fwrite", "fwrite",
	"fzero", "gallery", "gamma", "gammainc", "gammaln", "gca", "gcbf", "gcbo", "gcd", "gcf",
	"gco", "genpath", "get", "getappdata", "getenv", "getfield",
	"getframe", "ginput", "global", "gmres", "gplot", "gradient", "graymon", "grid",
	"griddata", "griddata3", "griddatan", "gsvd", "gtext", "guidata", "guide", "guihandles",
	"hadamard", "hankel", "hdf", "hdfinfo", "hdfread", "hdftool", "help", "helpbrowser",
	"helpdesk", "helpdlg", "helpwin", "hess", "hex2dec", "hex2num", "hgload", "hgsave",
	"hidden", "hilb", "hist", "histc", "hold", "home", "horzcat", "hsv2rgb",
	"ifft", "ifft2", "ifftn", "ifftshift", "im2frame", "im2java", "imag", "image", "imagesc", 
	"imfinfo", "imformats", "import", "importdata", "imread", "imwrite", "ind2rgb",
	"ind2sub", "Inf", "inferiorto", "info", "inline", "inmem", "inpolygon", "input",
	"inputdlg", "inputname", "inspect", "instrcallback", "instrfind", "int2str", "int8",
	"int16", "int32", "int64", "interp1", "interp2", "interp3", "interpft", "interpn",
	"interpstreamspeed", "intersect", "inv", "invhilb", "invoke", "ipermute", "is", "isa",
	"isappdata", "iscell", "iscellstr", "ischar", "isempty", "isequal",
	"isequalwithequalnans", "isevent", "isfield", "isfinite", "isglobal", "ishandle",
	"ishold", "isinf", "isjava", "iskeyword", "isletter", "islogical", "ismember",
	"ismethod", "isnan", "isnumeric", "isobject", "isocaps", "isocolors", "isonormals",
	"isosurface", "ispc", "isprime", "isprop", "isreal", "isruntime", "issorted", "isspace",
	"issparse", "isstr", "isstruct", "isstudent", "isunix", "isvalid", "isvalid", "isvarname", 
	"javaArray", "javachk", "javaMethod", "javaObject", "keyboard", "kron", "lasterr",
	"lasterror", "lastwarn", "lcm", "legend", "legendre", "length", "length", "license",
	"light", "lightangle", "lighting", "lin2mu", "line", "LineSpec", "linspace", "listdlg",
	"load", "loadobj", "log", "log10", "log2", "logical", "loglog", "logm", "logspace",
	"lookfor", "lower", "ls", "lscov", "lsqnonneg", "lsqr", "lu", "luinc", "magic",
	"mat2cell", "mat2str", "material", "matlab", "matlabrc", "matlabroot", "max", "mean",
	"median", "memory", "menu", "mesh", "meshc", "meshz", "meshgrid", "methods",
	"methodsview", "mex", "mexext", "mfilename", "min", "minres", "mislocked", "mkdir",
	"mkpp", "mlock", "mod", "more", "move", "movefile", "movegui", "movie", "movie2avi",
	"moviein", "msgbox", "mu2lin", "multibandread", "multibandwrite", "munlock",
	"namelengthmax", "NaN", "nargchk", "nargin", "nargout", "nargoutchk", "nchoosek",
	"ndgrid", "ndims", "newplot", "nextpow2", "nnls", "nnz", "noanimate", "nonzeros", "norm",
	"normest", "notebook", "now", "null", "num2cell", "num2str", "numel", "nzmax", "ode45",
	"ode23", "ode113", "ode15s", "ode23s", "ode23t", "ode23tb", "odefile", "odeget", "odeset",
	"ones", "open", "openfig", "opengl", "openvar", "optimget", "optimset", "orderfields",
	"orient", "orth", "otherwise", "pack", "pagedlg", "pagesetupdlg", "pareto",
	"partialpath", "pascal", "patch", "path", "path2rc", "pathtool", "pause", "pbaspect",
	"pcg", "pchip", "pcode", "pcolor", "pdepe", "pdeval", "peaks", "perl", "perms", "permute",
	"persistent", "pie", "pie3", "pinv", "planerot", "plot", "plot3", "plotedit",
	"plotmatrix", "plotyy", "pol2cart", "polar", "poly", "polyarea", "polyder", "polyeig",
	"polyfit", "polyint", "polyval", "polyvalm", "pow2", "ppval", "prefdir", "primes",
	"print", "printopt", "printdlg", "printpreview", "prod", "profile", "profreport",
	"propedit", "propedit", "psi", "pwd", "qmr", "qr", "qrdelete", "qrinsert", "qrupdate",
	"quad", "quad8", "quadl", "questdlg", "quit", "quiver", "quiver3", "qz", "rand", "randn", 
	"randperm", "rank", "rat", "rats", "rbbox", "rcond", "readasync", "real", "reallog",
	"realmax", "realmin", "realpow", "realsqrt", "record", "rectangle", "rectint",
	"reducepatch", "reducevolume", "refresh", "regexp", "regexpi", "regexprep",
	"registerevent", "rehash", "release", "rem", "repmat", "reset", "reshape", "residue",
	"rethrow", "return", "rgb2hsv", "rgbplot", "ribbon", "rmappdata", "rmdir", "rmfield",
	"rmpath", "roots", "rose", "rosser", "rot90", "rotate", "rotate3d", "round", "rref",
	"rsf2csf", "run", "runtime", "save", "save", "save", "saveas", "saveobj", "scatter",
	"scatter3", "schur", "script", "sec", "sech", "selectmoveresize", "semilogx", "semilogy",
	"send", "sendmail", "serial", "serialbreak", "set", "setappdata",
	"setdiff", "setfield", "setstr", "setxor", "shading", "shiftdim", "shrinkfaces", "sign",
	"sin", "single", "sinh", "size", "slice", "smooth3", "sort", "sortrows", "sound",
	"soundsc", "spalloc", "sparse", "spaugment", "spconvert", "spdiags", "speye", "spfun",
	"sph2cart", "sphere", "spinmap", "spline", "spones", "spparms", "sprand", "sprandn",
	"sprandsym", "sprank", "sprintf", "spy", "sqrt", "sqrtm", "squeeze", "sscanf", "stairs",
	"start", "startat", "startup", "std", "stem", "stem3", "stop", "stopasync", "str2double",
	"str2func", "str2mat", "str2num", "strcat", "strcmp", "strcmpi", "stream2", "stream3",
	"streamline", "streamparticles", "streamribbon", "streamslice", "streamtube", "strfind",
	"strings", "strjust", "strmatch", "strncmp", "strncmpi", "strread", "strrep", "strtok",
	"struct", "struct2cell", "strvcat", "sub2ind", "subplot", "subsasgn", "subsindex",
	"subspace", "subsref", "substruct", "subvolume", "sum", "superiorto", "support", "surf",
	"surfc", "surf2patch", "surface", "surfl", "surfnorm", "svd", "svds", "switch", "symamd",
	"symbfact", "symmlq", "symmmd", "symrcm", "symvar", "system", "tan", "tanh", "tempdir",
	"tempname", "terminal", "tetramesh", "texlabel", "text", "textread", "textwrap", "tic",
	"toc", "timer", "timerfind", "title", "toeplitz", "trace", "trapz", "treelayout",
	"treeplot", "tril", "trimesh", "triplequad", "triplot", "trisurf", "triu", "try",
	"tsearch", "tsearchn", "type", "uicontextmenu", "uicontrol", "uigetdir", "uigetfile",
	"uiimport", "uimenu", "uint8", "uint16", "uint32", "uint64", "uiputfile", "uiresume",
	"uiwait", "uisetcolor", "uisetfont", "uistack", "undocheckout", "union", "unique", "unix",
	"unmkpp", "unregisterallevents", "unregisterevent", "unwrap", "unzip", "upper", "urlread",
	"urlwrite", "usejava", "vander", "var", "varargin", "varargout", "vectorize", "ver",
	"verctrl", "version", "vertcat", "view", "viewmtx", "volumebounds", "voronoi", "voronoin",
	"wait", "waitbar", "waitfor", "waitforbuttonpress", "warndlg", "warning", "waterfall",
	"wavplay", "wavread", "wavrecord", "wavwrite", "web", "weekday", "what", "whatsnew",
	"which", "whitebg", "who", "whos", "wilkinson", "winopen", "wk1read", "wk1write",
	"workspace", "xlabel", "ylabel", "zlabel", "xlim", "ylim", "zlim", "xlsfinfo", "xlsread",
	"xmlread", "xmlwrite", "xor", "xslt", "zeros", "zip", "zoom"];

var more_known_functions = ["println", "cummax", "cummin", "diagm", "hcat", "vcat", "maximum", "minimum"];

var known_non_functions = ["false", "pi", "true"];
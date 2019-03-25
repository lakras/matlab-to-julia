// the translator itself lives in this script, and can be used
// independently of index.html

// advanced options input (is set by web_page_functions.js if
// changed by user; otherwise set to these defaults)
var functionNamesInput = "";
var nonFunctionNamesInput = "";
var removeSemicolons = false;
var nonanonymousOneLiners = false;

var defaultFunctionNamesFieldValue = "functionName1, functionName2, etc.";
var defaultNotFunctionNamesFieldValue = "matrixName, variableName, etc.";

translate = function(input)
{
	// SAVES USER-INPUTTED FUNCTION NAMES
	var functions = {};
	var splitRegex = /\s*[,\s]\s*/;
	if(functionNamesInput != defaultFunctionNamesFieldValue)
	{
		var splitFunctionNamesInput = functionNamesInput.split(splitRegex);
		for(var i = 0; i < splitFunctionNamesInput.length; i++)
		{
			var functionName = splitFunctionNamesInput[i];
			if(functionName.length > 0)
			{
				functions[functionName] = -1;
			}
		}
	}
	
	// SAVES USER-INPUTTED VALUES NOT TO BE INTERPRETED AS FUNCTIONS
	var matrixes = {};
	if(nonFunctionNamesInput != defaultNotFunctionNamesFieldValue)
	{
		var splitNonFunctionNamesInput = nonFunctionNamesInput.split(splitRegex);
		for(var i = 0; i < splitNonFunctionNamesInput.length; i++)
		{
			var nonFunctionName = splitNonFunctionNamesInput[i];
			if(nonFunctionName.length > 0 && !(nonFunctionName in functions))
			{
				matrixes[nonFunctionName] = -1;
			}
		}
	}
	
	// SAVES NAMES OF KNOWN FUNCTIONS
	for(var i = 0; i < knownFunctions.length; i++)
	{
		var knownFunction = knownFunctions[i];
		if(!(knownFunction in matrixes))
		{
			functions[knownFunction] = -1;
		}
	}
	for(var i = 0; i < moreKnownFunctions.length; i++)
	{
		var knownFunction = moreKnownFunctions[i];
		if(!(knownFunction in matrixes))
		{
			functions[knownFunction] = -1;
		}
	}
	
	// SAVES NAMES OF KNOWN NOT-FUNCTIONS
	for(var i = 0; i < knownNonFunctions.length; i++)
	{
		var knownNonFunction = knownNonFunctions[i];
		if(!(knownNonFunction in functions))
		{
			matrixes[knownNonFunction] = -1;
		}
	}
	
	// SAVES NAMES OF PROBABLE FUNCTIONS
	//        functionName = @(anything)
	//        function [anything] = functionName(anything)
	
	// object = @(anything)
	var regex = /([^\s]*)(\s*=)\s*@\s*\((.*)\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var functionName = match[1];
		var functionLocation = match.index;
		if(!(functionName in matrixes))
		{
			functions[functionName] = functionLocation;
		}
	}
	// function [anything] = object(anything)
	var regex = /(function\s*?\[)(.*?)(\]\s*?=\s*)(.*?)\s*?\((.*?)\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var functionName = match[4];
		var functionLocation = indexOfGroup(match, 4);
		if(!(functionName in matrixes))
		{
			functions[functionName] = functionLocation;
		}
	}
	
	// SAVES NAMES OF PROBABLE MATRICES
	//        matrixName = load anything
	//        matrixName = load(anything)
	//        matrixName = functionName
	//        matrixName = functionName(anything)
	//        matrixName = otherMatrixName(anything)
	//        matrixName = otherMatrixName
	//        matrixName = something not defined

	// matrixName = load anything
	var regex = /(\w+)\s*=\s*load\s+\w+/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrixName = match[1];
		var matrixLocation = match.index;
		if(!(matrixName in functions))
		{
			matrixes[matrixName] = matrixLocation;
		}
	}
	// matrixName = load(anything)
	var regex = /(\w+)\s*=\s*load\s*\(\w+\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrixName = match[1];
		var matrixLocation = match.index;
		if(!(matrixName in functions))
		{
			matrixes[matrixName] = matrixLocation;
		}
	}
	// matrixName = functionName(anything)
	// matrixName = otherMatrixName(anything)
	var regex = /(\w+)\s*=\s*(\w+)\s*\(.*\)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrixName = match[1];
		var matrixLocation = match.index;
		var otherName = match[2];
		if(otherName in functions || otherName in matrixes)
		{
			if(!(matrixName in functions))
			{
				matrixes[matrixName] = matrixLocation;
			}
		}
	}
	// matrixName = functionName
	// matrixName = something not defined
	// matrixName = otherMatrixName
	var regex = /(\w+)\s*=\s*(\w+)/g;
	var match;
	while(match = regex.exec(input))
	{
		var matrixName = match[1];
		var matrixLocation = match.index;
		var otherName = match[2];
		if(!(matrixName in functions))
		{
			matrixes[matrixName] = matrixLocation;
		}
	}
	
	// retrieves input
	// extra newline added to end so we don't have to deal with end of string
	var splitContents = input.split("\n");
	var contents = "";
 	for(var i = 0; i < splitContents.length; i++)
 	{
 		var line = splitContents[i];
		contents = contents + line + "\n";
 	}
 	
 	// adds newline to start so we don't have to deal with start of string
 	contents = "\n" + contents;
 	
 	// BLOCK COMMENTS
	//     replace all instances of %{ with #=
	//     replace all instances of %} with =#
	contents = contents.replace(/%{/g, "#=");
	contents = contents.replace(/%}/g, "=#");
 	 	
 	// COMMENTS
	//     replace all instances of % with #
	contents = contents.replace(/%/g, "#");
	
	// SEMICOLONS
	//      Julia does not need semicolons at the ends of statements
	if(removeSemicolons)
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
	contents = contents.replace(/([^\w\d_])sqrt\s*\(\s*-1\s*\)/g, "$1im");

	// MODULUS
	//          mod(a, b) -> a % b
	// mod(a + b, c + d) -> (a + b) % (c + d)
	contents = contents.replace(/([^\w\d_])mod\s*\((\w+?),(\s*)(\w+?)\)/g, "$1$2$3\%$3$4");
	contents = contents.replace(/([^\w\d_])mod\s*\((.+?),(\s*)(.+?)\)/g, "$1\($2\)$3\%$3($4\)");

	// DIAGONAL MATRIX
	//		diag([1 2 3]) -> Diagonal([1, 2, 3])
	while(/([^\w\d_])(diag\(\s*\[.*[^,])(\s[^,]\s*.*]\s*\))/.test(contents))
	{
		contents = contents.replace(/([^\w\d_])(diag\(\s*\[.*[^,])(\s[^,]\s*.*]\s*\))/g, "$1$2,$3");
	}
	contents = contents.replace(/([^\w\d_])diag(\s*\(.+?\))/g, "$1Diagonal$2");
	
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
	if(nonanonymousOneLiners)
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
	//         function [a b] = sumProduct(x, y)   |     function sumProduct(x,y)
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
		var endLocations = [];
		var regex = /(\wend\w)|(end\w)|(\wend)|(end)/g;
		var match;
		while(match = regex.exec(contents))
		{
			if(match[4] != null && match[4].length > 0)
			{
				endLocations.push(match.index);
			}
		}
	
		// locates all if, for, while, and function statements
		var loopLocations = [];
		var regex = /(\w(if|while|function|for)\w)|((if|while|function|for)\w)|(\w(if|while|function|for))|(if|while|function|for)/g;
		var match;
		while(match = regex.exec(contents))
		{
  			if(match[7] != null && match[7].length > 0)
			{
				loopLocations.push(match.index);
			}
		}
	
		// adds extra end statement if necessary
		if(endLocations.length < loopLocations.length)
		{
			var addition = "end\n";
			contents = contents + addition;
			endLocations.push(contents.length - addition.length);
		}
	
		// only proceeds if there are as many end statements as starts of for, if, or while loops or functions
		if(endLocations.length == loopLocations.length)
		{
			// finds places to add function return statements
			var returnStatements = [];
			var returnLocations = [];
			var regex = /(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/g;
			var match;
			while(match = regex.exec(contents))
			{
				var location = match.index;
				var returnStatement = match[2];
				var whitespace = match[5];
				whitespace = whitespace.replace(/\n/g, "");
		
				// progresses indexes to next after (and including) function start
				var loopIndex = 0;
				var endIndex = 0;
				while(loopIndex < loopLocations.length && loopLocations[loopIndex] <= location)
				{
					loopIndex = loopIndex + 1;
				}
				while(endIndex < endLocations.length && endLocations[endIndex] <= location)
				{
					endIndex = endIndex + 1;
				}
			
				// matches end statements with loops or functions
				var depth = 1;
				while(depth > 0 && endIndex <= endLocations.length)
				{
					// next closest item is an end
					if(loopIndex >= endLocations.length || endLocations[endIndex] < loopLocations[loopIndex])
					{
						endIndex = endIndex + 1;
						depth = depth - 1;
					}
				
					// next item is the start of a loop or a function
					else
					{
						loopIndex = loopIndex + 1;
						depth = depth + 1;
					}
				}
			
 				// saves return statement (with end statements added if necessary) and location to add it to
 				var returnLocation = endLocations[endIndex - 1] - 1;
 				whitespace = whitespace.replace(/^\n(\s*)/g, "$1");
 				whitespace = whitespace.replace(/(\s*)\n$/g, "$1");
				var returnStatement = whitespace + "\[" + returnStatement + "\]";
				if(!(/\s/.test(contents.substring(returnLocation - 1, 1))))
				{
					returnStatement = "\n" + returnStatement;
				}
				if(!(/\n/g.test(contents.substring(returnLocation, 1))))
				{
					returnStatement = returnStatement + "\n";
				}
			
				returnStatements.push(returnStatement);
				returnLocations.push(returnLocation);
			}
		
			// sorts return statements by location (largest first)
			var sortedReturnStatements = [];
			var sortedReturnLocations = [];
			for(var index = 0; index < returnStatements.length; index++)
			{
				var maxIndex = 0;
				for(var indexj = 1; indexj < returnLocations.length; indexj++)
				{
					if(returnLocations[indexj] > returnLocations[maxIndex])
					{
						maxIndex = indexj;
					}
				}
			
				sortedReturnStatements[index] = returnStatements[maxIndex];
				sortedReturnLocations[index] = returnLocations[maxIndex];
			
				returnLocations[maxIndex] = -1;
			}
			returnStatements = sortedReturnStatements;
			returnLocations = sortedReturnLocations;
	
			// inserts return statements (and end statements, if necessary) in reverse order by location
			for(var index = 0; index < returnLocations.length; index++)
			{
				var returnStatement = returnStatements[index];
				var returnLocation = returnLocations[index];
				
				var contentsPt1 = contents.substring(0, returnLocation+1);
				var contentsPt2 = contents.substring(returnLocation+1, contents.length);
				
				if(contentsPt1.length > 0 && contentsPt1.charAt(contentsPt1.length - 1) != "\n")
				{
					returnStatement = "\n"+returnStatement;
				}
				if(contentsPt2.length > 0 && contentsPt2.charAt(0) != "\n")
				{
					returnStatement = returnStatement + "\n";
				}
				contents = contentsPt1 + returnStatement + contentsPt2;
			}

			// translates function headers
			contents = contents.replace(/(function)\s*?\[(.*?)\]\s*?=\s*(.*?)\s*?\((.*?)\)\n*?(\s*)((\n*?.*?)*?)/g, "function $3\($4\)$5$6");
		}
	}

	// FUNCTION CALL WITHOUT PARAMETERS
	//    f -> f()
	for(var functionName in functions)
 	{
		var regex = new RegExp("([^\\w\\d_])("+functionName+")(\\s*[^\\w\\d_(=\\s])");
 		while(regex.test(contents))
 		{
 			contents = contents.replace(regex, "$1$2\(\)$3");
 		}
 		
 		var regex = new RegExp("([^\\w\\d_])("+functionName+")(\\s*\\n)");
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
		var possibleMatrixName = match[3];
		
		// not defined as matrix, but defined as function
		if(!(possibleMatrixName in matrixes) && (possibleMatrixName in functions))
		{
			// leave as is
		}
		// defined as matrix or matrix by default
		else
		{
			var innerRegex = new RegExp("([^\\w\\d_])(min|max)(\\s*[(]\\s*" + possibleMatrixName + "\\s*[)]\\s*)");
			while(innerRegex.test(contents))
			{
 				contents = contents.replace(innerRegex, "$1$2imum$3");
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
		var possibleMatrixName = match[1];
		var possibleMatrixNameEnd = match.index + possibleMatrixName.length;
	
		// not defined as matrix, but defined as function
		if(!(possibleMatrixName in matrixes) && (possibleMatrixName in functions))
		{
			// leave as is
			
			// look again right after the function name, just in case there's more inside
			// the function call
			regex.lastIndex = possibleMatrixNameEnd+1;
		}
		// defined as matrix or matrix by default
		else
		{
			// matrix indexing (one level of parentheses--no parentheses inside the parentheses)
			var innerRegex = new RegExp("([^\\w\\d_])(" + possibleMatrixName + "\\s*)[(]([^()]*)[)]");
			while(innerRegex.test(contents))
			{
 				contents = contents.replace(innerRegex, "$1$2\[$3\]");
 				
 				// forces detection to start over so we don't miss nested parentheses
 				regex.lastIndex = 0;
 			}
 			
 			// matrix indexing (two levels of parentheses)
 			var o = "[^()]*";
 			var p1 = "[(]";
 			var p2 = "[)]";
			var innerRegex = new RegExp("([^\\w\\d_])(" + possibleMatrixName + "\\s*)" + p1+"(("+o+p1+o+p2+o+")+)"+p2);
			while(innerRegex.test(contents))
			{
 				contents = contents.replace(innerRegex, "$1$2\[$3\]");
 				
 				// forces detection to start over so we don't miss nested parentheses
 				regex.lastIndex = 0;
 			}
 			
 			// more than two levels of parentheses
 			var innerRegex = new RegExp("([^\\w\\d_]" + possibleMatrixName + "\\s*[(])");
 			var match;
  			if(match = innerRegex.exec(contents))
 			{
 				var indexAfterOpeningParen = match.index + match[0].length;
 				var indexOfOpeningParen = indexAfterOpeningParen - 1;
 				var parenDepth = 0;
 				for(var i = indexAfterOpeningParen; i < contents.length && parenDepth > -1; i++)
 				{
 					if(contents.charAt(i) == '(')
 					{
 						parenDepth++;
 					}
 					if(contents.charAt(i) == ')')
 					{
 						parenDepth--;
 						if(parenDepth == -1)
 						{
 							contents = contents.substring(0, i) + "]" + contents.substring(i+1, contents.length);
 							contents = contents.substring(0, indexOfOpeningParen) + "[" + contents.substring(indexOfOpeningParen+1, contents.length);
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
	
	// BITWISE XOR
	//             bitxor(a, b) -> a xor b
	//     bitxor(a + b, c + d) -> (a + b) xor (c + d)
	contents = contents.replace(/([^\w\d_])bitxor\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3xor $3$4");
	contents = contents.replace(/([^\w\d_])bitxor\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3xor $3($4\)");

	// BITWISE AND
	//             bitand(a, b) -> a & b
	//     bitand(a + b, c + d) -> (a + b) & (c + d)
	//                  a and b -> a & b
	contents = contents.replace(/([^\w\d_])bitand\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\&$3$4");
	contents = contents.replace(/([^\w\d_])bitand\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\&$3($4\)");
	contents = contents.replace(/([^\w\d_])(.*)(\s+)and(\s+)(.*)/g, "$1$2$3\&$4$5");

	// BITWISE OR
	//      bitor(a, b) -> a | b
	//           a or b -> a | b
	contents = contents.replace(/([^\w\d_])bitor\s*\((\w*),(\s*)(\w*)\)/g, "$1$2$3\|$3$4");
	contents = contents.replace(/([^\w\d_])bitor\s*\((.*),(\s*)(.*)\)/g, "$1\($2\)$3\|$3($4\)");
	contents = contents.replace(/([^\w\d_])(.*)(\s+)or(\s+)(.*)/g, "$1$2$3\|$4$5");
	
	// LOGICAL COMPARISON OPERATIONS
	//       A == B -> A .== B
	//        A < B -> A .< B
	//        A > B -> A .> B
	contents = contents.replace(/([^\w\d_])(.*)(\s+)==(\s+)(.*)/g, "$1$2$3.==$4$5");
	contents = contents.replace(/([^\w\d_])(.*)(\s+)<(\s+)(.*)/g, "$1$2$3.<$4$5");
	contents = contents.replace(/([^\w\d_])(.*)(\s+)>(\s+)(.*)/g, "$1$2$3.>$4$5");
	
	// LINEARLY SPACED VECTOR OF k POINTS
	//      linspace(1, 5, k) -> range(1, 5, length = k)
	contents = contents.replace(/([^\w\d_])linspace(\s*\(.*,\s*.*,)(\s*)(.*\))/g, "$1range$2$3length$3=$3$4");
	
	// IDENTITY MATRIX
	//       eye(2, 2) -> I
	contents = contents.replace(/([^\w\d_])eye\(.+?,.+?\)/g, "$1I");
	
	// removes newline artificially added to start and end
 	contents = contents.substring(1, contents.length - 1);
	
	// adds PLOTTING PACKAGE if necessary
	if(/([^\w\d_])plot\((.*)\)/.test(contents) || /^plot\((.*)\)/.test(contents))
	{
		contents = "using PyPlot\n\n" + contents;
	}
	
	return contents;
}

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
var knownFunctions = ["abs", "acos", "acosh", "acot", "acoth", "acsc", "acsch",
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
	"func2str", "function", "functionHandle", "functions", "funm", "fwrite", "fwrite",
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

var moreKnownFunctions = ["println", "cummax", "cummin", "diagm", "hcat", "vcat", "maximum",
	"minimum", "Diagonal"];

var knownNonFunctions = ["false", "pi", "true"];


// to allow us to run the translate function from tests.js
module.exports =
{
	translate: function(input)
	{
		return translate(input);
	}
}
// this script contains tests to be run by travis
// (a green checkmark for a commit signifies that all tests passed)
// tests for unimplemented Julia 1.x features commented out and marked TODO

const translator = require('./matlab_to_julia_translator');
var assert = require('assert');



var matlab = "hello world";
var julia  = "hello world";
assert(julia === translator.translate(matlab));



// from https://docs.julialang.org/en/latest/manual/noteworthy-differences/#Noteworthy-differences-from-MATLAB-1
// TODO: logical comparison operations
matlab = "A == B";
julia  = "A .== B";
// assert(julia === translator.translate(matlab));

matlab = "A < B";
julia  = "A .< B";
// assert(julia === translator.translate(matlab));

matlab = "A > B";
julia  = "A .> B";
// assert(julia === translator.translate(matlab));

// bitwise operations 
matlab = "a and b";
julia  = "a & b";
assert(julia === translator.translate(matlab));

matlab = "a or b";
julia  = "a | b";
assert(julia === translator.translate(matlab));

matlab = "a xor b";
julia  = "a xor b"; // or ⊻
assert(julia === translator.translate(matlab));



// from https://cheatsheets.quantecon.org
// Row vector: size (1, n)
matlab = "A = [1 2 3]";
julia  = "A = [1 2 3]";
assert(julia === translator.translate(matlab));

// TODO: Column vector: size (n, 1)
matlab = "A = [1; 2; 3]";
julia  = "A = [1 2 3]'";
// assert(julia === translator.translate(matlab));

// Integers from j to n with step size k
matlab = "A = j:k:n";
julia  = "A = j:k:n";
assert(julia === translator.translate(matlab));

// TODO: Linearly spaced vector of k points
matlab = "A = linspace(1, 5, k)";
julia  = "A = range(1, 5, length = k)";
// assert(julia === translator.translate(matlab));

// Create a matrix
matlab = "A = [1 2; 3 4]";
julia  = "A = [1 2; 3 4]";
assert(julia === translator.translate(matlab));

// 2 x 2 matrix of zeros
matlab = "A = zeros(2, 2)";
julia  = "A = zeros(2, 2)";
assert(julia === translator.translate(matlab));

// 2 x 2 matrix of ones
matlab = "A = ones(2, 2)";
julia  = "A = ones(2, 2)";
assert(julia === translator.translate(matlab));

// TODO: 2 x 2 identity matrix
matlab = "A = eye(2, 2)";
julia  = "A = I";
// assert(julia === translator.translate(matlab));

// TODO: Diagonal matrix
matlab = "A = diag([1 2 3])";
julia  = "A = Diagonal([1, 2, 3])";
// assert(julia === translator.translate(matlab));

// Uniform random numbers
matlab = "A = rand(2, 2)";
julia  = "A = rand(2, 2)";
assert(julia === translator.translate(matlab));

// Normal random numbers
matlab = "A = randn(2, 2)";
julia  = "A = randn(2, 2)";
assert(julia === translator.translate(matlab));

// TODO: Sparse Matrices
matlab = "A = sparse(2, 2)\n"
	+ "A(1, 2) = 4\n"
	+ "A(2, 2) = 1";
julia  = "using SparseArrays\n"
	+ "A = spzeros(2, 2)\n"
	+ "A[1, 2] = 4\n"
	+ "A[2, 2] = 1";
// assert(julia === translator.translate(matlab));

// TODO: Tridiagonal Matrices
matlab = "A = [1 2 3 NaN;\n"
	+ "4 5 6 7;\n"
	+ "NaN 8 9 0]\n"
	+ "spdiags(A',[-1 0 1], 4, 4)";
julia  = "x = [1, 2, 3]\n"
	+ "y = [4, 5, 6, 7]\n"
	+ "z = [8, 9, 10]\n"
	+ "Tridiagonal(x, y, z)";
// assert(julia === translator.translate(matlab));

// TODO: Transpose
matlab = "A.'";
julia  = "transpose(A)";
// assert(julia === translator.translate(matlab));

// Complex conjugate transpose (Adjoint)
matlab = "A'";
julia  = "A'";
assert(julia === translator.translate(matlab));

// Concatenate horizontally
matlab = "A = [[1 2] [1 2]]";
julia  = "A = [[1 2] [1 2]]";
assert(julia === translator.translate(matlab));

matlab = "A = horzcat([1 2], [1 2])";
julia  = "A = hcat([1 2], [1 2])";
assert(julia === translator.translate(matlab));

// Concatenate vertically
matlab = "A = [[1 2]; [1 2]]";
julia  = "A = [[1 2]; [1 2]]";
assert(julia === translator.translate(matlab));

matlab = "A = vertcat([1 2], [1 2])";
julia  = "A = vcat([1 2], [1 2])";
assert(julia === translator.translate(matlab));

// Reshape (to 5 rows, 2 columns)
matlab = "A = reshape(1:10, 5, 2)";
julia  = "A = reshape(1:10, 5, 2)";
assert(julia === translator.translate(matlab));

// Convert matrix to vector
matlab = "A(:)";
julia  = "A[:]";
assert(julia === translator.translate(matlab));

// TODO: Flip left/right
matlab = "fliplr(A)";
julia  = "reverse(A, dims = 2)";
// assert(julia === translator.translate(matlab));

// TODO: Flip up/down
matlab = "flipud(A)";
julia  = "reverse(A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Repeat matrix (3 times in the row dimension, 4 times in the column dimension)
matlab = "repmat(A, 3, 4)";
julia  = "repeat(A, 3, 4)";
// assert(julia === translator.translate(matlab));

// TODO: Broadcast a function over a collection/matrix/vector
matlab = "f = @(x) x.^2\n"
	+ "g = @(x, y) x + 2 + y.^2\n"
	+ "x = 1:10\n"
	+ "y = 2:11\n"
	+ "f(x)\n"
	+ "g(x, y)";
julia  = "f(x) = x^2\n"
	+ "g(x, y) = x + 2 + y^2\n"
	+ "x = 1:10\n"
	+ "y = 2:11\n"
	+ "f.(x)\n"
	+ "g.(x, y)";
// assert(julia === translator.translate(matlab));

// Access one element
matlab = "A(2, 2)";
julia  = "A[2, 2]";
assert(julia === translator.translate(matlab));

// Access specific rows
matlab = "A(1:4, :)";
julia  = "A[1:4, :]";
assert(julia === translator.translate(matlab));

// Access specific columns
matlab = "A(:, 1:4)";
julia  = "A[:, 1:4]";
assert(julia === translator.translate(matlab));

// TODO: Remove a row
matlab = "A([1 2 4], :)";
julia  = "A[[1, 2, 4], :]";
// assert(julia === translator.translate(matlab));

// TODO: Diagonals of matrix
matlab = "diag(A)";
julia  = "diag(A)";
// assert(julia === translator.translate(matlab));

// TODO: Get dimensions of matrix
matlab = "[nrow ncol] = size(A)";
julia  = "nrow, ncol = size(A)";
// assert(julia === translator.translate(matlab));

// Dot product
matlab = "dot(A, B)";
julia  = "dot(A, B)"; // also A ⋅ B
assert(julia === translator.translate(matlab));

// Matrix multiplication
matlab = "A * B";
julia  = "A * B";
assert(julia === translator.translate(matlab));

// Element-wise multiplication
matlab = "A .* B";
julia  = "A .* B";
assert(julia === translator.translate(matlab));

// Matrix to a power
matlab = "A^2";
julia  = "A^2";
assert(julia === translator.translate(matlab));

// Matrix to a power, elementwise
matlab = "A.^2";
julia  = "A.^2";
assert(julia === translator.translate(matlab));

// Inverse
matlab = "inv(A)";
julia  = "inv(A)";
assert(julia === translator.translate(matlab));

matlab = "A^(-1)";
julia  = "A^(-1)";
assert(julia === translator.translate(matlab));

// Determinant
matlab = "det(A)";
julia  = "det(A)";
assert(julia === translator.translate(matlab));

// TODO: Eigenvalues and eigenvectors
matlab = "[vec, val] = eig(A)";
julia  = "val, vec = eigen(A)";
// assert(julia === translator.translate(matlab));

// Euclidean norm
matlab = "norm(A)";
julia  = "norm(A)";
assert(julia === translator.translate(matlab));

// Solve linear system  Ax=b  (when  A  is square)
// Solve least squares problem  Ax=b  (when  A  is rectangular)
matlab = "A\b";
julia  = "A\b";
assert(julia === translator.translate(matlab));

// TODO: Sum of each column
matlab = "sum(A, 1)";
julia  = "sum(A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Max of each column
matlab = "max(A, [], 1)";
julia  = "maximum(A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Min of each column
matlab = "min(A, [], 1)";
julia  = "minimum(A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Sum of each row
matlab = "sum(A, 2)";
julia  = "sum(A, dims = 2)";
// assert(julia === translator.translate(matlab));

// TODO: Max of each row
matlab = "max(A, [], 2)";
julia  = "maximum(A, dims = 2)";
// assert(julia === translator.translate(matlab));

// TODO: Min of each row
matlab = "min(A, [], 2)";
julia  = "minimum(A, dims = 2)";
// assert(julia === translator.translate(matlab));

// Sum of entire matrix
matlab = "sum(A(:))";
julia  = "sum(A)";
assert(julia === translator.translate(matlab));

// Max of entire matrix
matlab = "max(A(:))";
julia  = "maximum(A)";
assert(julia === translator.translate(matlab));

// Min of entire matrix
matlab = "min(A(:))";
julia  = "minimum(A)";
assert(julia === translator.translate(matlab));

// TODO: Cumulative sum by row
matlab = "cumsum(A, 1)";
julia  = "cumsum(A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Cumulative max by row
matlab = "cummax(A, 1)";
julia  = "accumulate(max, A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Cumulative min by row
matlab = "cummin(A, 1)";
julia  = "accumulate(min, A, dims = 1)";
// assert(julia === translator.translate(matlab));

// TODO: Cumulative sum by column
matlab = "cumsum(A, 2)";
julia  = "cumsum(A, dims = 2)";
// assert(julia === translator.translate(matlab));

// TODO: Cumulative max by column
matlab = "cummax(A, 2)";
julia  = "accumulate(max, A, dims = 2)";
// assert(julia === translator.translate(matlab));

// TODO: Cumulative min by column
matlab = "cummin(A, 2)";
julia  = "accumulate(min, A, dims = 2)";
// assert(julia === translator.translate(matlab));

// Comment one line
matlab = "% This is a comment";
julia  = "# This is a comment";
assert(julia === translator.translate(matlab));

// Comment block
matlab = "%{"
	+ "Comment block"
	+ "%}";
julia  = "#="
	+ "Comment block"
	+ "=#";
assert(julia === translator.translate(matlab));

// For loop
matlab = "for i = 1:N"
	+ "  % do something"
	+ "end";
julia  = "for i = 1:N"
	+ "  # do something"
	+ "end";
assert(julia === translator.translate(matlab));

// While loop
matlab = "while i <= N"
	+ "  % do something"
	+ "end";
julia  = "while i <= N"
	+ "  # do something"
	+ "end";
assert(julia === translator.translate(matlab));

// If
matlab = "if i <= N"
	+ "  % do something"
	+ "end";
julia  = "if i <= N"
	+ "  # do something"
	+ "end";
assert(julia === translator.translate(matlab));

// If / else
matlab = "if i <= N"
	+ "  % do something"
	+ "else"
	+ "  % do something else"
	+ "end";
julia  = "if i <= N"
	+ "  # do something"
	+ "else"
	+ "  # do something else"
	+ "end";
assert(julia === translator.translate(matlab));

// TODO: Print text and variable
matlab = "fprintf('x = %d \n', x)";
julia  = "println(\"x = $x\")";
// assert(julia === translator.translate(matlab));

// TODO: Function: anonymous
matlab = "f = @(x) x^2";
julia  = "f = (x) -> x^2";
// assert(julia === translator.translate(matlab));

// TODO: Function
matlab = "function out  = f(x)"
	+ "  out = x^2"
	+ "end";
julia  = "function f(x)"
	+ "  return x^2"
	+ "end";
// assert(julia === translator.translate(matlab));

// TODO: Tuples
matlab = "t = {1 2.0 \"test\"}"
	+ "t{1}";
julia  = "t = (1, 2.0, \"test\")"
	+ "t[1]";
// assert(julia === translator.translate(matlab));

// TODO: Named Tuples/ Anonymous Structures
matlab = "m.x = 1"
	+ "m.y = 2"
	+ "m.x";
julia  = "m = (x = 1, y = 2)"
	+ "m.x";
// assert(julia === translator.translate(matlab));

// TODO: Closures
// passes if "compact (one-line) Julia functions" is selected
matlab = "a = 2.0"
	+ "f = @(x) a + x"
	+ "f(1.0)";
julia  = "a = 2.0"
	+ "f(x) = a + x"
	+ "f(1.0)";
// assert(julia === translator.translate(matlab));

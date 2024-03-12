# WebGL Fractals

Press C to see the controls panel.

## How it works
### Julia set
For every pixel, the fragment shader iterates through the function $z_{n+1}=z_n^2+c$, where $z_0$ is the coordinate of that pixel in the viewport as a complex number in the complex plane and $c$ is a constant complex number that is the same for every pixel. Every iteration, $z_n$ becomes a different coordinate in the complex plane. When $z_n$ does not go to infinity, but stays inside a range, the pixel belongs to the set, so the program will stop iterating the function. It knows $z$ goes to infinity, when $|z_n|\gt2$.[^1] With a complex number, we can use $a^2+b^2=c^2$ with the two parts of the complex number $x+yi$ as the input, which gives $x^2+y^2 \gt 2^2$.

The color of a pixel is calculated, based on the amount of iterations for that pixel. In this case, pixels with many iterations show a darker color, and pixels with few iterations show a lighter color.

### Mandelbrot set
The Mandelbrot set works the same as the Julia set, except $z_0$ is $0 + 0i$ and $c$ is the coordinate of the pixel in the viewport as a complex number in the complex plane.

##
From my orginal [Pen](https://codepen.io/Thijn09/pen/Jjzgmgp) on [CodePen](https://codepen.io).

[License](https://codepen.io/license/pen/Jjzgmgp).


[^1]: https://en.wikipedia.org/wiki/Mandelbrot_set#Basic_properties

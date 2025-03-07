var GUI = dat.GUI;

const gui = new GUI();

let options = {
  "z₀ =": "vCoords",
  "zₙ =": "power(z,2.0) + u_mouse", //"addComplex(multiplyComplex(z, z), u_mouse)",
  color: {
    r: 255,
    g: 0,
    b: 255
  },
  moveable: false
};

//let variables = [];
const equationFolder = gui.addFolder("Equation");
const zzeroController = equationFolder.add(options, "z₀ =");
const equationController = equationFolder.add(options, "zₙ =");
/*equationFolder.add({"Add variable": function () {
  const variableName = prompt("Please enter the variable name:", "myVariable");
  if (!variableName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    alert(new Error("Invalid syntax"));
    throw new Error("Invalid syntax");
  }
  let type = prompt("Is the variable complex? Y/n:", "");
  if (type === "Y" || type === "y") {
    type = "vec2";
  } else if (type === "N" || type === "n") {
    type = "float";
  } else {
    alert(new Error(`'${type}' was not an option...`));
    throw new Error(`'${type}' was not an option...`);
  }
  variables.push([variableName, type]);
  options[variableName + " ="] = "";
  equationFolder.add(options, variableName + " =").onChange(() => {
    let variableString = "";
    for (let i = 0; i < variables.length; i++) {
      variableString += variables[i][1] + variables[i][0] + " = " + compileComplexExpression(options[variables[i][0] + " ="]) + "\n";
    }
    meshGeometry.material.defines.VARIABLES = variableString;
    console.log(meshGeometry.material.defines.VARIABLES);
  });
}}, "Add variable");*/
const colorController = gui.addColor(options, "color");
const modeController = gui.add(options, "moveable");

// source: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function compileComplexExpression(expression) {
  function tokenize(expr) {
      const regex = /(?:\d+(?:\.\d*)?|(?:\d*\.)?\d+)|[a-zA-Z_][a-zA-Z0-9_]*|[()+\-*/]|,/g;
      return expr.match(regex) || [];
  }

  function parse(tokens) {
      let pos = 0;

      function parsePrimary() {
          let token = tokens[pos];
          if (!token) throw new Error("Unexpected end of input");
          
          if (token.match(/^(?:\d+(?:\.\d*)?|(?:\d*\.)?\d+)$/)) {
              pos++;
              return token.includes('.') ? token : token + '.0';
          }
          
          if (token.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
              pos++;
              if (tokens[pos] === '(') {
                  pos++;
                  let args = [];
                  if (tokens[pos] !== ')') {
                      while (true) {
                          args.push(parseExpression());
                          if (tokens[pos] === ',') pos++;
                          else break;
                      }
                  }
                  if (tokens[pos] !== ')') throw new Error("Expected )");
                  pos++;
                  return `${token}(${args.join(', ')})`;
              }
              return token;
          }
          
          if (token === '(') {
              pos++;
              let expr = parseExpression();
              if (tokens[pos] !== ')') throw new Error("Expected )");
              pos++;
              return expr;
          }
          throw new Error("Unexpected token: " + token);
      }

      function parseFactor() {
          let left = parsePrimary();
          while (tokens[pos] === '*' || tokens[pos] === '/') {
              let op = tokens[pos++];
              let right = parsePrimary();
              left = `${op === '*' ? 'multiply' : 'divide'}(${left}, ${right})`;
          }
          return left;
      }

      function parseTerm() {
          let left = parseFactor();
          while (tokens[pos] === '+' || tokens[pos] === '-') {
              let op = tokens[pos++];
              let right = parseFactor();
              left = `${op === '+' ? 'add' : 'subtract'}(${left}, ${right})`;
          }
          return left;
      }

      function parseExpression() {
          return parseTerm();
      }

      return parseExpression();
  }
  
  return parse(tokenize(expression));
}



const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  1,
  1000
);
//const controls = new THREE.OrbitControls(camera, renderer.domElement);

camera.position.z = 75;
//controls.update();
let meshGeometry = null;

function updateMaterial() {
  meshGeometry.material.uniforms.resolution.value = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );
  if (options.moveable) {
    meshGeometry.material.uniforms.u_scale.value = scale;
    meshGeometry.material.uniforms.u_offset.value = new THREE.Vector2(
      offsetX,
      offsetY
    );
  } else {
    meshGeometry.material.uniforms.u_scale.value = 1.4;
    meshGeometry.material.uniforms.u_offset.value = new THREE.Vector2(
      0,
      0
    );
  }
  meshGeometry.material.uniforms.u_mouse.value = new THREE.Vector2(
    mouseX,
    mouseY
  );
  meshGeometry.material.uniforms.u_color.value = new THREE.Vector3(
    options.color.r / 255,
    options.color.g / 255,
    options.color.b / 255
  );
  fragmentShader = document.getElementById("fragment-shader").textContent;
  meshGeometry.material.fragmentShader = fragmentShader;
  meshGeometry.material.needsUpdate = true;
}

function addMesh() {
  const vertexShader = document.getElementById("vertex-shader").textContent;
  const fragmentShader = document.getElementById("fragment-shader").textContent;
  
  const bufferGeometry = new THREE.PlaneGeometry(
    window.innerWidth,
    window.innerHeight
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      resolution: {
        value: new THREE.Vector2()
      },
      u_scale: { value: 1 },
      u_offset: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2() },
      u_color: {
        value: new THREE.Vector3()
      }
    },
    defines: {
      EQUATION: compileComplexExpression(options["zₙ ="]),
      ZZERO: compileComplexExpression(options["z₀ ="]),
      //VARIABLES: ""
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  meshGeometry = new THREE.Mesh(bufferGeometry, material);

  equationController.onChange(() => {
    meshGeometry.material.defines.EQUATION = compileComplexExpression(options["zₙ ="]);
    console.log(meshGeometry.material.defines.EQUATION);
  });

  zzeroController.onChange(() => {
    meshGeometry.material.defines.ZZERO = compileComplexExpression(options["z₀ ="]);
    console.log(meshGeometry.material.defines.ZZERO);
  });

  updateMaterial();

  scene.add(meshGeometry);
}

let scale = 1.4;
let offsetX = 0;
let offsetY = 0;
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

window.onwheel = (e) => {
  if (options.moveable) {
    e.preventDefault();
    let deltaScale = e.deltaY / 166.6666;
    scale *= 2 ** deltaScale;
    let newMouseX = mouseX / 2 ** deltaScale;
    let newMouseY = mouseY / 2 ** deltaScale;
    offsetX += (newMouseX - mouseX) * scale;
    offsetY -= (newMouseY - mouseY) * scale;
  }
};

window.onmousemove = (e) => {
  mouseX = ((e.clientX - window.innerWidth / 2) / window.innerHeight) * 2;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
};

window.onmousedown = (e) => {
  if (options.moveable) {
    document.body.style.cursor = "grabbing";
  }
  isMouseDown = true;
};

window.onmouseup = (e) => {
  if (options.moveable) {
    document.body.style.cursor = "grab";
  }
  isMouseDown = false;
};

let lastMouseX = 0;
let lastMouseY = 0;
let currentMouseX = mouseX;
let currentMouseY = mouseY;

function controls() {
  if (!options.moveable) {
    document.body.style.cursor = "default";
    scale = 1.4;
    offsetX = 0;
    offsetY = 0;
    isMouseDown = false;
  }
  currentMouseX = mouseX;
  currentMouseY = mouseY;
  let deltaMouseX = currentMouseX - lastMouseX;
  let deltaMouseY = currentMouseY - lastMouseY;
  if (isMouseDown && options.moveable) {
    offsetX -= deltaMouseX * scale;
    offsetY += deltaMouseY * scale;
  }
  lastMouseX = currentMouseX;
  lastMouseY = currentMouseY;
}


function animate() {
  controls();
  updateMaterial();
  meshGeometry.scale.x = window.innerWidth;
  meshGeometry.scale.y = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

addMesh();
var GUI = lil.GUI;

const stats = new Stats();
const gui = new GUI();

stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const options = {
  isJulia: true,
  equation: "addComplex(multiplyComplex(z, z), c)",
  r: 1.0,
  g: 0.0,
  b: 1.0,
};

gui.add(options, "isJulia");
gui.add(options, "equation");
gui.add(options, "r", 0, 1);
gui.add(options, "g", 0, 1);
gui.add(options, "b", 0, 1);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const camera = new THREE.OrthographicCamera( window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
//const controls = new THREE.OrbitControls(camera, renderer.domElement);

camera.position.z = 75;
//controls.update();
let meshGeometry = null;
let fragmentShader = "";

function addMesh() {
  const vertexShader = document.getElementById('vertex-shader').textContent;
  if (options.isJulia) {
    fragmentShader = document.getElementById('fragment-shader-julia').textContent;
  } else {
    fragmentShader = document.getElementById('fragment-shader').textContent;
  }
  const bufferGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_scale: { value: scale },
      u_offset: { value: new THREE.Vector2(offsetX,offsetY) },
      u_mouse: { value: new THREE.Vector2(mouseX,mouseY) },
      u_color: { value: new THREE.Vector3(options.r,options.g,options.b) }
    },
    defines: { 
      EQUATION: options.equation
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  
  meshGeometry = new THREE.Mesh(bufferGeometry, material);

  scene.add(meshGeometry);
}


let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

const equationInput = document.getElementById("equation")
const modeInput = document.getElementById("mode")

window.onwheel = (e) => {
  e.preventDefault();
  let deltaScale = e.deltaY / 166.6666;
  scale *= 2 ** deltaScale;
  let newMouseX = mouseX / (2 ** deltaScale);
  let newMouseY = mouseY / (2 ** deltaScale);
  offsetX += (newMouseX - mouseX) * scale;
  offsetY -= (newMouseY - mouseY) * scale;
};

window.onmousemove = (e) => {
  e.preventDefault();
  mouseX = ( e.clientX - window.innerWidth / 2 ) / window.innerHeight * 2;
  mouseY = e.clientY / window.innerHeight * 2 - 1;
};

window.onmousedown = (e) => {
  document.body.style.cursor = "grabbing";
  e.preventDefault();
  isMouseDown = true;
}

window.onmouseup = (e) => {
  document.body.style.cursor = "grab";
  e.preventDefault();
  isMouseDown = false;
}



let lastMouseX = 0;
let lastMouseY = 0;
let currentMouseX = mouseX;
let currentMouseY = mouseY;

function controls() {
  if (options.isJulia) {
    document.body.style.cursor = "default";
  }
  currentMouseX = mouseX;
  currentMouseY = mouseY;
  let deltaMouseX = currentMouseX - lastMouseX;
  let deltaMouseY = currentMouseY - lastMouseY;
  if (isMouseDown) {
    offsetX -= deltaMouseX * scale;
    offsetY += deltaMouseY * scale;
  }
  lastMouseX = currentMouseX;
  lastMouseY = currentMouseY;
}

function updateMaterial() {
  meshGeometry.material.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
  meshGeometry.material.uniforms.u_scale.value = scale;
  meshGeometry.material.uniforms.u_offset.value = new THREE.Vector2(offsetX, offsetY);
  meshGeometry.material.uniforms.u_mouse.value = new THREE.Vector2(mouseX,mouseY);
  meshGeometry.material.uniforms.u_color.value = new THREE.Vector3(options.r,options.g,options.b);
  if (options.isJulia) {
    fragmentShader = document.getElementById('fragment-shader-julia').textContent;
  } else {
    fragmentShader = document.getElementById('fragment-shader').textContent;
  }
  meshGeometry.material.fragmentShader = fragmentShader;
  meshGeometry.material.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  controls();
  updateMaterial();
  meshGeometry.scale.x = window.innerWidth;
  meshGeometry.scale.y = window.innerHeight;
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.render( scene, camera );
};

addMesh();
animate();

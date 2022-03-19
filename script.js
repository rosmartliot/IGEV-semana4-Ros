'use strict';

var scene, camera, renderer, orbit, light;
let renderCalls = [];

//creando una escena
scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');
//creando la cámara
camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
//los valores de la perspectiva de camara corresponden con los de la página fundamentals
//se cambia la perspectiva con una posicíón no lineal.
camera.position.z = 30;

//renderizando en la escena
renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio ); //píxeles y tanaño de ventana
renderer.setSize( window.innerWidth, window.innerHeight );
//este desvanece el color  del fondo en tonalidades  cuando se une con el gris del suelo
renderer.setClearColor( 0x242426 );
renderer.toneMapping = THREE.LinearToneMapping;
//se crea la luz desde arriba que genera sombra entorno al auto
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener( 'resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight );
}, false );

document.body.appendChild( renderer.domElement );


//se le garega luz ambiental a la escena
var ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

//se le agrega luz sobre la escena 
let Light = new THREE.HemisphereLight( 0xEBF7FD, 0xEBF7FD, 0.2 );
scene.add( Light );

/*se crea función para darle un acabado a la textura del canvas/*/

function noiseMap(size = 256, intensity = 60, repeat = 0){
  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      width = canvas.width = size,
      height = canvas.height = size;

  let texture = new THREE.Texture(canvas);
  if ( repeat ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //para q se repita la textura
    texture.repeat.set(repeat, repeat);
  }
  texture.needsUpdate = true;

  return texture;
}

/*Creando el cuerpo del auto con dos rectángulos, primero se forma la base y luego el de arriba*/

let carGeometry = new THREE.BoxGeometry(20,10,3);
let carMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xd3bfb7, 
  emissive: 0xFF0000,
  emissiveIntensity: 0.6,
});

let carTopGeometry = new THREE.BoxGeometry(12,8,5);
let carTopMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xd3bfb7, 
  emissive: 0x990000,
  emissiveIntensity: 0.7
});

/* creando las ruedas del auto con el segmento radial aumentado para que sea redonda la rueda*/
let wheelGeometry = new THREE.CylinderGeometry( 3, 3, 1, 32 );
let wheelMaterial = new THREE.MeshBasicMaterial( {color: 0x000000 } );


// con la geometria y el material del carro, se crea un cuerpo unico con la sombra y todo
function Car(color){

  THREE.Object3D.apply(this,arguments);
  let carBody = new THREE.Mesh( carGeometry, carMaterial );
  carBody.castShadow = true;
  carBody.receiveShadow = true;
  this.add(carBody);
    //ya rectificando el rectángulo de arriba
  let carTop = new THREE.Mesh( carTopGeometry, carTopMaterial);
  carTop.position.x -= 2;
  carTop.position.z += 3.5;
  carTop.castShadow = true;
  carTop.receiveShadow = true;
  this.add(carTop);
   // luz y sombra generada desde arriba y en el centro 
  var light = new THREE.PointLight( 0xFFFFFF, 1, 0 );
  light.position.z = 25;
  light.position.x = 5;
  light.castShadow = true;
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 50;
  light.shadow.bias = 0.1;
  light.shadow.radius = 5;
  light.power = 3;
  this.add(light);
  //Se le agregan las ruedas con el material y la geometría ya decididos
  this.wheels = Array(4).fill(null);
  this.wheels = this.wheels.map((wheel,i) => {
    wheel = new THREE.Mesh( wheelGeometry, wheelMaterial );
    wheel.position.y = ( i < 2 ? 6 : -6 );
    wheel.position.x = ( i % 2 ? 6 : -6 );
    wheel.position.z = -3;
    this.add(wheel);
    return wheel;
  });
    
  // se le agregan dos luces en el frente
  this.lights = Array(2).fill(null);
  this.lights = this.lights.map((light,i) => {
   
    light = new THREE.SpotLight( 0xffffff );
    light.position.x = 11;
    light.position.y = ( i < 1 ? -3 : 3 ); //;
    light.position.z = -3;
    light.angle = Math.PI / 3.5;
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 400;
    light.shadow.camera.fov = 40;
    light.target.position.y = ( i < 1 ? -0.5 : 0.5 );
    light.target.position.x = 35;// = Math.PI/2;
    //this.add( light.target );
    this.add( light );
    
    return light;
   }); 
   
       }

    Car.prototype = Object.assign(THREE.Object3D.prototype, {
    constructor: Car,
    maxspeed: 3,
    speed: 0,
    angle: 0,
   steering: 0,
   lightsOn: true, 

    // adpatando algunos rasgos 
    update(){
         
    // se enfoca bien la luz en el sentido de la delantera del auto
    if ( this.lights ) {
      this.lights.forEach((light,i) => {
        light.rotation.z = this.angle;  
        light.target.position.clone(this.position);
        light.target.position.x += 10;
        light.target.position.y += ( i < 1 ? -0.5 : 0.5 );
        light.target.updateMatrixWorld();
      });
      
        } 
    
    //se enfoca bien la posición de la cámara con respecto al auto 
    this.position.x = ( this.position.x > 990 || this.position.x < -990 ? prev.x : this.position.x );
    this.position.y = ( this.position.y > 990 || this.position.y < -990 ? prev.y : this.position.y );
    camera.position.x += ( this.position.x - camera.position.x ) * 0.1; //0.02; // (camera.position.x - this.position.x)/50;
    camera.position.y = ( this.position.y - 40 - ( this.speed * 10 ) );//(( this.position.y -camera.position.y ) * 0.01 ) +; //0.02; //(camera.position.y - thiposition.y)/50;
    camera.lookAt(
      new THREE.Vector3(
        this.position.x, 
        this.position.y, 
      )
    );
  }

});

//se agrega la función car a la escena 
let car = new Car();
scene.add(car);
renderCalls.push(car.update.bind(car));


  let noise = noiseMap(256, 20, 30);
  //se crea una función para el acabar el suelo con geometría plana 
  function ground(){

  let geometry = new THREE.PlaneGeometry( 2000, 2000, 40, 45 ); //se le pone valores con respecto a los ejes y con repsecto a los segumentos.
  for (let i = 0; i < geometry.vertices.length; i++) {
    geometry.vertices[i].x += (Math.cos( i * i )+1/2) * 2; 
    geometry.vertices[i].y += (Math.cos(i )+1/2) * 2; 
    geometry.vertices[i].z = (Math.sin(i * i * i)+1/2) * -4;
  }
  geometry.verticesNeedUpdate = true;
  geometry.normalsNeedUpdate = true;
  geometry.computeFaceNormals(); 

//se define un poco el material 
  let material = new THREE.MeshPhongMaterial({ 
    color: 0xd6ce49, 
    shininess: 80, //le da u toque en el centro de la luz sde arriba como que está enfocada justa al costado del auto
    emissive: 0xFFFFFF,//0xEBF7FD
    shading: THREE.SmoothShading
  }); 

  let plane = new THREE.Mesh( geometry, material );
  plane.receiveShadow = true;
  plane.position.z = -5;

  return plane;

}
scene.add( ground() );

////////////////////////////////////////

let count = 3;

//renderizando la escena conla cámara y todo listo
function render () {

  requestAnimationFrame( render );
  count += 0.03;

  renderCalls.forEach((callback)=>{
    callback();
  });

  renderer.toneMappingExposure = Math.pow( 0.91, 5.0 );
  renderer.render( scene, camera );

};

render();


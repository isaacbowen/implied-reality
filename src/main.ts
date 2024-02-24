import * as THREE from 'three';

class SphereWithRods {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rods: THREE.Mesh[] = [];
  rodMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.scene = new THREE.Scene();

    // Set the background color to a darker shade
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark grey

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(this.scene.position);

    // Rod material with semi-transparency
    this.rodMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Start the rod placement and camera animation
    this.startPlacingRods();
    this.animate();
  }

  placeRod(): void {
    // Define the base and maximum length of the rods
    const baseLength = 1;  // Assuming R = 1 for simplicity
    const maxLength = 4;  // 4R

    // Generate a random length with 2R being the most likely
    const randomFactor = Math.pow(Math.random(), 2);  // Squaring the random number to skew towards lower values
    const lengthVariance = (maxLength - baseLength) * randomFactor;
    const rodLength = baseLength + lengthVariance;

    const rodGeometry = new THREE.CylinderGeometry(0.01, 0.01, rodLength, 32);
    const rod = new THREE.Mesh(rodGeometry, this.rodMaterial);

    // Random spherical coordinates
    const phi = Math.random() * 2 * Math.PI; // Azimuthal angle
    const theta = Math.random() * Math.PI; // Polar angle
    const jitter = 0.9 + Math.random() * 0.2; // Jitter for radius (0.9 to 1.1)

    // Convert spherical to Cartesian coordinates
    const x = jitter * Math.sin(theta) * Math.cos(phi);
    const y = jitter * Math.sin(theta) * Math.sin(phi);
    const z = jitter * Math.cos(theta);

    rod.position.set(x, y, z);

    // Orient rod tangent to sphere
    rod.lookAt(this.scene.position);

    this.scene.add(rod);
    this.rods.push(rod);
  }

  startPlacingRods(): void {
    setInterval(() => {
      this.placeRod();
    }, 100);
  }

  animate = (): void => {
    requestAnimationFrame(this.animate);

    // Parameters for the camera's orbit
    const radius = 5;  // Distance from the center of the scene
    const orbitSpeed = 0.0005;  // Speed of the orbit
    const time = Date.now() * orbitSpeed;

    // Calculate the new camera position
    this.camera.position.x = radius * Math.sin(time);
    this.camera.position.y = 0;  // Keep the camera at the same level as the sphere
    this.camera.position.z = radius * Math.cos(time);

    // Always look at the center of the scene
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));  // Adjust as necessary if your sphere's center is not at the origin

    this.renderer.render(this.scene, this.camera);
  }

}

new SphereWithRods();

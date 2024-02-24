import * as THREE from 'three';

class SphereWithRods {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rods: THREE.Mesh[] = [];
  rodMaterial: THREE.Material;
  sparklineCanvas: HTMLCanvasElement;
  sparklineContext: CanvasRenderingContext2D;
  startTime: number;
  totalDuration: number = 60; // seconds

  constructor() {
    this.constructSphere();
    this.constructSparkline();
  }

  constructSphere(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark grey

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(this.scene.position);

    this.rodMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    this.startPlacingRods();
    this.animate();
  }

  constructSparkline(): void {
    this.sparklineCanvas = document.getElementById('sparkline-canvas') as HTMLCanvasElement;
    this.sparklineContext = this.sparklineCanvas.getContext('2d')!;
    this.startTime = Date.now();
    this.drawSparkline();
  }

  drawSparkline(): void {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.startTime) / 1000; // in seconds
    const cycle = elapsedTime % (2 * this.totalDuration); // Complete cycle for back and forth
    const progress = (cycle > this.totalDuration) ? 2 - cycle / this.totalDuration : cycle / this.totalDuration;

    this.sparklineContext.clearRect(0, 0, this.sparklineCanvas.width, this.sparklineCanvas.height);

    this.sparklineContext.beginPath();
    for (let x = 0; x <= this.sparklineCanvas.width; x++) {
      const t = x / this.sparklineCanvas.width;
      const y = this.calculateFrequency(t) * this.sparklineCanvas.height * 0.8 + (0.1 * this.sparklineCanvas.height);
      this.sparklineContext.lineTo(x, this.sparklineCanvas.height - y);
    }
    this.sparklineContext.stroke();

    const lineX = progress * this.sparklineCanvas.width;
    this.sparklineContext.beginPath();
    this.sparklineContext.moveTo(lineX, 0);
    this.sparklineContext.lineTo(lineX, this.sparklineCanvas.height);
    this.sparklineContext.strokeStyle = 'white';
    this.sparklineContext.lineWidth = 2;
    this.sparklineContext.stroke();

    requestAnimationFrame(this.drawSparkline.bind(this));
  }

  calculateFrequency(t: number): number {
    // Sine function adjusted for [0, 1] range, peaking in the middle
    const sineWave = Math.sin(Math.PI * t);

    // Raise the sine wave to a power to make the curve more dramatic
    const power = 20; // Adjust this power to make the curve more or less dramatic
    const dramaticSineWave = Math.pow(sineWave, power);

    return dramaticSineWave;
  }

  placeRod(): void {
    // Base length and maximum length of the rods
    const baseLength = 1;  // Assuming R = 1 for simplicity
    const maxLength = 4;  // 4R

    // Random length for the rod between baseLength and maxLength
    const rodLength = baseLength + Math.random() * (maxLength - baseLength);

    // Rod geometry
    const rodGeometry = new THREE.CylinderGeometry(0.01, 0.01, rodLength, 32);
    const rod = new THREE.Mesh(rodGeometry, this.rodMaterial);

    // Random spherical coordinates
    const phi = Math.random() * 2 * Math.PI;  // Azimuthal angle
    const theta = Math.acos(2 * Math.random() - 1);  // Polar angle, adjusted for uniform distribution
    const jitter = 0.9 + Math.random() * 0.2;  // Jitter for radius (0.9 to 1.1)

    // Convert spherical to Cartesian coordinates for position
    const x = jitter * Math.sin(theta) * Math.cos(phi);
    const y = jitter * Math.sin(theta) * Math.sin(phi);
    const z = jitter * Math.cos(theta);

    // Set rod position
    rod.position.set(x, y, z);

    // Create a vector representing the rod's position
    const rodPosition = new THREE.Vector3(x, y, z);

    // Calculate the radial direction from the sphere's center to the rod's position
    const radialDirection = rodPosition.clone().normalize();

    // Calculate the up direction for the rod (tangent to the sphere at the rod's position)
    // This can be any vector that is not parallel to the radial direction
    // Here, we use a simple trick: if the radial direction is not vertical, use the world up direction; otherwise, use the world forward direction
    const upDirection = Math.abs(radialDirection.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);

    // Calculate the tangent direction at the rod's position by taking the cross product of the radial and up directions
    const tangentDirection = new THREE.Vector3().crossVectors(radialDirection, upDirection).normalize();

    // Rotate the rod to align with the tangent direction
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangentDirection);

    // Apply an additional random rotation around the radial direction to vary the orientation of the rods
    const randomAngle = Math.random() * 2 * Math.PI;  // Random angle for rotation
    rod.rotateOnWorldAxis(radialDirection, randomAngle);  // Rotate the rod around the radial direction by the random angle

    // Add the rod to the scene and the rods array
    this.scene.add(rod);
    this.rods.push(rod);
  }

  startPlacingRods(): void {
    const placeOrRemoveRod = () => {
      const elapsedTime = (Date.now() - this.startTime) / 1000; // in seconds
      const cycle = Math.floor(elapsedTime / this.totalDuration);
      const t = (elapsedTime % this.totalDuration) / this.totalDuration; // Normalized time for current half-cycle
      const frequency = this.calculateFrequency(t);

      const delayFactor = Math.pow(1 - frequency, 4); // Adjust the exponent as needed
      const delay = 1000 - (1000 - 25) * (1 - delayFactor);

      if (cycle % 2 === 0) {
        this.placeRod(); // Add rod during even cycles
      } else if (this.rods.length > 0) {
        const removeIndex = Math.floor(Math.random() * this.rods.length);
        const [removedRod] = this.rods.splice(removeIndex, 1); // Remove random rod during odd cycles
        this.scene.remove(removedRod);
      }

      setTimeout(placeOrRemoveRod, delay);
    };

    placeOrRemoveRod();
  }

  animate = (): void => {
    requestAnimationFrame(this.animate);

    const orbitSpeed = 0.00025;
    const time = Date.now() * orbitSpeed;

    this.camera.position.x = 5 * Math.sin(time);
    this.camera.position.y = 0;
    this.camera.position.z = 5 * Math.cos(time);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.render(this.scene, this.camera);
  }

}

new SphereWithRods();

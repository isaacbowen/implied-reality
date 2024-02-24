import * as THREE from 'three';

class SphereWithRods {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rods: THREE.Mesh[] = [];
  rodMaterial: THREE.MeshBasicMaterial;
  sparklineCanvas: HTMLCanvasElement;
  sparklineContext: CanvasRenderingContext2D;
  startTime: number;
  totalDuration: number = 10; // seconds

  constructor() {
    this.constructSphere();
    this.constructSparkline();
  }

  constructSphere(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark grey

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(this.scene.position);

    this.rodMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

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
    const progress = elapsedTime / this.totalDuration;

    this.sparklineContext.clearRect(0, 0, this.sparklineCanvas.width, this.sparklineCanvas.height);

    this.sparklineContext.beginPath();
    for (let x = 0; x <= this.sparklineCanvas.width; x++) {
      const t = x / this.sparklineCanvas.width;
      const y = this.calculateFrequency(t) * this.sparklineCanvas.height;
      this.sparklineContext.lineTo(x, this.sparklineCanvas.height - y);
    }
    this.sparklineContext.stroke();

    const lineX = (progress % 1) * this.sparklineCanvas.width;
    this.sparklineContext.beginPath();
    this.sparklineContext.moveTo(lineX, 0);
    this.sparklineContext.lineTo(lineX, this.sparklineCanvas.height);
    this.sparklineContext.strokeStyle = 'white';
    this.sparklineContext.stroke();

    requestAnimationFrame(this.drawSparkline.bind(this));
  }

  calculateFrequency(t: number): number {
    const wrappedT = t % 1; // Wrap t to the range [0, 1]

    // Parabolic curve equation: -4t^2 + 4t
    return -4 * wrappedT * wrappedT + 4 * wrappedT;
  }

  placeRod(): void {
    const baseLength = 1;  // Assuming R = 1
    const maxLength = 4;  // 4R

    const randomFactor = Math.random();  // Direct random factor for simplicity
    const rodLength = baseLength + (maxLength - baseLength) * randomFactor;

    const rodGeometry = new THREE.CylinderGeometry(0.01, 0.01, rodLength, 32);
    const rod = new THREE.Mesh(rodGeometry, this.rodMaterial);

    const phi = Math.random() * 2 * Math.PI; // Azimuthal angle
    const theta = Math.random() * Math.PI; // Polar angle
    const jitter = 0.9 + Math.random() * 0.2; // Jitter for radius

    const x = jitter * Math.sin(theta) * Math.cos(phi);
    const y = jitter * Math.sin(theta) * Math.sin(phi);
    const z = jitter * Math.cos(theta);

    rod.position.set(x, y, z);
    rod.lookAt(this.scene.position);

    this.scene.add(rod);
    this.rods.push(rod);
  }

  startPlacingRods(): void {
    const minInterval = 25; // Minimum interval time in ms
    const maxInterval = 1000; // Maximum interval time in ms

    const placeRodWithVariableTiming = () => {
      const elapsedTime = (Date.now() - this.startTime) / 1000; // in seconds
      const t = elapsedTime / this.totalDuration; // Normalize time based on total duration
      const frequency = this.calculateFrequency(t);

      // Use an exponential function to decrease the delay more significantly at higher frequencies
      const delayFactor = Math.pow(1 - frequency, 100); // The exponent can be adjusted to control the "dramatic" effect
      const delay = maxInterval - (maxInterval - minInterval) * (1 - delayFactor);

      this.placeRod();

      setTimeout(placeRodWithVariableTiming, delay);
    };

    placeRodWithVariableTiming();
  }

  animate = (): void => {
    requestAnimationFrame(this.animate);

    const orbitSpeed = 0.0005;
    const time = Date.now() * orbitSpeed;

    this.camera.position.x = 5 * Math.sin(time);
    this.camera.position.y = 0;
    this.camera.position.z = 5 * Math.cos(time);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.render(this.scene, this.camera);
  }

}

new SphereWithRods();

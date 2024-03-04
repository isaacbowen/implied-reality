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
  lastTime: number = 0; // To track the last animation frame time
  totalDuration: number = 60; // seconds
  baselineOrbitSpeed: number = 0.25; // Original baseline speed
  currentOrbitSpeed: number = this.baselineOrbitSpeed; // Starts at the baseline speed
  accumulatedAngle: number = 0; // To accumulate the orbit angle

  x: number = 0; // Our progress along the x axis of the sparkline, ranging from 0 to 1
  y: number = 0; // The height of the sparkline curve as we progress, ranging from 0 to 1
  reverse: boolean = false; // Indicates whether we're going forward or backward

  constructor() {
    this.lastTime = Date.now();
    this.constructSphere();
    this.constructSparkline();
    this.addEventListeners();
    this.updateXY(); // Initialize the time and direction update loop
  }

  addEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    // Add click event listener for toggling fullscreen
    window.addEventListener('click', this.toggleFullScreen.bind(this), false);
  }

  toggleFullScreen(): void {
    if (!document.fullscreenElement) {
      if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.sparklineCanvas.width = Math.min(window.innerWidth, window.innerHeight) * 0.5;
    this.sparklineCanvas.height = this.sparklineCanvas.width * 0.3;
  }

  constructSphere(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
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
    this.sparklineCanvas.width = Math.min(window.innerWidth, window.innerHeight) * 0.5;
    this.sparklineCanvas.height = this.sparklineCanvas.width * 0.3;
    this.startTime = Date.now();
    this.drawSparkline();
  }

  updateXY(): void {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.startTime) / 1000; // in seconds
    const cycle = Math.floor(elapsedTime / this.totalDuration);
    this.x = (elapsedTime % this.totalDuration) / this.totalDuration; // Normalized time for current cycle
    this.y = this.calculateY(this.x); // Calculate the corresponding y value
    this.reverse = cycle % 2 !== 0; // Reverse direction every other cycle

    requestAnimationFrame(this.updateXY.bind(this));
  }

  drawSparkline(): void {
    this.sparklineContext.clearRect(0, 0, this.sparklineCanvas.width, this.sparklineCanvas.height);
    this.sparklineContext.strokeStyle = 'white';
    this.sparklineContext.lineWidth = Math.ceil(Math.sqrt(Math.min(window.innerWidth, window.innerHeight)) / 1000) * 3;

    this.sparklineContext.beginPath();
    for (let x = 10; x <= this.sparklineCanvas.width - 10; x++) {
      const t = (x - 10) / (this.sparklineCanvas.width - 20); // Adjust to ensure t starts from 0
      const y = this.calculateY(t) * (this.sparklineCanvas.height - 20);
      this.sparklineContext.lineTo(x, this.sparklineCanvas.height - 10 - y); // Invert y when plotting
    }
    this.sparklineContext.stroke();

    // Adjust the cursor position for back-and-forth movement
    const cursorProgress = this.reverse ? 1 - this.x : this.x; // If reverse is true, move the cursor backwards
    const lineX = cursorProgress * (this.sparklineCanvas.width - 20) + 10;

    this.sparklineContext.beginPath();
    this.sparklineContext.moveTo(lineX, 0);
    this.sparklineContext.lineTo(lineX, this.sparklineCanvas.height);
    this.sparklineContext.stroke();

    requestAnimationFrame(this.drawSparkline.bind(this));
  }

  calculateY(t: number): number {
    // Ensure t is in the range [0, 1]
    t = Math.max(0, Math.min(1, t));

    // Calculate the sine wave, mapped to go from 0 at t=0, to 1 at t=0.5, back to 0 at t=1
    const sineWave = Math.sin(Math.PI * t);

    // Raise the sine wave to a power to sharpen the peak
    const power = 20;
    const y = Math.pow(sineWave, power);

    // Return the y value, which should now start and end at 0, with a peak in the middle
    return y;
  }

  placeRod(): void {
    const baseLength = 1;
    const maxLength = 4;
    const biasFactor = 3;
    const rodLength = baseLength + Math.pow(Math.random(), biasFactor) * (maxLength - baseLength);
    const rodGeometry = new THREE.CylinderGeometry(0.01, 0.01, rodLength, 32);
    const rod = new THREE.Mesh(rodGeometry, this.rodMaterial);
    const phi = Math.random() * 2 * Math.PI;
    const theta = Math.acos(2 * Math.random() - 1);
    const jitter = 0.9 + Math.random() * 0.2;
    const x = jitter * Math.sin(theta) * Math.cos(phi);
    const y = jitter * Math.sin(theta) * Math.sin(phi);
    const z = jitter * Math.cos(theta);
    rod.position.set(x, y, z);
    const rodPosition = new THREE.Vector3(x, y, z);
    const radialDirection = rodPosition.clone().normalize();
    const upDirection = Math.abs(radialDirection.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    const tangentDirection = new THREE.Vector3().crossVectors(radialDirection, upDirection).normalize();
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangentDirection);
    const randomAngle = Math.random() * 2 * Math.PI;
    rod.rotateOnWorldAxis(radialDirection, randomAngle);
    this.scene.add(rod);
    this.rods.push(rod);
  }

  startPlacingRods(): void {
    const placeOrRemoveRod = () => {
      // Keep the maximum delay the same to maintain the bottom speed
      const maxDelay = 1000; // Maximum delay in milliseconds

      // Decrease the minimum delay to increase the top speed of rod addition/removal
      const minDelay = 40; // Minimum delay in milliseconds, reduced to increase top speed

      // Use a sharper curve to decrease the delay as this.y increases
      // The exponent can be adjusted to control how quickly the delay decreases
      const delayFactor = Math.pow(1 - this.y, 10); // Using a square to make the decrease more pronounced

      // Calculate the actual delay using the delayFactor to interpolate between minDelay and maxDelay
      const delay = minDelay + (maxDelay - minDelay) * delayFactor;

      if (!this.reverse) {
        this.placeRod();
      } else if (this.rods.length > 0) {
        const removeIndex = Math.floor(Math.random() * this.rods.length);
        const [removedRod] = this.rods.splice(removeIndex, 1);
        this.scene.remove(removedRod);
      }
      setTimeout(placeOrRemoveRod, delay);
    };
    placeOrRemoveRod();
  }

  animate = (): void => {
    requestAnimationFrame(this.animate);

    // Directly correlate orbit speed with this.y, increasing it around the peak
    const speedMultiplier = 1 + 3 * this.y; // Ranges from 1 (at y=0) to 4 (at y=1)
    this.currentOrbitSpeed = this.baselineOrbitSpeed * speedMultiplier;

    // Calculate the change in angle based on the current orbit speed
    const deltaTime = this.getDeltaTime(); // Get the time difference since the last frame
    const angleIncrement = this.currentOrbitSpeed * deltaTime; // Calculate the angle increment for this frame
    this.accumulatedAngle += angleIncrement; // Accumulate the angle

    this.camera.position.x = 5 * Math.sin(this.accumulatedAngle);
    this.camera.position.y = 0;
    this.camera.position.z = 5 * Math.cos(this.accumulatedAngle);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.render(this.scene, this.camera);
  }

  // Helper method to calculate the time difference since the last frame
  lastFrameTime: number = performance.now();
  getDeltaTime(): number {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;
    return deltaTime;
  }
}

new SphereWithRods();

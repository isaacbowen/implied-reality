import * as THREE from 'three';

interface RodParameters {
  rodRadius: number;
  rodLength: number;
  rodSegments: number;
}

class ThreeJSSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rodGeometry: THREE.CylinderGeometry;
  cameraRadius: number; // Distance of the camera from the center of the scene
  cameraTheta: number; // Horizontal angle for camera rotation

  constructor(rodParams: RodParameters) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Set the initial position and orientation of the camera
    this.cameraRadius = 5; // Adjust as needed
    this.cameraTheta = 0; // Starting angle

    this.updateCameraPosition();

    this.rodGeometry = new THREE.CylinderGeometry(rodParams.rodRadius, rodParams.rodRadius, rodParams.rodLength, rodParams.rodSegments);
  }

  addRodToSphere(): void {
    const sphereRadius = 2; // Adjust as needed
    const phi = Math.random() * Math.PI; // Random angle for spherical coordinates
    const theta = Math.random() * 2 * Math.PI;

    // Convert spherical coordinates to Cartesian for the rod's position
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
    const z = sphereRadius * Math.cos(phi);

    // Number of segments per rod to simulate the bell curve opacity
    const segments = 10; // More segments for a smoother gradient
    const segmentLength = this.rodGeometry.parameters.height / segments;

    for (let i = 0; i < segments; i++) {
      // Calculate opacity using a simple bell curve formula, adjusted for the number of segments
      const opacity = Math.exp(-Math.pow(i - segments / 2, 2) / (2 * Math.pow(segments / 4, 2)));

      // Create a material for each segment with the calculated opacity
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: opacity
      });

      // Create a segment and position it accordingly
      const segmentGeometry = new THREE.CylinderGeometry(this.rodGeometry.parameters.radiusTop, this.rodGeometry.parameters.radiusBottom, segmentLength, this.rodGeometry.parameters.radialSegments);
      const segment = new THREE.Mesh(segmentGeometry, material);

      // Calculate the segment's position along the rod
      const segmentPosition = (i - segments / 2 + 0.5) * segmentLength;
      segment.position.set(x, y + segmentPosition, z);

      // Orient the segment towards the center of the sphere
      segment.lookAt(this.scene.position);

      this.scene.add(segment);
    }
  }


  updateCameraPosition(): void {
    // Update the camera's position using spherical coordinates
    this.camera.position.x = this.cameraRadius * Math.sin(this.cameraTheta);
    this.camera.position.z = this.cameraRadius * Math.cos(this.cameraTheta);
    this.camera.lookAt(this.scene.position); // Ensure the camera always looks at the center of the scene
  }

  animate = (): void => {
    requestAnimationFrame(this.animate);

    // Update the camera's position for each frame to rotate it around the sphere
    this.cameraTheta += 0.01; // Adjust the speed of rotation as needed
    this.updateCameraPosition();

    this.renderer.render(this.scene, this.camera);
  }
}

const rodParams: RodParameters = { rodRadius: 0.05, rodLength: 5, rodSegments: 32 };
const threeJSSetup = new ThreeJSSetup(rodParams);

threeJSSetup.animate();

// Set an interval to add a rod every 100ms
setInterval(() => {
  threeJSSetup.addRodToSphere();
}, 100);

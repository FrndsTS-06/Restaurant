import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js GLTFExporter binary export
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '../client/public/models/food');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function exportSceneToGLB(scene, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (glb) => {
        const filePath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(glb));
        const stats = fs.statSync(filePath);
        console.log(`✓ Exported ${filename} (${(stats.size / 1024).toFixed(2)} KB) -> ${filePath}`);
        resolve({ filename, size: stats.size, path: filePath });
      },
      (error) => {
        console.error(`Error exporting ${filename}:`, error);
        reject(error);
      },
      { binary: true }
    );
  });
}

// ----------------------------------------------------------------------
// 1. A5 MIYAZAKI WAGYU RIBEYE
// ----------------------------------------------------------------------
function buildWagyuScene() {
  const scene = new THREE.Scene();
  scene.name = 'A5_Miyazaki_Wagyu_Ribeye';

  // Bone China Porcelain Platter
  const plateGeo = new THREE.CylinderGeometry(1.5, 1.2, 0.1, 32);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xfdfdfd,
    roughness: 0.15,
    metalness: 0.05
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = -0.05;
  scene.add(plate);

  // 24K Gold Filigree Rim
  const rimGeo = new THREE.TorusGeometry(1.48, 0.02, 8, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf5cf8e,
    metalness: 0.95,
    roughness: 0.15
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.01;
  scene.add(rim);

  // Rich Demi-Glace Sauce Reduction Swirl
  const sauceGeo = new THREE.RingGeometry(0.25, 0.85, 24);
  const sauceMat = new THREE.MeshStandardMaterial({
    color: 0x220e06,
    roughness: 0.1,
    metalness: 0.2
  });
  const sauce = new THREE.Mesh(sauceGeo, sauceMat);
  sauce.rotation.x = -Math.PI / 2;
  sauce.position.y = 0.015;
  scene.add(sauce);

  // A5 Wagyu Medallion
  const wagyuGeo = new THREE.CylinderGeometry(0.5, 0.52, 0.22, 24);
  const wagyuMat = new THREE.MeshStandardMaterial({
    color: 0x381c14,
    roughness: 0.6,
    metalness: 0.15
  });
  const wagyu = new THREE.Mesh(wagyuGeo, wagyuMat);
  wagyu.position.y = 0.12;
  scene.add(wagyu);

  // Caramelized Sear Crust Top
  const crustGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.015, 24);
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0x200e08,
    roughness: 0.4,
    metalness: 0.2
  });
  const crust = new THREE.Mesh(crustGeo, crustMat);
  crust.position.y = 0.235;
  scene.add(crust);

  // Norcia Black Truffle Shavings
  const truffleMat = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.7 });
  const truffle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 12), truffleMat);
  truffle1.position.set(-0.12, 0.25, 0.08);
  truffle1.rotation.set(0.1, 0.4, 0.1);
  scene.add(truffle1);

  const truffle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 12), truffleMat);
  truffle2.position.set(0.14, 0.255, -0.06);
  truffle2.rotation.set(-0.1, -0.3, -0.1);
  scene.add(truffle2);

  // Edible 24K Gold Leaf
  const goldLeafGeo = new THREE.PlaneGeometry(0.12, 0.1);
  const goldLeafMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.98,
    roughness: 0.1,
    side: THREE.DoubleSide
  });
  const goldLeaf = new THREE.Mesh(goldLeafGeo, goldLeafMat);
  goldLeaf.position.set(0.02, 0.27, 0);
  goldLeaf.rotation.set(0.2, 0.3, 0.4);
  scene.add(goldLeaf);

  return scene;
}

// ----------------------------------------------------------------------
// 2. GRAND CRU DARK CHOCOLATE SPHERE
// ----------------------------------------------------------------------
function buildChocolateSphereScene() {
  const scene = new THREE.Scene();
  scene.name = 'Grand_Cru_Dark_Chocolate_Sphere';

  // Obsidian Ceramic Dessert Plate
  const plateGeo = new THREE.CylinderGeometry(1.4, 1.15, 0.08, 32);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x111319,
    roughness: 0.4,
    metalness: 0.2
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = -0.04;
  scene.add(plate);

  // Gold Filigree Accent Ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.36, 0.018, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xe6af5d, metalness: 0.92, roughness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.005;
  scene.add(ring);

  // Salted Caramel Ganache Pool
  const caramel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.8, 0.03, 24),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.18, metalness: 0.2 })
  );
  caramel.position.y = 0.02;
  scene.add(caramel);

  // Valrhona 70% Dark Chocolate Sphere
  const sphereGeo = new THREE.SphereGeometry(0.52, 28, 24);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x1a0f0a,
    roughness: 0.25,
    metalness: 0.15
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 0.52;
  scene.add(sphere);

  // Torched Gold Leaf on Crown
  const goldTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1, side: THREE.DoubleSide })
  );
  goldTop.rotation.x = -Math.PI / 2.3;
  goldTop.position.set(0.05, 1.04, 0.02);
  scene.add(goldTop);

  // Madagascar Vanilla Bean Quenelle
  const quenelleGeo = new THREE.SphereGeometry(0.18, 16, 12);
  quenelleGeo.scale(1.4, 0.7, 0.8);
  const quenelleMat = new THREE.MeshStandardMaterial({
    color: 0xfef9ee,
    roughness: 0.5,
    metalness: 0.05
  });
  const quenelle = new THREE.Mesh(quenelleGeo, quenelleMat);
  quenelle.position.set(0.65, 0.12, 0.35);
  quenelle.rotation.set(0.1, 0.6, -0.2);
  scene.add(quenelle);

  return scene;
}

// ----------------------------------------------------------------------
// 3. SMOKED ROSEMARY OLD FASHIONED
// ----------------------------------------------------------------------
function buildOldFashionedScene() {
  const scene = new THREE.Scene();
  scene.name = 'Smoked_Rosemary_Old_Fashioned';

  // Coaster / Base Rim
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.04, 28),
    new THREE.MeshStandardMaterial({ color: 0x1e1510, roughness: 0.7, metalness: 0.2 })
  );
  coaster.position.y = -0.02;
  scene.add(coaster);

  // Crystal Lowball Glass Base
  const glassBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.18, 28),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.7 })
  );
  glassBase.position.y = 0.09;
  scene.add(glassBase);

  // Crystal Glass Wall
  const glassWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.65, 1.1, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  glassWall.position.y = 0.65;
  scene.add(glassWall);

  // Amber Bourbon Liquid
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.65, 24),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.85 })
  );
  liquid.position.y = 0.45;
  scene.add(liquid);

  // Hand-Carved Clear Ice Sphere
  const ice = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.8 })
  );
  ice.position.set(0, 0.52, 0);
  scene.add(ice);

  // Flamed Orange Twist Peel
  const peel = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.04, 8, 20, Math.PI * 1.3),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35, metalness: 0.1 })
  );
  peel.position.set(0.18, 0.82, 0.12);
  peel.rotation.set(0.4, 0.2, 0.5);
  scene.add(peel);

  // Charred Fresh Rosemary Sprig
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.75, 8),
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 })
  );
  stem.position.set(-0.15, 0.85, 0.1);
  stem.rotation.set(-0.3, 0.2, 0.35);
  scene.add(stem);

  return scene;
}

// ----------------------------------------------------------------------
// 4. PAN-SEARED HOKKAIDO SCALLOPS
// ----------------------------------------------------------------------
function buildScallopsScene() {
  const scene = new THREE.Scene();
  scene.name = 'Pan_Seared_Hokkaido_Scallops';

  // Fine Bone China Coupe Dish
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 0.95, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.15, metalness: 0.05 })
  );
  dish.position.y = -0.07;
  scene.add(dish);

  // Gold Inlay Rim
  const goldRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.018, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xf5cf8e, metalness: 0.94, roughness: 0.15 })
  );
  goldRim.rotation.x = Math.PI / 2;
  goldRim.position.y = 0.005;
  scene.add(goldRim);

  // Creamy Cauliflower Velouté Pool
  const veloute = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.02, 28),
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.2, metalness: 0.1 })
  );
  veloute.position.y = 0.01;
  scene.add(veloute);

  // Scallop Body & Sear Material
  const scallopBodyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
  const searCrustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.15 });

  // Trio of Hokkaido Scallops in Triangular Composition
  const positions = [
    [-0.32, 0, -0.15],
    [0.32, 0, -0.15],
    [0.0, 0, 0.32]
  ];

  positions.forEach(([x, _, z], idx) => {
    const group = new THREE.Group();
    group.position.set(x, 0.08, z);

    // Scallop Cylindrical Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.16, 20), scallopBodyMat);
    group.add(body);

    // Caramelized Sear Top
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.015, 20), searCrustMat);
    top.position.y = 0.085;
    group.add(top);

    // Black Truffle Pearls
    const pearl = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.3 })
    );
    pearl.position.set(0.04, 0.105, 0.02);
    group.add(pearl);

    scene.add(group);
  });

  return scene;
}

// ----------------------------------------------------------------------
// MAIN EXPORT PIPELINE
// ----------------------------------------------------------------------
async function runAssetGeneration() {
  console.log('================================================================');
  console.log('  GENERATING STANDARDS-COMPLIANT OPTIMIZED GLB FOOD MODELS       ');
  console.log('================================================================\n');

  const models = [
    { name: 'a5-wagyu-ribeye.glb', scene: buildWagyuScene() },
    { name: 'chocolate-sphere.glb', scene: buildChocolateSphereScene() },
    { name: 'old-fashioned.glb', scene: buildOldFashionedScene() },
    { name: 'pan-seared-scallops.glb', scene: buildScallopsScene() }
  ];

  const results = [];
  for (const model of models) {
    const res = await exportSceneToGLB(model.scene, model.name);
    results.push(res);
  }

  console.log('\nAll 4 Approved Food Models successfully created as optimized GLB files.');
  return results;
}

runAssetGeneration().catch(err => {
  console.error(err);
  process.exit(1);
});

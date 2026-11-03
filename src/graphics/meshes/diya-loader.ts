import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DiyaMesh } from './diya-mesh';

export interface LoadedDiyaResult {
  group: THREE.Group;
  wickAnchor: THREE.Vector3;
  dispose: () => void;
}

/**
 * Loads an optional external GLTF/GLB model from /models/diya.glb,
 * falling back seamlessly to procedural Diya geometry if absent (D-01).
 */
export async function loadDiyaModelWithFallback(): Promise<LoadedDiyaResult> {
  const procedural = new DiyaMesh();

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
      loader.load(
        '/models/diya.glb',
        (loaded) => resolve(loaded),
        undefined,
        (err) => reject(err)
      );
    });

    const anchorObj = gltf.scene.getObjectByName('WickAnchor');
    const wickAnchor = anchorObj
      ? anchorObj.position.clone()
      : new THREE.Vector3(0.0, 0.68, 1.38);

    // Clean up unused procedural instance
    procedural.dispose();

    return {
      group: gltf.scene,
      wickAnchor,
      dispose: () => {
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      },
    };
  } catch {
    // Silent fallback to procedural geometry
    return {
      group: procedural.group,
      wickAnchor: procedural.wickAnchor,
      dispose: () => procedural.dispose(),
    };
  }
}

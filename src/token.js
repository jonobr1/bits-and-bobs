import { LatheGeometry, Path, Mesh, Texture, MeshPhongMaterial } from 'three';

const segments = {
  cap: [0.5, 64],
  radial: [4, 64],
};
const sizes = [0, 4];

// TODO: Move to an encapsulated model or SDF
// to improve page loads
class TokenGeometry extends LatheGeometry {
  constructor(
    radius,
    length,
    capSegments,
    radialSegments,
    heightSegments,
    warpType
  ) {
    const path = new Path();
    const height = length;

    if (warpType === TokenGeometry.WARP_TYPES.BULGE) {
      path.absarc(0, -length / 2, 1.5 * radius, Math.PI * 1.5, 0);
      for (let i = 0; i < heightSegments; i++) {
        const pct = i / heightSegments;
        let x = radius;
        let y = height * pct - height / 2;
        if (pct < 0.5) {
          x = lerp(radius * 1.5, radius, 2 * pct);
        }
        path.lineTo(x, y);
      }

      path.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
    } else {
      path.absarc(0, -length / 2, radius, Math.PI * 1.5, 0);

      for (let i = 0; i < heightSegments; i++) {
        const pct = i / heightSegments;
        let x = radius;
        let y = height * pct - height / 2;
        if (warpType === TokenGeometry.WARP_TYPES.PINCH) {
          if (pct < 0.5) {
            x = lerp(radius, radius * 0.5, 2 * pct);
          } else {
            x = lerp(radius, radius * 0.5, 2 * (1 - pct));
          }
        }
        path.lineTo(x, y);
      }

      path.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
    }

    super(path.getPoints(capSegments), radialSegments);

    this.type = 'TokenGeometry';

    this.parameters = {
      radius: radius,
      length: length,
      capSegments: capSegments,
      radialSegments: radialSegments,
      heightSegments: heightSegments,
    };
  }

  static WARP_TYPES = {
    BULGE: 'bulge',
    PINCH: 'pinch',
  };

  static fromJSON(data) {
    return new TokenGeometry(
      data.radius,
      data.length,
      data.capSegments,
      data.radialSegments,
      data.heightSegments
    );
  }
}

export class Token extends Mesh {
  isToken = true;

  constructor(colors) {
    const radius = 1;
    const sid = Math.floor(Math.random() * segments.cap.length);
    const sc = segments.cap[sid];
    const sr = segments.radial[sid];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    let type;
    if (size > 0 && Math.random() > 0.33) {
      if (Math.random() > 0.5) {
        type = TokenGeometry.WARP_TYPES.BULGE;
      } else {
        type = TokenGeometry.WARP_TYPES.PINCH;
      }
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1;
    canvas.height = 128;

    const gradient = ctx.createLinearGradient(0, 0, 1, 128);

    for (let i = 0; i < colors.length; i++) {
      const pct = i / (colors.length - 1);
      gradient.addColorStop(pct, colors[i]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    const geometry = new TokenGeometry(radius, radius * size, sc, sr, 32, type);
    const material = new MeshPhongMaterial({
      color: 0xffffff,
      map: texture,
      emissive: 0x000000,
      specular: 0x111111,
      fog: true,
      flatShading: sc < 1,
      shininess: 0,
      reflectivity: 0,
      refractionRatio: 0,
    });
    super(geometry, material);

    this.castShadow = true;
    this.receiveShadow = true;
  }
}

function lerp(a, b, t) {
  return t * (b - a) + a;
}

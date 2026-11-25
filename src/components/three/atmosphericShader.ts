export const ATMOSPHERIC_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export function buildAtmosphericFragmentShader(octaves: 2 | 3): string {
  return /* glsl */ `
    precision highp float;

    #define FBM_OCTAVES ${octaves}

    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uChaos;
    uniform float uTheme;
    uniform vec2 uResolution;

    varying vec2 vUv;

    // 2D Simplex Noise (Ashima / Stefan Gustavson)
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec2 mod289(vec2 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec3 permute(vec3 x) {
      return mod289(((x * 34.0) + 1.0) * x);
    }

    float snoise(vec2 v) {
      const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
        -0.577350269189626,
        0.024390243902439
      );

      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);

      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;

      i = mod289(i);
      vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
      );

      vec3 m = max(
        0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
        0.0
      );
      m = m * m;
      m = m * m;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.52;
      mat2 rot = mat2(0.84, 0.54, -0.54, 0.84);

      for (int i = 0; i < FBM_OCTAVES; i++) {
        value += amp * snoise(p);
        p = rot * p * 1.92 + vec2(3.17, 1.83);
        amp *= 0.48;
      }
      return value;
    }

    // Deterministic interleaved gradient micro-dither to prevent 8-bit banding
    float microDither(vec2 fragCoord) {
      float n = fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715))));
      return (n - 0.5) * 0.006;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = max(uResolution.x, 1.0) / max(uResolution.y, 1.0);
      vec2 centered = (uv - 0.5) * vec2(min(aspect, 1.85), 1.0);

      // Soft cursor attraction field
      vec2 mouseCentered = (uMouse - 0.5) * vec2(min(aspect, 1.85), 1.0);
      vec2 toMouse = centered - mouseCentered;
      float mouseDistSq = dot(toMouse, toMouse);
      float mouseHalo = exp(-mouseDistSq * 2.4);

      // Gentle silk domain warp modulated by chaos state
      float t = uTime * 0.22;
      float agitation = mix(0.0, 0.16, uChaos);
      vec2 flowUv = centered * vec2(1.05, 1.25) - toMouse * (0.14 * mouseHalo);

      vec2 warp = vec2(
        fbm(flowUv + vec2(t * 0.42, -t * 0.24)),
        fbm(flowUv + vec2(-t * 0.31 + 2.4, t * 0.37 - 1.3))
      );

      // Secondary caustic ribbon layer
      float silkPrimary = fbm(
        flowUv * (1.15 + agitation * 0.65) +
        warp * (0.68 + agitation * 0.5) +
        vec2(t * 0.18, -t * 0.12)
      );

      float silkSecondary = fbm(
        flowUv * 1.48 -
        warp * 0.52 +
        vec2(-t * 0.21 + 4.1, t * 0.16 + 1.9)
      );

      // Smooth velvety light bands [0..1]
      float oceanBand = smoothstep(-0.55, 0.72, silkPrimary * 0.75 + 0.18);
      float pearlBand = smoothstep(-0.25, 0.85, silkSecondary * 0.65 + mouseHalo * 0.35);

      // Spatially separated focal envelopes so Ocean and Coral never mix into violet
      float upperFocus = smoothstep(0.08, 0.72, uv.y) * (1.0 - smoothstep(0.94, 1.12, uv.y));
      float centerEnvelope = exp(-dot(centered * vec2(0.88, 1.18), centered * vec2(0.88, 1.18)) * 1.45);
      float coralEnvelope = exp(
        -dot((centered - vec2(0.08, 0.06)) * vec2(1.15, 1.35), (centered - vec2(0.08, 0.06)) * vec2(1.15, 1.35)) * 1.9
      );

      // Gentle billowing agitation shimmer when uChaos > 0
      float chaosWave = 0.5 + 0.5 * sin(silkSecondary * 3.1 + uTime * 0.85);
      float coralMask = coralEnvelope * smoothstep(-0.2, 0.75, silkSecondary + 0.18) * (0.72 + 0.28 * chaosWave) * uChaos;

      // Calm sage serenity rises as uChaos -> 0
      float calmFactor = 1.0 - uChaos;
      float sageMask = centerEnvelope * smoothstep(-0.3, 0.75, silkSecondary * 0.8 + 0.12) * calmFactor;

      // ======================================================================
      // LIGHT MODE PALETTE (Cool Mist #F7F9FA + Ocean Mist #118AB2 + Pearl)
      // ======================================================================
      vec3 lightCanvas = vec3(0.9686, 0.9765, 0.9804); // #F7F9FA
      vec3 lightPearl = vec3(0.996, 0.998, 1.0);
      vec3 lightOcean = vec3(0.0667, 0.5412, 0.6980);  // #118AB2
      vec3 lightCoral = vec3(0.8510, 0.3150, 0.2950);  // Soft muted #D94A4A warmed slightly
      vec3 lightSage = vec3(0.1686, 0.6196, 0.3569);   // #2B9E5B

      vec3 lightCol = lightCanvas;
      // Subtle translucent Ocean Mist wash (~14% peak influence)
      float lightOceanWeight = oceanBand * (0.145 * upperFocus) * (1.0 - coralMask * 0.45);
      lightCol = mix(lightCol, lightOcean, clamp(lightOceanWeight, 0.0, 0.16));

      // Pale pearl caustic lift
      lightCol = mix(lightCol, lightPearl, clamp(pearlBand * 0.34 * upperFocus, 0.0, 0.34));

      // Warm muted coral agitation (~10% peak influence when uChaos = 1.0)
      lightCol = mix(lightCol, lightCoral, clamp(coralMask * 0.105 * upperFocus, 0.0, 0.11));

      // Tranquil sage harmony (~9% peak influence when uChaos = 0.0)
      lightCol = mix(lightCol, lightSage, clamp(sageMask * 0.092 * upperFocus, 0.0, 0.095));

      // Whisper pointer highlight
      lightCol = mix(lightCol, lightPearl, mouseHalo * 0.14 * upperFocus);

      // ======================================================================
      // DARK MODE PALETTE (Deep Ink #071014 + Submerged Cyan #2EA8D1)
      // ======================================================================
      vec3 darkCanvas = vec3(0.0275, 0.0627, 0.0784);  // #071014
      vec3 darkCyan = vec3(0.1804, 0.6588, 0.8196);    // #2EA8D1
      vec3 darkTerra = vec3(0.8400, 0.3800, 0.3200);   // Muted warm terracotta
      vec3 darkSage = vec3(0.3200, 0.7200, 0.5200);    // Deep aurora teal/sage

      vec3 darkCol = darkCanvas;
      // Submerged deep-ocean cyan luminescence (~16% peak influence)
      float darkOceanWeight = oceanBand * (0.165 * upperFocus) * (1.0 - coralMask * 0.4);
      darkCol = mix(darkCol, darkCyan, clamp(darkOceanWeight, 0.0, 0.18));

      // Whisper cursor underwater sheen
      darkCol = mix(darkCol, darkCyan, clamp(pearlBand * mouseHalo * 0.09 * upperFocus, 0.0, 0.1));

      // Warm terracotta agitation (uChaos = 1.0)
      darkCol = mix(darkCol, darkTerra, clamp(coralMask * 0.115 * upperFocus, 0.0, 0.12));

      // Deep aurora sage serenity (uChaos = 0.0)
      darkCol = mix(darkCol, darkSage, clamp(sageMask * 0.105 * upperFocus, 0.0, 0.11));

      // ======================================================================
      // THEME CROSSFADE + SEAMLESS BOTTOM CANVAS FADE + MICRO-DITHER
      // ======================================================================
      vec3 finalColor = mix(lightCol, darkCol, clamp(uTheme, 0.0, 1.0));
      vec3 canvasBase = mix(lightCanvas, darkCanvas, clamp(uTheme, 0.0, 1.0));

      // Seamless shader-side melt into page canvas near lower hero edge
      float bottomMelt = smoothstep(0.02, 0.36, uv.y);
      finalColor = mix(canvasBase, finalColor, bottomMelt);

      // Subtle deterministic micro-dither (+/- 0.003)
      finalColor += microDither(gl_FragCoord.xy);

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
    }
  `;
}

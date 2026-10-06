"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import bra from "./bra.geo.json";
import pry from "./pry.geo.json";

type Anel = number[][];
type Geo = { features: { geometry: { coordinates: number[][][] } }[] };

function ponto(lat: number, lon: number, raio: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -raio * Math.sin(phi) * Math.cos(theta),
    raio * Math.cos(phi),
    raio * Math.sin(phi) * Math.sin(theta),
  );
}

function anelDe(geo: Geo) {
  const bruto = geo.features[0].geometry.coordinates[0];
  const anel = bruto.slice(0, -1);
  return anel.length > 2 && anel[0][0] === anel[anel.length - 1][0] ? anel.slice(0, -1) : anel;
}

function centro(anel: Anel) {
  let lon = 0;
  let lat = 0;
  for (const pontoAnel of anel) {
    lon += pontoAnel[0];
    lat += pontoAnel[1];
  }
  return { lon: lon / anel.length, lat: lat / anel.length };
}

const vert = `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vWorld = mundo.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

const fragBrilho = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 olhar = normalize(cameraPosition - vWorld);
  float face = clamp(dot(normalize(vNormal), olhar), 0.0, 1.0);
  float varredura = sin(uTime * 0.18 + vWorld.x * 2.2) * 0.5 + 0.5;
  float brilho = pow(face, 8.0) * varredura;
  gl_FragColor = vec4(0.95, 0.93, 0.86, brilho * 0.28);
}
`;

const fragAr = `
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 olhar = normalize(cameraPosition - vWorld);
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), olhar)), 2.6);
  gl_FragColor = vec4(0.55, 0.72, 0.86, fresnel * 0.42);
}
`;

const fragPais = `
uniform sampler2D mapa;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec4 tex = texture2D(mapa, vUv);
  if (tex.a < 0.4) discard;
  float traco = smoothstep(0.04, 0.2, tex.b - tex.r);
  vec3 claro = vec3(1.0, 1.0, 1.0);
  vec3 azul = vec3(0.173, 0.325, 0.447);
  vec3 base = mix(claro, azul, traco);
  vec3 olhar = normalize(cameraPosition - vWorld);
  float face = clamp(dot(normalize(vNormal), olhar), 0.0, 1.0);
  float limb = smoothstep(0.22, 1.0, 1.0 - face);
  gl_FragColor = vec4(mix(base, azul, limb * 0.45), tex.a);
}
`;

function desenhar(visao: string) {
  const tela = document.createElement("canvas");
  tela.width = 2048;
  tela.height = 1024;
  const ctx = tela.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.clearRect(0, 0, tela.width, tela.height);

  function pintar(alvo: CanvasRenderingContext2D, anel: Anel) {
    alvo.beginPath();
    anel.forEach(([lon, lat], indice) => {
      const x = ((lon + 180) / 360) * tela.width;
      const y = ((90 - lat) / 180) * tela.height;
      if (indice === 0) alvo.moveTo(x, y);
      else alvo.lineTo(x, y);
    });
    alvo.closePath();
    alvo.fillStyle = "rgba(255,255,255,0.42)";
    alvo.fill();
    alvo.strokeStyle = "#2C5372";
    alvo.lineWidth = 3.5;
    alvo.lineJoin = "round";
    alvo.stroke();
  }

  if (visao !== "PY") pintar(ctx, anelDe(bra as Geo));
  if (visao !== "BR") pintar(ctx, anelDe(pry as Geo));

  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.NoColorSpace;
  textura.anisotropy = 8;
  textura.needsUpdate = true;
  return textura;
}

function Cena({ visao }: { visao: string }) {
  const grupo = useRef<THREE.Group>(null);
  const pronto = useRef(false);
  const terra = useLoader(THREE.TextureLoader, "/brand/terra.jpg");
  const textura = useMemo(() => desenhar(visao), [visao]);
  useEffect(() => () => textura.dispose(), [textura]);
  if (terra) terra.colorSpace = THREE.SRGBColorSpace;
  const brasil = useMemo(() => centro(anelDe(bra as Geo)), []);
  const paraguai = useMemo(() => centro(anelDe(pry as Geo)), []);
  const cidade = useRef(new THREE.Vector3());
  const olhar = useRef(new THREE.Vector3());
  const quatAlvo = useRef(new THREE.Quaternion());
  const brilhoShader = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, camera }, delta) => {
    if (!grupo.current) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lat = visao === "BR" ? brasil.lat : visao === "PY" ? paraguai.lat : -20.5;
    const lon = visao === "BR" ? brasil.lon : visao === "PY" ? paraguai.lon : -57.5;
    const distancia = visao === "BR+PY" ? 4.35 : 3.72;
    const orbita = reduzido ? 0 : Math.sin(clock.elapsedTime * 0.32) * 0.06;
    const passo = !pronto.current || reduzido ? 1 : 1 - Math.exp(-delta * 2.6);
    pronto.current = true;
    camera.position.x += (Math.sin(orbita) * distancia - camera.position.x) * passo;
    camera.position.y += (0.04 - camera.position.y) * passo;
    camera.position.z += (Math.cos(orbita) * distancia - camera.position.z) * passo;
    camera.lookAt(0, 0, 0);
    cidade.current.copy(ponto(lat, lon, 1)).normalize();
    olhar.current.copy(camera.position).normalize();
    quatAlvo.current.setFromUnitVectors(cidade.current, olhar.current);
    grupo.current.quaternion.slerp(quatAlvo.current, passo);
    if (brilhoShader.current) {
      brilhoShader.current.uniforms.uTime.value = reduzido ? 1.2 : clock.elapsedTime;
    }
  });

  return (
    <>
      <mesh scale={1.025}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial transparent depthWrite={false} vertexShader={vert} fragmentShader={fragAr} toneMapped={false} />
      </mesh>
      <group ref={grupo}>
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          <meshBasicMaterial map={terra} />
        </mesh>
        <mesh scale={1.002}>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            ref={brilhoShader}
            transparent
            depthWrite={false}
            vertexShader={vert}
            fragmentShader={fragBrilho}
            uniforms={{ uTime: { value: 1.2 } }}
            toneMapped={false}
          />
        </mesh>
        <mesh key={visao}>
          <sphereGeometry args={[1.008, 96, 96]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            toneMapped={false}
            uniforms={{ mapa: { value: textura } }}
            vertexShader={vert}
            fragmentShader={fragPais}
          />
        </mesh>
      </group>
    </>
  );
}

export default function GlobeMark({
  visao = "BR",
  nomePy = "Paraguai",
  compacto = false,
}: {
  visao?: string;
  nomePy?: string;
  compacto?: boolean;
}) {
  const legenda = visao === "BR" ? "Brasil" : visao === "PY" ? nomePy : "Brasil e Paraguai";
  return (
    <figure className="m-0 flex w-full flex-col items-center">
      <div className={compacto ? "h-10 w-10" : "aspect-square w-full"} aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0.04, 3.72], fov: 32 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Cena visao={visao} />
        </Canvas>
      </div>
      <figcaption className={`m-0 mt-3 text-center text-[15px] font-light text-[#f4f3ed] ${compacto ? "sr-only" : ""}`}>{legenda}</figcaption>
    </figure>
  );
}

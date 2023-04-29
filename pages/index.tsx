import Image from 'next/image';
import { Inter } from 'next/font/google';
import { useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
} from 'recharts';
import { vec3, mat3 } from 'gl-matrix';

const inter = Inter({ subsets: ['latin'] });

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

let currentMaxAcceleration = 0;
let currentMaxVelocity = 0;

const state = {
  position: 0,
  velocity: 0,
  acceleration: 0,
};

let isSetup = false;

type Orientation = {
  alpha: number;
  beta: number;
  gamma: number;
};

let orientation: Orientation = {
  alpha: 0,
  beta: 0,
  gamma: 0,
};

function getRotationMatrix(x: number, y: number, z: number): number[][] {
  // Vector v = [x, y, z]
  // Vector u = [0, 0, -1]

  // Step 1) Find the axis of rotation (v x u)
  let ax = y * -1 - z * 0;
  let ay = z * 0 - x * -1;
  let az = x * 0 - y * 0;

  // Step 2) Find the angle of rotation (arccos(v.u))
  let vDotU = x * 0 + y * 0 + z * -1;
  let theta = Math.acos(vDotU);

  // Step 3) Construct the rotation matrix R
  let R = [
    [
      ax * ax + (1 - ax * ax) * Math.cos(theta),
      ax * ay * (1 - Math.cos(theta)) - az * Math.sin(theta),
      ax * az * (1 - Math.cos(theta)) + ay * Math.sin(theta),
    ],
    [
      ax * ay * (1 - Math.cos(theta)) + az * Math.sin(theta),
      ay * ay + (1 - ay * ay) * Math.cos(theta),
      ay * az * (1 - Math.cos(theta)) - ax * Math.sin(theta),
    ],
    [
      ax * az * (1 - Math.cos(theta)) - ay * Math.sin(theta),
      ay * az * (1 - Math.cos(theta)) + ax * Math.sin(theta),
      az * az + (1 - az * az) * Math.cos(theta),
    ],
  ];

  return R;
}

const handleMotionChatGPT = (
  gravityVector: vec3
) => {
  const v: vec3 = gravityVector;
  const w: vec3 = vec3.fromValues(0, 0, -1);

  // Find the axis of rotation
  const axis: vec3 = vec3.cross(vec3.create(), v, w);

  // Find the angle of rotation
  const cosTheta: number = vec3.dot(v, w);
  const theta: number = Math.acos(cosTheta);

  // Compute the rotation matrix
  // First, we compute the skew-symmetric matrix K associated with the axis of rotation
  const K: mat3 = mat3.fromValues(
    0,
    -axis[2],
    axis[1],
    axis[2],
    0,
    -axis[0],
    -axis[1],
    axis[0],
    0
  );

  // Next, we use the Rodrigues' rotation formula to compute the rotation matrix R
  // R = I + sin(theta)K + (1 - cos(theta))K^2, where I is the identity matrix
  const sinTheta: number = Math.sin(theta);
  const K2: mat3 = mat3.multiply(mat3.create(), K, K);
  mat3.multiplyScalar(K, K, sinTheta);
  mat3.multiplyScalar(K2, K2, 1 - cosTheta);
  const R = mat3.add(mat3.create(), mat3.fromValues(1, 0, 0, 0, 1, 0, 0, 0, 1), K);
  mat3.add(R, R, K2);

  // Test the transformation
  const newV: vec3 = vec3.transformMat3(vec3.create(), v, R);
  console.log('openAPI newV:', newV); // Should print [0, 0, -1]
};

const handleMotionAnthropic = (
  gravityVector: vec3,
) => {
  const v: vec3 = gravityVector;
  const w: vec3 = vec3.fromValues(0, 0, -1);

  const R = getRotationMatrix(v[0], v[1], v[2]);

  let vRotated = [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];

  console.log('vrotated', vRotated); // Should print [0, 0, -1]
};

const handleMotionChatGPT2 = (gravityVector: vec3) => {
  // Helper functions to calculate the dot product and cross product of two vectors
  const dotProduct = (a: number[], b: number[]): number => {
    return a.reduce((acc, cur, i) => acc + cur * b[i], 0);
  };

  const crossProduct = (a: number[], b: number[]): number[] => {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  };


  // Define the vector v and the target vector
  const v: number[] = [gravityVector[0], gravityVector[1], gravityVector[2]];
  const target: number[] = [0, 0, -1];

  // Find the axis of rotation
  const axis: number[] = crossProduct(v, target);

  // Find the angle of rotation
  const angle: number = Math.acos(dotProduct(v, target));
  console.log(angle)

  // Find the rotation matrix using the Rodrigues' formula
  const cosA: number = Math.cos(angle);
  const sinA: number = Math.sin(angle);
  const oneMinusCosA: number = 1 - cosA;

  const xSq: number = axis[0] ** 2;
  const ySq: number = axis[1] ** 2;
  const zSq: number = axis[2] ** 2;

  const xyOMCA: number = axis[0] * axis[1] * oneMinusCosA;
  const xzOMCA: number = axis[0] * axis[2] * oneMinusCosA;
  const yzOMCA: number = axis[1] * axis[2] * oneMinusCosA;

  const xsinA: number = axis[0] * sinA;
  const ysinA: number = axis[1] * sinA;
  const zsinA: number = axis[2] * sinA;

  const R: number[][] = [
    [xSq * oneMinusCosA + cosA, xyOMCA - zsinA, xzOMCA + ysinA],
    [xyOMCA + zsinA, ySq * oneMinusCosA + cosA, yzOMCA - xsinA],
    [xzOMCA - ysinA, yzOMCA + xsinA, zSq * oneMinusCosA + cosA],
  ];

  const result: number[] = [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];

  console.log('result2', result)
}

function vectorLength(v: number[]) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

const handleMotionRosettaCode = (acceleration: vec3, gravityVector: vec3) => {
  function norm(v: number[]) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }
  function normalize(v: number[]) {
    var length = norm(v);
    return [v[0] / length, v[1] / length, v[2] / length];
  }
  function dotProduct(v1: number[], v2: number[]) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  }
  function crossProduct(v1: number[], v2: number[]) {
    return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
  }
  function getAngle(v1: number[], v2: number[]) {
    return Math.acos(dotProduct(v1, v2) / (norm(v1) * norm(v2)));
  }
  function matrixMultiply(matrix: number[][], v: number[]) {
    return [
      dotProduct(matrix[0], v),
      dotProduct(matrix[1], v),
      dotProduct(matrix[2], v),
    ];
  }
  function getRotationMatrix(p: number[], v: number[], a: number) {
    var ca = Math.cos(a),
      sa = Math.sin(a),
      t = 1 - ca,
      x = v[0],
      y = v[1],
      z = v[2];
    return [
      [ca + x * x * t, x * y * t - z * sa, x * z * t + y * sa],
      [x * y * t + z * sa, ca + y * y * t, y * z * t - x * sa],
      [z * x * t - y * sa, z * y * t + x * sa, ca + z * z * t],
    ];
  }
    function calculateRotationMatrix(v1: number[], v2: number[]) {
      var a = getAngle(v1, v2);
      var cp = crossProduct(v1, v2);
      var ncp = normalize(cp);
      return getRotationMatrix(v1, ncp, a);
    }

  var v1 = [gravityVector[0], gravityVector[1], gravityVector[2]];
  var v2 = normalize([0, 0, -1]);
  const r = calculateRotationMatrix(v1, v2);
  const rotatedAcceleration = matrixMultiply(r, [acceleration[0], acceleration[1], acceleration[2]])
  return rotatedAcceleration;
  // const againstGravity = rotatedAcceleration[2];
  // if (Math.abs(againstGravity) > 2) {
  //   console.log('againstGravity', againstGravity);
  // }
}

const round = (float: number | null | undefined) => Number((float ?? 0).toFixed(1))
let dataPoints: number[] = [];

export default function Home() {
  const [data, setData] = useState<{ x: number; y: number }[]>([]);
  const getAccel = async () => {
    const requestPermission = (
      DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    ).requestPermission;
    const iOS = typeof requestPermission === 'function';
    if (iOS && !isSetup) {
      const response = await requestPermission();
      let t = 0;
      if (response === 'granted') {
        isSetup = true;
        window.addEventListener('devicemotion', (event) => {
          const acceleration: vec3 = [
            round(event.acceleration?.x),
            round(event.acceleration?.y),
            round(event.acceleration?.z),
          ];
          const accelerationIncludingGravity: vec3 = [
            round(event.accelerationIncludingGravity?.x),
            round(event.accelerationIncludingGravity?.y),
            round(event.accelerationIncludingGravity?.z),
          ];
          const gravityVector = vec3.subtract(
            vec3.create(),
            accelerationIncludingGravity,
            acceleration
          );
          vec3.normalize(gravityVector, gravityVector);


          // console.log('acceleration', acceleration, 'accelerationIncludingGravity', accelerationIncludingGravity)
          // handleMotionChatGPT(gravityVector);
          // handleMotionChatGPT2(gravityVector)
          // handleMotionAnthropic(gravityVector);
          const rotatedAcceleration = handleMotionRosettaCode(acceleration, gravityVector)
          const zAccel = rotatedAcceleration[2]
          dataPoints.push(zAccel);

          // // if (accelerationAgainstGravity > 8) {
          //   console.log('without gravity', acceleration)
          //   // console.log(accelerationAgainstGravity);
          //   console.log('with gravity');
          //   console.log(accelerationIncludingGravity);
          // // }

          t += event.interval;
        });
      }
    }
  };
  const [isRecording, setIsRecording] = useState(false);
  const [lastHeight, setLastHeight] = useState(0)
  const toggleRecording = () => {
    if (isRecording) {
      console.log(dataPoints)
      let lastVelocity = 0
      let velocities: number[] = []
      let lastPosition = 0
      let positions: number[] = []
      const dt = 1.0 / 60.0;
      dataPoints.forEach((d, i) => {
        lastVelocity += (-d * dt)
        velocities.push(lastVelocity)
        lastPosition += (lastVelocity * dt)
        positions.push(lastPosition)
      })
      setLastHeight(Math.max(...positions) - Math.min(...positions))
      setData(dataPoints.map((z, i) => ({ x: i, y: z })));
    }
    dataPoints = [];
    setIsRecording(!isRecording);
  }
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between`}>
      <button onClick={getAccel}>Get Accelerometer</button>
      <button onClick={toggleRecording}>{isRecording ? 'Stop recording' : 'Start recording'}</button>
      <h1>{lastHeight ?? ''}</h1>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="time" unit="s" />
          <YAxis type="number" dataKey="y" name="acceleration" unit="m/s^2" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="A school" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </main>
  );
}

import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { vec3 } from 'gl-matrix';

interface DeviceMotionEventiOS extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

type Orientation = {
  alpha: number;
  beta: number;
  gamma: number;
};

type Throw = {
  duration: number;
  totalHeight: number;
  accelerationData: number[];
  maxAcceleration: number;
  acceleratingIndex: number;
  inFlightIndex: number;
  completeIndex: number;
};

const handleMotionRosettaCode = (
  acceleration: vec3,
  gravityVector: vec3
): vec3 => {
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
  var v2 = [0, 0, -1];
  const r = calculateRotationMatrix(v1, v2);
  const rotatedAcceleration = matrixMultiply(r, [
    acceleration[0],
    acceleration[1],
    acceleration[2],
  ]);
  return [
    rotatedAcceleration[0],
    rotatedAcceleration[1],
    rotatedAcceleration[2],
  ];
};

// Function to calculate max height
function getMaxHeight(timeInAir: number): number {
  let t = timeInAir / 2;
  let g = 9.8; // m/s^2
  let v0 = g * t;
  let height = v0 * t + (-g * t * t) / 2;
  let heightFt = height * 3.281;
  return heightFt;
}

const round = (float: number | null | undefined) =>
  Number((float ?? 0).toFixed(1));

let accelerations: number[] = [];

const detectThrow = (accelerations: readonly number[]): Throw | null => {
  let status: 'waiting' | 'accelerating' | 'in_flight' | 'complete' = 'waiting';
  let startIndex = 0;
  let acceleratingIndex = 0;
  let inFlightIndex = 0;
  let completeIndex = 0;
  const threshold = 8;
  for (let i = 0; i < accelerations.length; i++) {
    const a = accelerations[i];
    // if we're not in flight and a substantial acceleration occurs
    if (a > threshold && status === 'waiting') {
      status = 'accelerating';
      acceleratingIndex = i;
      startIndex = Math.max(i - 30, 0); // capture an extra .5s
      // -3 to make sure there's no sensor error
    } else if (status === 'accelerating' && a < -3) {
      status = 'in_flight';
      inFlightIndex = i;
    }
    // if we are in flight and experience a substantial upward acceleration
    else if (status === 'in_flight' && a > threshold) {
      status = 'complete';
      completeIndex = i;
      // capture an extra .5s
    } else if (status === 'complete' && i - completeIndex > 30) {
      let minimumAcceleration = accelerations[inFlightIndex];
      // const window = inFlightIndex + 60;
      // for (let j = inFlightIndex; j < window; j++) {
      //   if (accelerations[j] < minimumAcceleration) {
      //     inFlightIndex = j;
      //     minimumAcceleration = accelerations[j];
      //   }
      // }
      const correctionFactorSeconds = 0;
      const rawDurationSeconds = (completeIndex - inFlightIndex) / 60; // 60Hz TODO adjust for different intervals
      // need to play with this - the graph looks correct, but the duration is off
      const durationInSeconds = Math.max(rawDurationSeconds - correctionFactorSeconds, 0);
      const height = getMaxHeight(durationInSeconds);
      debugger;
      return {
        duration: durationInSeconds,
        totalHeight: height,
        accelerationData: accelerations.slice(startIndex, i),
        maxAcceleration: Math.max(
          ...accelerations.slice(startIndex, inFlightIndex)
        ),
        acceleratingIndex: acceleratingIndex - startIndex,
        inFlightIndex: inFlightIndex - startIndex,
        completeIndex: completeIndex - startIndex,
      };
    }
  }
  return null;
};

const Game = () => {
  const [started, setStarted] = useState(false);
  const [lastThrow, setLastThrow] = useState<Throw | null>(null);

  const getAccel = useCallback(async () => {
    const requestPermission = (
      DeviceMotionEvent as unknown as DeviceMotionEventiOS
    ).requestPermission;
    const iOS = typeof requestPermission === 'function';
    if (iOS && !started) {
      const response = await requestPermission();
      if (response === 'granted') {
        localStorage.setItem('airtimeHasLocationAccess', 'true');
        setStarted(true);
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
          const rotatedAcceleration = handleMotionRosettaCode(
            acceleration,
            gravityVector
          );
          // 5 seconds, enough for a 100 foot throw
          const zAccel = rotatedAcceleration[2] * -1;
          accelerations.push(zAccel);
          if (accelerations.length > 300) {
            accelerations.shift();
          }

          let detectedThrow = detectThrow(accelerations);
          if (detectedThrow) {
            accelerations = [];
            if (detectedThrow.totalHeight > 1) {
              setLastThrow(detectedThrow);
            }
          }
        });
      }
    }
  }, [started]);
  useEffect(() => {
    const fetchData = async () => {
      if (localStorage.getItem('airtimeHasLocationAccess') === 'true') {
        getAccel();
      }
    };
    // workaround for https://github.com/facebook/react/issues/24502
    const id = setTimeout(() => fetchData(), 10);
    return () => clearTimeout(id);
  }, [getAccel]);
  if (!started) {
    return <button onClick={getAccel}>Start</button>;
  }
  return (
    <>
      {lastThrow ? (
        <>
          <h1>{`${lastThrow.duration.toFixed(2)} seconds in the air`}</h1>
          <h1>{`${lastThrow.totalHeight.toFixed(1)} foot throw!`}</h1>
          <h1>{`Power score: ${lastThrow.maxAcceleration.toFixed(2)}`}</h1>
          <h1>
            {lastThrow.acceleratingIndex} {lastThrow.inFlightIndex}{' '}
            {lastThrow.completeIndex} ({lastThrow.accelerationData.length})
          </h1>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="time" unit="s" />
              <YAxis
                type="number"
                dataKey="y"
                name="acceleration"
                unit="m/s^2"
              />
              <ReferenceLine
                x={lastThrow.acceleratingIndex / 60.0}
                stroke="yellow"
              />
              <ReferenceLine x={lastThrow.inFlightIndex / 60.0} stroke="red" />
              <ReferenceLine x={lastThrow.completeIndex / 60.0} stroke="green" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                data={lastThrow.accelerationData.map((a, t) => ({
                  x: t / 60,
                  y: a,
                }))}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </>
      ) : (
        <>
          <h1>Throw your phone high into the sky!</h1>
        </>
      )}
    </>
  );
};

export default function Home() {
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between`}>
      <Game />
    </main>
  );
}

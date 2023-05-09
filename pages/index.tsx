import { useEffect, useRef, useState } from 'react';
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
import Head from 'next/head';
import { Switch } from '@/components/Switch';
import Confetti from 'react-confetti';
import useMediaRecorder from '@/components/useMediaRecorder';
// import { truncateVideo } from '@/components/truncateVideo';

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
  totalRotation: {
    alpha: number;
    beta: number;
  };
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

const requestMotionPermissions = async () => {
  const requestPermission = (
    DeviceMotionEvent as unknown as DeviceMotionEventiOS
  ).requestPermission;
  const iOS = typeof requestPermission === 'function';
  if (iOS) {
    const response = await requestPermission();
    if (response === 'granted') {
      return true;
    }
  }
  return false;
};

const AutoScroller = () => {
  useEffect(() => {
    window.scrollTo(0, 1);
  })
  return <></>
}

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

type ButtonProps = {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
};
const Button = ({ text, onClick, type }: ButtonProps) => (
  <button
    type={type ?? 'button'}
    onClick={onClick}
    className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm bg-black"
  >
    {text}
  </button>
);

const detectThrow = (
  accelerations: readonly number[],
  orientations: readonly Orientation[]
): Throw | null => {
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
      // anti cheat - we should be accelerating downwards the whole time. Not -9.8 because flips confuse the accelerometer.
      const averageAcceleration =
        accelerations.slice(inFlightIndex, i).reduce((a, b) => a + b, 0) /
        (i - inFlightIndex);
      // if (averageAcceleration < -5) { // TODO reenable
      status = 'complete';
      completeIndex = i;
      // }
      // capture an extra .5s
    } else if (status === 'complete' && i - completeIndex > 30) {
      const correctionFactorSeconds = 0;
      const rawDurationSeconds = (completeIndex - inFlightIndex) / 60; // 60Hz TODO adjust for different intervals
      const durationInSeconds = Math.max(
        rawDurationSeconds - correctionFactorSeconds,
        0
      );
      const height = getMaxHeight(durationInSeconds);
      const orientationsInWindow = orientations.slice(
        inFlightIndex,
        completeIndex
      );
      const differenceInAngles = (a: number, b: number) => {
        let diff = a - b;
        if (diff < 0) {
          diff += 360;
        }
        if (diff > 180) {
          diff = 360 - diff;
        }
        return diff;
      };
      const rotationDiffs = orientationsInWindow.map((orientation, i) => {
        if (i === 0) {
          return [0, 0];
        }
        const lastOrientation = orientationsInWindow[i - 1];
        return [
          differenceInAngles(
            Number(orientation.alpha.toFixed(0)),
            Number(lastOrientation.alpha.toFixed(0))
          ),
          differenceInAngles(
            Number(orientation.beta.toFixed(0)) + 180,
            Number(lastOrientation.beta.toFixed(0)) + 180
          ),
        ];
      });
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
        totalRotation: {
          alpha: rotationDiffs.reduce((acc, diff) => {
            return acc + diff[0];
          }, 0),
          beta:
            rotationDiffs.reduce((acc, diff) => {
              return acc + diff[1];
            }, 0) / 2, // TODO this makes no sense
        },
      };
    }
  }
  return null;
};

type GameProps = {
  playerInfo: PlayerInfo;
};

const Game = ({ playerInfo }: GameProps) => {
  const [lastThrow, setLastThrow] = useState<Throw | null>(null);
  const [showGraphs, setShowGraphs] = useState(false);
  const [recordVideo, setRecordVideo] = useState(false);
  const {
    status: videoStatus,
    error: videoError,
    stopRecording,
    getMediaStream,
    startRecording,
  } = useMediaRecorder({
    recordScreen: false,
    blobOptions: { type: 'video/mp4' },
    mediaStreamConstraints: {
      audio: false,
      video: {
        facingMode: { exact: 'environment' },
        frameRate: { ideal: 8, max: 8 },
        height: { ideal: 320 },
        width: { ideal: 320 },
      },
    },
    onStop: async (blob) => {
      // const truncated = await truncateVideo(blob, 3)
      setVideoBlob(blob);
    },
    onError: (error) => {
      alert(JSON.stringify(error));
    },
  });
  console.log(videoStatus);
  const chunksRef = useRef<Blob[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let accelerations: number[] = [];
    let orientations: Orientation[] = [];
    const orientationEventsPerSecond = 60;
    const windowSizeSeconds = 3.5; // enough for a 50 foot throw, plus a .5s buffer at the end
    const maxWindowSize = orientationEventsPerSecond * windowSizeSeconds;
    const orientationListener = (event: DeviceOrientationEvent) => {
      orientations.push({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      });
      if (orientations.length > maxWindowSize) {
        orientations.shift();
      }
    };
    const motionListener = (event: DeviceMotionEvent) => {
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

      const zAccel = rotatedAcceleration[2] * -1;
      accelerations.push(zAccel);
      if (accelerations.length > maxWindowSize) {
        accelerations.shift();
      }

      let detectedThrow = detectThrow(accelerations, orientations);
      if (detectedThrow && !lastThrow) {
        accelerations = [];
        orientations = [];
        chunksRef.current = [];
        if (detectedThrow.totalHeight > 2) {
          setLastThrow(detectedThrow);
          stopRecording();
        }
      }
    };
    const timeout = setTimeout(() => {
      requestMotionPermissions().then((result) => {
        if (result) {
          console.log('adding listeners');
          window.addEventListener('deviceorientation', orientationListener);
          window.addEventListener('devicemotion', motionListener);
        }
      });
    }, 10);

    return () => {
      console.log('removing listeners');
      clearTimeout(timeout);
      accelerations = [];
      orientations = [];
      chunksRef.current = [];
    };
  }, []);
  return (
    <>
      {lastThrow ? (
        <div className="flex flex-col space-y-2 w-full px-2 items-center">
          <AutoScroller />
          <Confetti
            recycle={false}
            colors={[
              `#FFD700`,
              `#FFC400`,
              `#FFBF00`,
              `#FFD56A`,
              `#FFC107`,
              `#FFB300`,
              `#FFC87C`,
              `#FFB90F`,
              `#FFD42A`,
              `#FFC300`,
            ]}
            numberOfPieces={Math.round(lastThrow.totalHeight * 100)}
            confettiSource={{
              x: 0,
              y: -20,
              h: 0,
              w: document.body.clientWidth,
            }}
          />
          <h1>{`${lastThrow.duration.toFixed(2)} seconds in the air`}</h1>
          <h1>{`${lastThrow.totalHeight.toFixed(1)} foot throw!`}</h1>
          <h1>{`${(lastThrow.totalRotation.beta / 360).toFixed(
            1
          )} vertical flips!`}</h1>
          <div className="flex flex-row space-x-2">
            <Button
              text="Throw again"
              onClick={() => {
                setLastThrow(null);
                setVideoBlob(null);
                setRecordVideo(false)
              }}
            />
            <Button
              text="Show graphs"
              onClick={() => setShowGraphs(!showGraphs)}
            />
          </div>
          {videoBlob && (
            <>
              <video
                src={URL.createObjectURL(videoBlob)}
                width={320}
                height={320}
                autoPlay
                playsInline
                loop
              />
            </>
          )}
          {showGraphs && (
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
                <ReferenceLine
                  x={lastThrow.inFlightIndex / 60.0}
                  stroke="red"
                />
                <ReferenceLine
                  x={lastThrow.completeIndex / 60.0}
                  stroke="green"
                />
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
          )}
        </div>
      ) : (
        <>
          <h1 className="text-md font-semibold">
            Throw your phone high into the sky!
          </h1>
          <Switch
            label="Film my phone's journey"
            on={recordVideo}
            onToggle={async (enabled) => {
              setRecordVideo(enabled);
              if (enabled) {
                await getMediaStream();
                await startRecording();
              } else {
                stopRecording();
              }
            }}
          />
        </>
      )}
    </>
  );
};

type PlayerInfo = {
  name: string;
  hasCase: boolean;
};

const usePlayerInfo = () => {
  // a react hook to retrieve the player's name and case status from local storage and also set it
  const [playerInfo, setPlayerInfoInner] = useState<
    PlayerInfo | null | undefined
  >(undefined);
  const updateLocalStorage = ({name, hasCase}: PlayerInfo) => {
    localStorage.setItem('airtimeName', name);
    localStorage.setItem('airtimeHasCase', hasCase ? 'true' : 'false');
  };
  const setPlayerInfo = (info: PlayerInfo) => {
    updateLocalStorage(info)
    setPlayerInfoInner(info);
  };
  useEffect(() => {
    const name = localStorage.getItem('airtimeName');
    const hasCase = localStorage.getItem('airtimeHasCase');
    if (name || hasCase) {
      setPlayerInfoInner({
        name: name ?? '',
        hasCase: hasCase === 'true',
      });
    } else {
      setPlayerInfoInner(null);
    }
  }, []);
  return [playerInfo, setPlayerInfo, updateLocalStorage] as const;
};

type WelcomeProps = {
  onPlay: (name: string, hasCase: boolean) => void;
};

const Welcome = ({ onPlay }: WelcomeProps) => {
  const [hasCase, setHasCase] = useState(true);
  const [name, setName] = useState('');
  const defaultSwitchLabel = 'Does your phone have a case?';
  const [switchLabel, setSwitchLabel] = useState(defaultSwitchLabel);
  const toggleCase = (newHasCase: boolean) => {
    setHasCase(newHasCase);
    if (!newHasCase) {
      setSwitchLabel('Fuck yea 🤙');
      setTimeout(() => setSwitchLabel(defaultSwitchLabel), 2000);
    } else {
      setSwitchLabel(defaultSwitchLabel);
    }
  };
  // render a form to collect the player's name and a checkbox to see if their phone has a case
  // when they submit the form, render the game
  return (
    <div className={`flex w-full min-h-screen flex-col items-center space-y-2`}>
      <h1>highphone ☝️</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const permissionResult = await requestMotionPermissions();
          if (permissionResult) {
            onPlay(name, hasCase);
          }
        }}
        className="flex flex-col space-y-2"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Your name
          </label>
          <div>
            <input
              type="name"
              name="name"
              id="name"
              className="block w-full rounded-md border border-black p-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm min-w-[300px]"
              placeholder="Seeker of glory"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <label>
          <Switch label={switchLabel} on={hasCase} onToggle={toggleCase} />
        </label>
        <Button type="submit" text="START" />
      </form>
    </div>
  );
};

export default function Home() {
  const [playerInfo, setPlayerInfo, updateLocalStorage] = usePlayerInfo();
  return (
    <main className={`mt-4 flex w-full min-h-screen flex-col items-center`}>
      <Head>
        <title>highphone</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🆙</text></svg>"
        />
      </Head>
      {playerInfo === null && (
        <Welcome onPlay={(name, hasCase) => {
          updateLocalStorage({ name, hasCase });
          // reload to avoid the "shake to undo" bug
          window.location.reload();
        }} />
      )}
      {playerInfo && <Game playerInfo={playerInfo} />}
    </main>
  );
}

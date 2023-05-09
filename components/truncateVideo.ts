// import { FFmpeg, createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// const ffmpegPromise = new Promise<FFmpeg>(async (resolve, reject) => {
//   try {
//     const ffmpeg = createFFmpeg({
//       log: true,
//       corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
//     });
//     await ffmpeg.load();
//     resolve(ffmpeg);
//   } catch (e) {
//     reject(e);
//   }
// });

// export const truncateVideo = async (mp4: Blob, seconds: number) => {
//   const ffmpeg = await ffmpegPromise;
//   const name = 'test.mp4';
//   ffmpeg.FS('writeFile', name, await fetchFile(mp4));
//   await ffmpeg.run('-sseof', (-1 * seconds).toFixed(0), '-i', name, 'output.mp4');
//   return new Blob([ffmpeg.FS('readFile', 'output.mp4')]);
// };

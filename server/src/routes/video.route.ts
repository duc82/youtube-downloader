import { Router } from "express";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "ffmpeg-static";
import { spawn } from "child_process";
import fs from "fs";
import sanitize from "sanitize-filename";
import internal from "stream";

const router = Router();

interface DownloadDto {
  url: string;
  itag: number;
  title: string;
  type: "video" | "audio";
  qualityLabel: string;
  audioBitrate: number;
}

router.get("/info", async (req, res) => {
  try {
    const url = req.query.url as string;
    const info = await ytdl.getInfo(url);
    res.json(info);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Url is not valid" });
  }
});

router.post("/download", async (req, res) => {
  try {
    const body = req.body as DownloadDto;

    if (!ffmpeg) {
      return res.status(500).json({ message: "FFmpeg not found" });
    }

    const title = sanitize(body.title);

    const audioFilePath = `${process.cwd()}/public/audios/${title}_${
      body.audioBitrate
    }kbs.mp3`;
    const videoFilePath = `${process.cwd()}/public/videos/${title}_${
      body.qualityLabel
    }.mp4`;

    // Check if file already exists
    if (fs.existsSync(body.type === "audio" ? audioFilePath : videoFilePath)) {
      return res.status(201).json({
        message: "Downloaded Successfully",
        path:
          body.type === "audio"
            ? `/audios/${title}_${body.audioBitrate}kbs.mp3`
            : `/videos/${title}_${body.qualityLabel}.mp4`,
      });
    }

    // Donwload only audio
    if (body.type === "audio") {
      const audioStream = ytdl(body.url, {
        filter: (format) => format.itag === body.itag,
      });

      const ffmpegProcess = spawn(ffmpeg, [
        "-i",
        "pipe:0",
        "-q:a",
        "0",
        "-map",
        "a",
        "-f",
        "mp3",
        "pipe:1",
      ]);

      audioStream.pipe(ffmpegProcess.stdin);

      const output = fs.createWriteStream(audioFilePath);

      ffmpegProcess.stdout.pipe(output);

      await new Promise((resolve, reject) => {
        ffmpegProcess.on("close", (code) => {
          if (code === 0) {
            resolve("Done");
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });

        ffmpegProcess.stderr.on("data", (data) => {
          console.error(`FFmpeg stderr: ${data.toString()}`);
        });

        audioStream.on("error", (err) => {
          reject(new Error(`Error in audio stream: ${err.message}`));
        });

        ffmpegProcess.on("error", (err) => {
          reject(new Error(`Error in FFmpeg process: ${err.message}`));
        });

        output.on("error", (err) => {
          reject(new Error(`Error writing to output file: ${err.message}`));
        });
      });

      return res.status(201).json({
        message: "Downloaded Successfully",
        path: `/audios/${title}_${body.audioBitrate}kbs.mp3`,
      });
    }

    const audioStream = ytdl(body.url, {
      quality: "highestaudio",
    });

    const videoStream = ytdl(body.url, {
      filter: (format) => format.itag === body.itag,
    });

    const ffmpegProcess = spawn(
      ffmpeg,
      [
        "-i",
        "pipe:3",
        "-i",
        "pipe:4",
        "-map",
        "0:a",
        "-map",
        "1:v",
        "-c:v",
        "copy",
        videoFilePath,
      ],
      {
        windowsHide: true,
        stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
      }
    );

    audioStream.pipe(ffmpegProcess.stdio[3] as internal.Writable);
    videoStream.pipe(ffmpegProcess.stdio[4] as internal.Writable);

    await new Promise((resolve, reject) => {
      ffmpegProcess.on("close", (code) => {
        if (code === 0) {
          resolve("Done");
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      audioStream.on("error", (err) => {
        reject(new Error(`Error in audio stream: ${err.message}`));
      });

      videoStream.on("error", (err) => {
        reject(new Error(`Error in video stream: ${err.message}`));
      });

      ffmpegProcess.on("error", (err) => {
        reject(new Error(`Error in FFmpeg process: ${err.message}`));
      });
    });

    res.status(201).json({
      message: "Downloaded Successfully",
      path: `/videos/${title}_${body.qualityLabel}.mp4`,
    });
  } catch (error) {
    res.status(500).json({ message: "Download failed" });
  }
});

export default router;

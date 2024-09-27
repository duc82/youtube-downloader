import { ClipboardEvent, Fragment, useEffect, useState } from "react";
import { VideoInfo } from "../types/video";
import formatBytes from "../utils/formatBytes";
import clsx from "clsx";
import {
  Button,
  CloseButton,
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/16/solid";

interface DownloadDto {
  url: string;
  itag: number;
  title: string;
  type: "video" | "audio";
  qualityLabel: string;
  audioBitrate: number;
}

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [type, setType] = useState<"video" | "audio">("video");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pathDownload, setPathDownload] = useState("");

  const getInfo = async (value: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/videos/info?url=${value}`
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message);
        return;
      }

      setVideoInfo({
        videoDetails: {
          videoId: data.videoDetails.videoId,
          title: data.videoDetails.title,
          video_url: data.videoDetails.video_url,
          thumbnail:
            data.videoDetails.thumbnails[
              data.videoDetails.thumbnails.length - 1
            ].url,
        },
        formats: data.formats,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = e.currentTarget.search.value;
    await getInfo(value);
  };

  const handlePaste = async (e: ClipboardEvent<HTMLInputElement>) => {
    const value = e.clipboardData.getData("text/plain");
    await getInfo(value);
  };

  const handleDownload = async (body: DownloadDto) => {
    try {
      setIsOpenDialog(true);
      setIsDownloading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/videos/download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message);
        return;
      }

      setPathDownload(data.path);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Fragment>
      <Dialog
        open={isOpenDialog}
        onClose={() => setIsOpenDialog(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/30 duration-300 ease-out data-[closed]:opacity-0"
        />
        <div className="fixed top-10 left-0 flex w-screen items-center justify-center">
          <DialogPanel
            transition
            className="relative max-w-2xl bg-white p-4 rounded-md duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <DialogTitle className="text-lg font-bold mb-5 pr-4">
              {videoInfo?.videoDetails.title}
            </DialogTitle>

            <div className="flex justify-center mb-5">
              {!isDownloading && pathDownload ? (
                <a
                  href={`${
                    import.meta.env.VITE_API_URL
                  }/download?path=${pathDownload}`}
                  target="_blank"
                  className="flex items-center space-x-1.5 bg-green-600 px-4 py-2 font-medium text-white rounded-md hover:bg-green-800"
                >
                  <ArrowDownTrayIcon className="w-6 h-6" />
                  <span>Download .{type === "video" ? "mp4" : "mp3"}</span>
                </a>
              ) : (
                <span>Downloading...</span>
              )}
            </div>

            <Description>
              Thank you for using our service. If you could share our website
              with your friends, that would be a great help. Thank you.
            </Description>

            <CloseButton className={"absolute right-4 top-5"}>
              <XMarkIcon className="w-6 h-6" />
            </CloseButton>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="mt-5 border rounded-md p-4 flex flex-col items-center">
        <h1 className="text-3xl mb-10">
          Download Video and Audio from YouTube
        </h1>
        <form
          className="w-full flex items-center space-x-2"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Paste link here..."
            onPaste={handlePaste}
            className="w-full border outline-none px-4 py-2 rounded-md focus:ring-2 focus:ring-indigo-700"
          />
          <Button
            type="submit"
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-800"
          >
            Start
          </Button>
        </form>

        {isLoading && (
          <div className="mt-10">
            <svg
              className="animate-spin h-8 w-8 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {videoInfo && !isLoading && (
          <div className="flex space-x-8 mt-10">
            <figure className="flex-1">
              <img
                src={videoInfo.videoDetails.thumbnail}
                alt={videoInfo.videoDetails.title}
              />
              <figcaption className="font-bold mt-2.5">
                {videoInfo.videoDetails.title}
              </figcaption>
            </figure>
            <div className="flex-[2_2_0%]">
              <div className="flex items-center space-x-0.5">
                <div
                  className={clsx(
                    "px-4 py-2 font-bold",
                    type === "video"
                      ? "bg-gray-200 text-rose-700"
                      : "cursor-pointer hover:bg-gray-200"
                  )}
                  onClick={() => setType("video")}
                >
                  Video
                </div>
                <div
                  className={clsx(
                    "px-4 py-2 font-bold",
                    type === "audio"
                      ? "bg-gray-200 text-rose-700"
                      : "cursor-pointer hover:bg-gray-200"
                  )}
                  onClick={() => setType("audio")}
                >
                  Audio
                </div>
              </div>
              <table className="table w-full border">
                <tbody>
                  {videoInfo.formats
                    .filter((format, index, self) => {
                      if (type === "video") {
                        return (
                          format.mimeType?.includes(type) &&
                          format.codecs.includes("vp09")
                        );
                      }

                      return (
                        format.mimeType?.includes(type) &&
                        format.audioBitrate &&
                        index === self.findIndex((t) => t.itag === format.itag)
                      );
                    })
                    .map((format, i) => {
                      let size = +format.contentLength;

                      if (type === "video") {
                        const audioSize = videoInfo.formats.find((format) =>
                          format.mimeType?.includes("audio")
                        )?.contentLength;
                        if (audioSize) {
                          size += +audioSize;
                        }
                      }

                      return (
                        <tr key={i}>
                          <td className="border py-2 text-center">
                            {format.qualityLabel
                              ? `${format.qualityLabel} (.mp4)`
                              : `MP3 - ${format.audioBitrate}kbs`}
                          </td>
                          <td className="border py-2 text-center">
                            {formatBytes(size, 1)}
                          </td>
                          <td className="border py-2">
                            <div className="flex justify-center">
                              <Button
                                onClick={() =>
                                  handleDownload({
                                    url: videoInfo.videoDetails.video_url,
                                    itag: format.itag,
                                    title: videoInfo.videoDetails.title,
                                    type: type,
                                    qualityLabel: format.qualityLabel,
                                    audioBitrate: format.audioBitrate || 0,
                                  })
                                }
                                className="flex items-center space-x-1.5 bg-green-600 px-4 py-2 text-white font-medium rounded-md hover:bg-green-800"
                              >
                                <ArrowDownTrayIcon className="w-6 h-6" />
                                <span>Download</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
}

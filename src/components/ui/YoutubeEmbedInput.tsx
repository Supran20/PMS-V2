"use client";

import { UseFormSetValue } from "react-hook-form";

type Props = {
  value?: string | null;
  setValue: UseFormSetValue<any>;
};

const extractYoutubeId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const YoutubeEmbedInput = ({ value, setValue }: Props) => {
  const handleChange = (input: string) => {
    const trimmed = input.trim();

    if (!trimmed) {
      setValue("youtube_link", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const videoId = extractYoutubeId(trimmed);

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      setValue("youtube_link", embedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue("youtube_link", trimmed, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        defaultValue={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Paste full YouTube link (https://youtube.com/...)"
        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />

      {value && value.includes("embed") && (
        <div className="aspect-video rounded-xl overflow-hidden border shadow-md">
          <iframe src={value} className="w-full h-full" allowFullScreen />
        </div>
      )}
    </div>
  );
};

export default YoutubeEmbedInput;


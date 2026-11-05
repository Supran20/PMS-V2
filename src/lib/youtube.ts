export const getYoutubeWatchUrl = (url: string) => {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com") && u.pathname.includes("/embed/")) {
      const id = u.pathname.split("/embed/")[1];
      return `https://www.youtube.com/watch?v=${id}`;
    }

    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
    }

    return url;
  } catch {
    return url;
  }
};

export const getYoutubeVideoId = (url?: string | null) => {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }

    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }

    if (u.pathname.includes("/embed/")) {
      return u.pathname.split("/embed/")[1];
    }

    return null;
  } catch {
    return null;
  }
};

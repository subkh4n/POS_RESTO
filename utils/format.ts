export const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

/**
 * Convert Google Drive image URLs to a displayable format.
 * Uses lh3.googleusercontent.com which is Google's CDN format for Drive images.
 */
export const getDisplayImageUrl = (url: string | undefined): string => {
  const fallback =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

  if (!url) return fallback;

  // If it's already a working lh3 format with parameters, return as is
  if (url.includes("lh3.googleusercontent.com") && url.includes("=")) {
    return url;
  }

  // Handle lh3.googleusercontent.com/d/FILE_ID format - convert to proper lh3 format
  const lh3Match = url.match(
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/
  );
  if (lh3Match) {
    const fileId = lh3Match[1];
    // Use the lh3.googleusercontent.com format with size parameters
    return `https://lh3.googleusercontent.com/d/${fileId}=w500`;
  }

  // Handle drive.google.com/file/d/FILE_ID/view format
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w500`;
  }

  // Handle drive.google.com/open?id=FILE_ID format
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    const fileId = openMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w500`;
  }

  // Return original URL if not a Google Drive URL
  return url;
};

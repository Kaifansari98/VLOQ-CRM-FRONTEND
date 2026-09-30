// utils/file.utils.ts
export async function urlToFile(url: string, filename: string, mimeType: string) {
  const targetUrl = url.startsWith('http')
    ? `/api/proxy-file?url=${encodeURIComponent(url)}`
    : url;

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.statusText}`);
  }
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
}  
export const getFileExtension = (filename: string) =>
  filename.split(".").pop()?.toLowerCase() || "";

export const isImageExt = (ext: string) =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
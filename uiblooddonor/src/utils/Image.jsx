
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;

export const getImageUrl = (path) => {
  if (!path) return null;

  if (path.startsWith("http")) return path;

  return CLOUDINARY_URL + path;
};
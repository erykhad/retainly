export const slugify = (text: string): string => {
  return text
    .toString() // Ensure it's a string
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .normalize("NFD") // Split accented characters into their base characters and diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove the diacritics (accents)
    .replace(/[^a-z0-9 -]/g, "") // Remove anything that isn't a letter, number, or space
    .replace(/\s+/g, "-") // Replace one or more spaces with a single hyphen
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Trim hyphens from the beginning and end
};

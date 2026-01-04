/**
 * Capitalizes the first letter of a string.
 * Example: "hello" -> "Hello"
 */
export const capitalizeText = (
  str?: string | null,
  type: "first" | "all" = "first"
): string => {
  if (!str) return "N/A"; // fallback if null/undefined/empty
  const trimmed = str.trim();
  if (trimmed.length === 0) return "NA";

  if (type === "all") {
    // Capitalize each word
    return trimmed
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Default: capitalize only the first character
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};




export const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
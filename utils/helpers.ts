
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString; // Fallback if parsing fails
  }
};

export const calculateVolume = (dimensions: { length: number; width: number; height: number }): number => {
  if (!dimensions || dimensions.length <= 0 || dimensions.width <= 0 || dimensions.height <= 0) return 0;
  return (dimensions.length * dimensions.width * dimensions.height) / 1000000; // cm³ to m³
};

export const cleanGeminiJsonResponse = (text: string): string => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const imageFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error(`File is too large. Max size: ${MAX_FILE_SIZE_MB}MB`));
      return;
    }
    if (!file.type.startsWith('image/')) {
       reject(new Error('Invalid file type. Please select an image.'));
       return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

import Tesseract from "tesseract.js";

export async function extractDOB(imageFile: File): Promise<string | null> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageFile, "eng");
    const dobMatch = text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
    return dobMatch ? dobMatch[0] : null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}
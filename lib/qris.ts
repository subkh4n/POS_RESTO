import jsQR from "jsqr";
import QRCode from "qrcode";

/**
 * CRC16-CCITT (0xFFFF) implementation for EMVCo QRIS standard
 */
function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Decode QRIS payload string from an image file using jsQR
 */
export const decodeQRISFromImage = async (
  file: File,
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not found");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        resolve(code ? code.data : null);
      };
      img.onerror = () => reject("Failed to load image");
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject("Failed to read file");
    reader.readAsDataURL(file);
  });
};

/**
 * Generate dynamic QRIS with embedded amount
 * @param basePayload - The static QRIS payload string
 * @param amount - The transaction amount to embed
 * @returns Base64 data URL of the generated QR code
 */
export const generateDynamicQRIS = async (
  basePayload: string,
  amount: number,
): Promise<string> => {
  let raw = basePayload;

  // 1. Remove existing CRC (Tag 63) if present
  const crcIndex = raw.lastIndexOf("6304");
  if (crcIndex !== -1) {
    raw = raw.substring(0, crcIndex);
  }

  // 2. Remove existing Tag 54 (Amount) if present
  raw = raw.replace(/54\d{2}\d+/, "");

  // 3. Format new Amount Tag (54)
  const amountStr = amount.toString();
  const lengthStr = amountStr.length.toString().padStart(2, "0");
  const tag54 = `54${lengthStr}${amountStr}`;

  // 4. Insert Tag 54 before Tag 58 (Country Code) or at end
  const tag58Index = raw.indexOf("5802");
  if (tag58Index !== -1) {
    raw = raw.slice(0, tag58Index) + tag54 + raw.slice(tag58Index);
  } else {
    raw += tag54;
  }

  // 5. Calculate new CRC
  const contentToCRC = raw + "6304";
  const newCRC = calculateCRC16(contentToCRC);
  const finalPayload = contentToCRC + newCRC;

  // 6. Generate QR Code Image as Base64 Data URL
  return await QRCode.toDataURL(finalPayload, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
};

/**
 * Parse QRIS payload to extract merchant info
 */
export const parseQRISPayload = (payload: string): Record<string, string> => {
  const result: Record<string, string> = {};
  let index = 0;

  while (index < payload.length - 4) {
    const tag = payload.substring(index, index + 2);
    const length = parseInt(payload.substring(index + 2, index + 4), 10);

    if (isNaN(length) || length <= 0) break;

    const value = payload.substring(index + 4, index + 4 + length);
    result[`tag_${tag}`] = value;
    index += 4 + length;
  }

  return result;
};

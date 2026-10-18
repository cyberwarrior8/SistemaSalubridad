import multer from 'multer';

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_BYTES, files: 1, fields: 5, parts: 6 },
  fileFilter(_req, file, callback) {
    const extensionIsPdf = typeof file.originalname === 'string' && /\.pdf$/i.test(file.originalname);
    if (file.mimetype !== 'application/pdf' || !extensionIsPdf) {
      const error = new Error('Only PDF files are accepted');
      error.code = 'INVALID_PDF_TYPE';
      return callback(error);
    }
    callback(null, true);
  }
});

export function isPdfBuffer(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export { MAX_PDF_BYTES };

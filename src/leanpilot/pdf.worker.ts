import './pdf-compat'
// Keep the export for PDF.js's main-thread fallback when workers are blocked.
export { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs'

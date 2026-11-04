import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PreviewDocument {
  pageCount: number;
  renderPage: (pageNumber: number, canvas: HTMLCanvasElement, width: number) => Promise<void>;
  destroy: () => void;
}

async function loadPdf(file: File): Promise<PreviewDocument> {
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  return {
    pageCount: doc.numPages,
    async renderPage(pageNumber, canvas, width) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas_unavailable');
      await page.render({ canvasContext: context, viewport }).promise;
    },
    destroy: () => {
      void doc.destroy();
    },
  };
}

async function loadImage(file: File): Promise<PreviewDocument> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    pageCount: 1,
    async renderPage(_pageNumber, canvas, width) {
      const height = Math.round((image.naturalHeight * width) / image.naturalWidth);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas_unavailable');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
    },
    destroy: () => URL.revokeObjectURL(url),
  };
}

export function loadPreview(file: File): Promise<PreviewDocument> {
  return file.type === 'application/pdf' ? loadPdf(file) : loadImage(file);
}

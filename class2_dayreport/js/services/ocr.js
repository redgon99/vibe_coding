/**
 * Tesseract.js로 이미지 OCR. PDF는 pdf.js로 텍스트 추출 후 동일 파이프라인.
 */
let TesseractLoaded = null;

async function loadTesseract() {
  if (TesseractLoaded) return TesseractLoaded;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  script.async = true;
  document.head.appendChild(script);
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Tesseract.js 로드 실패'));
  });
  TesseractLoaded = window.Tesseract;
  return TesseractLoaded;
}

export async function recognizeImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일이 아닙니다.');
  const Tesseract = await loadTesseract();
  const result = await Tesseract.recognize(file, 'kor+eng', { logger: () => {} });
  return result.data.text;
}

export async function recognizePdf(file) {
  if (file.type !== 'application/pdf') throw new Error('PDF 파일이 아닙니다.');
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  document.head.appendChild(script);
  await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let text = '';
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

export async function extractTextFromFile(file) {
  if (file.type.startsWith('image/')) return recognizeImage(file);
  if (file.type === 'application/pdf') return recognizePdf(file);
  throw new Error('지원하지 않는 파일 형식입니다.');
}

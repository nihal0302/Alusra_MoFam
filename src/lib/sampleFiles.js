// Made-up documents for the testing scenarios: a small photograph (a plain portrait-shaped picture, drawn on a canvas) and a
// tiny report (a bare PDF). They carry no real content. Returns a File, like one picked from a device.

const photo = () =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, 200, 240);
    ctx.fillStyle = '#c9b8a0';
    ctx.beginPath();
    ctx.arc(100, 96, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(100, 232, 74, 78, 0, Math.PI, 0);
    ctx.fill();
    canvas.toBlob((blob) => resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.85);
  });

const report = () => {
  const pdf = '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
  return Promise.resolve(new File([pdf], 'medical-report.pdf', { type: 'application/pdf' }));
};

export const makeSampleFile = (kind) => (kind === 'photo' ? photo() : report());

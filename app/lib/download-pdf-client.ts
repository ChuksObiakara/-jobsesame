'use client';

// Triggers a PDF download via a real form POST + browser navigation, instead
// of building a Blob client-side and dispatching a synthetic <a> click.
// Blob downloads are known to silently fail on iOS/mobile Safari (and some
// in-app browsers): the click fires asynchronously, after the page's "user
// activation" window from the original tap has expired, so the browser drops
// the save with no error. A genuine form submission is a real navigation —
// the server's Content-Disposition: attachment header (see app/api/pdf) is
// honoured natively on every platform without ever leaving the current page.
export function downloadPdf(kind: 'cv' | 'cover-letter', payload: unknown, fileName: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/pdf';
  form.style.display = 'none';

  const addField = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };
  addField('kind', kind);
  addField('fileName', fileName);
  addField('payload', JSON.stringify(payload));

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 2000);
}

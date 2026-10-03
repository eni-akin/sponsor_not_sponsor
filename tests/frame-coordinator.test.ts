import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanPage } from '../src/scanner';
import { embeddedFrameResult, FrameCoordinator } from '../src/frame-coordinator';
import type { ScannerSnapshot, ScanResult } from '../src/types';

const parentUrl = 'https://company.example/careers';
const childUrl = 'https://jobs.example/jobs/123/job';
const scan = (html: string, url: string) => scanPage(new JSDOM(html, { url }).window.document, url);

test('redirected frame identity is bound to its window; stale reads cannot survive reset or removal', async () => {
  for (const change of ['none', 'clear', 'navigate', 'remove', 'replace', 'hide'] as const) {
    const dom = new JSDOM('<h1>Careers</h1><iframe src="https://jobs.example/redirect"></iframe>', { url: parentUrl });
    const doc = dom.window.document;
    const frame = doc.querySelector('iframe')!;
    const parent: ScannerSnapshot = { state: 'ready', hostname: 'company.example', result: scanPage(doc, parentUrl) };
    const child = scan('<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools.</p><h2>Qualifications</h2><p>Current student.</p><a>Apply</a></main>', childUrl);
    let complete!: (result: ScanResult) => void;
    const coordinator = new FrameCoordinator(doc, () => new Promise(resolve => { complete = resolve; }), async (_message, nonce) => {
      dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: frame.contentWindow,
        origin: new URL(childUrl).origin, data: { type: 'SNS_FRAME_IDENTITY', nonce } }));
    }, () => {}, () => {});
    const pending = coordinator.available({ type: 'FRAME_AVAILABLE', frameId: 1, documentId: 'doc1', url: childUrl });
    await new Promise(resolve => setTimeout(resolve, 0));
    if (change === 'clear') coordinator.clear();
    if (change === 'navigate') coordinator.reset(`${parentUrl}/other`);
    if (change === 'remove') frame.remove();
    if (change === 'replace') frame.src = 'https://jobs.example/other';
    if (change === 'hide') frame.hidden = true;
    complete(child);
    await pending;
    assert.equal(coordinator.combine(parent).result?.role?.title ?? null, change === 'none' ? 'Engineer Intern' : null, change);
    coordinator.dispose(); dom.window.close();
  }
});

test('a hidden child cannot identify itself as the visible job frame', async () => {
  const dom = new JSDOM('<h1>Careers</h1><iframe src="https://jobs.example/visible"></iframe><iframe hidden src="https://jobs.example/hidden"></iframe>', { url: parentUrl });
  let reads = 0;
  const coordinator = new FrameCoordinator(dom.window.document, async () => { reads++; return null; }, async (_message, nonce) => {
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window.document.querySelectorAll('iframe')[1]!.contentWindow,
      origin: new URL(childUrl).origin, data: { type: 'SNS_FRAME_IDENTITY', nonce } }));
  }, () => {}, () => {});
  await coordinator.available({ type: 'FRAME_AVAILABLE', frameId: 2, documentId: 'hidden', url: childUrl });
  assert.equal(reads, 0);
  coordinator.dispose(); dom.window.close();
});

test('a selected embedded role keeps its own evidence source and parent page address', () => {
  const parent = scan(`<h1>Careers</h1><iframe src="${childUrl}"></iframe>`, parentUrl);
  const child = scan('<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for the team.</p><h2>Qualifications</h2><p>Current student with software experience.</p><p>Visa sponsorship is not available for this role.</p><a>Apply</a></main>', childUrl);
  const combined = embeddedFrameResult(parent, child);
  assert.equal(combined?.url, parentUrl);
  assert.equal(combined?.role?.title, 'Engineer Intern');
  assert.equal(combined?.interpretation?.sponsorship.status, 'unavailable');
  assert.ok(combined?.role?.evidence.some(block => block.source === 'embedded-frame' && block.sourceUrl === childUrl));
  assert.equal(combined?.role?.coverage?.sources[0]?.kind, 'embedded-frame');
});

test('an embedded role cannot overwrite a role already selected in the parent', () => {
  const parent = scan('<main><h1>Product Analyst</h1><h2>Responsibilities</h2><p>Analyze products.</p><h2>Qualifications</h2><p>Current student.</p><a>Apply</a></main>', parentUrl);
  const child = scan('<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for the team.</p><h2>Qualifications</h2><p>Current student.</p><a>Apply</a></main>', childUrl);
  assert.equal(embeddedFrameResult(parent, child), null);
});

test('a frame supplements only an exact requisition match with an employer or ATS tenant match', () => {
  const rolePage = (url: string, title: string, employer: string, identifier: string, text: string) => scan(
    `<main><h1>${title}</h1><h2>Responsibilities</h2><p>${text}</p><h2>Qualifications</h2><p>Current student with software experience.</p><a>Apply</a></main><script type="application/ld+json">${JSON.stringify({
      '@type': 'JobPosting', title, identifier, hiringOrganization: { name: employer },
      description: `<p>${text}</p><p>Current students apply.</p>`,
    })}</script>`, url);
  const parent = rolePage(parentUrl, 'Engineer Intern', 'Example Corp', 'REQ-42', 'Build reliable tools for customers.');
  const child = rolePage(childUrl, 'Engineer Intern', 'Example Corp', 'REQ-42', 'Visa sponsorship is not available for this role.');
  const result = embeddedFrameResult(parent, child);
  assert.equal(result?.url, parentUrl);
  assert.equal(result?.role?.identifier, 'REQ-42');
  assert.ok(result?.role?.evidence.some(block => block.text.includes('Build reliable tools') && block.source === 'visible-page'));
  assert.ok(result?.role?.evidence.some(block => block.text.includes('Visa sponsorship') && block.source === 'embedded-frame' && block.sourceUrl === childUrl));

  const otherRequisition = rolePage(childUrl, 'Engineer Intern', 'Example Corp', 'REQ-43', 'Different opening requirement.');
  assert.equal(embeddedFrameResult(parent, otherRequisition), null);
  const missingIdentity = rolePage(childUrl, 'Engineer Intern', 'Example Corp', '', 'Unidentified opening wording.');
  assert.equal(embeddedFrameResult(parent, missingIdentity), null);
  assert.equal(embeddedFrameResult(parent, otherRequisition, true), null, 'an Apply link cannot override an ID conflict');
  const otherEmployer = rolePage(childUrl, 'Engineer Intern', 'Other Corp', 'REQ-42', 'Unrelated employer.');
  assert.equal(embeddedFrameResult(parent, otherEmployer, true), null);
  child.role!.coverage!.gaps.push('truncated');
  child.role!.completeness = 'incomplete';
  assert.equal(embeddedFrameResult(parent, child)?.role?.completeness, 'incomplete', 'merging must not erase truncation');
});

test('coordinator waits for unrelated visible frames before adopting a job result', async () => {
  const dom = new JSDOM('<h1>Careers</h1><iframe src="https://jobs.example/job"></iframe><iframe src="https://widget.example/calendar"></iframe>', { url: parentUrl });
  const frames = [...dom.window.document.querySelectorAll('iframe')];
  const job = scan('<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for customers.</p><h2>Qualifications</h2><p>Current student.</p><a>Apply</a></main>', childUrl);
  const widget = scan('<main><h1>Calendar</h1><p>Select a date.</p></main>', 'https://widget.example/calendar');
  let finishJob!: (value: ScanResult) => void;
  const coordinator = new FrameCoordinator(dom.window.document,
    async message => message.frameId === 1 ? await new Promise<ScanResult>(resolve => { finishJob = resolve; }) : widget,
    async (message, nonce) => { dom.window.dispatchEvent(new dom.window.MessageEvent('message', {
      source: frames[message.frameId - 1]!.contentWindow, origin: new URL(message.url).origin,
      data: { type: 'SNS_FRAME_IDENTITY', nonce },
    })); }, () => {}, () => {});
  const parent = scanPage(dom.window.document, parentUrl);
  const first = coordinator.available({ type: 'FRAME_AVAILABLE', frameId: 1, documentId: 'job', url: childUrl });
  const second = coordinator.available({ type: 'FRAME_AVAILABLE', frameId: 2, documentId: 'widget', url: 'https://widget.example/calendar' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(coordinator.combine({ state: 'ready', hostname: 'company.example', result: parent }).result?.role, null);
  finishJob(job);
  await Promise.all([first, second]);
  assert.equal(coordinator.combine({ state: 'ready', hostname: 'company.example', result: parent }).result?.role?.title, 'Engineer Intern');
  coordinator.dispose(); dom.window.close();
});

test('structured description inside the frame keeps frame-specific attribution', () => {
  const parent = scan(`<h1>Careers</h1><iframe src="${childUrl}"></iframe>`, parentUrl);
  const description = `<p>${'Build reliable software systems with the team. '.repeat(10)}</p><p>Visa sponsorship is unavailable for this role.</p>`;
  const child = scan(`<main><h1>Engineer Intern</h1><form><label>Resume<input type="file"></label></form></main><script type="application/ld+json">${JSON.stringify({ '@type': 'JobPosting', title: 'Engineer Intern', description })}</script>`, childUrl);
  const combined = embeddedFrameResult(parent, child);
  assert.ok(combined?.role?.evidence.some(block => block.source === 'embedded-structured-data' && block.sourceUrl === childUrl));
  assert.ok(combined?.role?.coverage?.sources.some(source => source.kind === 'embedded-structured-data'));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanPage } from '../src/scanner';
import { embeddedFrameResult } from '../src/frame-coordinator';

const parentUrl = 'https://company.example/careers';
const childUrl = 'https://jobs.example/jobs/123/job';
const scan = (html: string, url: string) => scanPage(new JSDOM(html, { url }).window.document, url);

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

test('structured description inside the frame keeps frame-specific attribution', () => {
  const parent = scan(`<h1>Careers</h1><iframe src="${childUrl}"></iframe>`, parentUrl);
  const description = `<p>${'Build reliable software systems with the team. '.repeat(10)}</p><p>Visa sponsorship is unavailable for this role.</p>`;
  const child = scan(`<main><h1>Engineer Intern</h1><form><label>Resume<input type="file"></label></form></main><script type="application/ld+json">${JSON.stringify({ '@type': 'JobPosting', title: 'Engineer Intern', description })}</script>`, childUrl);
  const combined = embeddedFrameResult(parent, child);
  assert.ok(combined?.role?.evidence.some(block => block.source === 'embedded-structured-data' && block.sourceUrl === childUrl));
  assert.ok(combined?.role?.coverage?.sources.some(source => source.kind === 'embedded-structured-data'));
});

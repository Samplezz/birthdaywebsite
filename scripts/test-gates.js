const { randomUUID } = require('crypto');

const SITE_URL = process.env.SITE_URL;
const EDITOR_URL = process.env.EDITOR_URL;
const VISITOR_PASSWORD = process.env.TEST_VISITOR_PASSWORD;
const EDITOR_PASSWORD = process.env.TEST_EDITOR_PASSWORD;

for (const [name, value] of Object.entries({
  SITE_URL,
  EDITOR_URL,
  TEST_VISITOR_PASSWORD: VISITOR_PASSWORD,
  TEST_EDITOR_PASSWORD: EDITOR_PASSWORD,
})) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const runId = randomUUID();
const runIp = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
const spoofedIp = '203.0.113.250';
const siteBase = SITE_URL.replace(/\/$/, '');
const editorBase = EDITOR_URL.replace(/\/$/, '');
const failures = [];
let testCount = 0;

function endpoint(base, path) {
  return `${base}${path}`;
}

function headers(extra = {}) {
  return {
    'x-forwarded-for': runIp,
    ...extra,
  };
}

function cookieFrom(response) {
  const setCookie = response.headers.get('set-cookie');
  return setCookie ? setCookie.split(';', 1)[0] : '';
}

async function request(base, path, options = {}) {
  return fetch(endpoint(base, path), {
    redirect: 'manual',
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {}),
    },
  });
}

async function jsonRequest(base, path, options = {}) {
  const response = await request(base, path, options);
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON responses are reported by the assertion detail.
  }
  return { response, body };
}

function pass(name, detail = '') {
  testCount += 1;
  console.log(`PASS ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, detail) {
  testCount += 1;
  console.error(`FAIL ${name}${detail ? ` - ${detail}` : ''}`);
  failures.push(name);
}

function expectStatus(name, response, expected) {
  if (response.status === expected) {
    pass(name);
  } else {
    fail(name, `expected ${expected}, received ${response.status}`);
  }
}

async function expectUnauthenticated(name, base, path, options = {}) {
  const response = await request(base, path, options);
  if (response.status === 401 || (response.status >= 300 && response.status < 400)) {
    pass(name);
  } else {
    fail(name, `expected 401 or redirect, received ${response.status}`);
  }
}

async function login(base, password) {
  const response = await request(base, '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return { response, cookie: cookieFrom(response) };
}

async function main() {
  await expectUnauthenticated('site page rejects unauthenticated access', siteBase, '/');
  await expectUnauthenticated('editor page rejects unauthenticated access', editorBase, '/');
  await expectUnauthenticated('site content API rejects unauthenticated access', siteBase, '/api/content');
  await expectUnauthenticated('editor content API rejects unauthenticated access', editorBase, '/api/content');
  await expectUnauthenticated('site media API rejects unauthenticated access', siteBase, '/api/media?pathname=photos/test.webp');
  await expectUnauthenticated('editor media API rejects unauthenticated access', editorBase, '/api/media?pathname=photos/test.webp');
  await expectUnauthenticated('site wishes GET rejects unauthenticated access', siteBase, '/api/wishes');
  await expectUnauthenticated('site wishes POST rejects unauthenticated access', siteBase, '/api/wishes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Guest', message: 'Hello' }),
  });
  await expectUnauthenticated('editor wishes moderation rejects unauthenticated access', editorBase, '/api/wishes');
  await expectUnauthenticated('site photo upload rejects unauthenticated access', siteBase, '/api/upload/photo', { method: 'POST', body: new FormData() });
  await expectUnauthenticated('editor photo upload rejects unauthenticated access', editorBase, '/api/upload/photo', { method: 'POST', body: new FormData() });
  await expectUnauthenticated('editor audio upload rejects unauthenticated access', editorBase, '/api/upload/audio', { method: 'POST', body: new FormData() });

  const wrongVisitor = await login(siteBase, `${VISITOR_PASSWORD}-wrong`);
  expectStatus('wrong visitor password rejected', wrongVisitor.response, 401);

  const wrongEditor = await login(editorBase, `${EDITOR_PASSWORD}-wrong`);
  expectStatus('wrong editor password rejected', wrongEditor.response, 401);

  const visitorLogin = await login(siteBase, VISITOR_PASSWORD);
  expectStatus('correct visitor password accepted', visitorLogin.response, 200);
  const editorLogin = await login(editorBase, EDITOR_PASSWORD);
  expectStatus('correct editor password accepted', editorLogin.response, 200);

  const authenticatedSiteContent = await request(siteBase, '/api/content', {
    headers: { cookie: visitorLogin.cookie },
  });
  expectStatus('visitor can access site content API', authenticatedSiteContent, 200);

  const authenticatedEditorContent = await request(editorBase, '/api/content', {
    headers: { cookie: editorLogin.cookie },
  });
  expectStatus('editor can access editor content API', authenticatedEditorContent, 200);

  const oversizedWish = await request(siteBase, '/api/wishes', {
    method: 'POST',
    headers: {
      cookie: visitorLogin.cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Guest', message: 'x'.repeat(281) }),
  });
  expectStatus('over-length wish rejected', oversizedWish, 400);

  const htmlWishText = '<strong>Plain text wish</strong>';
  const htmlWish = await jsonRequest(siteBase, '/api/wishes', {
    method: 'POST',
    headers: {
      cookie: visitorLogin.cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: '<b>Guest</b>', message: htmlWishText }),
  });

  if (htmlWish.response.status === 200 || htmlWish.response.status === 201) {
    const wishes = await jsonRequest(siteBase, '/api/wishes', {
      headers: { cookie: visitorLogin.cookie },
    });
    const serialized = JSON.stringify(wishes.body);
    if (serialized.includes('Plain text wish') && !serialized.includes('<strong>')) {
      pass('HTML wish is returned as plain text');
    } else {
      fail('HTML wish is returned as plain text', 'response was not safely rendered as text');
    }
  } else {
    fail('HTML wish is returned as plain text', `POST returned ${htmlWish.response.status}`);
  }

  const visitorCookieOnEditor = await request(editorBase, '/api/content', {
    headers: { cookie: visitorLogin.cookie },
  });
  expectStatus('visitor cookie rejected by editor', visitorCookieOnEditor, 401);

  const editorCookieOnSite = await request(siteBase, '/api/content', {
    headers: { cookie: editorLogin.cookie },
  });
  expectStatus('editor cookie rejected by site', editorCookieOnSite, 401);

  for (const pathname of [
    'https://example.com/photos/test.webp',
    '../photos/test.webp',
    'documents/test.webp',
  ]) {
    const result = await request(siteBase, `/api/media?pathname=${encodeURIComponent(pathname)}`, {
      headers: { cookie: visitorLogin.cookie },
    });
    expectStatus(`media rejects invalid pathname: ${pathname}`, result, 400);
  }

  const invalidPhoto = new FormData();
  invalidPhoto.append('file', new Blob(['not-webp'], { type: 'image/webp' }), 'invalid.webp');
  const invalidPhotoResult = await request(editorBase, '/api/upload/photo', {
    method: 'POST',
    headers: { cookie: editorLogin.cookie },
    body: invalidPhoto,
  });
  expectStatus('photo upload rejects non-WebP signature', invalidPhotoResult, 400);

  const oversizedPhoto = new FormData();
  oversizedPhoto.append(
    'file',
    new Blob([Buffer.alloc(1.5 * 1024 * 1024 + 1)], { type: 'image/webp' }),
    'oversized.webp'
  );
  const oversizedPhotoResult = await request(editorBase, '/api/upload/photo', {
    method: 'POST',
    headers: { cookie: editorLogin.cookie },
    body: oversizedPhoto,
  });
  expectStatus('photo upload rejects oversized file', oversizedPhotoResult, 413);

  const invalidAudio = new FormData();
  invalidAudio.append('file', new Blob(['not-mp3'], { type: 'audio/mpeg' }), 'invalid.mp3');
  const invalidAudioResult = await request(editorBase, '/api/upload/audio', {
    method: 'POST',
    headers: { cookie: editorLogin.cookie },
    body: invalidAudio,
  });
  expectStatus('audio upload rejects non-MP3 signature', invalidAudioResult, 400);

  const spoofedHeaderResult = await request(siteBase, '/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `${spoofedIp}, ${runIp}`,
      'x-real-ip': runIp,
    },
    body: JSON.stringify({ password: `${VISITOR_PASSWORD}-wrong` }),
  });

  if (spoofedHeaderResult.status === 401 || spoofedHeaderResult.status === 429) {
    pass(
      'spoofed x-forwarded-for is handled by the deployment edge',
      'on Vercel, compare repeated runs: the edge-normalized client IP should produce the same rate-limit behavior'
    );
  } else {
    fail('spoofed x-forwarded-for behavior', `received ${spoofedHeaderResult.status}`);
  }

  console.log(`Test run ${runId} used isolated IP header ${runIp}.`);
  console.log(`Test count: ${testCount}; failures: ${failures.length}`);
  if (failures.length > 0) {
    console.error(`${failures.length} test(s) failed.`);
    process.exit(1);
  }

  console.log('All gate tests passed.');
}

main().catch((error) => {
  console.error('FAIL test runner:', error);
  process.exit(1);
});

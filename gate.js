/* TestFlight link gate.
   The TestFlight URL is not in the page source — it's stored AES-GCM
   encrypted below, with the key derived from the access code (PBKDF2).
   To change the code or URL: node tools/encrypt-gate.mjs <code> <url>,
   then replace SALT/IV/CIPHERTEXT below. */

const SALT = 'VBUCL226+AYBlscQ9PrY2w==';
const IV = 'HwWmyGZ+hlACDehm';
const CIPHERTEXT = 'fQxqjA1htO0XDfbLAyEVxKwz5AzoVqlSXsRb5pgkM6EhTEUULBkIjTHhSSR29nS9HdfGjfOdrsR0Gg==';
const PBKDF2_ITERATIONS = 310000;

const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function decryptUrl(code) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBytes(SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBytes(IV) }, key, b64ToBytes(CIPHERTEXT));
    return new TextDecoder().decode(plaintext);
}

function unlock(url) {
    document.getElementById('cta-link').href = url;
    document.getElementById('gate-locked').hidden = true;
    document.getElementById('gate-unlocked').hidden = false;
}

const codeForm = document.getElementById('code-form');
const codeError = document.getElementById('code-error');

codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeForm.elements.code.value.trim().toLowerCase();
    if (!code) return;
    try {
        const url = await decryptUrl(code);
        sessionStorage.setItem('gfm-url', url);
        unlock(url);
    } catch {
        codeError.hidden = false;
        codeForm.elements.code.select();
    }
});

codeForm.elements.code.addEventListener('input', () => {
    codeError.hidden = true;
});

const saved = sessionStorage.getItem('gfm-url');
if (saved) unlock(saved);

/* Interest form: post to Formspree via fetch for an inline thank-you.
   If fetch is unavailable or fails, the form falls back to a normal
   POST to Formspree's hosted page. */

const interestForm = document.getElementById('interest-form');

interestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = interestForm.querySelector('button');
    const errorEl = document.getElementById('interest-error');
    button.disabled = true;
    errorEl.hidden = true;
    let res;
    try {
        res = await fetch(interestForm.action, {
            method: 'POST',
            body: new FormData(interestForm),
            headers: { Accept: 'application/json' },
        });
    } catch {
        // Network failure — fall back to a normal POST to Formspree's page.
        button.disabled = false;
        interestForm.submit();
        return;
    }
    if (res.ok) {
        interestForm.hidden = true;
        document.getElementById('interest-thanks').hidden = false;
    } else {
        button.disabled = false;
        errorEl.hidden = false;
    }
});

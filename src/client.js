const input = document.querySelector('input');
const output = document.querySelector('output');

let key;

document.querySelector('.btn-box').addEventListener('click', e => {
    if (e.target.classList.contains('btn-send')) {
        encryptAndSendMsg();

        e.target.nextElementSibling.removeAttribute('disabled')
    } else if (e.target.classList.contains('btn-get')) {
        getAndDecryptMsg();
    }
});

const generateKey = async () =>
    window.crypto.subtle.generateKey({
        name: 'AES-GCM',
        length: 256,
    }, true, ['encrypt', 'decrypt']);

const encode = data => {
    const encoder = new TextEncoder();

    return encoder.encode(data);
}

const generateIv = () => window.crypto.getRandomValues(new Uint8Array(12));

const encrypt = async (data, key) => {
    const encoded = encode(data);
    const iv = generateIv();
    const cipher = await window.crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv
    }, key, encoded);

    return {
        cipher,
        iv
    };
}

const pack = buffer => window.btoa(
    String.fromCharCode.apply(null, new Uint8Array(buffer))
);

const unpack = packed => {
    const string = window.atob(packed);
    const buffer = new ArrayBuffer(string.length);
    const bufferView = new Uint8Array(buffer);

    for (let i = 0; i < string.length; i++) {
        bufferView[i] = string.charCodeAt(i)
    }

    return buffer;
}

const decode = byteStream => {
    const decoder = new TextDecoder();

    return decoder.decode(byteStream);
}

const decrypt = async (cipher, key, iv) => {
    const encoded = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv
    }, key, cipher);

    return decode(encoded);
}

const encryptAndSendMsg = async () => {
    const msg = input.value;

    key = await generateKey();

    const {cipher, iv} = await encrypt(msg, key);

    await fetch('/secure-api', {
        method: 'POST',
        body: JSON.stringify({
            cipher: pack(cipher),
            iv: pack(iv)
        })
    });

    output.innerHTML = `Сообщение <span>"${msg}"</span> зашифровано.<br>Данные отправлены на сервер.`;
}

const getAndDecryptMsg = async () => {
    const res = await fetch('/secure-api');
    const data = await res.json();
    console.log(data);
    const msg = await decrypt(unpack(data.cipher), key, unpack(data.iv));
    output.innerHTML = `Данные от сервера получены.<br>Сообщение <span>"${msg}"</span> расшифровано.`;
}
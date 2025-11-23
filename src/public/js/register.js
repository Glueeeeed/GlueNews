import {x25519} from 'https://cdn.jsdelivr.net/npm/@noble/curves@2.0.1/ed25519/+esm';
import {gcm} from 'https://cdn.jsdelivr.net/npm/@noble/ciphers@2.0.1/aes/+esm';
import {randomBytes} from 'https://cdn.jsdelivr.net/npm/@noble/ciphers@2.0.1/utils/+esm';



const registerBtn = document.getElementById('registerBtn');
const showButton = document.getElementById('togglePassword');
showButton.addEventListener('click', e => {
    showPassword();
})
registerBtn.addEventListener('click', () => {
     register();
});



async function register() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const sessionKey = await getSessionKey();
    const sessionID = sessionKey.sessionID
    const sessionSecret = sessionKey.secret

    const encryptedUsername = await encryptAesGcm(username, sessionSecret);
    const encryptedEmail = await encryptAesGcm(email, sessionSecret);
    const encryptedPassword = await encryptAesGcm(password, sessionSecret);

    try {
        const register = await fetch(`http://localhost:2137/api/auth/register`, { // CHANGE TO YOUR DOMAIN
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: encryptedEmail,
                password: encryptedPassword,
                username: encryptedUsername,
                sessionID: sessionID

            })
        });
        if (!register.ok) {
            const errorData = await register.json();
            throw new Error(errorData.error);
        }
        const registerData = await register.json();
        console.log("Rejestracja powiodla sie: ", registerData.message);
        window.location.href = '/login';


    } catch (error) {
        console.log('Rejestracja nie powiodla sie: ', error.message);
        alert(error.message);
    }

}

async function encryptAesGcm(plainText, keyHex) {
    const nonce = randomBytes(12);
    const key = Uint8Array.fromHex(keyHex);
    const data = new TextEncoder().encode(plainText);
    const aes = gcm(key, nonce);
    const cipher = aes.encrypt(data);
    const uint8Array = new Uint8Array(cipher);
    return uint8Array.toBase64() + ":" + nonce.toHex()
}

async function getSessionKey() {
    try {
        const clientKeyPair = x25519.keygen();
        const clientPublicKeyHex = clientKeyPair.publicKey.toHex();
        const keyExchange = await fetch(`http://localhost:2137/api/key-exchange`, { // CHANGE TO YOUR DOMAIN
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientPublicKey: clientPublicKeyHex
            })
        });
        if (!keyExchange.ok) {
            throw new Error('HTTP error! status: ' + keyExchange.status);
        }

        const keyExchangeData = await keyExchange.json();
        const serverPublicKeyBytes = Uint8Array.fromHex(keyExchangeData.serverPublicKey);
        return {secret: x25519.getSharedSecret(clientKeyPair.secretKey, serverPublicKeyBytes).toHex().slice(0,32), sessionID: keyExchangeData.sessionID};
    } catch (error) {
        alert('Wystapil nieoczekiwany błąd. Spróbuj odświeżyć stronę.');
        console.log("Wystapil blad podczas wymiany kluczy: ", error);
    }


}

function showPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const eye = document.getElementById('eye');
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    eye.classList.toggle('fa-eye', !isPassword);
    eye.classList.toggle('fa-eye-slash', isPassword);
}

window.showPassword = showPassword;

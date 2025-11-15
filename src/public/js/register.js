import {x25519} from 'https://cdn.jsdelivr.net/npm/@noble/curves@2.0.1/ed25519/+esm';

const registerBtn = document.getElementById('registerBtn');
registerBtn.addEventListener('click', () => {
    register();
});

async function register() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const sessionKey = await getSessionKey();

}


async function getSessionKey() {
    try {
        const clientKeyPair = x25519.keygen();
        const clientPublicKeyHex = clientKeyPair.publicKey.toHex();
        const keyExchange = await fetch(`http://localhost:2137/api/key-exchange`, {
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
        console.log(serverPublicKeyBytes);
        return x25519.getSharedSecret(clientKeyPair.secretKey, serverPublicKeyBytes).toHex().slice(0,32);
    } catch (error) {
        console.log("Wystapil blad podczas wymiany kluczy: ", error);
    }


}

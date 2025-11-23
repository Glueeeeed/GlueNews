function copyToClipboard(sessionID) {
    const text = 'http://localhost:2137/api/battle/results/' + sessionID // CHANGE TO YOUR DOMAIN
    navigator.clipboard.writeText(text).then(() => {
        alert('Skopiowano do schowka!');
    }).catch(err => {
        console.error('Nie mozna skopiowac tekstu: ', err);
    });
}

function redirect(url) {
    window.location.href = url;
}

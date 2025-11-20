const battleBtn = document.getElementById('battleBtn');
battleBtn.addEventListener('click', async (e)  =>  {
    await startBattle();
})

async function startBattle() {
    const sessionID = await createSession();
}

async function createSession() {
    try {
        const input = document.getElementById('inputText').value;
        const getSession = await fetch('http://localhost:2137/api/battle/start-session', { // CHANGE TO YOUR DOMAIN
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: input,
            }),
        });

        if (!getSession.ok) {
            throw new Error('Session failed.');
        }

        const session = await getSession.json();
        window.location.href = `http://localhost:2137/api/battle/rooms/${session.sessionBattleID}/?user=${session.uuid}`;

    } catch (error) {
        console.log(error);
    }

}

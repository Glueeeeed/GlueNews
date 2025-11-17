 document.addEventListener('DOMContentLoaded',  async () => {
   await checkStatus()
})

const analizaBtn = document.getElementById('analizujBtn');
analizaBtn.addEventListener('click', () => {
 analiza();
})

 const loginBtn = document.getElementById('loginBtn');

 loginBtn.addEventListener('click', () => {
     window.location.href = '/login';
 })

async function analiza() {
    const text = document.getElementById('inputText').value;
    await waitInput();
    try {
        const analiza = await fetch(`http://localhost:2137/api/analiza`, { // CHANGE TO YOUR DOMAIN
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: text
            })
        });
        if (!analiza.ok) {
            const errorData = await analiza.json();
            document.getElementById('inputText').value = 'Wystapil blad podczas analizy tego tekstu. Sprobuj ponownie.';
            throw new Error(errorData.error);
        }
        const analizaData = await analiza.json();
        window.location.href = `http://localhost:2137/api/results/${analizaData.result}`; // CHANGE TO YOUR DOMAIN


    } catch (error) {
         console.log("Wystapil blad: ", error);
    }
}

async function waitInput() {
    const text = document.getElementById('inputText').value;
    document.getElementById('inputText').value = 'Analizowanie prosze czekac...';
}

async function checkStatus(){
    const status = await fetch(`http://localhost:2137/api/auth/status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const statusData = await status.json();

    if (statusData.status === "unauthorized") {
        document.getElementById('inputText').placeholder = "Aby móc wykonać analizę musisz się zalogować!"
        document.getElementById('inputText').disabled = true;
        document.getElementById('analizujBtn').disabled = true;
        document.getElementById('battleBtn').disabled = true;
        document.getElementById('loginBtn').hidden = false;
    }

}


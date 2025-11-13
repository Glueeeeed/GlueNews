const analizaBtn = document.getElementById('analizujBtn');
analizaBtn.addEventListener('click', () => {
 analiza();
})

async function analiza() {
    const text = document.getElementById('inputText').value;
    await waitInput();
    try {
        const analiza = await fetch(`http://localhost:2137/api/analiza`, {
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
        window.location.href = `http://localhost:2137/api/results/${analizaData.result}`;


    } catch (error) {
         console.log("Wystapil blad: ", error);
    }
}

async function waitInput() {
    const text = document.getElementById('inputText').value;
    document.getElementById('inputText').value = 'Analizowanie prosze czekac...';
}
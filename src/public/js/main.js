const analizaBtn = document.getElementById('analizujBtn');
analizaBtn.addEventListener('click', () => {
 analiza();
})

async function analiza() {
    let text = document.getElementById('inputText').value;
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
            throw new Error(errorData.error);
        }

    } catch (error) {
         console.log("Wystapil blad: ", error);
         document.getElementById('inputText').value = 'Wystapil blad podczas analizy tego tekstu. Sprobuj ponownie.';
    }
}
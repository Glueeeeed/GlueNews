const battleData = window.__BATTLE
console.log(battleData)
const chatrtf = document.getElementById('chatSection');
const startSection = document.getElementById('startSection');
const inviteSection = document.getElementById('inviteLinkSection');
const choosedRole = document.getElementById('choosedRoleSection');
const rolaObronca = document.getElementById('roleObronca');
const rolaObalator = document.getElementById('roleObalator');
const chatInput = document.getElementById('chat-input');
const checkToMember = document.getElementById('checkToMemberP');
const readyBtn = document.getElementById('readyBtn');
const understandBtn = document.getElementById('understandBtn');
const voteSection = document.getElementById('votingSection');
const forPlayerInfo = document.getElementById('forPlayersInfo');
const voteABtn = document.getElementById('voteABtn');
const voteBBtn = document.getElementById('voteBBtn');


let player;
let playerRole;


sendBtn.addEventListener('click', (e) => {
        socket.emit('message', {msg: input.value, role: playerRole, topic: battleData.sessionData.input});
        sendMessage();
})
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        socket.emit('message', {msg: input.value, role: playerRole, topic: battleData.sessionData.input});
        sendMessage();
    }
});

voteBBtn.addEventListener('click', (e) => {
    socket.emit('vote', 'B');
    voteBBtn.innerText = 'Zagłosowano';
    voteABtn.hidden = true;
    voteBBtn.disabled = true;
})

voteABtn.addEventListener('click', (e) => {
    socket.emit('vote', 'A');
    voteABtn.innerText = 'Zagłosowano';
    voteABtn.disabled = true;
    voteBBtn.hidden = true;
})

readyBtn.addEventListener('click', () => {
    readyBtn.disabled = true;
    readyBtn.textContent = 'Gotowy...';
    ready();
})

understandBtn.addEventListener('click', () => {
    choosedRole.hidden = true;
    chatrtf.hidden = false;
    input.hidden = false;
})

if (battleData.user.role === 'player' && battleData.sessionData.A_uuid === battleData.user.uuid ) {
    startSection.hidden = false;
    inviteSection.hidden = false;
    chatrtf.hidden = true;
    choosedRole.hidden = true;
    player = 'a';
}

if (battleData.user.role === 'player' && battleData.sessionData.B_uuid === battleData.user.uuid ) {
    startSection.hidden = false;
    inviteSection.hidden = true;
    chatrtf.hidden = true;
    choosedRole.hidden = true;
    player = 'b';
}

if (battleData.user.role === 'spectator') {
    startSection.hidden = true;
    inviteSection.hidden = true;
    chatrtf.hidden = false;
    choosedRole.hidden = true;
    chatInput.hidden = true;
    document.getElementById('send-btn').hidden = true;
    checkToMember.hidden = true;
    player = 'spectator';

}

const socket = io({
    query: {
        sessionID: battleData.sessionID,
        nickname: battleData.user.username,
        role: player.toUpperCase(),
    }
})

socket.on('connect', () => {
    console.log('Connected');

})

socket.on('duplicateNickname', () => {
    alert('Nie mozesz dołączyć do pokoju, ponieważ twoja nazwa użytkownika jest już zajęta w tej sesji.');
    window.location.href = '/';
});

socket.on('announcement', (data) => {
    addMessage(data, 'system', 'System')
})

socket.on('unlockButtons', () => {
     readyBtn.disabled= false;
    checkToMember.hidden = true;
})

function ready() {
    socket.emit('ready', player );
}

socket.on('startBattle', (role) => {
    sessionStorage.setItem('game', 'true');
    startSection.hidden = true;
    if (player === 'a') {
        playerRole = role.a
        choosedRole.hidden = false;
        if (role.a === "OBRONCA") {
            rolaObronca.hidden = false;
        } else {
            rolaObalator.hidden = false;
        }
    } else if (player === 'b') {
        playerRole = role.b
        choosedRole.hidden = false;
        if (role.b === "OBRONCA") {
            rolaObronca.hidden = false;
        } else {
            rolaObalator.hidden = false;
        }
    }
});

socket.on('voting', () => {
    sessionStorage.removeItem('game');
    sessionStorage.setItem('voting', 'true');
    chatrtf.hidden = true;
    voteSection.hidden = false;
    if (battleData.user.role !== 'spectator') {
        forPlayerInfo.hidden = false;
        voteABtn.disabled = true;
        voteBBtn.disabled = true;
    } else {
        voteABtn.disabled = false;
        voteBBtn.disabled = false;
    }

})

socket.on('votingEnded', () => {
   sessionStorage.removeItem('game');
   sessionStorage.removeItem('voting');
   window.location.href = '/api/battle/results/' + battleData.sessionID;
})

socket.on('message', (data) => {
    addMessage(data.message, 'other', data.nickname)
})

socket.on('votingResult', (data) => {
    voteSection.hidden = true;
    chatrtf.hidden = false;
    chatInput.hidden = true;
    addMessage(`Wynik głosowania:  ${data} !!`, 'system', 'System')
})

socket.on('timer', (data) => {
    document.getElementById('timer').innerText = `${formatTime(data)}`;
});

socket.on('loadMessages', (data) => {
    if (battleData.user.role !== 'spectator') {
        data.forEach(msg => {
            if (msg.nickname === battleData.user.username) {
                sendMessage(msg.message);
            } else {
                const sender = msg.user_message + " | " + msg.nickname;
                addMessage(msg.message, "other", sender);
            }
        });
    } else {
        data.forEach(msg => {
            const sender = msg.user_message + " | " + msg.nickname;
            addMessage(msg.message, "other", sender);
        });}


});










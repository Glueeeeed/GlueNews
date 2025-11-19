const battleData = window.__BATTLE
const chatrtf = document.getElementById('chatSection');
const startSection = document.getElementById('startSection');
const inviteSection = document.getElementById('inviteLinkSection');
const choosedRole = document.getElementById('choosedRoleSection');
const chatInput = document.getElementById('chat-input');

console.log(battleData.sessionData);



if (battleData.user.role === 'player' && battleData.sessionData.A_uuid === battleData.user.uuid ) {
    startSection.hidden = false;
    inviteSection.hidden = false;
    chatrtf.hidden = true;
    choosedRole.hidden = true;
}

if (battleData.user.role === 'player' && battleData.sessionData.B_uuid === battleData.user.uuid ) {
    startSection.hidden = false;
    inviteSection.hidden = true;
    chatrtf.hidden = true;
    choosedRole.hidden = true;
}

if (battleData.user.role === 'spectator') {
    startSection.hidden = true;
    inviteSection.hidden = true;
    chatrtf.hidden = false;
    choosedRole.hidden = true;
    chatInput.hidden = true;
    document.getElementById('send-btn').hidden = true;

}
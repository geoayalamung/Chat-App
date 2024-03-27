document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const form = document.querySelector('#form');
    const input = document.querySelector('#input');
    const messages = document.querySelector('#messages');
    const username = document.querySelector('#username');
    const roomSelect = document.querySelector('#room');
    const leaveRoomBtn = document.getElementById('leave-room'); 
    let currentRoom = '';
  
    input.disabled = true;
    form.querySelector('button').disabled = true;
  
    roomSelect.addEventListener('change', function() {
        if (this.value) {
            input.disabled = false;
            form.querySelector('button').disabled = false;
            joinRoom(this.value);
        } else {
            input.disabled = true;
            form.querySelector('button').disabled = true;
            leaveRoom();
        }
    });
  
    function joinRoom(newRoom) {
        currentRoom = newRoom;
        socket.emit('join room', { room: newRoom, user: username.value });
        messages.innerHTML = '';
        leaveRoomBtn.disabled = false;
        // call end point to get 50 old messages
      //   fetch(`/messages/?room=${currentRoom}&?limit=50`)
      //     .then((res) => res.json())
      //     .then((data) => data.map(addMessage));
    }
  
    function leaveRoom() {
        if (currentRoom) {
            socket.emit('leave room', currentRoom);
            currentRoom = '';
            messages.innerHTML = '';
            alert('You have left the room.');
            leaveRoomBtn.disabled = true;
            roomSelect.value = '';
            input.disabled = true;
            form.querySelector('button').disabled = true;
        }
    }
  
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value && username.value) {
            socket.emit('chat message', { msg: input.value, user: username.value, room: currentRoom });
            input.value = '';
        }
    });
  
    socket.on('chat message', function(data) {
        if (data.room === currentRoom) {
            const item = document.createElement('li');
            item.textContent = `${data.user}: ${data.msg}`;
            messages.appendChild(item);
        }
    });
  
    leaveRoomBtn.addEventListener('click', function() {
        leaveRoom();
    });
  });
  
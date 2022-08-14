let Peer = window.Peer;
let messagesEl = document.querySelector('.messages');
let peerIdEl = document.querySelector('#connect-to-peer');
let videoEl = document.querySelector('.remote-video');
let logMessage = (message) => {
    let newMessage = document.createElement('div');
    newMessage.innerText = message;
    messagesEl.appendChild(newMessage);
};

//
const video = document.querySelector("#videoElement");
if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            video.srcObject = stream;
        })
        .catch(function (error) {
            console.log("Something went wrong!");
        });
}

const stop = (media) => {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    const toggleAButton = document.getElementById("audioBtn");
    const toggleVButton = document.getElementById("videoBtn");
    if (media === "audio") {
        if (tracks[0].enabled) {
            tracks[0].enabled = false;
            toggleAButton.innerHTML = "🎙️ Unmute";
        } else {
            tracks[0].enabled = true;
            toggleAButton.innerHTML = "🔇Mute";

        }
    } else if (media === "video") {
        if (tracks[1].enabled) {
            tracks[1].enabled = false;
            toggleVButton.innerHTML = "📷 Unmute Video";
        } else {
            tracks[1].enabled = true;
            toggleVButton.innerHTML = "📷 Mute Video";

        }

    }


}
let renderVideo = (stream) => {
    videoEl.srcObject = stream;
};




let peer = new Peer({
    host: '/',
    path: '/peerjs/myapp'
});
peer.on('open', (id) => {
    logMessage('🆔 Your Peer ID is: ' + id);
    console.log("Peer ID: " + id);
    $(document).ready(function () {
        $.post("/update-peer",
            {
                peerid: id
            },
            function (data, status) {
            });

    });
});
peer.on('error', (error) => {
    console.error(error);
});


peer.on('connection', (conn) => {
    logMessage('📲 Incoming peer connection!...');
    conn.on('data', (data) => {
        logMessage(`received: ${data}`);
    });
    conn.on('open', () => {
        conn.send('🌏 Now you are connected !...');
    });
});

// Handle incoming voice/video connection
peer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on('stream', renderVideo);
        })
        .catch((err) => {
            console.error('😢 Failed to get local stream', err);
        });
});

// fetch the peers data.

const tableView = document.getElementById("display");
let msgNode = document.createElement("table");
msgNode.innerHTML = "<tr><th>Name</th><th>Peer ID</th><th>Last Seen</th></tr>";


let oldArrayLength = 0;
function loadData() {
    const URL = "https://peerjsconnect.herokuapp.com/peers";
    const getPosts = async () => {
        const response = await fetch(URL);
        if (!response.ok) {
            console.log("error!");
        }
        const data = await response.json();
        return data;
    }
    getPosts()
        .then(mydata => {
            if (oldArrayLength < mydata.length) {
                oldArrayLength = mydata.length;
                mydata.forEach(element => {
                    addmessageToList(element);
                });
            }
        })
        .catch(error => {
            console.log("error.");
        });

}

loadData();
function addmessageToList(message) {
    msgNode.innerHTML += `<tr><td>${message.email.replace("@gmail.com", "")}</td><td><button onclick="copyThis('${message.peer}')">${message.peer}</button></td><td>${message.time.replace("IST", "")}</td></tr>`;
    tableView.appendChild(msgNode);
}





// Initiate outgoing connection
let connectToPeer = () => {
    let peerId = peerIdEl.value;
    logMessage(`⌛ Connecting to ${peerId}...`);

    let conn = peer.connect(peerId);
    conn.on('data', (data) => {
        logMessage(`📥 Received: ${data}`);
    });
    conn.on('open', () => {
        conn.send('🌏 Now you are connected!...');
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            let call = peer.call(peerId, stream);
            call.on('stream', renderVideo);
        })
        .catch((err) => {
            logMessage('😢 Failed to get local stream...', err);
        });
};



window.connectToPeer = connectToPeer;
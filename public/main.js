// client-side js, loaded by index.html
// run by the browser each time the page is loaded

let Peer = window.Peer;

let messagesEl = document.querySelector('.messages');
let peerIdEl = document.querySelector('#connect-to-peer');
let videoEl = document.querySelector('.remote-video');

let logMessage = (message) => {
    let newMessage = document.createElement('div');
    newMessage.innerText = message;
    messagesEl.appendChild(newMessage);
};

let renderVideo = (stream) => {
    videoEl.srcObject = stream;
};

// Register with the peer server
let peer = new Peer({
    host: '/',
    path: '/peerjs/myapp'
});
peer.on('open', (id) => {
    logMessage('My peer ID is: ' + id);
    console.log("Peer ID: " + id);
    console.log(typeof (id));
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

// Handle incoming data connection
peer.on('connection', (conn) => {
    logMessage('incoming peer connection!');
    conn.on('data', (data) => {
        logMessage(`received: ${data}`);
    });
    conn.on('open', () => {
        conn.send('--> User Connected.');
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
            console.error('Failed to get local stream', err);
        });
});

// fetch the peers data.

const tableView = document.getElementById("display");
let msgNode = document.createElement("table");
msgNode.innerHTML = "<tr><th>Name</th><th>Peer</th><th>Last Online</th></tr>";


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
                removeAllChildNodes(display);
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


setInterval(() => {
    loadData();
    console.log("API Refreshing..");
}, 2000);




function addmessageToList(message) {
    msgNode.innerHTML += `<tr><td>${message.email.replace("@gmail.com", "")}</td><td><button type="button" class="btn btn-success" onclick='connectPeer("${message.peer}");'>Paste</button></td><td>${message.time}</td></tr>`;
    display.appendChild(msgNode);
}
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}




// Initiate outgoing connection
let connectToPeer = () => {
    let peerId = peerIdEl.value;
    logMessage(`Connecting to ${peerId}...`);

    let conn = peer.connect(peerId);
    conn.on('data', (data) => {
        logMessage(`received: ${data}`);
    });
    conn.on('open', () => {
        conn.send('--> User Connected.');
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            let call = peer.call(peerId, stream);
            call.on('stream', renderVideo);
        })
        .catch((err) => {
            logMessage('Failed to get local stream', err);
        });
};



window.connectToPeer = connectToPeer;
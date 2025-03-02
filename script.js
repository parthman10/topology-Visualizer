// Function to draw a dotted line between two nodes
function drawDottedLine(node1, node2) {
    const container = document.getElementById('topologyContainer');
    const line = document.createElement('div');
    line.classList.add('dotted-line');

    const node1Rect = node1.getBoundingClientRect();
    const node2Rect = node2.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const startX = node1Rect.left - containerRect.left + node1.offsetWidth / 2;
    const startY = node1Rect.top - containerRect.top + node1.offsetHeight / 2;
    const endX = node2Rect.left - containerRect.left + node2.offsetWidth / 2;
    const endY = node2Rect.top - containerRect.top + node2.offsetHeight / 2;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    line.style.width = `${distance}px`;
    line.style.left = `${startX}px`;
    line.style.top = `${startY}px`;

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    line.style.transform = `rotate(${angle}deg)`;

    container.appendChild(line);
}

// Function to draw topology connections
function drawTopologyLines(topologyType) {
    const nodes = document.querySelectorAll('.node');

    // Clear previous lines
    document.querySelectorAll('.dotted-line').forEach(line => line.remove());

    if (topologyType === 'star') {
        const server = document.getElementById('server');
        nodes.forEach(node => {
            if (node !== server) drawDottedLine(server, node);
        });
    } else if (topologyType === 'mesh') {
        nodes.forEach((node1, i) => {
            nodes.forEach((node2, j) => {
                if (i < j) drawDottedLine(node1, node2);
            });
        });
    } else if (topologyType === 'ring') {
        for (let i = 0; i < nodes.length; i++) {
            drawDottedLine(nodes[i], nodes[(i + 1) % nodes.length]);
        }
    }
}

// Create nodes and draw topology
function createTopology() {
    const numNodes = document.getElementById('numNodes').value;
    const topologyType = document.getElementById('topologyType').value;
    const container = document.getElementById('topologyContainer');
    container.innerHTML = '';

    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 50;

    if (topologyType === 'star') {
        const serverNode = document.createElement('div');
        serverNode.classList.add('node');
        serverNode.textContent = 'Server';
        serverNode.id = 'server';
        serverNode.style.left = `${centerX - 35}px`;
        serverNode.style.top = `${centerY - 35}px`;
        container.appendChild(serverNode);
    }

    for (let i = 0; i < numNodes; i++) {
        const node = document.createElement('div');
        node.classList.add('node');
        node.id = `node-${i}`;
        node.textContent = i === 0 ? 'Sender' : i === numNodes - 1 ? 'Receiver' : `Node ${i + 1}`;
        container.appendChild(node);

        const angle = (2 * Math.PI / numNodes) * i;
        node.style.left = `${centerX + radius * Math.cos(angle) - 35}px`;
        node.style.top = `${centerY + radius * Math.sin(angle) - 35}px`;
    }

    drawTopologyLines(topologyType);
    setupTransferOptions(numNodes);
}

function setupTransferOptions(numNodes) {
    const transferOptions = document.getElementById('transferOptions');
    transferOptions.innerHTML = '';

    const sourceSelect = document.createElement('select');
    sourceSelect.id = 'sourceNode';
    const destinationSelect = document.createElement('select');
    destinationSelect.id = 'destinationNode';

    for (let i = 0; i < numNodes; i++) {
        const option = document.createElement('option');
        option.value = `node-${i}`;
        option.textContent = `Node ${i + 1}`;
        sourceSelect.appendChild(option.cloneNode(true));
        destinationSelect.appendChild(option);
    }

    transferOptions.appendChild(document.createTextNode('Transfer from: '));
    transferOptions.appendChild(sourceSelect);
    transferOptions.appendChild(document.createTextNode(' to: '));
    transferOptions.appendChild(destinationSelect);

    const transferButton = document.createElement('button');
    transferButton.textContent = 'Transmit Data';
    transferButton.onclick = handleDataTransmission;
    transferOptions.appendChild(transferButton);
}

function handleDataTransmission() {
    const topologyType = document.getElementById('topologyType').value;
    if (topologyType === 'star') {
        transmitDataBetweenNodes();
    } else if (topologyType === 'ring') {
        transmitDataInRing();
    } else if (topologyType === 'mesh') {
        transmitDataInMesh();
    }
}

// Star topology: Node → Server → Node
function transmitDataBetweenNodes() {
    const sourceNodeId = document.getElementById('sourceNode').value;
    const destinationNodeId = document.getElementById('destinationNode').value;
    const serverNode = document.getElementById('server');
    const packet = createPacket(sourceNodeId);

    if (sourceNodeId === destinationNodeId) {
        alert('Source and destination cannot be the same!');
        packet.remove();
        return;
    }

    const sourceNode = document.getElementById(sourceNodeId);
    const destinationNode = document.getElementById(destinationNodeId);

    const sourceLabel = sourceNode.textContent;
    const destinationLabel = destinationNode.textContent;

    // Move packet from Source → Server
    movePacket(packet, sourceNodeId, 'server', () => {
        // Move packet from Server → Destination
        movePacket(packet, 'server', destinationNodeId, () => {
            alert(`Data successfully transferred from ${sourceLabel} → Server → ${destinationLabel}`);
            packet.remove();
        });
    });
}


// Ring topology: Node → Node → ... → Destination
function transmitDataInRing() {
    const sourceNode = document.getElementById('sourceNode').value;
    const destinationNode = document.getElementById('destinationNode').value;
    const nodes = Array.from(document.querySelectorAll('.node:not(#server)'));
    const packet = createPacket(sourceNode);

    let currentIndex = nodes.indexOf(document.getElementById(sourceNode));
    const destinationIndex = nodes.indexOf(document.getElementById(destinationNode));

    let path = [];
    while (currentIndex !== destinationIndex) {
        path.push(nodes[currentIndex]);
        currentIndex = (currentIndex + 1) % nodes.length;
    }
    path.push(document.getElementById(destinationNode));

    moveAlongPath(packet, path);
}

// Mesh topology: direct node-to-node along lines
function transmitDataInMesh() {
    const sourceNode = document.getElementById('sourceNode').value;
    const destinationNode = document.getElementById('destinationNode').value;
    const packet = createPacket(sourceNode);

    const path = [document.getElementById(sourceNode), document.getElementById(destinationNode)];

    moveAlongPath(packet, path);
}

// Helper functions
function createPacket(startNode) {
    const packet = document.createElement('div');
    packet.classList.add('data-packet');
    document.getElementById('topologyContainer').appendChild(packet);

    const startElement = document.getElementById(startNode);
    movePacket(packet, startNode, startNode);
    return packet;
}

function movePacket(packet, fromNode, toNode, callback) {
    const fromElement = document.getElementById(fromNode);
    const toElement = document.getElementById(toNode);
    const containerRect = document.getElementById('topologyContainer').getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    packet.style.left = `${toRect.left - containerRect.left + toElement.offsetWidth / 2}px`;
    packet.style.top = `${toRect.top - containerRect.top + toElement.offsetHeight / 2}px`;

    setTimeout(() => callback && callback(), 600);
}

function moveAlongPath(packet, path) {
    let delay = 0;
    path.forEach((node, i) => {
        setTimeout(() => {
            movePacket(packet, node.id, node.id);
            if (i === path.length - 1) {
                setTimeout(() => {
                    alert(`Data transferred through: ${path.map(n => n.textContent).join(' → ')}`);
                    packet.remove();
                }, 600);
            }
        }, delay);
        delay += 600;
    });
}

// Add a button for transmitting through all nodes
function setupTransferOptions(numNodes) {
    const transferOptions = document.getElementById('transferOptions');
    transferOptions.innerHTML = '';

    const sourceSelect = document.createElement('select');
    sourceSelect.id = 'sourceNode';
    const destinationSelect = document.createElement('select');
    destinationSelect.id = 'destinationNode';

    for (let i = 0; i < numNodes; i++) {
        const option = document.createElement('option');
        option.value = `node-${i}`;
        option.textContent = `Node ${i + 1}`;
        sourceSelect.appendChild(option.cloneNode(true));
        destinationSelect.appendChild(option);
    }

    transferOptions.appendChild(document.createTextNode('Transfer from: '));
    transferOptions.appendChild(sourceSelect);
    transferOptions.appendChild(document.createTextNode(' to: '));
    transferOptions.appendChild(destinationSelect);

    const transferButton = document.createElement('button');
    transferButton.textContent = 'Transmit Data';
    transferButton.onclick = handleDataTransmission;
    transferOptions.appendChild(transferButton);

    const broadcastButton = document.createElement('button');
    broadcastButton.textContent = 'Transmit through All Nodes';
    broadcastButton.onclick = transmitThroughAllNodes;
    transferOptions.appendChild(broadcastButton);
}

// Handle transmission through all nodes
function transmitThroughAllNodes() {
    const topologyType = document.getElementById('topologyType').value;
    if (topologyType === 'star') {
        broadcastInStar();
    } else if (topologyType === 'mesh') {
        broadcastInMesh();
    } else if (topologyType === 'ring') {
        broadcastInRing();
    }
}

// Star topology broadcast: Server sends packets to all nodes
function broadcastInStar() {
    const serverNode = document.getElementById('server');
    const nodes = Array.from(document.querySelectorAll('.node:not(#server)'));

    nodes.forEach(node => {
        const packet = createPacket('server');
        movePacket(packet, 'server', node.id, () => {
            setTimeout(() => packet.remove(), 600);
        });
    });

    alert('Data broadcasted to all nodes through Server.');
}

// Mesh topology broadcast: every node sends packets to all others
function broadcastInMesh() {
    const nodes = Array.from(document.querySelectorAll('.node'));

    nodes.forEach(sourceNode => {
        nodes.forEach(targetNode => {
            if (sourceNode !== targetNode) {
                const packet = createPacket(sourceNode.id);
                movePacket(packet, sourceNode.id, targetNode.id, () => {
                    setTimeout(() => packet.remove(), 600);
                });
            }
        });
    });

    alert('Data broadcasted to all nodes directly.');
}

// Ring topology broadcast: packets move sequentially through all nodes
function broadcastInRing() {
    const nodes = Array.from(document.querySelectorAll('.node:not(#server)'));
    const packetCount = nodes.length;

    nodes.forEach((_, i) => {
        const packet = createPacket(nodes[i].id);
        let path = [];
        for (let j = 0; j < nodes.length; j++) {
            path.push(nodes[(i + j) % nodes.length]);
        }
        moveAlongPath(packet, path);
    });

    alert('Data broadcasted sequentially through the ring.');
}


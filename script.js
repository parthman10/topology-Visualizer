function createTopology() {
    const numNodes = document.getElementById('numNodes').value;
    const topologyType = document.getElementById('topologyType').value;
    const container = document.getElementById('topologyContainer');
    container.innerHTML = '';

    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 50;

    for (let i = 0; i < numNodes; i++) {
        const node = document.createElement('div');
        node.classList.add('node');
        node.textContent = i === 0 ? 'Sender' : (i == numNodes - 1) ? 'Receiver' : `Node ${i}`;
        node.id = `node-${i}`;
        container.appendChild(node);

        if (topologyType === 'star') {
            if (i === 0) {
                node.style.left = `${centerX - 35}px`;
                node.style.top = `${centerY - 35}px`;
            } else {
                const angle = (2 * Math.PI / (numNodes - 1)) * (i - 1);
                node.style.left = `${centerX + radius * Math.cos(angle) - 35}px`;
                node.style.top = `${centerY + radius * Math.sin(angle) - 35}px`;
            }
        } else if (topologyType === 'mesh') {
            const rows = Math.ceil(Math.sqrt(numNodes));
            const cols = Math.ceil(numNodes / rows);
            const stepX = container.offsetWidth / cols;
            const stepY = container.offsetHeight / rows;
            const x = (i % cols) * stepX + stepX / 2 - 35;
            const y = Math.floor(i / cols) * stepY + stepY / 2 - 35;
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
        } else if (topologyType === 'ring') {
            const angle = (2 * Math.PI / numNodes) * i;
            node.style.left = `${centerX + radius * Math.cos(angle) - 35}px`;
            node.style.top = `${centerY + radius * Math.sin(angle) - 35}px`;
        }
    }

    document.getElementById('transmitButton').disabled = false;
}

function transmitData() {
    const nodes = document.querySelectorAll('.node');
    const packet = document.createElement('div');
    packet.classList.add('data-packet');
    document.getElementById('topologyContainer').appendChild(packet);

    let currentNode = 0;

    function movePacket() {
        if (currentNode < nodes.length) {
            const node = nodes[currentNode];
            const nodeRect = node.getBoundingClientRect();
            const containerRect = document.getElementById('topologyContainer').getBoundingClientRect();
            const offsetX = nodeRect.left - containerRect.left + node.offsetWidth / 2 - packet.offsetWidth / 2;
            const offsetY = nodeRect.top - containerRect.top + node.offsetHeight / 2 - packet.offsetHeight / 2;
            packet.style.left = `${offsetX}px`;
            packet.style.top = `${offsetY}px`;
            currentNode++;
            setTimeout(movePacket, 600);
        } else {
            setTimeout(() => {
                alert('Data is successfully reached!');
                packet.remove();
            }, 600);
        }
    }

    movePacket();
}

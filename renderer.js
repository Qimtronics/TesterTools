console.log('renderer.js loaded');

const atgBuffer = [];
const beaconBuffer = [];
const MAX_BUF = 20;

function fifoPush(buf, text) {
  buf.push(text);
  if (buf.length > MAX_BUF) buf.shift();
}

function startRenderer(el, getter) {
  setInterval(() => {
    el.textContent = getter().join('\n');
  }, 100);
}

async function loadPorts() {
  const ports = await window.api.listPorts();

  portAtg.innerHTML = '';
  portBeacon.innerHTML = '';

  ports.forEach(p => {
    const label = `${p.path} ${p.manufacturer}`;

    const opt1 = new Option(label, p.path);
    const opt2 = new Option(label, p.path);

    portAtg.add(opt1);
    portBeacon.add(opt2);
  });
}

window.onload = () => {
  loadPorts();
  refreshBtn.onclick = loadPorts;
};

window.addEventListener('DOMContentLoaded', () => {
  const monAtg = document.getElementById('termAtg');
  const monBeacon = document.getElementById('termBeacon');

  startRenderer(monAtg, () => atgBuffer);
  startRenderer(monBeacon, () => beaconBuffer);

  window.api.onATGData(line => {
    //console.log('ATG:', line);
    fifoPush(atgBuffer, line.trim());
    // parseAtg(line);
  });

  window.api.onBeaconData(line => {
    fifoPush(beaconBuffer, line.trim());
    // parseBeacon(line);
  });

});

connectAtg.onclick = () => {
  window.api.connectATG({
    path: portAtg.value,
    baud: parseInt(baudAtg.value)
  });
};

connectBeacon.onclick = () => {
  window.api.connectBeacon({
    path: portBeacon.value,
    baud: parseInt(baudBeacon.value)
  });
};


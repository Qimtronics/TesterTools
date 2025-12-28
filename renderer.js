console.log('renderer.js loaded');

let atgConnected = false;
let beaconConnected = false;
const atgBuffer = [];
const beaconBuffer = [];
const MAX_BUF = 20;

let labelConnATG = document.getElementById('atgConn');
let labelConnBeacon = document.getElementById('beaconConn');

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

function parseBeacon(str){
  if(!str.includes('Raw Volt|Percent		:')) 
  {
    console.log('Beacon parse failed for string:', str);
    return false;
  }

  console.log('Beacon parse OK for string:', str);
  const m=str.match(/Raw\s+Volt\|Percent.*?:\s*(\d+)/i);

  if(!m) 
  {
    labelConnBeacon.innerText='Data Received';
    return false;
  }

  beaconVal=parseFloat(m[1])/100;
  document.getElementById('beaconVolt').innerText=beaconVal;
  labelConnBeacon.className='status green';
  labelConnBeacon.innerText='Data Parsed';
  return true;
}

function parseAtg(str){
  if(!str.includes('(Volt)')) 
  {
    return false;
  }
  
  const m=str.match(/\(Volt\)\s*([0-9.]+)/);

  if(!m) 
  {
    labelConnATG.innerText='Data Received';
    return false;
  }

  atgVal=parseFloat(m[1]);
  document.getElementById('atgVolt').innerText=atgVal;
  labelConnATG.className='status green';
  labelConnATG.innerText='Data Parsed';
  return true;
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
    //labelConnATG.innerText='Data Received';
    parseAtg(line.trim());
    // parseAtg(line);
  });

  window.api.onBeaconData(line => {
    fifoPush(beaconBuffer, line.trim());
    //labelConnBeacon.innerText='Data Received';
    parseBeacon(line.trim());
    // parseBeacon(line);
  });

});

connectAtg.onclick = async () => {
  const ok = await window.api.connectATG({
    path: portAtg.value,
    baud: parseInt(baudAtg.value)
  });

  if (ok) {
    atgConnected = true;
    disconnectAtg.disabled = false;
    disconnectAtg.style.background = 'var(--blue)';
    connectAtg.disabled = true;
    connectAtg.style.background = '#374151';
  }
};

disconnectAtg.onclick = async () => {
  if (!atgConnected) return;

  await window.api.disconnectATG();
  atgConnected = false;

  disconnectAtg.disabled = true;
  disconnectAtg.style.background = '#374151';
  connectAtg.disabled = false;
  connectAtg.style.background = 'var(--blue)';

  labelConnATG.className='status gray';
  labelConnATG.innerText='Data Stopped';
};


connectBeacon.onclick = async () => {
  const ok = await window.api.connectBeacon({
    path: portBeacon.value,
    baud: parseInt(baudBeacon.value)
  });

  if (ok) {
    beaconConnected = true;
    disconnectBeacon.disabled = false;
    disconnectBeacon.style.background = 'var(--blue)';
    connectBeacon.disabled = true;
    connectBeacon.style.background = '#374151';
  }
};

disconnectBeacon.onclick = async () => {
  if (!beaconConnected) return;

  await window.api.disconnectBeacon();
  beaconConnected = false;  

  disconnectBeacon.disabled = true;
  disconnectBeacon.style.background = '#374151';
  connectBeacon.disabled = false;
  connectBeacon.style.background = 'var(--blue)';

  labelConnBeacon.className='status gray';
  labelConnBeacon.innerText='Data Stopped';
};

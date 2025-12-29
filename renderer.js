console.log('renderer.js loaded');

let atgConnected = false;
let beaconConnected = false;

const atgBuffer = [];
const beaconBuffer = [];
const MAX_BUF = 20;

let labelConnATG = document.getElementById('atgConn');
let labelConnBeacon = document.getElementById('beaconConn');

let getLowerTestStatus = document.getElementById('lowSt');
let getMiddleTestStatus = document.getElementById('midSt');
let getUpperTestStatus = document.getElementById('upSt');

let lowTest = 0;
let midTest = 0;
let topTest = 0;
let atgVal=null;
let atgLow=null, atgMid=null, atgUp=null;

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

document.getElementById('checkValue').onclick=()=>{
  let rangeMin = 0;
  let rangeMax = 0;
  const isValidHex = /^[0-9a-fA-F]+$/.test(hexInput.value);
  
  if (isValidHex) {
    userVal=parseInt(hexInput.value,16)/100;
    hexResult.value=userVal;

    const getSelecteTypeTest = document.querySelector('input[name="testType"]:checked');
    if(getSelecteTypeTest !== null){

      console.log('Selected Test Type:', getSelecteTypeTest);

      if(getSelecteTypeTest.value==='low' && (getLowerTestStatus.innerText='-')){
        getLowerTestStatus.className='status green'; 
        getLowerTestStatus.innerText='DONE';
        atgLow=atgVal;

        rangeMin = atgLow * 0.99;
        rangeMax = atgLow * 1.01;

        if(((userVal >= rangeMin) && (userVal <= rangeMax)) && ((beaconVal >= rangeMin) && (beaconVal <= rangeMax)))
        {
          lowTest = 1;
        }
      }
      else if(getSelecteTypeTest.value==='mid' && (getMiddleTestStatus.innerText='-') && (getLowerTestStatus.innerText==='DONE')){
        getMiddleTestStatus.className='status green'; 
        getMiddleTestStatus.innerText='DONE'; 
        atgMid=atgVal;

        rangeMin = atgMid * 0.99;
        rangeMax = atgMid * 1.01;

        if(((userVal >= rangeMin) && (userVal <= rangeMax)) && ((beaconVal >= rangeMin) && (beaconVal <= rangeMax)))
        {
          midTest = 1;
        }
      }
      else if(getSelecteTypeTest.value==='up' && (getUpperTestStatus.innerText='-') && (getLowerTestStatus.innerText==='DONE') && (getMiddleTestStatus.innerText==='DONE')){
        getUpperTestStatus.className='status green';  
        getUpperTestStatus.innerText='DONE';
        atgUp=atgVal;

        rangeMin = atgUp * 0.99;
        rangeMax = atgUp * 1.01;

        if(((userVal >= rangeMin) && (userVal <= rangeMax)) && ((beaconVal >= rangeMin) && (beaconVal <= rangeMax)))
        {
          topTest = 1;
        }
      }
      else{
        hexResult.value='start from Lower Level';
      }
    }
    else
    {
      console.log('No seelected Test Type:', getSelecteTypeTest);
      hexResult.value='Select Test Type';
    }
  }
  else {
    hexResult.value='Invalid Hex';
  }
};

document.getElementById('testData').onclick=()=>{
  //const ok=(atgVal===beaconVal && beaconVal===userVal);
  const ok=(lowTest===1 && midTest===1 && topTest===1);
  ['stComm','stBeacon'].forEach(id=>{
    const el=document.getElementById(id);
    el.className='status '+(ok?'green':'red');
    el.innerText=ok?'SUCCESS':'FAIL';
  });
  // const sel=document.querySelector('input[name=test]:checked')?.value;
  // if(sel==='low'){ atgLow=atgVal; lowSt.className='status green'; }
  // if(sel==='mid'){ atgMid=atgVal; midSt.className='status green'; }
  // if(sel==='up'){ atgUp=atgVal; upSt.className='status green'; }
  if(atgLow!==null && atgMid!==null && atgUp!==null){
    stSensor.className='status '+((atgLow<atgMid && atgMid<atgUp)?'green':'red');
    stSensor.innerText=(atgLow<atgMid && atgMid<atgUp)?'SUCCESS':'FAIL';
  }
};

document.getElementById('ResetTest').onclick=()=>{
  getLowerTestStatus.className='status gray'; 
  getLowerTestStatus.innerText='-';
  getMiddleTestStatus.className='status gray'; 
  getMiddleTestStatus.innerText='-';
  getUpperTestStatus.className='status gray'; 
  getUpperTestStatus.innerText='-';
  atgLow = null;
  atgMid = null;
  atgUp = null;
  stSensor.className='status gray'; 
  stSensor.innerText='Status';
  stComm.className='status gray'; 
  stComm.innerText='Status';
  stBeacon.className='status gray'; 
  stBeacon.innerText='Status';
};
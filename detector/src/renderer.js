const card = document.querySelector('.card');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const checkBtn = document.getElementById('checkBtn');
const statusPanel = document.getElementById('statusPanel');
const statusText = document.getElementById('statusText');
const details = document.getElementById('details');

const bridge =
  window.detectorAPI &&
  typeof window.detectorAPI.startMonitoring === 'function' &&
  typeof window.detectorAPI.getServerStatus === 'function' &&
  typeof window.detectorAPI.scanNow === 'function' &&
  typeof window.detectorAPI.stopMonitoring === 'function'
    ? window.detectorAPI
    : null;

let currentPort = null;
let latestNetworkBlock = { applied: false };
const autoScanIntervalRef = { current: null };
const scanInFlightRef = { current: false };

const setCardMode = ({ running = false, suspicious = false }) => {
  card.classList.toggle('running', running && !suspicious);
  card.classList.toggle('suspicious', suspicious);
};

const describeFinding = (finding) => {
  if (!finding) return '';
  const signature = finding.match?.signature || '';
  const name = finding.name || '';
  if (signature && name) {
    return `${signature} (${name})`;
  }
  return signature || name;
};

const describeNetworkBlock = (block) => {
  if (!block) return '';
  if (block.error) {
    return `Network block error: ${block.error}.`;
  }
  if (block.applied) {
    const location = block.path ? ` (${block.path})` : '';
    const flushInfo = block.flush?.success
      ? ` DNS flushed via ${block.flush.command}.`
      : block.flush?.command === null
      ? ' DNS flush command unavailable.'
      : '';
    return `Network block active for reddit.com${location}.${flushInfo}`;
  }
  if (block.reason === 'removed' || block.reason === 'not_blocked') {
    return 'Network block disabled.';
  }
  return '';
};

const updateDetails = (baseText) => {
  const networkText = describeNetworkBlock(latestNetworkBlock);
  details.textContent = networkText ? `${baseText} ${networkText}` : baseText;
};

const applyBridgeErrorState = () => {
  stopAutoScan();
  currentPort = null;
  setCardMode({ running: false, suspicious: false });
  statusPanel.hidden = false;
  statusText.textContent = 'Initialization Error';
  details.textContent = 'Desktop bridge unavailable. Restart the app or reinstall.';
  startBtn.disabled = true;
  startBtn.textContent = 'Unavailable';
  startBtn.hidden = false;
  if (stopBtn) {
    stopBtn.hidden = true;
    stopBtn.disabled = false;
    stopBtn.textContent = 'Stop Monitoring';
  }
  if (checkBtn) {
    checkBtn.hidden = true;
  }
};

const applyIdleState = () => {
  stopAutoScan();
  currentPort = null;
  setCardMode({ running: false, suspicious: false });
  statusPanel.hidden = false;
  statusText.textContent = 'Monitoring Idle';
  updateDetails('Press “Start Monitoring” to launch the detection API.');
  startBtn.disabled = false;
  startBtn.textContent = 'Start Monitoring';
  startBtn.hidden = false;
  if (stopBtn) {
    stopBtn.hidden = true;
    stopBtn.disabled = false;
    stopBtn.textContent = 'Stop Monitoring';
  }
  if (checkBtn) {
    checkBtn.hidden = true;
    checkBtn.disabled = true;
  }
};

const stopAutoScan = () => {
  if (autoScanIntervalRef.current) {
    clearInterval(autoScanIntervalRef.current);
    autoScanIntervalRef.current = null;
  }
};

const applyScanResult = (scan) => {
  const flaggedCount = Number.isFinite(scan?.flaggedProcessCount)
    ? Number(scan.flaggedProcessCount)
    : Array.isArray(scan?.findings)
    ? scan.findings.length
    : 0;
  const suspicious = flaggedCount > 0;

  setCardMode({ running: true, suspicious });
  statusPanel.hidden = false;

  if (suspicious) {
    const example = describeFinding(scan.findings?.[0]);
    const exampleText = example ? ` Example: ${example}.` : '';
    statusText.textContent = 'Cheating Suspected';
    updateDetails(`Detected ${flaggedCount} suspicious process${flaggedCount === 1 ? '' : 'es'}.${exampleText}`);
  } else {
    statusText.textContent = 'Monitoring Active';
    const time = scan?.timestamp ? new Date(scan.timestamp).toLocaleTimeString() : 'recently';
    const linkText = currentPort ? ` API http://localhost:${currentPort}` : '';
    updateDetails(`No suspicious apps detected. Last scan ${time}.${linkText ? ` ${linkText}` : ''}`);
  }
};

const renderStatus = (status) => {
  if (status?.networkBlock) {
    latestNetworkBlock = status.networkBlock;
  }

  if (!status || !status.running) {
    stopAutoScan();
    applyIdleState();
    return;
  }

  currentPort = status.port || currentPort;
  startBtn.disabled = true;
  startBtn.hidden = true;
  if (stopBtn) {
    stopBtn.hidden = false;
    stopBtn.disabled = false;
    stopBtn.textContent = 'Stop Monitoring';
  }
  setCardMode({ running: true, suspicious: false });
  statusPanel.hidden = false;
  statusText.textContent = 'Monitoring Active';
  updateDetails('Press “Check Status” to run a scan on demand.');

  if (checkBtn) {
    checkBtn.hidden = false;
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check Status';
  }

  if (status.lastScanResult) {
    applyScanResult({
      ...status.lastScanResult,
      cached: true,
      cacheAgeMs: status.lastScanTimestamp ? Math.max(0, Date.now() - status.lastScanTimestamp) : 0,
      cacheWindowMs: status.cacheWindowMs ?? 0,
    });
  }

  startAutoScan();
};

const requestStatus = async () => {
  if (!bridge) {
    applyBridgeErrorState();
    return;
  }

  try {
    const status = await bridge.getServerStatus();
    renderStatus(status);
  } catch (error) {
    console.error('Failed to fetch status', error);
    setCardMode({ running: false, suspicious: false });
    statusPanel.hidden = false;
    statusText.textContent = 'Status Error';
    details.textContent = `Unable to reach monitoring service: ${error.message || error}`;
  }
};

const executeScan = async (manual = false) => {
  if (!bridge || scanInFlightRef.current) {
    if (!bridge) {
      applyBridgeErrorState();
    }
    return;
  }

  scanInFlightRef.current = true;

  if (manual && checkBtn) {
    checkBtn.hidden = false;
    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking...';
  }

  if (manual) {
    statusPanel.hidden = false;
    statusText.textContent = 'Running Scan...';
    updateDetails('Scanning running processes for camera manipulation tools.');
  }

  try {
    const result = await bridge.scanNow();
    applyScanResult(result);
  } catch (error) {
    console.error('Scan failed:', error);
    if (manual) {
      setCardMode({ running: true, suspicious: false });
      statusPanel.hidden = false;
      const message = error?.message || String(error);
      statusText.textContent = 'Monitoring Active (error)';
      updateDetails(`Scan failed: ${message}`);
      if (message && message.toLowerCase().includes('not running')) {
        await requestStatus();
      }
    }
  } finally {
    scanInFlightRef.current = false;
    if (manual && checkBtn) {
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Status';
    }
  }
};

const startAutoScan = () => {
  if (autoScanIntervalRef.current) {
    return;
  }
  const tick = () => {
    executeScan(false);
  };
  tick();
  autoScanIntervalRef.current = setInterval(tick, 2000);
};

startBtn.addEventListener('click', async () => {
  if (!bridge) {
    applyBridgeErrorState();
    return;
  }

  startBtn.disabled = true;
  startBtn.textContent = 'Starting...';

  try {
    const status = await bridge.startMonitoring();
    renderStatus(status);
    startAutoScan();
  } catch (error) {
    console.error('Failed to start monitoring', error);
    startBtn.disabled = false;
    startBtn.hidden = false;
    startBtn.textContent = 'Start Monitoring';
    statusPanel.hidden = false;
    statusText.textContent = 'Startup Error';
    updateDetails(`Failed to start monitoring: ${error.message || error}`);
  }
});

if (checkBtn) {
  checkBtn.addEventListener('click', async () => {
    await executeScan(true);
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', async () => {
    if (!bridge) {
      applyBridgeErrorState();
      return;
    }
    stopBtn.disabled = true;
    stopBtn.textContent = 'Stopping...';
    statusPanel.hidden = false;
    statusText.textContent = 'Stopping Monitoring...';
    updateDetails('Shutting down detection service.');
    try {
      const status = await bridge.stopMonitoring();
      if (status?.networkBlock) {
        latestNetworkBlock = status.networkBlock;
      }
      stopAutoScan();
      applyIdleState();
      updateDetails('Monitoring stopped.');
    } catch (error) {
      console.error('Failed to stop monitoring', error);
      const message = error?.message || String(error);
      statusText.textContent = 'Stop Error';
      updateDetails(`Failed to stop monitoring: ${message}`);
      stopBtn.disabled = false;
      stopBtn.textContent = 'Stop Monitoring';
    }
  });
}

if (!bridge) {
  applyBridgeErrorState();
} else {
  applyIdleState();
  requestStatus();
}

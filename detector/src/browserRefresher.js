import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const kill_commands = {
  win32: [
    'taskkill /F /IM chrome.exe',
    'taskkill /F /IM msedge.exe',
    'taskkill /F /IM firefox.exe',
    'taskkill /F /IM opera.exe'
  ],
  darwin: [
    'killall -9 "Google Chrome"',
    'killall -9 "Google Chrome Canary"',
    'killall -9 "Safari"',
    'killall -9 "Firefox"',
    'killall -9 "Opera"',
    'killall -9 "Microsoft Edge"'
  ],
  linux: [
    'pkill -f chrome',
    'pkill -f chromium',
    'pkill -f firefox',
    'pkill -f opera'
  ]
};

export async function refreshBrowsers() {
  const commands = kill_commands[process.platform] || [];
  for (const cmd of commands) {
    try {
      await execAsync(cmd);
    } catch (error) {
      // ignore
    }
  }
}

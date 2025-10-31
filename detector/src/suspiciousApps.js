export const SUSPICIOUS_PROCESS_SIGNATURES = [
  {
    label: 'OBS Virtual Camera',
    patterns: ['obs64', 'obs32', 'obs', 'obs-virtualcam']
  },
  {
    label: 'Snap Camera',
    patterns: ['snap camera', 'snapcamera']
  },
  {
    label: 'ManyCam',
    patterns: ['manycam']
  },
  {
    label: 'YouCam',
    patterns: ['youcam']
  },
  {
    label: 'CamTwist',
    patterns: ['camtwist']
  },
  {
    label: 'XSplit',
    patterns: ['xsplit', 'xsplitvcam']
  },
  {
    label: 'vMix Video',
    patterns: ['vmix', 'vmixvcam']
  },
  {
    label: 'AlterCam',
    patterns: ['altercam']
  },
  {
    label: 'Logitech Capture',
    patterns: ['logi capture', 'logitechcapture', 'logicapture']
  },
  {
    label: 'Virtual Webcam Generic',
    patterns: ['virtual camera', 'virtualcam', 'vcam', 'fakecam']
  },
  {
    label: 'NDI Tools',
    patterns: ['ndi', 'scanconverter']
  },
  {
    label: 'ManyCam Service',
    patterns: ['mcam']
  },
  {
    label: 'Calculator',
    patterns: ['Calculator']
  }
];

export const DEFAULT_SCAN_CONFIG = {
  includeCommandLine: true,
  matchesRequired: 1,
  minimumConfidence: 0.5,
};

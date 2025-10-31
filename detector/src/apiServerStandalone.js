import { startApiServer } from './apiServer.js';

startApiServer()
  .then((context) => {
    const { port } = context.getStatus();
    console.log(`API server running on port ${port}`);
  })
  .catch((error) => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });

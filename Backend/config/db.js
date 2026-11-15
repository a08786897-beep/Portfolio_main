const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  const configuredUri = process.env.MONGO_URI;
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/portfolio';

  async function connectWithUri(uri, label) {
    await mongoose.connect(uri);
    console.info(`Database connected successfully${label ? ` ${label}` : ''}.`);
  }

  const uri = configuredUri || defaultLocalUri;
  const label = configuredUri ? 'using the configured MongoDB URI' : 'using the local MongoDB service';
  try {
    await connectWithUri(uri, label);
    return;
  } catch {
    console.warn(configuredUri
      ? 'Configured MongoDB URI is unavailable.'
      : 'Local MongoDB service is unavailable.');
  }

  if (process.env.ALLOW_IN_MEMORY_DATABASE !== 'true') {
    throw new Error(
      'Unable to connect to MongoDB. Configure a reachable MONGO_URI or start the local MongoDB service. ' +
      'Set ALLOW_IN_MEMORY_DATABASE=true only for disposable development data.'
    );
  }

  if (!memoryServer) {
    console.warn('Persistent MongoDB is unavailable; using in-memory MongoDB. Data will be lost when the process exits.');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'portfolio'
      }
    });
  }

  await connectWithUri(memoryServer.getUri(), 'using in-memory MongoDB');
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}

module.exports = connectDB;
module.exports.disconnect = disconnectDB;

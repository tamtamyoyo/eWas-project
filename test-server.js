// Simple HTTP server to test if port 5000 is available
import http from 'http';

const port = 5000;
const host = '127.0.0.1';

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World! Server is working.\n');
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 
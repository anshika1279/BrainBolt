const redis = require('redis');

const client = redis.createClient({
  host: 'localhost',
  port: 6379,
});

client.on('error', (err) => {
  console.error('Redis error:', err);
  process.exit(1);
});

client.connect().then(() => {
  // Clear rate limit keys
  const patterns = [
    'ratelimit:quiz-next:*',
    'ratelimit:quiz-answer:*',
  ];

  let cleared = 0;
  Promise.all(patterns.map(pattern => 
    client.sendCommand(['EVAL', `return redis.call('del', unpack(redis.call('keys', ARGV[1])))`, '0', pattern])
      .then(count => {
        cleared += count || 0;
      })
      .catch(err => console.error('Error clearing', pattern, err))
  )).then(() => {
    console.log(`Cleared ${cleared} rate limit keys from Redis`);
    client.quit();
  });
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

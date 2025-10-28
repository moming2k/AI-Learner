// Test OpenAI API Configuration
// Run: node test-openai.js

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.OPENAI_API_KEY;
const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
const model = process.env.OPENAI_MODEL || 'gpt-5';

console.log('🔧 OpenAI API Test');
console.log('==================');
console.log('API Base URL:', apiBaseUrl);
console.log('Model:', model);
console.log('API Key:', apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : 'NOT SET');

if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'sk-your-openai-key-here') {
  console.error('\n❌ Error: Please set your actual OpenAI API key in .env.local');
  console.log('\n📝 Instructions:');
  console.log('1. Get your API key from: https://platform.openai.com/api-keys');
  console.log('2. Edit .env.local and replace the placeholder with your actual key');
  console.log('3. Run this test again');
  process.exit(1);
}

console.log('\n🚀 Testing OpenAI API connection...\n');

const testMessage = {
  model: model,
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant. Respond with a simple JSON object.'
    },
    {
      role: 'user',
      content: 'Return a JSON object with a single field "status" set to "working".'
    }
  ],
  max_completion_tokens: 100,
  response_format: { type: 'json_object' }
};

if (!model.startsWith('gpt-5')) {
  testMessage.temperature = 0.7;
}

const url = new URL(`${apiBaseUrl}/chat/completions`);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ OpenAI API is working correctly!');
        console.log('\nResponse:', response.choices[0].message.content);
        console.log('\n📊 Usage:');
        console.log(`- Prompt tokens: ${response.usage.prompt_tokens}`);
        console.log(`- Completion tokens: ${response.usage.completion_tokens}`);
        console.log(`- Total tokens: ${response.usage.total_tokens}`);
        console.log('\n🎉 Your OpenAI API is configured and ready to use!');
      } else {
        console.error('❌ OpenAI API Error:', res.statusCode);
        console.error('Response:', response);

        if (res.statusCode === 401) {
          console.log('\n📝 Invalid API key. Please check your key in .env.local');
        } else if (res.statusCode === 429) {
          console.log('\n📝 Rate limit exceeded or quota reached. Check your OpenAI account.');
        } else if (res.statusCode === 404) {
          console.log('\n📝 Model not found. Check that the model name is correct.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('\n📝 Please check:');
  console.log('1. Your internet connection');
  console.log('2. The API base URL in .env.local');
  console.log('3. Any firewall or proxy settings');
});

req.write(JSON.stringify(testMessage));
req.end();

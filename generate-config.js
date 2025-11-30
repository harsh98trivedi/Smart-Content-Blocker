const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'config.js');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/GIPHY_API_KEY=(.*)/);
  
  if (apiKeyMatch && apiKeyMatch[1]) {
    const apiKey = apiKeyMatch[1].trim();
    const configContent = `export const CONFIG = {\n  GIPHY_API_KEY: "${apiKey}"\n};\n`;
    
    fs.writeFileSync(configPath, configContent);
    console.log('Successfully generated config.js from .env');
  } else {
    console.error('GIPHY_API_KEY not found in .env');
  }
} else {
  console.error('.env file not found');
}

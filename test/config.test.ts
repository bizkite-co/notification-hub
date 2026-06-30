import fs from 'fs';
import path from 'path';

test('config loads and has clientAccounts', () => {
  const configPath = path.join(__dirname, '..', 'config', 'config.json');
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  expect(config).toHaveProperty('clientAccounts');
});

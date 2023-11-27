import fs from 'fs';
import crypto from 'crypto';

export default (modPath: string, hash: string) => {
  if (!fs.existsSync(modPath)) {
    return false;
  }

  const modFile = fs.readFileSync(modPath);
  const calculatedHash = crypto
    .createHash('sha1')
    .update(modFile)
    .digest('hex');

  if (calculatedHash !== hash)
    console.warn(modPath, 'was downloaded incorrectly');

  return calculatedHash === hash;
};

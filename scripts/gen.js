const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');
const {
  DATA_PATH,
  OUT_PATH,
  validateConfig,
  getConfig,
  getImagePath,
  getImageUri,
  getAddressImagePath,
  getResourceImagePath,
  getChainId,
} = require('./utils/config');


const loadSupportedSymbols = (basedir) => {
  const files = fs.readdirSync(basedir);
  let symbols = [];
  for (const f of files) {
    const result = validateConfig(f);
    if (!result.valid) {
      console.log(`validation failed for ${f}:`, result.errors);
      continue;
    }

    const config = getConfig(f);

    // make sure config is enabled
    if ('enable' in config && !config.enable) {
      console.log(`config is not enabled, skip ${f}`);
      continue;
    }

    symbols.push(f);
  }
  return symbols;
};


const mkdirIfNeeded = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * generate token list for voltswap with given symbol array
 * @param {Array} symbols
 */
const genSwapTokens = (symbols) => {
  const parsed = version.split('.');
  const tokenList = [];
  for (const sym of symbols) {
    const config = getConfig(sym);

    for (const token of config.tokens) {
      const chainId = getChainId(token.network);
      tokenList.push({
        name: token.name || config.name,
        address: token.address,
        symbol: token.symbol || config.symbol,
        decimals: token.decimals || config.decimals,
        chainId,
        logoURI: getImageUri(sym),
      });
    }
  }

  const swapTokens = {
    name: 'Horus Exchange Default List',
    timestamp: '', //new Date().toISOString(),
    version: {
      major: +parsed[0],
      minor: +parsed[1],
      patch: +parsed[2],
    },
    tags: {},
    logoURI: '', //FIXME: ipfs logo?
    keywords: ['horus', 'default', 'coreDAO'],
    tokens: tokenList
      .filter((t) => t.chainId > 0)
      .sort((t1, t2) => {
        if (t1.chainId === t2.chainId) {
          return t1.symbol.toLowerCase() < t2.symbol.toLowerCase() ? -1 : 1;
        }
        return t1.chainId < t2.chainId ? -1 : 1;
      }),
  };

  const outPath = path.join(OUT_PATH, `swap-tokens.json`);
  fs.writeFileSync(outPath, JSON.stringify(swapTokens, null, 2));
  console.log(`write swap tokens config to ${outPath}`);
};

/**
 * place images in `resource-logos` and `token-logos`
 */
const placeImages = (symbols) => {
  for (const sym of symbols) {
    const config = getConfig(sym);
    const imagePath = getImagePath(sym);
    const resourceImagePath = getResourceImagePath(config.resourceID);
    mkdirIfNeeded(path.dirname(resourceImagePath));
    fs.copyFileSync(imagePath, resourceImagePath);

    for (const token of config.tokens) {
      const addressImagePath = getAddressImagePath(token.network, token.address);
      mkdirIfNeeded(path.dirname(addressImagePath));
      fs.copyFileSync(imagePath, addressImagePath);
    }
  }
};

const symbols = loadSupportedSymbols(DATA_PATH);
console.log(symbols);
genSwapTokens(symbols);
placeImages(symbols);

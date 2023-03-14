const Ajv = require('ajv');
const ajv = new Ajv();

// supported chains
const CHAINS = [
  {
    enum: 'CoreTest',
    chainId: 1115,
    nativeToken: { name: 'CORE', symbol: 'CORE', decimals: 18 },
  },
  {
    enum: 'Core',
    chainId: 1116,
    nativeToken: { name: 'CORE', symbol: 'CORE', decimals: 18 },
  }
];

const tokenSchema = {
  type: 'object',
  properties: {
    network: { enum: CHAINS.map((c) => c.enum) }, // enum for supported network
    address: { type: 'string', pattern: '^0x[0-9a-zA-Z]{40}$' }, // string of 0x + 40 digit/letter

    // chain-specific configs, optional
    name: { type: 'string', pattern: '^[0-9a-zA-Z._ ]{1,100}$' }, // string of 1-100 digit/letter
    symbol: { type: 'string', pattern: '^[0-9a-zA-Z.]{1,9}$' }, // string of 1-9 digit/upper_letter
    decimals: { type: 'number', maximum: 20, minimum: 1 }, // number between 1-20
    native: { type: 'boolean' }, // true - native | false - ERC20
    tokenProxy: { type: 'string' }, // optional
  },
  required: ['network', 'address'],
};

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[0-9a-zA-Z._ ]{1,100}$' }, // string of 1-100 digit/letter
    symbol: { type: 'string', pattern: '^[0-9a-zA-Z.]{1,9}$' }, // string of 1-9 digit/upper_letter
    decimals: { type: 'number', maximum: 20, minimum: 1 }, // number between 1-20
    enable: { type: 'boolean' }, // true - enable | false - disable
    tokens: { type: 'array', items: tokenSchema, minItems: 1 },
  },
  required: ['name', 'symbol', 'decimals', 'tokens'],
};

const validate = ajv.compile(schema);

const validateSchema = (jsonObj) => {
  const valid = validate(jsonObj);
  return { errors: validate.errors, valid };
};

const getChainId = (network) => {
  const c = getChainConfig(network);
  return c ? c.chainId : -1;
};

const isTestnet = (network) => {
  const c = getChainConfig(network);
  return c ? !!c.testnet : true;
};

const getChainConfig = (network) => {
  for (const c of CHAINS) {
    if (c.enum === network.toString()) {
      return c;
    }
  }
  return undefined;
};

const getChainConfigs = () => {
  return CHAINS;
};

module.exports = { validateSchema, getChainId, isTestnet, getChainConfig, getChainConfigs };

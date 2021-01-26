const CONFIGS = {
  templateUrl: '',
  component: {
    name: 'http',
    fullname: 'HTTP',
  },
  defaultPort: '18888',
  defaultEntryFile: 'sls.js',
  handler: 'sl_handler.handler',
  runtime: 'Nodejs10.15',
  timeout: 3,
  memorySize: 128,
  namespace: 'default',
  description: 'Created by Serverless Component',
};

export default CONFIGS;

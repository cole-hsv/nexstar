module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'Nexstar',
      script: 'index.js',
      watch: true,
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
module.exports = {
  apps: [
    {
      name: "furnix-frontend-staging",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/var/www/furnixcrm/staging/frontend-staging",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "staging",
        PORT: 3001,
      },
    },
  ],
};

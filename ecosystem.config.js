module.exports = {
  apps: [
    {
      name: "furnixcrm-prod",
      script: "pnpm",
      args: "run start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://api.furnixcrm.com",
      },
    },
    {
      name: "furnixcrm-staging",
      script: "pnpm",
      args: "run start",
      env: {
        PORT: 3001,
        NODE_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://staging-api.furnixcrm.com",
      },
    },
  ],
};

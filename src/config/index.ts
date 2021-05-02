type Env = "dev" | "fat" | "stage" | "prod";

export const env = process.env.DIND_RUNTIME_ENV_NAME as Env;

type Config = {
  api: string;
  homepage: string;
  ums: string;
  login?: string;
};

const defaultConfig: Config = {
  api: "/api",
  homepage: "http://localhost:8080",
  ums: "/ums",
  login: "http://kuai-dev.gaoding.com/login",
};

const envMap: {
  [key in Env]?: Config;
} = {
  dev: {
    api: "http://api-kc-dev.gaoding.com",
    homepage: "http://kuai-dev.gaoding.com",
    ums: "http://ums.dev.gaoding.com",
  },
  fat: {
    api: "http://api-kc-fat.gaoding.com",
    homepage: "http://kuai-fat.gaoding.com",
    ums: "http://ums-fat.gaoding.com",
  },
  stage: {
    api: "https://api-kc-stage.gaoding.com",
    homepage: "https://kuai-stage.gaoding.com",
    ums: "https://ums-stage.gaoding.com",
  },
  prod: {
    api: "https://api-kc.gaoding.com",
    homepage: "https://kuai.gaoding.com",
    ums: "https://ums.gaoding.com",
  },
};

const config = envMap[env] || defaultConfig;

export const isProd = env === "prod";

export default config;

export const authConfig = {
  clientId: "kc",
  clientSecret: "7da458070e57b98e11d00d9286f235dx",
};

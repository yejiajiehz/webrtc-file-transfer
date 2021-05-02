const isDev =
  !process.env.DIND_RUNTIME_ENV_NAME ||
  process.env.DIND_RUNTIME_ENV_NAME === "dev";
/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  crossorigin: "anonymous",
  productionSourceMap: isDev,
  devServer: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:8080",
        // pathRewrite: { "^/api": "" },
        changeOrigin: true,
      },
    },
  },
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  publicPath:
    process.env.NODE_ENV === "production"
      ? "https://cdn.dancf.com/kc-front/"
      : "/",

  // 注入构建变量
  chainWebpack: (config) => {
    config.plugin("define").tap((definitions) => {
      definitions[0]["process.env"]["DIND_RUNTIME_ENV_NAME"] = JSON.stringify(
        process.env.DIND_RUNTIME_ENV_NAME
      );

      return definitions;
    });
  },
};

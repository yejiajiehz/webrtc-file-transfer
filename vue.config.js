/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  devServer: {
    port: 3000,
  },
};

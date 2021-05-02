module.exports = {
  presets: ["@vue/cli-plugin-babel/preset"],
  plugins: [
    [
      "import",
      {
        libraryName: "@gaoding/gd-antd-plus",
        libraryDirectory: "es",
        style: true,
      },
      "@gaoding/gd-antd-plus",
    ],
  ],
};

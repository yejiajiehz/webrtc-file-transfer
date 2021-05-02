module.exports.zip = {
  folders: [["dist"]],
};

module.exports.cdn = (tag) => {
  switch (tag) {
    case "zip":
      return {
        cdnPrefix: "/kc-front/",
        files: ["kc-front_dist.zip"],
      };
    default:
      return {
        cdnPrefix: "/kc-front/",
        folders: ["dist"],
      };
  }
};

module.exports.apollo = {
  type: "file",
  value: {
    html: "dist/index.html",
  },
  config: {
    // token
    token: process.env.APOLLO_GAODINGX_TOEKN,
    // 部门
    department: "gaoding",
    // Namespace所属的AppId
    appId: "gaoding_ci",
    // Namespace的名字
    namespaceName: "kc-front",
    // 配置环境
    env: process.env.DIND_RUNTIME_ENV_NAME.toUpperCase(),
  },
};

module.exports.drms = {
  type: "file",
  content: {
    html: "dist/index.html",
  },
};

module.exports.dingtalk = {
  text: "发版成功!",
};

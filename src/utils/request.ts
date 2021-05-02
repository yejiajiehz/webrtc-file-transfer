import axios, { AxiosRequestConfig } from "axios";

import config from "@/config";
import { getAuthorizationHeader } from "./auth";

const axiosConfig: AxiosRequestConfig = {
  baseURL: config.api,
  withCredentials: true,
};

const instance = axios.create(axiosConfig);
const defaultRequest = axios.create(axiosConfig);

// 添加 auth
async function addAuthHeader(config: AxiosRequestConfig) {
  const authrization = await getAuthorizationHeader();

  if (authrization) {
    config.headers["Authorization"] = authrization;
  }
  return config;
}

instance.interceptors.request.use(addAuthHeader);
defaultRequest.interceptors.request.use(addAuthHeader);

// 默认只获取 data，如果需要自行判断
instance.interceptors.response.use(function (response) {
  const data = response.data;

  if (data.code === "200") {
    return data.data;
  } else {
    const error = new Error(data.message);
    error.data = data;
    return Promise.reject(error);
  }
});

export const request = instance;
export { defaultRequest };

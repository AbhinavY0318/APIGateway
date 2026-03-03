import axios from "axios";

export const proxyRequest = async (
  method: string,
  url: string,
  data?: any
) => {
  const response = await axios({
    method,
    url,
    data
  });

  return response.data;
};
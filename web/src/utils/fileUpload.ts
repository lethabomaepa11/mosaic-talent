import { getAxiosInstance } from "@/utils/axiosInstance";

export interface IUploadedFile {
  fileId: string;
  key: string;
  url: string;
  contentType: string;
  size: number;
}

const uploadInternal = async (file: File, folder: string, isPublic: boolean) => {
  const instance = getAxiosInstance();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const endpoint = isPublic ? "/api/files/upload-public" : "/api/files/upload";
  const response = await instance.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return (response.data?.result ?? response.data) as IUploadedFile;
};

export const uploadFile = (file: File, folder = "general") => {
  return uploadInternal(file, folder, false);
};

export const uploadPublicFile = (file: File, folder = "public") => {
  return uploadInternal(file, folder, true);
};

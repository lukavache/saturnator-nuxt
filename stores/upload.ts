import type { Strapi4RequestParams } from "@nuxtjs/strapi";

export const useUploadStore = defineStore("Upload", () => {
  const client = useStrapiClient();

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    
    const res = await client('upload', {
      method: 'POST',
      body: formData,
    });
    return res;
  };

  const uploadMultipleFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const res = await client('upload', {
      method: 'POST',
      body: formData,
    });
    return res;
  };

  const createTrack = async (trackData: any) => {
    const res = await client<FindOne<any>>('tracks', {
      method: 'POST',
      body: { data: trackData },
    });
    return res;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    createTrack,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadStore, import.meta.hot));
}


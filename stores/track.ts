import type { Strapi4RequestParams } from "@nuxtjs/strapi";

export const useTrackStore = defineStore("Track", () => {
  const client = useStrapiClient();
  const endpoint = "tracks";
  const records = ref<Track[]>([]);

  const get = async (opts: Strapi4RequestParams = {}) => {
    const res = await client<FindMany<Track>>(endpoint, {
      method: "GET",
      params: opts,
    });
    records.value = res.data;
    return res;
  };

  const create = async (data: Partial<Track>) => {
    const res = await client<FindOne<Track>>(endpoint, {
      body: { data },
      method: "POST",
    });
    return res;
  };

  const getById = async (id: string, opt: Strapi4RequestParams = { 
    populate: ["coverImage", "users_permissions_user", "audioFile", "samples"] 
  }) => {
    const res = await client<FindOne<Track>>(`${endpoint}/${id}`, {
      method: "GET",
      params: opt,
    });
    return res;
  };

  const update = async (id: string, data: Partial<Track>) => {
    const res = await client<FindOne<Track>>(`${endpoint}/${id}`, {
      body: { data },
      method: "PUT",
    });
    return res;
  };

  return {
    get,
    records,
    create,
    getById,
    update,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTrackStore, import.meta.hot));
}

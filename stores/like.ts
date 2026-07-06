import type { Strapi4RequestParams } from "@nuxtjs/strapi";

interface Like {
  id: number;
  documentId?: string;
  track: { id?: number; documentId?: string } | number | string;
  users_permissions_user: { id?: number; documentId?: string } | number | string;
  createdAt: string;
  updatedAt: string;
}

export const useLikeStore = defineStore("Like", () => {
  const client = useStrapiClient();
  const endpoint = "likes";
  const records = ref<Like[]>([]);
  const userLikes = ref<Set<string>>(new Set()); // Track documentIds

  const ensureUserId = async () => {
    const auth = useAuthStore();
    if (!auth.isLoggedIn) return null;

    if (!auth.getUser?.id) {
      await auth.fetchUser();
    }

    return auth.getUser?.id ?? null;
  };

  const get = async (opts: Strapi4RequestParams = {}) => {
    const res = await client<FindMany<Like>>(endpoint, {
      method: "GET",
      params: opts,
    });
    records.value = res.data;
    return res;
  };

  const create = async (data: { trackId?: number; trackDocId?: string }) => {
    const userId = await ensureUserId();
    if (!userId) return null;

    // Validate that we have a valid trackDocId
    if (!data.trackDocId || data.trackDocId.trim() === '') {
      console.error('Invalid trackDocId:', data.trackDocId);
      throw new Error('Track documentId is required');
    }

    const trackConnect = data.trackDocId
      ? { connect: [{ documentId: data.trackDocId }] }
      : { connect: [{ id: data.trackId }] };

    const res = await client<FindOne<Like>>(endpoint, {
      method: "POST",
      body: {
        data: {
          track: trackConnect,
          users_permissions_user: { connect: [{ id: userId }] },
        },
      },
    });
    return res;
  };

  // Add delete method - use documentId if available, otherwise use id
  const deleteLike = async (likeId: number | string) => {
    const res = await client(`${endpoint}/${likeId}`, {
      method: "DELETE",
    });
    return res;
  };

  // Add method to find user's like for a track
  const findUserLike = async (trackDocId: string) => {
    const userId = await ensureUserId();
    if (!userId) return null;

    const res = await client(endpoint, {
      method: "GET",
      params: {
        filters: {
          track: { documentId: { $eq: trackDocId } },
          users_permissions_user: { id: { $eq: userId } },
        },
        populate: ["track", "users_permissions_user"],
      },
    });

    return res.data?.[0] ?? null;
  };

  // Load user's likes
  const loadUserLikes = async () => {
    const userId = await ensureUserId();
    if (!userId) return;

    try {
      const response = await client(endpoint, {
        method: "GET",
        params: {
          filters: {
            users_permissions_user: { id: { $eq: userId } },
          },
          populate: ["track"],
        },
      });

      userLikes.value.clear();
      if (response.data) {
        response.data.forEach((like: any) => {
          if (like.track?.documentId) {
            userLikes.value.add(like.track.documentId);
          }
        });
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  // Check if user liked a track
  const isLiked = (trackDocId: string) => userLikes.value.has(trackDocId);
  const markLiked = (trackDocId: string) => userLikes.value.add(trackDocId);
  const unmarkLiked = (trackDocId: string) => userLikes.value.delete(trackDocId);

  return {
    get,
    records,
    create,
    deleteLike,
    findUserLike,
    loadUserLikes,
    isLiked,
    markLiked,
    unmarkLiked,
    userLikes
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLikeStore, import.meta.hot));
}

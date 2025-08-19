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

  const get = async (opts: Strapi4RequestParams = {}) => {
    const res = await client<FindMany<Like>>(endpoint, {
      method: "GET",
      params: opts,
    });
    records.value = res.data;
    return res;
  };

  const create = async (data: { trackId?: number; trackDocId?: string }) => {
    const auth = useAuthStore();
    if (!auth.isLoggedIn) return null;

    // Validate that we have a valid trackDocId
    if (!data.trackDocId || data.trackDocId.trim() === '') {
      console.error('Invalid trackDocId:', data.trackDocId);
      throw new Error('Track documentId is required');
    }

    const trackConnect = data.trackDocId
      ? { connect: [{ documentId: data.trackDocId }] }
      : { connect: [{ id: data.trackId }] };

    console.log('Track connect object:', trackConnect); // Debug log

    const res = await client<FindOne<Like>>(endpoint, {
      method: "POST",
      body: {
        data: {
          track: trackConnect,
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
    const auth = useAuthStore();
    if (!auth.isLoggedIn) return null;

    const res = await client(endpoint, {
      method: "GET",
      params: {
        filters: {
          track: { documentId: { $eq: trackDocId } },
          users_permissions_user: { id: { $eq: auth.getUser!.id } },
        },
        populate: ["track"],
      },
    });

    return res.data?.[0] ?? null;
  };

  // Load user's likes
  const loadUserLikes = async () => {
    const auth = useAuthStore();
    if (!auth.isLoggedIn) return;

    try {
      console.log('Loading likes for user ID:', auth.getUser!.id);
      
      const response = await client(endpoint, {
        method: "GET",
        params: {
          populate: ["track"],
        },
      });

      console.log('Likes response:', response);

      userLikes.value.clear();
      if (response.data) {
        // Filter client-side for now to avoid complex Strapi v5 filter syntax
        const userLikesData = response.data.filter((like: any) => 
          like.users_permissions_user?.id === auth.getUser!.id
        );
        
        userLikesData.forEach((like: any) => {
          if (like.track?.documentId) {
            userLikes.value.add(like.track.documentId);
          }
        });
        
        console.log('User likes loaded:', userLikes.value);
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  // Check if user liked a track
  const isLiked = (trackDocId: string) => userLikes.value.has(trackDocId);

  return {
    get,
    records,
    create,
    deleteLike,
    findUserLike,
    loadUserLikes,
    isLiked,
    userLikes
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLikeStore, import.meta.hot));
}

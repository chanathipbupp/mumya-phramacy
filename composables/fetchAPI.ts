// import { getToken } from './tokenManager';

const API_URL = 'https://api.dev.mumya.kasidate.me';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGJjNTdlM2QxNWUwZDBkMTg5ZjYxMDciLCJlbWFpbCI6Im11bXlhcGhhcm1hY3kuYXBwQGdtYWlsLmNvbSIsInJvbGVzIjpbInN1cGVyYWRtaW4iLCJ1c2VyIiwiYWRtaW4iXSwiaWF0IjoxNzU3NDE2ODE3LCJleHAiOjE3NjAwMDg4MTd9.YrW73p7ebv1LjsR5ftx4CIJKv-3AhFZKF5cyT5xy8tI'
// Helper function to handle API errors
const handleApiError = async (response: Response, defaultMessage: string) => {
  let errorMessage = defaultMessage;

  try {
    const errorData = await response.json();
    console.log("Error: ",errorData);
    if (errorData.message) {
      errorMessage = errorData.message;
    }
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError);
  }

  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).statusText = response.statusText;
  throw error;
};

// Get User Profile
export async function getUserProfile(): Promise<any> {
  const url = `${API_URL}/users/me`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch user profile');
  }
  return res.json();
}


// Get User Point Balance
export async function getUserPointBalance(uid: string): Promise<any> {
  const url = `${API_URL}/points/${uid}/balance`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch user point balance');
  }
  return res.json();
}

// Get News List
export async function getNews(params?: {
  type?: string;
  priority?: string;
  page?: string;
  limit?: string;
  q?: string;
  scope?: string;
  sortby?: string;
  order?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_URL}/news${searchParams ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch news list');
  }
  return res.json();
}




// Get Articles List(Admin)
export async function getArticlesAdmin(params?: {
  page?: string;
  limit?: string;
  activeOnly?: string;
  q?: string;
  status?: string;
  tags?: string;
  sortby?: string;
  order?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_URL}/articles/admin/list${searchParams ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch articles list admin');
  }
  return res.json();
}

// Create News (Admin)
export async function createNews(data: {
  title: string;
  message: string;
  type: string;
  priority: string;
  isActive: boolean;
  isPinned: boolean;
  startAt: string;
  endAt: string;
  scope: string[];
  channels: string[];
  coverImage: string;
  linkUrl: string;
  bannerStyle: string;
  customSlug: string;
  content: object;
}): Promise<any> {
  const url = `${API_URL}/news`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to create news');
  }
  return res.json();
}

// Update News (Admin)
export async function updateNews(id: string, data: {
  title: string;
  message: string;
  type: string;
  priority: string;
  isActive: boolean;
  isPinned: boolean;
  startAt: string;
  endAt: string;
  scope: string[];
  channels: string[];
  coverImage: string;
  linkUrl: string;
  bannerStyle: string;
  customSlug: string;
  content: object;
}): Promise<any> {
  const url = `${API_URL}/news/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to update news');
  }
  return res.json();
}


export async function getNewsAdmin(params?: {
  page?: string;
  limit?: string;
  q?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_URL}/news/admin/list${searchParams ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch news list admin');
  }
  return res.json();
}

// Get News by Slug (Public)
export async function getNewsBySlug(slug: string): Promise<any> {
  const url = `${API_URL}/news/${slug}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch news by slug');
  }
  return res.json();
}

// Upload File
export async function uploadFile(file: File): Promise<any> {
  const url = `${API_URL}/files/uploads`;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      // 'Content-Type' should NOT be set for multipart/form-data; browser/React Native will set it
    },
    body: formData,
  });

  if (!res.ok) {
    await handleApiError(res, 'Failed to upload file');
  }
  return res.json();
}

// Soft Delete News (Admin)
export async function deleteNews(id: string): Promise<any> {
  const url = `${API_URL}/news/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to delete news');
  }
  return res.json();
}

// Get Articles (Public)
export async function getArticles(params?: {
  page?: string;
  limit?: string;
  activeOnly?: string;
  q?: string;
  status?: string;
  tags?: string;
  sortBy?: string;
  order?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_URL}/articles${searchParams ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch articles');
  }
  return res.json();
}

// Create Article (Admin)
export async function createArticle(data: {
  title: string;
  content: object;
  status: string;
  tags: string[];
  customSlug: string;
  coverImage: string;
  publishDate: string;
  activeFrom: string;
  activeTo: string;
  isOptional: string[];
}): Promise<any> {
  const url = `${API_URL}/articles`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to create article');
  }
  return res.json();
}

// Update Article (Admin)
export async function updateArticle(id: string, data: {
  title: string;
  content: object;
  status: string;
  publishDate: string;
  activeFrom: string;
  activeTo: string;
  customSlug: string;
  coverImage: string;
  isOptional: string[];
}): Promise<any> {
  const url = `${API_URL}/articles/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to update article');
  }
  return res.json();
}

// Soft Delete Article (Admin)
export async function deleteArticle(id: string): Promise<any> {
  const url = `${API_URL}/articles/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to delete article');
  }
  return res.json();
}

// Get Article by Slug (Public)
export async function getArticleBySlug(slug: string): Promise<any> {
  const url = `${API_URL}/articles/${slug}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch article by slug');
  }
  return res.json();
}

// 1. GET /points/me/balance
export async function getMyPointBalance(): Promise<any> {
  const url = `${API_URL}/points/me/balance`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch my point balance');
  }
  return res.json();
}

// 2. GET /points/me/ledger
export async function getMyPointLedger(params?: {
  limit?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  refType?: string[];
  refId?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else if (value !== undefined) {
        searchParams.append(key, value as string);
      }
    });
  }
  const url = `${API_URL}/points/me/ledger${searchParams.toString() ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch my point ledger');
  }
  return res.json();
}

// 3. GET /points/{uid}/ledger
export async function getUserPointLedger(uid: string, params?: {
  limit?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  refType?: string[];
  refId?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else if (value !== undefined) {
        searchParams.append(key, value as string);
      }
    });
  }
  const url = `${API_URL}/points/${uid}/ledger${searchParams.toString() ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch user point ledger');
  }
  return res.json();
}

// 4. GET /points/{uid}/balance
export async function getUserPointBalanceByUid(uid: string): Promise<any> {
  const url = `${API_URL}/points/${uid}/balance`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch user point balance by uid');
  }
  return res.json();
}

// 5. POST /points/admin/adjust
export async function adjustUserPointAdmin(data: {
  userId: string;
  action: 'credit' | 'debit';
  amount: number;
  refType?: string;
  refId?: string;
  idempotencyKey: string;
  expiresAt: string;
}): Promise<any> {
  const url = `${API_URL}/points/admin/adjust`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to adjust user point (admin)');
  }
  return res.json();
}
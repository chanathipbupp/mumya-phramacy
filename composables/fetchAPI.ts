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

// Get Articles List
export async function getArticles(params?: {
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
  const url = `${API_URL}/articles${searchParams ? `?${searchParams}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch articles list');
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
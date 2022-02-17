import useSWR from "swr";

export const NOTIFICATIONS_BASE_PATH = "/api/v1/plus/notifications";
export const NOTIFICATIONS_MARK_ALL_AS_READ_PATH = `${NOTIFICATIONS_BASE_PATH}/all/mark-as-read/`;

export async function markNotificationsAsRead(body: FormData) {
  return fetch(NOTIFICATIONS_MARK_ALL_AS_READ_PATH, {
    body: body,
    method: "POST",
  });
}
export const starItem = async (csrfToken: string, id: number) => {
  await post(`${NOTIFICATIONS_BASE_PATH}/${id}/toggle-starred/`, csrfToken);
};

export async function toggleStarItemsById(csrfToken: string, ids: number[]) {
  return await post(`${NOTIFICATIONS_BASE_PATH}/toggle-starred/`, csrfToken, {
    ids,
  });
}

export async function deleteItemsById(csrfToken: string, ids: number[]) {
  return await post(`${NOTIFICATIONS_BASE_PATH}/delete-by-id/`, csrfToken, {
    ids,
  });
}

export async function deleteItemById(csrfToken: string, id: number) {
  return await post(`${NOTIFICATIONS_BASE_PATH}/${id}/delete/`, csrfToken);
}

export async function undoDeleteItemById(csrfToken: string, id: number) {
  return await post(
    `${NOTIFICATIONS_BASE_PATH}/${id}/undo-deletion/`,
    csrfToken
  );
}

export function useNotificationsEndpoint(
  page: number,
  searchTerms: string,
  starredOnly: boolean,
  perPage?: number
) {
  const sp = new URLSearchParams();
  page!! && sp.append("page", page.toString());
  searchTerms!! && sp.append("q", searchTerms);
  starredOnly!! && sp.append("starred", "true");
  perPage!! && sp.append("per_page", perPage.toString());

  return useSWR(
    `${NOTIFICATIONS_BASE_PATH}?${sp.toString()}`,
    async (url) => {
      console.log(`Fetching with params ${sp.toString()}`);
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} on ${url}: ${text}`);
      }
      return await response.json();
    },
    {
      revalidateOnFocus: true,
    }
  );
}

async function post(url: string, csrfToken: string, data?: object) {
  const fetchData: { method: string; headers: HeadersInit; body?: string } = {
    method: "POST",
    headers: {
      "X-CSRFToken": csrfToken,
      "Content-Type": "text/plain",
    },
  };
  if (data) fetchData.body = JSON.stringify(data);

  const response = await fetch(url, fetchData);

  if (!response.ok) {
    throw new Error(`${response.status} on ${response.url}`);
  }
  return true;
}

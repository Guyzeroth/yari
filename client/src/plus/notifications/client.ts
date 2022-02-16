export const NOTIFICATIONS_BASE_PATH = "/api/v1/plus/notifications";
export const NOTIFICATIONS_MARK_ALL_AS_READ_PATH = `${NOTIFICATIONS_BASE_PATH}/all/mark-as-read/`;

export async function markNotificationsAsRead(body: FormData) {
  return fetch(NOTIFICATIONS_MARK_ALL_AS_READ_PATH, {
    body: body,
    method: "POST",
  });
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

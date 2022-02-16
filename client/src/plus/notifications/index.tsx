import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLocale } from "../../hooks";
import Container from "../../ui/atoms/container";
import Tabs from "../../ui/molecules/tabs";
import List from "../common/list";
import {
  searchFiltersContext,
  SearchFiltersProvider,
} from "../contexts/search-filters";
import SearchFilter from "../search-filter";
import "./index.scss";
import NotificationCard from "./notification-card";
import IconCard from "../icon-card";
import useSWR, { mutate } from "swr";
import { HEADER_NOTIFICATIONS_MENU_API_URL } from "../../constants";
import {
  NOTIFICATIONS_MARK_ALL_AS_READ_PATH,
  NOTIFICATIONS_BASE_PATH,
  markNotificationsAsRead,
} from "./client";
import { getCookie, post } from "./utils";
import NotificationCardListItem from "./notification-card2";
import { Button } from "../../ui/atoms/button";
import { useUIStatus } from "../../ui-context";

enum TabVariant {
  ALL,
  STARRED,
  WATCHING,
}

interface Tab {
  variant: TabVariant;
  pageTitle: string;
  label: string;
  path: string;
}

const ALL_URL = "/plus/notifications";
const STARRED_URL = "/plus/notifications/starred";
const WATCHING_URL = "/plus/notifications/watching";

const FILTERS = [
  {
    label: "Content updates",
    param: "filterType=content",
  },
  {
    label: "Browser compatibility",
    param: "filterType=compat",
  },
];

const SORTS = [
  {
    label: "Date",
    param: "sort=date",
  },
  {
    label: "Title",
    param: "sort=title",
  },
];

function useCurrentTab(locale): TabVariant {
  const location = useLocation();
  const [currentTab, setTab] = useState<TabVariant>(TabVariant.ALL);

  useEffect(() => {
    if (location.pathname === `/${locale}${STARRED_URL}`) {
      setTab(TabVariant.STARRED);
    } else if (location.pathname === `/${locale}${WATCHING_URL}`) {
      setTab(TabVariant.WATCHING);
    } else {
      setTab(TabVariant.ALL);
    }
  }, [location]);

  return currentTab;
}

function NotificationsLayout() {
  const locale = useLocale();
  const { setToastData } = useUIStatus();

  const tabs: Tab[] = [
    {
      pageTitle: "Notifications",
      label: "All notifications",
      path: `/${locale}${ALL_URL}`,
      variant: TabVariant.ALL,
    },
    {
      label: "Starred",
      pageTitle: "My Starred Pages",
      path: `/${locale}${STARRED_URL}`,
      variant: TabVariant.STARRED,
    },
    {
      label: "Watch list",
      pageTitle: "My Watched Pages",
      path: `/${locale}${WATCHING_URL}`,
      variant: TabVariant.WATCHING,
    },
  ];

  const currentTab = useCurrentTab(locale);
  const [page, setPage] = useState(0);
  const [list, setList] = useState([{ id: 0 }]);

  const { selectedTerms, getSearchFiltersParams } =
    useContext(searchFiltersContext);

  let apiUrl = `/api/v1/plus/notifications/?${getSearchFiltersParams().toString()}`;

  useVisibilityChangeListener(apiUrl);

  let watchingApiUrl = `/api/v1/plus/watched/?q=${encodeURIComponent(
    selectedTerms
  )}`;

  const { data, error, mutate } = useNotificationsApi(
    page,
    selectedTerms,
    currentTab
  );

  useEffect(() => {
    setPage(0);
  }, [currentTab]);

  useEffect(() => {
    if (data) {
      setList(data.items);
    }
  }, [data]);

  const onStarred = async (item) => {
    await post(
      `${NOTIFICATIONS_BASE_PATH}/${item.id}/toggle-starred/`,
      data.csrfmiddlewaretoken
    );
    mutate();
  };

  const onDeleted = async (item) => {
    const undo = `${NOTIFICATIONS_BASE_PATH}/${item.id}/undo-deletion/`;
    await post(
      `${NOTIFICATIONS_BASE_PATH}/${item.id}/delete/`,
      data.csrfmiddlewaretoken
    );
    setToastData({
      mainText: `${item.title} removed from your collection`,
      shortText: "Article removed",
      buttonText: "UNDO",
      buttonHandler: async () => {
        await post(undo, data.csrfmiddlewaretoken);
        mutate();
        setToastData(null);
      },
    });
    mutate();
  };

  return (
    <>
      <header className="plus-header">
        <Container>
          <h1>Notifications</h1>
        </Container>
        <Tabs tabs={tabs} />
      </header>

      <Container>
        {currentTab === TabVariant.WATCHING ? (
          <>
            <SearchFilter />
            <div className="icon-card-list">
              <List
                component={IconCard}
                apiUrl={watchingApiUrl}
                makeKey={(item) => item.url}
                pageTitle="My Watched Pages"
              />
            </div>
          </>
        ) : (
          <>
            <SearchFilter filters={FILTERS} sorts={SORTS} />
            <ul>
              {list.map((item) => (
                <NotificationCardListItem
                  handleDelete={onDeleted}
                  item={item}
                  toggleSelected={() => {}}
                  toggleStarred={onStarred}
                  key={item.id}
                />
              ))}
            </ul>
            <div className="pagination">
              <Button type="primary" onClickHandler={() => setPage(page + 1)}>
                Show more
              </Button>
            </div>
          </>
        )}
      </Container>
    </>
  );
}

function useVisibilityChangeListener(apiUrl: string) {
  return useEffect(() => {
    const formData = new FormData();
    formData.append("csrfmiddlewaretoken", getCookie("csrftoken") || "");
    const visibilityChangeHandler = registerSendBeaconHandler(formData);

    return () => {
      // if the user clicks a react-router Link, we remove the sendBeacon handler
      // and send a fetch request to mark notifications as read
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      markNotificationsAsRead(formData).then(async () => {
        await mutate(apiUrl);
        await mutate(HEADER_NOTIFICATIONS_MENU_API_URL);
      });
    };
  }, [apiUrl]);
}

function registerSendBeaconHandler(formData: FormData) {
  formData.append("csrfmiddlewaretoken", getCookie("csrftoken") || "");
  // if the user clicks a hard link, we set notifications as read using a sendBeacon request
  const handler = () => {
    if (document.visibilityState === "hidden") {
      navigator.sendBeacon(NOTIFICATIONS_MARK_ALL_AS_READ_PATH, formData);
    }
  };
  document.addEventListener("visibilitychange", handler);
  return handler;
}

function useNotificationsApi(
  page: number,
  searchTerms: string,
  currentTab: TabVariant
) {
  const sp = new URLSearchParams();
  page!! && sp.append("page", page.toString());
  searchTerms!! && sp.append("q", searchTerms);
  (currentTab === TabVariant.STARRED)!! && sp.append("starred", "true");

  return useSWR(
    `${NOTIFICATIONS_BASE_PATH}?${sp.toString()}`,
    async (url) => {
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

//   useEffect(() => {
//     if (data) {
//       let newTitle = `${pageTitle}`;

//       if (data.metadata.total > 0) {
//         newTitle += ` (${data.metadata.total})`;
//       }

//       if (data.metadata.page > 1) {
//         newTitle += ` Page ${data.metadata.page}`;
//       }
//       document.title = newTitle;
//     }
//   }, [data, pageTitle]);
// }

export default function Notifications() {
  return (
    <SearchFiltersProvider>
      <NotificationsLayout />
    </SearchFiltersProvider>
  );
}

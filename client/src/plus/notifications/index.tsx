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
import IconCard from "../icon-card";
import { mutate } from "swr";
import { HEADER_NOTIFICATIONS_MENU_API_URL } from "../../constants";
import {
  NOTIFICATIONS_MARK_ALL_AS_READ_PATH,
  markNotificationsAsRead,
  useNotificationsEndpoint,
  deleteItemsById,
  toggleStarItemsById,
  undoDeleteItemById,
  deleteItemById,
  starItem,
} from "./client";
import { getCookie, post } from "./utils";
import { Button } from "../../ui/atoms/button";
import { useUIStatus } from "../../ui-context";
import NotificationCardListItem from "./notification-card-list-item";
import SelectedNotificationsBar from "./notification-select";

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

  const [page, setPage] = useState(1);
  const [list, setList] = useState<Array<any>>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const { selectedTerms, getSearchFiltersParams } =
    useContext(searchFiltersContext);

  let apiUrl = `/api/v1/plus/notifications/?${getSearchFiltersParams().toString()}`;

  useVisibilityChangeListener(apiUrl);

  let watchingApiUrl = `/api/v1/plus/watched/?q=${encodeURIComponent(
    selectedTerms
  )}`;

  const { data, error, mutate } = useNotificationsEndpoint(
    page,
    selectedTerms,
    currentTab === TabVariant.STARRED
  );

  //On tab change reset paging.
  useEffect(() => {
    setPage(1);
    setList([]);
    setSelectAllChecked(false);
  }, [currentTab]);

  useEffect(() => {
    if (data) {
      setList([
        ...list,
        ...data.items.map((item) => {
          console.log(item.id);
          return { ...item, checked: false };
        }),
      ]);
    }
  }, [data]);

  const deleteItem = async (item) => {
    deleteItemById(data.csrfmiddlewaretoken, item.id);
    setToastData({
      mainText: `${item.title} removed from your collection`,
      shortText: "Article removed",
      buttonText: "Undo",
      buttonHandler: async () => {
        await undoDeleteItemById(data.csrfmiddlewaretoken, item.id);
        mutate();
        setToastData(null);
      },
    });
    mutate();
  };

  const deleteMany = async () => {
    const toDelete = list.filter((v) => v.checked).map((i) => i.id);
    await deleteItemsById(data.csrfToken, toDelete);
    mutate();
  };

  const toggleStarItem = async (item) => {
    await starItem(data.csrfmiddlewaretoken, item.id);
    mutate();
  };

  const starMany = async () => {
    const toStar = list.filter((v) => v.checked && !v.starred).map((i) => i.id);
    await toggleStarItemsById(data.csrfmiddlewaretoken, toStar);
    mutate();
  };

  const unstarMany = async () => {
    const toUnstar = list.filter((v) => v.checked).map((i) => i.id);
    await toggleStarItemsById(data.csrfToken, toUnstar);
    mutate();
  };

  const toggleItemChecked = (item) => {
    const newList = list.map((v) => {
      if (v.id === item.id) {
        v.checked = !v.checked;
      }
      return v;
    });
    setList(newList);
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
            <SelectedNotificationsBar
              isChecked={selectAllChecked}
              onStarSelected={starMany}
              onSelectAll={(e) => {
                setList(
                  list.map((item) => {
                    return { ...item, checked: e.target.checked };
                  })
                );
                setSelectAllChecked(!selectAllChecked);
              }}
              onUnstarSelected={unstarMany}
              onDeleteSelected={deleteMany}
            />
            <ul>
              {list.map((item) => (
                <NotificationCardListItem
                  handleDelete={deleteItem}
                  item={item}
                  toggleSelected={toggleItemChecked}
                  toggleStarred={toggleStarItem}
                  key={item.id}
                />
              ))}
            </ul>
            <div className="pagination">
              <Button
                type="primary"
                onClickHandler={() => {
                  setSelectAllChecked(false);
                  setPage(page + 1);
                }}
              >
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

import { useState } from "react";
import { Button } from "../../ui/atoms/button";
import { Checkbox } from "../../ui/molecules/notifications-watch-menu/atoms/checkbox";

export default function SelectedNotificationsBar({}) {
  const [notificationsSelected, setNotificationsSelected] =
    useState<boolean>(false);

  const [selectedNotifications, setSelectedNotifications] = useState<
    Int32Array[]
  >([]);

  const deleteSelected = () => {};

  return (
    <form>
      <Checkbox name="select-all" onChange={() => null} />
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={deleteSelected}
      >
        Star
      </Button>
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={deleteSelected}
      >
        Unstar
      </Button>
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={deleteSelected}
      >
        Delete
      </Button>
    </form>
  );
}

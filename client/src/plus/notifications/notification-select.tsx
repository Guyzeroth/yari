import { Button } from "../../ui/atoms/button";
import { Checkbox } from "../../ui/molecules/notifications-watch-menu/atoms/checkbox";

export default function SelectedNotificationsBar({
  isChecked,
  onSelectAll,
  onStarSelected,
  onDeleteSelected,
  onUnstarSelected,
}) {
  return (
    <form>
      <Checkbox name="select-all" onChange={onSelectAll} checked={isChecked} />
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={onStarSelected}
      >
        Star
      </Button>
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={onUnstarSelected}
      >
        Unstar
      </Button>
      <Button
        type="secondary"
        // ariaControls={sortMenu.id}
        // ariaHasPopup={"menu"}
        onClickHandler={onDeleteSelected}
      >
        Delete
      </Button>
    </form>
  );
}

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../data/store";
import { ISelectedUnit } from "../data/interfaces";
import RemoveIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { selectUnit, removeUnit, addUnits, ListState } from "../data/listSlice";
import UpgradeService from "../services/UpgradeService";
import {
  Card,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
} from "@mui/material";
import RuleList from "./components/RuleList";
import UnitService from "../services/UnitService";
import LinkIcon from "@mui/icons-material/Link";
import _ from "lodash";
import { DropMenu } from "./components/DropMenu";
import ArmyBookGroupHeader from "./components/ArmyBookGroupHeader";
import UnitListItem from "./components/UnitListItem";

export function MainList({ onSelected, onUnitRemoved }) {
  const list = useSelector((state: RootState) => state.list);
  const loadedArmyBooks = useSelector(
    (state: RootState) => state.army.loadedArmyBooks
  );

  const units = list.units.filter((u) => u.selectionId !== "dummy");

  const rootUnits = _.orderBy(
    units.filter(
      (u) =>
        !(
          u.joinToUnit && list.units.some((t) => t.selectionId === u.joinToUnit)
        )
    ),
    (x) => x.sortId
  );

  const unitGroups = _.groupBy(rootUnits, (x) => x.armyId);
  const unitGroupKeys = Object.keys(unitGroups);

  return (
    <>
      {unitGroupKeys.map((key) => {
        const armyBook = loadedArmyBooks.find((book) => book.uid === key);
        return (
          <MainListSection
            key={key}
            army={armyBook}
            showTitle={loadedArmyBooks.length > 1}
            group={unitGroups[key]}
            onSelected={onSelected}
            onUnitRemoved={onUnitRemoved}
          />
        );
      })}
    </>
  );
}

function MainListSection({
  group,
  army,
  showTitle,
  onSelected,
  onUnitRemoved,
}) {
  const list = useSelector((state: RootState) => state.list);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card
      elevation={2}
      sx={{ backgroundColor: "#FAFAFA", marginBottom: "1rem" }}
      square
    >
      {showTitle && (
        <ArmyBookGroupHeader
          army={army}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      )}
      {!collapsed && (
        <>
          {group.map((s: ISelectedUnit, index: number) => {
            // TODO: REFACTOR!

            const attachedUnits: ISelectedUnit[] = UnitService.getAttachedUnits(
              list,
              s
            );
            const [heroes, otherJoined]: [ISelectedUnit[], ISelectedUnit[]] =
              _.partition(attachedUnits, (u) =>
                u.specialRules.some((r) => r.name === "Hero")
              );
            const hasJoined = attachedUnits.length > 0;
            const hasHeroes = hasJoined && heroes.length > 0;

            const unitSize = otherJoined.reduce((size, u) => {
              return size + UnitService.getSize(u);
            }, UnitService.getSize(s));
            const unitPoints = attachedUnits.reduce((cost, u) => {
              return cost + UpgradeService.calculateUnitTotal(u);
            }, UpgradeService.calculateUnitTotal(s));

            const handleClick = (unit) => {
              onSelected(unit);
            };

            return (
              <div
                key={index}
                className={hasJoined ? "my-2" : ""}
                style={{ backgroundColor: hasJoined ? "rgba(0,0,0,.12)" : "" }}
              >
                {hasJoined && (
                  <div className="is-flex px-4 py-2 is-align-items-center">
                    <LinkIcon
                      style={{ fontSize: "24px", color: "rgba(0,0,0,.38)" }}
                    />
                    <h3
                      className="ml-2"
                      style={{ fontWeight: 400, flexGrow: 1 }}
                    >
                      {hasHeroes &&
                        `${heroes[0].customName || heroes[0].name} & `}
                      {s.customName || s.name}
                      {` [${unitSize}]`}
                    </h3>
                    <p className="mr-2">{unitPoints}pts</p>
                    <DropMenu>
                      <DuplicateButton
                        units={[s, ...attachedUnits].filter((u) => u)}
                        list={list}
                        text="Duplicate"
                      />
                    </DropMenu>
                  </div>
                )}
                <div className={hasJoined ? "ml-1" : ""}>
                  {heroes.map((h) => (
                    <MainListItem
                      key={h.selectionId}
                      list={list}
                      unit={h}
                      onSelected={handleClick}
                      onUnitRemoved={onUnitRemoved}
                    />
                  ))}
                  <MainListItem
                    list={list}
                    unit={s}
                    onSelected={handleClick}
                    onUnitRemoved={onUnitRemoved}
                  />
                  {otherJoined.map((u) => (
                    <MainListItem
                      key={u.selectionId}
                      list={list}
                      unit={u}
                      onSelected={handleClick}
                      onUnitRemoved={onUnitRemoved}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </Card>
  );
}

function MainListItem({ list, unit, onSelected, onUnitRemoved }) {
  const dispatch = useDispatch();

  const handleSelectUnit = (unit: ISelectedUnit) => {
    if (list.selectedUnitId !== unit.selectionId) {
      dispatch(selectUnit(unit.selectionId));
    }
    onSelected(unit);
  };

  const handleRemove = (unit: ISelectedUnit) => {
    onUnitRemoved(unit);
    dispatch(removeUnit(unit.selectionId));
  };

  return (
    <UnitListItem
      unit={unit}
      selected={list.selectedUnitId === unit.selectionId}
      onClick={() => {
        handleSelectUnit(unit);
      }}
      rightControl={
        <DropMenu>
          <DuplicateButton units={[unit]} list={list} text=" Duplicate" />
          <MenuItem
            color="primary"
            onClick={(e) => {
              handleRemove(unit);
            }}
          >
            <ListItemIcon>
              <RemoveIcon />
            </ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>
        </DropMenu>
      }
    />
  );
}

export function DuplicateButton({ units, list, text = "" }) {
  const dispatch = useDispatch();

  const duplicateUnits = (units: ISelectedUnit[], list: ListState) => {
    console.log(units);
    dispatch(
      addUnits({ units: units, index: list.units.indexOf(units.at(-1)) + 1 })
    );
  };

  return (
    <MenuItem
      color="primary"
      onClick={(e) => {
        duplicateUnits(units, list);
      }}
    >
      {text ? (
        <>
          <ListItemIcon>
            <ContentCopyIcon />
          </ListItemIcon>
          <ListItemText>{text}</ListItemText>
        </>
      ) : (
        <ContentCopyIcon />
      )}
    </MenuItem>
  );
}

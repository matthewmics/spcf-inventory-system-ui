import React, { useEffect, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { useParams } from "react-router-dom";
import {
  Button,
  Form,
  Icon,
  Input,
  Label,
  Loader,
  Modal,
  Popup,
  Select,
} from "semantic-ui-react";
import { history } from "../../..";
import { DelayedSearchInput } from "../../Commons/DelayedSearchInput";
import agent from "../../../agent";
import { dateStringToLocal } from "../../../helpers";
import { ErrorMessage } from "../../Commons/ErrorMessage";
import { toast } from "react-toastify";
import { downloadBase64File } from "../../../libs/download";
import { transferRepairForm } from "../../../form-files";
import { PopupButton } from "../../Commons/PopupButton";
import { useDispatch } from "react-redux";
import modalActions from "../../../actions/modalActions";
import { DepartmentRequestRepair } from "./DepartmentRequestRepair";
import {
  ItemStatusCurrentStatusLabel,
  ItemStatusCurrentStatusText,
} from "../ItemStatusCurrentStatusLabel";
import { checkIfItemInTransaction } from "../InventoryHelpers";
import { itemStatusOptions } from "../../Commons/Enumerations";

export const DepartmentInventoryItemContent = () => {
  const searchRef = useRef(null);

  const [selectedStatus, setSelectedStatus] = useState("All");

  const filterData = (a) => {
    const val = searchRef.current.inputRef.current.value;
    // console.log(a);
    const status = ItemStatusCurrentStatusText(a);

    return (
      (a.serial_number.toLowerCase().includes(val.toLowerCase()) ||
        a.brand.toLowerCase().includes(val.toLowerCase())) &&
      (selectedStatus === "All" || selectedStatus === status)
    );
  };

  const [loaded, setLoaded] = useState(false);

  const dispatch = useDispatch();

  const { id: parentId, roomID } = useParams();

  const inputFile = useRef(null);

  const [rooms, setRooms] = useState([]);

  const [transferRequestErrors, setTransferRequestErrors] = useState(null);

  const [transferRequestModal, setTransferRequestModal] = useState({
    loading: false,
    open: false,
    errors: null,
  });

  const [transferRequestValue, setTransferRequestValue] = useState({
    item: null,
    details: "",
    destination_room_id: 0,
  });

  const onTransferRequestSubmit = async () => {
    // console.log(inputFile.current.files[0]);

    const file =
      inputFile.current.files.length > 0 ? inputFile.current.files[0] : "";

    setTransferRequestModal({
      ...transferRequestModal,
      loading: true,
    });

    setTransferRequestErrors(null);

    const req = {
      destination_room_id:
        transferRequestValue.destination_room_id === 0
          ? ""
          : transferRequestValue.destination_room_id,
      item_id: transferRequestValue.item.id,
      details: transferRequestValue.details,
    };

    try {
      await agent.TransferRequest.itemTransfer(req, file);
      toast.success("Transfer request successfully submitted");
      setTransferRequestModal({
        ...transferRequestModal,
        loading: false,
        open: false,
      });
      loadData();
    } catch (err) {
      setTransferRequestErrors(err.data.errors);
      setTransferRequestModal({
        ...transferRequestModal,
        loading: false,
      });
    }
  };

  const columns = [
    {
      name: "Serial / Asset No.",
      selector: (row) => row.serial_number,
      sortable: true,
    },
    {
      name: "Room",
      selector: (row) => row.room,
      sortable: true,
    },
    {
      name: "Brand",
      selector: (row) => row.brand,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => ItemStatusCurrentStatusText(row),
      format: (row) => <ItemStatusCurrentStatusLabel item={row} />,
      sortable: true,
    },
    {
      name: "Remarks",
      selector: (row) => {
        return row.remarks ? row.remarks : "-";
      },
    },
    {
      name: "Date Created",
      selector: (row) => row.created_at,
      sortable: true,
    },
    {
      name: "Actions",
      selector: (row) => row.actions,
      right: true,
    },
  ];

  const [itemParent, setItemParent] = useState({
    data: null,
    loading: false,
  });

  const [dataTemp, setDataTemp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const loadData = async () => {
    setLoaded(true);
    setLoading(true);

    const responseDeptCurrent = await agent.Room.list();

    setRooms([
      { value: 0, text: "---" },
      ...responseDeptCurrent
        .map((room) => {
          return {
            value: room.id,
            text: room.name,
          };
        })
        .filter((room) => {
          return room.value != roomID;
        }),
    ]);

    const itemParentData = await agent.Inventory.parentInstance(parentId);
    setItemParent(itemParentData);

    let response =
      parseInt(roomID) !== 0
        ? await agent.Room.items(roomID, parentId)
        : await agent.Inventory.parentAvailableItems(parentId);

    response = response.map((a) => {
      return {
        ...a,
        room: a.room ? a.room.name : "---",
        created_at: dateStringToLocal(a.created_at),
        actions: (
          <>
            <PopupButton
              disabled={checkIfItemInTransaction(a)}
              content="Request Transfer"
              iconName="dolly"
              onClick={() => {
                setTransferRequestErrors(null);
                setTransferRequestValue({
                  item: a,
                  details: "",
                  destination_room_id: 0,
                });
                setTransferRequestModal({
                  ...transferRequestModal,
                  open: true,
                });
              }}
            />
            {roomID != 0 && (
              <PopupButton
                disabled={checkIfItemInTransaction(a)}
                content="Repair Request"
                iconName="wrench"
                onClick={() => {
                  modalActions.openModal(
                    dispatch,
                    "Repair Request",
                    <DepartmentRequestRepair
                      item={{ id: a.id, parentName: itemParentData.name }}
                      onConfirm={() => {
                        loadData();
                      }}
                    />
                  );
                }}
              />
            )}
          </>
        ),
      };
    });

    setData(response);
    setDataTemp(response);
    setLoading(false);
  };

  useEffect(() => {
    setData(dataTemp.filter(filterData));
    if (!loaded) loadData();
  }, [dataTemp, selectedStatus]);

  return (
    <>
      {/* MODAL REQUEST TRANSFER */}
      <Modal
        size="tiny"
        open={transferRequestModal.open}
        closeOnDimmerClick={false}
      >
        <Modal.Header>
          Transfer Request |{" "}
          {itemParent?.name + " - " + transferRequestValue.item?.serial_number}
        </Modal.Header>
        <Modal.Content>
          {transferRequestErrors && (
            <ErrorMessage errors={transferRequestErrors} />
          )}
          <Form>
            <Form.Field>
              <label>From</label>
              <Input
                readOnly
                value={
                  transferRequestValue.item && transferRequestValue.item.room
                    ? transferRequestValue.item.room.name
                    : "Inventory"
                }
              />
            </Form.Field>
            <Form.Field>
              <label>To</label>
              <Select
                options={rooms}
                search
                value={transferRequestValue.destination_room_id}
                onChange={(e, data) => {
                  setTransferRequestValue({
                    ...transferRequestValue,
                    destination_room_id: data.value,
                  });
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Details</label>
              <textarea
                value={transferRequestValue.details}
                onChange={(e) => {
                  setTransferRequestValue({
                    ...transferRequestValue,
                    details: e.target.value,
                  });
                }}
              ></textarea>
            </Form.Field>
            <Form.Field>
              <label>File attachment</label>
              <input type="file" ref={inputFile} />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            loading={transferRequestModal.loading}
            disabled={transferRequestModal.loading}
            onClick={() =>
              setTransferRequestModal({ ...transferRequestModal, open: false })
            }
          >
            Cancel
          </Button>
          <Button
            loading={transferRequestModal.loading}
            disabled={transferRequestModal.loading}
            positive
            onClick={() => onTransferRequestSubmit()}
          >
            Save
          </Button>
        </Modal.Actions>
      </Modal>

      <div>
        <div className="page-header-title">
          <span
            className="link"
            onClick={() => {
              history.push("/inventory");
            }}
          >
            INVENTORY{" "}
          </span>
          <Icon name="arrow right" />
          {!loading && <>{itemParent ? itemParent.name : "..."}</>}
          <Loader active={loading} inline size="tiny" />
        </div>
        <hr></hr>
      </div>
      <div className="mb-10">
        <div style={{ display: "flex" }}>
          <DelayedSearchInput
            searchRef={searchRef}
            onSearch={(val) => {
              setData(dataTemp.filter(filterData));
            }}
          />
          <span style={{ width: "1em" }}></span>
          <Select
            search
            value={selectedStatus}
            options={[
              { text: "All Status", value: "All" },
              ...itemStatusOptions,
            ]}
            onChange={(e, data) => {
              setSelectedStatus(data.value);
            }}
          />
          <div style={{ marginLeft: "auto" }}>
            <Button
              size="small"
              icon
              labelPosition="left"
              onClick={() => {
                downloadBase64File(transferRepairForm, "request_form.docx");
              }}
            >
              <Icon name="cloud download" />
              Download Request Form
            </Button>
          </div>
        </div>
      </div>
      <DataTable columns={columns} data={data} pagination striped />
    </>
  );
};

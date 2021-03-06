import React, { useEffect, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Button,
  Form,
  Icon,
  Input,
  Loader,
  Modal,
  Popup,
  Segment,
  Select,
} from "semantic-ui-react";
import { history } from "../..";
import modalActions from "../../actions/modalActions";
import agent from "../../agent";
import { dateStringToLocal } from "../../helpers";
import { DelayedSearchInput } from "../Commons/DelayedSearchInput";
import {
  itemTypeOptions,
  roleOptions,
  roomTypeOptions,
} from "../Commons/Enumerations";
import { ErrorMessage } from "../Commons/ErrorMessage";
import { ReportForInventory } from "../Reports/ReportForInventory";

export const InventoryContent = () => {
  const searchRef = useRef(null);

  const dispatch = useDispatch();

  const columns = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Item type",
      selector: (row) => row.item_type,
      sortable: true,
    },
    {
      name: "Qty",
      selector: (row) => row.qty,
      sortable: true,
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

  const handleTextInputChange = (e) => {
    setFormValue({ ...formValue, [e.target.name]: e.target.value });
  };

  const formDefaultValue = {
    name: "",
    item_type: "PC",
    id: 0,
  };

  const [archive, setArchive] = useState({
    loading: false,
    data: null,
    open: false,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const [formValue, setFormValue] = useState(formDefaultValue);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [dataTemp, setDataTemp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [selectedItemType, setSelectedItemType] = useState("All");

  const loadParentItems = async () => {
    setLoaded(true);
    setLoading(true);

    let response = await agent.Inventory.parentList();
    response = response.map((a) => {
      return {
        ...a,
        created_at: dateStringToLocal(a.created_at),
        actions: (
          <>
            <Popup
              content="View items"
              trigger={
                <Button
                  icon="eye"
                  circular
                  size="tiny"
                  onClick={() => {
                    history.push("/inventory/" + a.id);
                  }}
                />
              }
            />
            <Popup
              content="Edit Item"
              trigger={
                <Button
                  icon="pencil"
                  circular
                  size="tiny"
                  onClick={() => {
                    setFormValue({
                      id: a.id,
                      name: a.name,
                      item_type: a.item_type,
                    });
                    setModalFormOpen(true);
                  }}
                />
              }
            />
            <Popup
              content="Delete Item"
              trigger={
                <Button
                  icon="archive"
                  circular
                  size="tiny"
                  onClick={() => {
                    setArchive({ ...archive, open: true, data: a });
                  }}
                />
              }
            />
          </>
        ),
      };
    });

    setDataTemp(response);
    setData(response);
    setLoading(false);
  };

  const onFormSubmit = async () => {
    setFormErrors(null);
    setFormLoading(true);
    try {
      let { id, ...req } = formValue;

      if (formValue.id === 0) {
        await agent.Inventory.parentCreate(req);
        toast.success("Item created successfully");
        loadParentItems();
        setModalFormOpen(false);
      } else {
        await agent.Inventory.parentUpdate(req, formValue.id);
        toast.success("Item updated successfully");
        loadParentItems();
        setModalFormOpen(false);
      }
    } catch (err) {
      setFormErrors(err.data.errors);
    } finally {
      setFormLoading(false);
    }
  };

  const onArchive = async () => {
    setArchive({ ...archive, loading: true });
    await agent.Inventory.parentDelete(archive.data.id);
    toast.success("Item deleted successfully");
    setArchive({ ...archive, loading: false, open: false });
    loadParentItems();
  };

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(dataTemp.filter(filterData));
    if (!loaded) loadParentItems();
  }, [selectedItemType, dataTemp]);

  const filterData = (a) => {
    const val = searchRef.current.inputRef.current.value;

    const filteredByType =
      "All" === selectedItemType || a.item_type === selectedItemType;

    return a.name.toLowerCase().includes(val.toLowerCase()) && filteredByType;
  };

  return (
    <>
      {/* MODAL ARCHIVE */}
      <Modal size="tiny" open={archive.open} closeOnDimmerClick={false}>
        <Modal.Header>Confirm Delete</Modal.Header>
        <Modal.Content>
          Are you sure you want to delete {archive.data?.name} ?
        </Modal.Content>
        <Modal.Actions>
          <Button
            negative
            loading={archive.loading}
            disabled={archive.loading}
            onClick={() => setArchive({ ...archive, open: false })}
          >
            Cancel
          </Button>
          <Button
            loading={archive.loading}
            disabled={archive.loading}
            positive
            onClick={() => onArchive()}
          >
            Yes
          </Button>
        </Modal.Actions>
      </Modal>
      {/* MODAL FORM */}
      <Modal size="tiny" open={modalFormOpen} closeOnDimmerClick={false}>
        <Modal.Header>
          {formValue.id === 0 ? "Create new item" : `Edit item`}
        </Modal.Header>
        <Modal.Content>
          {formErrors && <ErrorMessage errors={formErrors} />}
          <Form>
            <Form.Field>
              <label>Name</label>
              <input
                name="name"
                value={formValue.name}
                placeholder="Item name"
                onChange={handleTextInputChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Type</label>
              <Select
                options={itemTypeOptions}
                value={formValue.item_type}
                onChange={(e, data) => {
                  setFormValue({
                    ...formValue,
                    item_type: data.value,
                  });
                }}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            loading={formLoading}
            disabled={formLoading}
            onClick={() => setModalFormOpen(false)}
          >
            Cancel
          </Button>
          <Button
            loading={formLoading}
            disabled={formLoading}
            positive
            onClick={() => onFormSubmit()}
          >
            Save
          </Button>
        </Modal.Actions>
      </Modal>
      <div>
        <div className="page-header-title">
          INVENTORY <Loader active={loading} inline size="tiny" />
        </div>
        <hr></hr>
      </div>
      <div className="mb-10" style={{ overflowY: "visible" }}>
        <div style={{ display: "flex" }}>
          <DelayedSearchInput
            searchRef={searchRef}
            onSearch={(val) => {
              setData(dataTemp.filter(filterData));
            }}
          />
          <span style={{ width: "1em" }}></span>
          <Select
            value={selectedItemType}
            options={[{ text: "All Types", value: "All" }, ...itemTypeOptions]}
            onChange={(e, data) => {
              setSelectedItemType(data.value);
            }}
          />
          <div className="float-r disp-ib" style={{ marginLeft: "auto" }}>
            <Button
              size="small"
              color="blue"
              onClick={() => {
                modalActions.openModal(
                  dispatch,
                  "Inventory Report",
                  <ReportForInventory
                    items={dataTemp.map((a) => {
                      return {
                        text: a.name,
                        value: a.id,
                      };
                    })}
                  />
                );
              }}
            >
              <Icon name="file" /> REPORTS
            </Button>
            <Button
              size="small"
              color="green"
              onClick={() => {
                setFormValue(formDefaultValue);
                setModalFormOpen(true);
              }}
            >
              <Icon name="add" /> Create Item
            </Button>
          </div>
        </div>
      </div>
      <DataTable columns={columns} data={data} pagination striped />
    </>
  );
};

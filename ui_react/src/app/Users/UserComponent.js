import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
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
import agent from "../../agent";
import { DelayedSearchInput } from "../Commons/DelayedSearchInput";
import { roleOptions } from "../Commons/Enumerations";
import { ErrorMessage } from "../Commons/ErrorMessage";

export const UserComponent = () => {
  const { user } = useSelector((state) => state.auth);

  const columns = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => row.role,
      sortable: true,
    },
    {
      name: "Actions",
      selector: (row) => row.actions,
      grow: true,
    },
  ];

  const formDefaultValue = {
    name: "",
    email: "",
    role: "department",
    password: "",
    password_confirmation: "",
  };

  const [archiveUser, setArchiveUser] = useState({
    loading: false,
    user: null,
    open: false,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const [formValue, setFormValue] = useState(formDefaultValue);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [dataTemp, setDataTemp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    let response = await agent.User.list();
    response = response.map((a) => {
      return {
        ...a,
        actions: (
          <>
            {user.id !== a.id && (
              <Popup
                content="Archive User"
                trigger={
                  <Button
                    icon="archive"
                    circular
                    size="tiny"
                    onClick={() => {
                      setArchiveUser({ user: a, loading: false, open: true });
                    }}
                  />
                }
              />
            )}
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
      await agent.User.create({ ...formValue });
      loadUsers();
      setModalFormOpen(false);
      toast.success("User created successfully");
    } catch (err) {
      setFormErrors(err.data.errors);
    } finally {
      setFormLoading(false);
    }
  };

  const onArchiveUser = async () => {
    setArchiveUser({ ...archiveUser, loading: true });
    await agent.User.delete(archiveUser.user.id);
    setArchiveUser({ ...archiveUser, loading: false, open: false });
    loadUsers();
    toast.success("Successfully archived " + archiveUser.user.name);
  };

  const handleTextInputChange = (e) => {
    setFormValue({ ...formValue, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <>
      {/* MODAL ARCHIVE */}
      <Modal size="tiny" open={archiveUser.open} closeOnDimmerClick={false}>
        <Modal.Header>Confirm archive</Modal.Header>
        <Modal.Content>
          Are you sure you want to archive {archiveUser.user?.name} ?
        </Modal.Content>
        <Modal.Actions>
          <Button
            negative
            loading={archiveUser.loading}
            disabled={archiveUser.loading}
            onClick={() => setArchiveUser({ ...archiveUser, open: false })}
          >
            Cancel
          </Button>
          <Button
            loading={archiveUser.loading}
            disabled={archiveUser.loading}
            positive
            onClick={() => onArchiveUser()}
          >
            Yes
          </Button>
        </Modal.Actions>
      </Modal>
      {/* MODAL CREATE */}
      <Modal size="tiny" open={modalFormOpen} closeOnDimmerClick={false}>
        <Modal.Header>Create new account</Modal.Header>
        <Modal.Content>
          {formErrors && <ErrorMessage errors={formErrors} />}
          <Form>
            <Form.Field>
              <label>Name</label>
              <input
                name="name"
                value={formValue.name}
                placeholder="Fullname"
                onChange={handleTextInputChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Email</label>
              <input
                name="email"
                value={formValue.email}
                placeholder="Email"
                onChange={handleTextInputChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Role</label>
              <Select
                onChange={(e, data) => {
                  setFormValue({ ...formValue, role: data.value });
                }}
                value={formValue.role}
                options={roleOptions}
              ></Select>
            </Form.Field>
            <Form.Field>
              <label>Password</label>
              <input
                name="password"
                value={formValue.password}
                type="password"
                placeholder="Password"
                onChange={handleTextInputChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Password Confirmation</label>
              <input
                name="password_confirmation"
                value={formValue.password_confirmation}
                type="password"
                placeholder="Password Confirmation"
                onChange={handleTextInputChange}
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

      {/* AFTER MODAL */}
      <div>
        <div className="page-header-title">
          USERS <Loader active={loading} inline size="tiny" />
        </div>
        <hr></hr>
      </div>

      <div className="mb-10 clearfix">
        <div className="disp-ib">
          <DelayedSearchInput
            onSearch={(val) => {
              setData(
                dataTemp.filter((a) => a.name.toLowerCase().includes(val))
              );
            }}
          />
        </div>
        <div className="float-r disp-ib">
          <Button
            size="small"
            color="green"
            onClick={() => {
              setFormValue(formDefaultValue);
              setModalFormOpen(true);
            }}
          >
            <Icon name="add" /> Create User
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} pagination />
    </>
  );
};
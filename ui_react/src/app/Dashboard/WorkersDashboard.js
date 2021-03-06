import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Grid,
  Icon,
  Label,
  Loader,
  Popup,
  Segment,
  Table,
} from "semantic-ui-react";
import modalActions from "../../actions/modalActions";
import agent from "../../agent";
import { dateStringToLocal } from "../../helpers";
import { downloadBase64File } from "../../libs/download";
import { LabelTransferStatus } from "../Commons/LabelTransferStatus";
import { PopupButton } from "../Commons/PopupButton";
import { MessageModal } from "../Commons/MessageModal";
import { DetailsModal } from "../Commons/DetailsModal";
import { LabelRepairStatus } from "../Commons/LabelRepairStatus";
import { DisposedItemsComponentBak } from "../IventoryItem/DisposedItemsComponent";
import { PurchaseOrderComponent } from "../PurchaseOrders/PurchaseOrderComponent";
import { BorrowRequestSummary } from "./Department/BorrowRequestSummary";
import { NotesList } from "../Notes/NotesList";
import { TransferReport } from "./TransferReport";
import { BorrowReport } from "./BorrowReport";
import { RepairReport } from "./RepairReport";
import { PIRSummary } from "../PurchaseItemRequests/PIRSummary";
import { PIRReport } from "./PIRReport";

export const WorkersDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  // constants
  const columns = [
    {
      name: "Item",
      selector: (row) => row.item_name,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      center: true,
    },
    {
      name: "Actions",
      selector: (row) => row.actions,
      right: true,
    },
  ];

  // states
  const [loading, setLoading] = useState(false);
  const [transfersDt, setTransfersDt] = useState([]);
  const [repairsDt, setRepairsDt] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  // methods
  const loadData = async () => {
    setLoading(true);

    const r_transfers = await agent.TransferRequest.list();
    setTransfersDt(
      r_transfers.map((a) => {
        return {
          item_name: (
            <>
              <div style={{ fontWeight: "bold" }}>
                {a.item.inventory_parent_item.name}
              </div>
              <div style={{ color: "grey" }}>{a.item.serial_number}</div>
            </>
          ),
          status: <LabelTransferStatus status={a.status} />,
          actions: (
            <>
              {a.rejection_details && (
                <PopupButton
                  content="Rejection details"
                  iconName="warning"
                  color="red"
                  onClick={() => {
                    modalActions.openModal(
                      dispatch,
                      "Rejection Details",
                      <MessageModal message={a.rejection_details} />
                    );
                  }}
                />
              )}
              <PopupButton
                content="Notes"
                iconName="sticky note"
                color="green"
                onClick={() => {
                  modalActions.openModal(
                    dispatch,
                    "Note(s)",
                    <NotesList id={a.id} name={"transfer"} />
                  );
                }}
              />
              <PopupButton
                content="Details"
                iconName="book"
                color="blue"
                onClick={() => {
                  modalActions.openModal(
                    dispatch,
                    "Transfer Details",
                    <DetailsModal
                      data={{
                        "Requested By": a.requestor.name,
                        Details: a.details,
                        Item: a.item.inventory_parent_item.name,
                        "Serial Number": a.item.serial_number,
                        From: a.current_room
                          ? a.current_room.name
                          : "Inventory",
                        To: a.destination_room.name,
                        Status: a.status.toUpperCase(),
                        Date: dateStringToLocal(a.created_at),
                      }}
                    />
                  );
                }}
              />

              <PopupButton
                content="Download Attached"
                iconName="cloud download"
                onClick={async () => {
                  const response = await agent.FileStorage.get(
                    a.file_storage_id
                  );
                  downloadBase64File(response.base64, response.name);
                }}
              />
            </>
          ),
        };
      })
    );

    const r_repairs = await agent.RepairRequest.list();

    setRepairsDt(
      r_repairs.map((a) => {
        return {
          item_name: (
            <>
              <div style={{ fontWeight: "bold" }}>
                {a.item.inventory_parent_item.name}
              </div>
              <div style={{ color: "grey" }}>{a.item.serial_number}</div>
            </>
          ),
          status: <LabelRepairStatus status={a.status} />,
          actions: (
            <>
              {a.rejection_details && (
                <PopupButton
                  content="Rejection details"
                  iconName="warning"
                  color="red"
                  onClick={() => {
                    modalActions.openModal(
                      dispatch,
                      "Rejection Details",
                      <MessageModal message={a.rejection_details} />
                    );
                  }}
                />
              )}
              <PopupButton
                content="Notes"
                iconName="sticky note"
                color="green"
                onClick={() => {
                  modalActions.openModal(
                    dispatch,
                    "Note(s)",
                    <NotesList id={a.id} name={"repair"} />
                  );
                }}
              />
              <PopupButton
                content="Details"
                iconName="book"
                color="blue"
                onClick={() => {
                  modalActions.openModal(
                    dispatch,
                    "Request Details",
                    <DetailsModal
                      data={{
                        Item: a.item.inventory_parent_item.name,
                        "Serial Number": a.item.serial_number,
                        Details: a.details,
                        Status: a.status.toUpperCase(),
                        Date: dateStringToLocal(a.created_at),
                        "Processed By": a.handler ? a.handler.name : "-",
                      }}
                    />
                  );
                }}
              />

              <PopupButton
                content="Download Attached"
                iconName="cloud download"
                onClick={async () => {
                  const response = await agent.FileStorage.get(
                    a.file_storage_id
                  );
                  downloadBase64File(response.base64, response.name);
                }}
              />
            </>
          ),
        };
      })
    );

    setLoading(false);
  };

  return (
    <>
      <div>
        <div className="page-header-title">
          DASHBOARD
          <Loader active={loading} inline size="tiny" />
        </div>
        <hr></hr>
      </div>

      <Grid padded>
        <Grid.Row>
          <Grid.Column mobile={16} computer={8}>
            <Segment.Group>
              <Segment className="bg-gradient-1">
                <Icon name="dolly" />
                Transfer Requests
                {user.role === "admin" && (
                  <div style={{ float: "right" }}>
                    <PopupButton
                      content="Generate Report"
                      iconName="file excel"
                      color="blue"
                      onClick={() => {
                        modalActions.openModal(
                          dispatch,
                          "Generate Transfer Report",
                          <TransferReport />
                        );
                      }}
                    />
                  </div>
                )}
              </Segment>
              <Segment>
                <div className="dashboard-segment">
                  <DataTable
                    columns={columns}
                    data={transfersDt}
                    pagination
                    noTableHead
                    striped
                    progressPending={loading}
                  />
                </div>
              </Segment>
            </Segment.Group>
          </Grid.Column>

          <Grid.Column mobile={16} computer={8}>
            <Segment.Group>
              <Segment className="bg-gradient-1">
                <Icon name="wrench" />
                Repair Requests
                {user.role === "admin" && (
                  <div style={{ float: "right" }}>
                    <PopupButton
                      content="Generate Report"
                      iconName="file excel"
                      color="blue"
                      onClick={() => {
                        modalActions.openModal(
                          dispatch,
                          "Generate Repair Report",
                          <RepairReport />
                        );
                      }}
                    />
                  </div>
                )}
              </Segment>
              <Segment>
                <div className="dashboard-segment">
                  <DataTable
                    columns={columns}
                    data={repairsDt}
                    pagination
                    noTableHead
                    striped
                    progressPending={loading}
                  />
                </div>
              </Segment>
            </Segment.Group>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column computer={16} mobile={16}>
            <Segment.Group>
              <Segment className="bg-gradient-1">
                <Icon name="pallet" />
                Borrows
                {user.role === "admin" && (
                  <div style={{ float: "right" }}>
                    <PopupButton
                      content="Generate Report"
                      iconName="file excel"
                      color="blue"
                      onClick={() => {
                        modalActions.openModal(
                          dispatch,
                          "Generate Borrow Report",
                          <BorrowReport />
                        );
                      }}
                    />
                  </div>
                )}
              </Segment>
              <Segment>
                <BorrowRequestSummary />
              </Segment>
            </Segment.Group>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column computer={10} mobile={16}>
            <Segment.Group>
              <Segment className="bg-gradient-1">
                <Icon name="money" />
                Purchase Requests
                {user.role === "admin" && (
                  <div style={{ float: "right" }}>
                    <PopupButton
                      content="Generate Report"
                      iconName="file excel"
                      color="blue"
                      onClick={() => {
                        modalActions.openModal(
                          dispatch,
                          "Generate Purchase Item Request Report",
                          <PIRReport />
                        );
                      }}
                    />
                  </div>
                )}
              </Segment>
              <Segment>
                <PIRSummary />
              </Segment>
            </Segment.Group>
          </Grid.Column>
        </Grid.Row>

        {["admin-bak"].includes(user.role) && (
          <Grid.Row>
            <Grid.Column mobile={16} computer={8}>
              <Segment.Group>
                <Segment className="bg-gradient-1">
                  <Icon name="cart arrow down" />
                  Purchase Orders
                </Segment>
                <Segment>
                  <div className="dashboard-segment">
                    <PurchaseOrderComponent />
                  </div>
                </Segment>
              </Segment.Group>
            </Grid.Column>

            <Grid.Column mobile={16} computer={8}>
              <Segment.Group>
                <Segment className="bg-gradient-2">
                  <Icon name="trash" />
                  Disposed Items
                </Segment>
                <Segment>
                  <div className="dashboard-segment">
                    {/* <DisposedItemsComponent /> */}
                  </div>
                </Segment>
              </Segment.Group>
            </Grid.Column>
          </Grid.Row>
        )}
      </Grid>
    </>
  );
};

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { realApi as mockApi } from "@/lib/api";
import { AppUser, Market, WithdrawDetail, ResultRecord, WinHistory } from "@/lib/mockApi";
import { Field, getToday } from "../ui/AdminUI";
import { EntityForm, UserSelect, MarketSelect, ResultFormFields, UserMultiSelect, PermissionSelect, BulkResultUploadForm } from "./AdminForms";

export type ModalState =
  | { kind: "user"; mode: "create" | "edit"; item?: AppUser }
  | { kind: "withdraw"; mode: "create" | "edit"; item?: WithdrawDetail }
  | { kind: "market"; mode: "create" | "edit"; item?: Market }
  | { kind: "result"; mode: "create" | "edit"; item?: ResultRecord }
  | { kind: "bulk_result"; mode: "create"; defaultDate?: string }
  | { kind: "win"; mode: "create"; item?: WinHistory }
  | { kind: "sub_admin"; mode: "create" | "edit"; item?: any }
  | null;

function formText(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
function optional(value: string) { return value.trim() ? value.trim() : null; }
function selectedUserName(form: FormData, users: AppUser[]) { return formText(form, "user_name") || users.find((user) => user.id === formText(form, "app_user_id"))?.name || "Unknown User"; }

export function AdminModal({ modal, users, markets, results, onClose, onSaved }: { modal: Exclude<ModalState, null>; users: AppUser[]; markets: Market[]; results?: ResultRecord[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);

  async function submit(table: string, payload: Record<string, unknown>, id?: string) {
    setBusy(true);
    const { error } = id ? await mockApi.db.update(table as any, id, payload) : await mockApi.db.insert(table as any, payload);
    setBusy(false);
    if (error) toast.error("Save failed");
    else { toast.success("Saved successfully."); onSaved(); }
  }

  async function submitUser(form: FormData, id?: string) {
    const password = formText(form, "password");
    const confirmPassword = formText(form, "confirm_password");
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    await submit("app_users", {
      name: formText(form, "name"), phone: formText(form, "phone"), password: password,
      commission: Number(form.get("commission") || 0),
    }, id);
  }

  async function submitResult(form: FormData, id?: string) {
    setBusy(true);
    let error;
    if (id) {
      const res = await mockApi.db.update("results", id, {
        result_date: formText(form, "result_date"),
        market_id: Number(form.get("market_id")),
        open_pana: formText(form, "open_pana"),
        open_digit: Number(form.get("open_digit")),
      });
      error = res.error;
    } else {
      const res = await mockApi.db.declareResult({
        result_date: formText(form, "result_date"),
        market_id: Number(form.get("market_id")),
        open_pana: formText(form, "open_pana"),
        open_digit: Number(form.get("open_digit")),
        allow_overwrite: true
      });
      error = res.error;
    }
    setBusy(false);
    if (error) toast.error(error.detail || error.message || "Result save failed");
    else { toast.success(id ? "Result updated successfully." : "Manual result declared with top priority."); onSaved(); }
  }

  async function submitBulkResults(items: any[]) {
    setBusy(true);
    const { data, error } = await mockApi.db.declareBulkResults(items, true);
    setBusy(false);
    if (error) toast.error(error.detail || error.message || "Bulk upload failed");
    else {
      toast.success(data?.message || `Successfully saved ${items.length} manual results with top priority!`);
      onSaved();
    }
  }

  const title = modal.kind === "bulk_result"
    ? "Manual Result Upload (Top Priority)"
    : `${modal.mode === "create" ? "Create" : "Update"} ${modal.kind}`;

  const isWideModal = modal.kind === "bulk_result";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`dashboard-panel modal-card p-5 ${isWideModal ? "max-w-4xl w-full" : ""}`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold capitalize">{title}</h2><button className="icon-button" onClick={onClose}><X /></button></div>
        {modal.kind === "user" && <EntityForm busy={busy} onSubmit={(form) => submitUser(form, modal.item?.id)} fields={<><Field name="name" label="Name" defaultValue={modal.item?.name} required /><Field name="phone" label="Phone" defaultValue={modal.item?.phone} required /><Field name="password" label="4-Digit Password/MPIN" type="text" maxLength={4} defaultValue={modal.item?.password} required={modal.mode === "create"} /><Field name="confirm_password" label="Confirm Password" type="text" maxLength={4} required={modal.mode === "create"} /><Field name="commission" label="Commission %" type="number" defaultValue={modal.item?.commission ?? 5} required /></>} />}
        {modal.kind === "withdraw" && <EntityForm busy={busy} onSubmit={(form) => submit("withdraw_details", { app_user_id: Number(form.get("app_user_id")), user_name: selectedUserName(form, users), account_holder_name: formText(form, "account_holder_name"), upi_name: optional(formText(form, "upi_name")), account_number: formText(form, "account_number"), ifsc_code: formText(form, "ifsc_code").toUpperCase(), upi_id: optional(formText(form, "upi_id")) }, modal.item?.id)} fields={<><UserSelect users={users} defaultValue={modal.item?.app_user_id || ""} /><Field name="user_name" label="User Name" defaultValue={modal.item?.user_name} required /><Field name="account_holder_name" label="Account Holder Name" defaultValue={modal.item?.account_holder_name} required /><Field name="upi_name" label="UPI Name" defaultValue={modal.item?.upi_name || ""} /><Field name="account_number" label="Account Number" defaultValue={modal.item?.account_number} required /><Field name="ifsc_code" label="IFSC Code" defaultValue={modal.item?.ifsc_code} required /><Field name="upi_id" label="UPI ID" defaultValue={modal.item?.upi_id || ""} /></>} />}
        {modal.kind === "market" && <EntityForm busy={busy} onSubmit={(form) => submit("markets", { market_name: formText(form, "market_name"), open_time: formText(form, "open_time") }, modal.item?.id)} fields={<><Field name="market_name" label="Name" defaultValue={modal.item?.market_name} required /><Field name="open_time" label="Open Time" type="time" defaultValue={modal.item?.open_time} required /></>} />}
        {modal.kind === "result" && <EntityForm busy={busy} onSubmit={(form) => submitResult(form, modal.item?.id)} fields={<ResultFormFields markets={markets} item={modal.item} results={results || []} mode={modal.mode} />} />}
        {modal.kind === "bulk_result" && (
          <BulkResultUploadForm
            markets={markets}
            results={results || []}
            defaultDate={modal.defaultDate}
            onSave={submitBulkResults}
            busy={busy}
            onClose={onClose}
          />
        )}
        {modal.kind === "sub_admin" && (
          <EntityForm
            busy={busy}
            onSubmit={(form) =>
              submit(
                "sub_admins",
                {
                  username: formText(form, "username"),
                  password: formText(form, "password"),
                  assigned_user_ids: formText(form, "assigned_user_ids"),
                  can_add_result: form.get("can_add_result_hidden") === "true",
                  can_update_result: form.get("can_update_result_hidden") === "true",
                  can_delete_result: form.get("can_delete_result_hidden") === "true",
                  show_commission: form.get("show_commission_hidden") === "true",
                  show_bid_data: form.get("show_bid_data_hidden") === "true",
                  show_result: form.get("show_result_hidden") === "true",
                  show_agent_report: form.get("show_agent_report_hidden") === "true",
                },
                modal.item?.id
              )
            }
            fields={
              <>
                <Field name="username" label="Username" defaultValue={modal.item?.username} required />
                <Field name="password" label="Password" defaultValue={modal.item?.password} required />
                <UserMultiSelect users={users} selectedIds={modal.item?.assigned_user_ids ? modal.item.assigned_user_ids.split(",").filter(Boolean) : []} />
                <PermissionSelect item={modal.item} />
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

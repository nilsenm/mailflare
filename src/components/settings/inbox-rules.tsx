"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoutingRuleSelect } from "./domain-routing/routing-rule-select";
import type { InboxRule, InboxRuleInput } from "./inbox-rules-types";
import {
  createInboxRule,
  deleteInboxRule,
  fetchInboxRules,
  fetchRuleFolders,
  getInboxRuleDestination,
  getRuleFieldLabel,
  getRuleOperatorLabel,
  updateInboxRule,
} from "./inbox-rules-utils";
import { useT } from "@/lib/i18n/client";

export function InboxRules() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const { selectedMailbox } = useSelectedMailbox();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<InboxRule | null>(null);
  const [matchField, setMatchField] = useState<"email" | "content" | "title">(
    "email",
  );
  const [matchOperator, setMatchOperator] = useState<"contains" | "exact">(
    "contains",
  );
  const [matchValue, setMatchValue] = useState("");
  const [destination, setDestination] = useState("");
  const mailboxId = selectedMailbox?.id ?? "";

  const folders = useQuery({
    queryKey: ["folders", mailboxId],
    enabled: !!mailboxId,
    queryFn: () => fetchRuleFolders(mailboxId),
  });
  const rules = useQuery({
    queryKey: ["routing-rules", mailboxId],
    enabled: !!mailboxId,
    queryFn: () => fetchInboxRules(mailboxId),
  });

  const save = useMutation({
    mutationFn: () => {
      const input: InboxRuleInput = {
        mailboxId,
        matchField,
        matchOperator,
        matchValue,
        destination,
        priority: editingRule?.priority ?? 10,
      };
      return editingRule
        ? updateInboxRule(editingRule.id, input)
        : createInboxRule(input);
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["routing-rules", mailboxId] });
    },
  });
  const remove = useMutation({
    mutationFn: deleteInboxRule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["routing-rules", mailboxId] }),
  });

  const folderMap = new Map(
    (folders.data?.folders ?? []).map((folder) => [folder.id, folder.name]),
  );

  function getRuleDestinationLabel(
    rule: Pick<InboxRule, "action" | "folderId">,
  ) {
    if (rule.action === "spam") return t("nav.spam");
    if (rule.action === "trash") return t("nav.trash");
    return folderMap.get(rule.folderId ?? "") ?? t("settings.inboxRules.unknownFolder");
  }

  function openCreateDialog() {
    setEditingRule(null);
    setMatchField("email");
    setMatchOperator("contains");
    setMatchValue("");
    setDestination("");
    save.reset();
    setDialogOpen(true);
  }

  function openEditDialog(rule: InboxRule) {
    setEditingRule(rule);
    setMatchField(rule.matchField);
    setMatchOperator(rule.matchOperator);
    setMatchValue(rule.matchValue || rule.pattern);
    setDestination(getInboxRuleDestination(rule));
    save.reset();
    setDialogOpen(true);
  }

  function onRuleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    rule: InboxRule,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openEditDialog(rule);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-row items-center">
        <header className="flex-1">
          <h2 className="text-2xl font-semibold text-neutral-900">
            {t("settings.inboxRules.title")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {t("settings.inboxRules.description")}
          </p>
        </header>

        <Button type="button" onClick={openCreateDialog} disabled={!mailboxId}>
          <Plus className="h-4 w-4" />
          {t("settings.inboxRules.newRule")}
        </Button>
      </div>
      <div className="rounded-3xl bg-white p-6">
        {(rules.data?.rules ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">{t("settings.inboxRules.noRulesYet")}</p>
        )}
        <div className="space-y-1">
          {(rules.data?.rules ?? []).map((rule) => (
            <div
              key={rule.id}
              role="button"
              tabIndex={0}
              onClick={() => openEditDialog(rule)}
              onKeyDown={(event) => onRuleKeyDown(event, rule)}
              className="group flex cursor-pointer items-center gap-3 rounded-xl bg-neutral-50 px-3 py-3 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                {rule.action === "spam" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : rule.action === "trash" ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {getRuleFieldLabel(rule.matchField)}{" "}
                  {getRuleOperatorLabel(rule.matchOperator)}{" "}
                  {rule.matchValue || rule.pattern}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {getRuleDestinationLabel(rule)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  remove.mutate(rule.id);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                aria-label={t("settings.inboxRules.deleteRuleAria")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t("settings.inboxRules.updateTitle") : t("settings.inboxRules.newTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.inboxRules.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="matchField">{t("settings.inboxRules.fieldLabel")}</Label>
                <RoutingRuleSelect
                  id="matchField"
                  value={matchField}
                  onChange={(event) =>
                    setMatchField(
                      event.target.value as "email" | "content" | "title",
                    )
                  }
                >
                  <option value="email">{t("settings.inboxRules.fieldEmail")}</option>
                  <option value="content">{t("settings.inboxRules.fieldContent")}</option>
                  <option value="title">{t("settings.inboxRules.fieldTitle")}</option>
                </RoutingRuleSelect>
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="matchOperator">{t("settings.inboxRules.matchLabel")}</Label>
                <RoutingRuleSelect
                  id="matchOperator"
                  value={matchOperator}
                  onChange={(event) =>
                    setMatchOperator(event.target.value as "contains" | "exact")
                  }
                >
                  <option value="contains">{t("settings.inboxRules.matchContains")}</option>
                  <option value="exact">{t("settings.inboxRules.matchExact")}</option>
                </RoutingRuleSelect>
              </div>
            </div>
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="matchValue">{t("settings.inboxRules.valueLabel")}</Label>
                <Input
                  id="matchValue"
                  value={matchValue}
                  onChange={(event) => setMatchValue(event.target.value)}
                  placeholder={
                    matchField === "email" ? "sender@example.com" : "Invoice"
                  }
                />
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="destination">{t("settings.inboxRules.destinationLabel")}</Label>
                <RoutingRuleSelect
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                >
                  <option value="">{t("settings.inboxRules.selectDestination")}</option>
                  <option value="spam">{t("nav.spam")}</option>
                  <option value="trash">{t("nav.trash")}</option>
                  {(folders.data?.folders ?? []).map((folder) => (
                    <option key={folder.id} value={`folder:${folder.id}`}>
                      {folder.name}
                    </option>
                  ))}
                </RoutingRuleSelect>
              </div>
            </div>
            {save.isError && (
              <p className="text-sm text-red-600">{save.error.message}</p>
            )}
            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !mailboxId ||
                  !destination ||
                  !matchValue.trim() ||
                  save.isPending
                }
              >
                {save.isPending
                  ? t("settings.saving")
                  : editingRule
                    ? t("settings.inboxRules.saveChanges")
                    : t("settings.inboxRules.createRule")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
